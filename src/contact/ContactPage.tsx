import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readLandingAttributionForLead } from "@/analytics/sendAnalyticsBatch";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { submitWeddingPackageLead } from "@/contact/weddingPackageLeadApi";
import { readLeadIdentity } from "@/contact/leadIdentityStorage";
import { isValidEmail, isValidPhone } from "@/contact/leadValidators";
import { useWeddingLeadStep1Autosave } from "@/contact/useWeddingLeadStep1Autosave";
import { useContactPageMeta } from "@/contact/useContactPageMeta";
import { Header } from "@/share/Header";
import { Footer } from "@/share/Footer";
import { Button } from "@/share/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/share/ui/card";
import { Input } from "@/share/ui/input";
import { Textarea } from "@/share/ui/textarea";

type Step = 1 | 2;

/** Label paket untuk CRM — konsisten dengan alur `wedding-package-lead` di kartu paket. */
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
  const [touched, setTouched] = useState<{ phone: boolean; email: boolean }>({
    phone: false,
    email: false,
  });

  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventAddress, setEventAddress] = useState("");

  const phoneOk = isValidPhone(phone);
  const emailOk = isValidEmail(email);

  const { leadRowId, resetStep1Lead } = useWeddingLeadStep1Autosave({
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
    if (step === 1) {
      return name.trim().length > 0 && phoneOk && emailOk && !!leadRowId;
    }
    return (
      !!leadRowId &&
      eventDate.trim().length > 0 &&
      eventTime.trim().length > 0 &&
      eventAddress.trim().length > 0
    );
  }, [
    emailOk,
    eventAddress,
    eventDate,
    eventTime,
    leadRowId,
    name,
    phoneOk,
    step,
    submitting,
  ]);

  function resetForm() {
    setStep(1);
    resetStep1Lead();
    setErrorMessage("");
    setName("");
    setPhone("");
    setEmail("");
    setTouched({ phone: false, email: false });
    setEventDate("");
    setEventTime("");
    setEventAddress("");
  }

  async function onPrimary() {
    if (!canNext) return;
    if (step === 1) {
      setStep(2);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const res2 = await submitWeddingPackageLead({
        step: 2,
        id: leadRowId!,
        event_date: eventDate.trim(),
        event_time: eventTime.trim(),
        event_address: eventAddress.trim(),
        attribution: readLandingAttributionForLead(),
      });
      if (import.meta.env.DEV && res2.whatsapp?.skipped && res2.whatsapp?.skip_reason) {
        console.warn(
          "[wedding-package-lead] WhatsApp tidak dipanggil —",
          res2.whatsapp.skip_reason,
          "(set WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID di Supabase Edge Function secrets)",
        );
      }
      navigate("/thank-you-page");
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <Header />
      <div className="flex-1 px-4 py-10 md:px-6">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-8 text-center md:text-left">
            <div className="text-sm font-semibold text-muted-foreground">Kontak</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Konsultasi gratis dengan Vialdi Wedding
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Ceritakan rencana hari H Anda — tim kami membantu menyesuaikan dokumentasi foto &amp;
              video, album, dan paket yang masuk akal. Dua langkah singkat, sama seperti form
              konsultasi di halaman paket; data hanya dipakai untuk menghubungi Anda.
            </p>
            <p className="mt-2 text-xs text-muted-foreground md:text-sm">
              Tidak ada komitmen di tahap ini. Setelah terkirim, kami menghubungi Anda untuk diskusi
              awal.
            </p>
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-1 px-4 pb-2 pt-5 md:px-6">
              <CardTitle className="text-center text-sm font-semibold">
                Langkah {step} dari 2 — konsultasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-5 pt-0 md:px-6">
              {step === 1 ? (
                <div className="space-y-3">
                  <p className="text-center text-[0.65rem] text-muted-foreground md:text-left">
                    Data hanya untuk menghubungi Anda terkait konsultasi layanan pernikahan. Lanjut
                    ke langkah 2 kapan sudah siap.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Nama calon pengantin
                    </label>
                    <Input
                      name="lead-full-name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Nomor telepon</label>
                    <Input
                      name="lead-phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      placeholder="0812xxxxxxx"
                      inputMode="tel"
                      className="h-9 text-sm"
                    />
                    {touched.phone && !phoneOk ? (
                      <p className="text-[0.65rem] font-medium text-destructive">
                        Nomor tidak valid (9–15 digit, contoh 0812… atau +62812…).
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Email</label>
                    <Input
                      name="lead-email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="nama@email.com"
                      inputMode="email"
                      type="email"
                      className="h-9 text-sm"
                    />
                    {touched.email && !emailOk ? (
                      <p className="text-[0.65rem] font-medium text-destructive">
                        Format email tidak valid.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-[0.65rem] text-muted-foreground md:text-left">
                    Lengkapi jadwal &amp; lokasi agar tim bisa menyiapkan diskusi awal.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Tanggal acara</label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Jam acara</label>
                    <Input
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      placeholder="Contoh: 10.00 WIB / sore / seharian"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Alamat lengkap acara
                    </label>
                    <Textarea
                      value={eventAddress}
                      onChange={(e) => setEventAddress(e.target.value)}
                      placeholder="Alamat venue / rumah acara"
                      rows={3}
                      className="min-h-[4.5rem] resize-y text-sm"
                    />
                  </div>
                </div>
              )}

              {step === 2 && errorMessage ? (
                <p className="text-center text-[0.65rem] font-medium text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {step === 1 ? (
                  <Button type="button" variant="outline" size="sm" className="sm:mr-auto" asChild>
                    <Link to="/">Kembali ke beranda</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="sm:mr-auto"
                    onClick={resetForm}
                  >
                    Isi ulang dari awal
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={!canNext}
                  data-track={TRACK_KEYS.contactCta}
                  onClick={onPrimary}
                >
                  {step === 2 ? (submitting ? "Mengirim..." : "Kirim") : "Lanjut"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
