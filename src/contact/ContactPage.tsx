import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOrCreateSessionId, getRequiredWebId, readLandingAttributionForLead } from "@/analytics/sendAnalyticsBatch";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { metaPixelTrack } from "@/analytics/metaPixel";
import { readLeadIdentity } from "@/contact/leadIdentityStorage";
import { isValidEmail, isValidPhone } from "@/contact/leadValidators";
import { submitWeddingPackageLead } from "@/contact/weddingPackageLeadApi";
import { clearWeddingPackageLeadBrowserSession } from "@/contact/weddingPackageLeadSession";
import { useWeddingLeadStep1Autosave } from "@/contact/useWeddingLeadStep1Autosave";
import { useContactPageMeta } from "@/contact/useContactPageMeta";
import { Footer } from "@/share/Footer";
import { Header } from "@/share/Header";
import { Button } from "@/share/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/share/ui/card";
import { Checkbox } from "@/share/ui/checkbox";
import { Input } from "@/share/ui/input";
import { Textarea } from "@/share/ui/textarea";

type Step = 1 | 2;
const CONTACT_LEAD_PACKAGE_LABEL = "Konsultasi umum — halaman kontak";

export function ContactPage() {
  useContactPageMeta();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<{ phone: boolean; email: boolean }>({ phone: false, email: false });

  const phoneOk = isValidPhone(phone);
  const emailOk = isValidEmail(email);

  const { leadRowId, resetStep1Lead, ensureStep1RowId } = useWeddingLeadStep1Autosave({
    packageLabel: CONTACT_LEAD_PACKAGE_LABEL,
    name,
    phone,
    email,
    step,
  });

  useEffect(() => {
    const saved = readLeadIdentity();
    if (!saved) return;
    setName((n) => n.trim() || saved.name);
    setPhone((p) => p.trim() || saved.phone);
    setEmail((e) => e.trim() || saved.email);
  }, []);

  const canNext = useMemo(() => {
    if (submitting) return false;
    if (step === 1) return name.trim().length > 0 && phoneOk && emailOk;
    return !!leadRowId && eventDate.trim() && eventTime.trim() && eventAddress.trim() && consent;
  }, [consent, emailOk, eventAddress, eventDate, eventTime, leadRowId, name, phoneOk, step, submitting]);

  function resetAll() {
    setStep(1);
    resetStep1Lead();
    setSubmitting(false);
    setErrorMessage("");
    setName("");
    setPhone("");
    setEmail("");
    setEventDate("");
    setEventTime("");
    setEventAddress("");
    setConsent(false);
    setTouched({ phone: false, email: false });
  }

  async function onPrimary() {
    if (!canNext) return;
    if (step === 1) {
      setSubmitting(true);
      setErrorMessage("");
      try {
        await ensureStep1RowId();
        setConsent(false);
        setStep(2);
      } catch (e: unknown) {
        setErrorMessage(e instanceof Error ? e.message : "Gagal menyimpan. Coba lagi.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const webId = getRequiredWebId();
      await submitWeddingPackageLead({
        step: 2,
        id: leadRowId!,
        event_date: eventDate.trim(),
        event_time: eventTime.trim(),
        event_address: eventAddress.trim(),
        attribution: readLandingAttributionForLead(),
        analytics_session_id: getOrCreateSessionId(),
        web_id: webId,
      });
      try {
        clearWeddingPackageLeadBrowserSession(getRequiredWebId());
      } catch {
        /* VITE_WEB_ID */
      }
      metaPixelTrack("Lead", { source: "contact_page_form" });
      navigate("/thank-you-page");
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">Kontak Vialdi Wedding</h1>
          <p className="mt-3 text-sm text-muted-foreground">Isi singkat, kami hubungi via WhatsApp/telepon.</p>

          <Card className="mt-8 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Langkah {step} dari 2</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 ? (
                <>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    placeholder="Nomor telepon (WhatsApp)"
                    inputMode="tel"
                  />
                  {touched.phone && !phoneOk ? (
                    <p className="text-xs font-medium text-destructive">Nomor telepon tidak valid.</p>
                  ) : null}
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="Email"
                    type="email"
                    inputMode="email"
                  />
                  {touched.email && !emailOk ? (
                    <p className="text-xs font-medium text-destructive">Format email tidak valid.</p>
                  ) : null}
                </>
              ) : (
                <>
                  <Input
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="Tanggal acara"
                    type="date"
                    inputMode="none"
                  />
                  <Input
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="Jam acara"
                    type="time"
                    inputMode="none"
                  />
                  <Textarea
                    value={eventAddress}
                    onChange={(e) => setEventAddress(e.target.value)}
                    placeholder="Lokasi acara (venue + alamat)"
                    rows={3}
                  />
                  <label className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3">
                    <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
                    <span className="text-sm text-muted-foreground">
                      Saya setuju data diproses untuk konsultasi & dihubungi via WhatsApp/telepon.
                    </span>
                  </label>
                </>
              )}

              {errorMessage ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                {step === 1 ? (
                  <Button variant="ghost" asChild>
                    <Link to="/">Kembali</Link>
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={resetAll}>
                    Isi ulang
                  </Button>
                )}
                <Button data-track={TRACK_KEYS.contactCta} disabled={!canNext} onClick={onPrimary}>
                  {step === 1 ? (submitting ? "Menyimpan..." : "Lanjut") : submitting ? "Mengirim..." : "Kirim"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
