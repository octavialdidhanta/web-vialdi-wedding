import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { usePackageCardLeadOptional } from "@/home/PackagePricingCardShell";
import { readLeadIdentity } from "@/contact/leadIdentityStorage";
import { submitWeddingPackageLead } from "@/contact/weddingPackageLeadApi";
import { isValidEmail, isValidPhone } from "@/contact/leadValidators";
import { useWeddingLeadStep1Autosave } from "@/contact/useWeddingLeadStep1Autosave";
import { readLandingAttributionForLead } from "@/analytics/sendAnalyticsBatch";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Button } from "@/share/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/share/ui/card";
import { Input } from "@/share/ui/input";
import { Textarea } from "@/share/ui/textarea";

type Step = 1 | 2;

type Props = {
  packageLabel: string;
};

export function PackageConsultLeadForm({ packageLabel }: Props) {
  const navigate = useNavigate();
  const cardLead = usePackageCardLeadOptional();
  const [open, setOpen] = useState(false);
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
    packageLabel,
    name,
    phone,
    email,
    step,
  });

  const clearLeadDraft = useCallback(() => {
    setSubmitting(false);
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
  }, [resetStep1Lead]);

  useEffect(() => {
    if (cardLead?.consultOpen) {
      setOpen(true);
      return;
    }
    if (!cardLead) return;
    setOpen(false);
    clearLeadDraft();
  }, [cardLead?.consultOpen, cardLead, clearLeadDraft]);

  /** Isi ulang nama/telepon/email dari penyimpanan lokal + dukungan autofill browser. */
  useEffect(() => {
    if (!open || step !== 1) return;
    const saved = readLeadIdentity();
    if (!saved) return;
    setName((n) => n.trim() || saved.name);
    setPhone((p) => p.trim() || saved.phone);
    setEmail((e) => e.trim() || saved.email);
  }, [open, step]);

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

  function reset() {
    setOpen(false);
    cardLead?.setConsultOpen(false);
    clearLeadDraft();
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
          "(set WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID di Supabase Edge Function secrets, sama seperti contact-lead)",
        );
      }
      if (res2.whatsapp && "error" in res2.whatsapp && typeof res2.whatsapp.error === "string") {
        setErrorMessage(
          "Data tersimpan, tetapi notifikasi WhatsApp gagal. Hubungi tim jika perlu. Detail: " +
            res2.whatsapp.error.slice(0, 280),
        );
        return;
      }
      navigate("/thank-you-page");
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        data-track={TRACK_KEYS.contactCta}
        onClick={() => {
          setOpen(true);
          cardLead?.setConsultOpen(true);
        }}
        className="inline-flex w-full max-w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md transition-opacity hover:opacity-95 sm:max-w-sm sm:px-8"
        style={{ background: "#25D366" }}
      >
        <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
        Konsultasi gratis
      </button>
    );
  }

  return (
    <div className="w-full max-w-full space-y-3 sm:max-w-sm">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-1 px-3 pb-2 pt-4 md:px-6">
          <CardTitle className="text-center text-sm font-semibold">
            Langkah {step} dari 2 — konsultasi paket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 pb-4 pt-0 md:px-6">
          {step === 1 ? (
            <div className="space-y-3">
              <p className="text-center text-[0.65rem] text-muted-foreground">
                Data hanya untuk menghubungi Anda terkait konsultasi paket ini. Lanjut ke langkah 2
                kapan sudah siap.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Nama calon pengantin</label>
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
              <p className="text-center text-[0.65rem] text-muted-foreground">
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
                <label className="text-xs font-medium text-foreground">Alamat lengkap acara</label>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="sm:mr-auto"
              onClick={reset}
            >
              Lihat detail paket
            </Button>
            <Button type="button" size="sm" disabled={!canNext} onClick={onPrimary}>
              {step === 2 ? (submitting ? "Mengirim..." : "Kirim") : "Lanjut"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
