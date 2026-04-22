import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { usePackageCardLeadOptional } from "@/home/PackagePricingCardShell";
import { readLeadIdentity } from "@/contact/leadIdentityStorage";
import {
  clearWeddingPackageLeadBrowserSession,
  readWeddingPackageLeadSubmittedAt,
  writeWeddingPackageLeadSubmittedAt,
} from "@/contact/weddingPackageLeadSession";
import { submitWeddingPackageLead } from "@/contact/weddingPackageLeadApi";
import { isValidEmail, isValidPhone } from "@/contact/leadValidators";
import { useWeddingLeadStep1Autosave } from "@/contact/useWeddingLeadStep1Autosave";
import {
  getOrCreateSessionId,
  getRequiredWebId,
  readLandingAttributionForLead,
  resetAnalyticsSessionId,
} from "@/analytics/sendAnalyticsBatch";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Button } from "@/share/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/share/ui/card";
import { Input } from "@/share/ui/input";
import { Textarea } from "@/share/ui/textarea";

type Step = 1 | 2;

type Props = {
  packageLabel: string;
};

const REPEAT_TTL_MS = 30 * 1000;

export function PackageConsultLeadForm({ packageLabel }: Props) {
  const navigate = useNavigate();
  const cardLead = usePackageCardLeadOptional();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [ttlNow, setTtlNow] = useState(() => Date.now());
  const [submittedAtMs, setSubmittedAtMs] = useState<number | null>(null);

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

  const { leadRowId, resetStep1Lead, ensureStep1RowId } = useWeddingLeadStep1Autosave({
    packageLabel,
    name,
    phone,
    email,
    step,
    locked: Boolean(submittedAtMs),
  });

  const canStartNew = submittedAtMs ? ttlNow - submittedAtMs >= REPEAT_TTL_MS : true;

  // Ensure UI flips to "canStartNew" automatically when TTL expires (no extra user interaction needed).
  useEffect(() => {
    if (!open) return;
    if (!submittedAtMs) return;
    const msLeft = REPEAT_TTL_MS - (Date.now() - submittedAtMs);
    if (msLeft <= 0) return;
    const t = window.setTimeout(() => setTtlNow(Date.now()), msLeft + 25);
    return () => window.clearTimeout(t);
  }, [open, submittedAtMs]);

  // Read submittedAt from sessionStorage when dialog opens.
  useEffect(() => {
    if (!open) return;
    try {
      setSubmittedAtMs(readWeddingPackageLeadSubmittedAt(getRequiredWebId()));
    } catch {
      setSubmittedAtMs(null);
    }
  }, [open]);

  const markSubmittedNow = useCallback(
    (retryAfterSec?: number) => {
      const now = Date.now();
      const retryMs = typeof retryAfterSec === "number" ? Math.max(0, retryAfterSec) * 1000 : null;
      const inferredSubmittedAt =
        retryMs != null ? now - Math.max(0, REPEAT_TTL_MS - retryMs) : now;
      try {
        writeWeddingPackageLeadSubmittedAt(getRequiredWebId(), inferredSubmittedAt);
      } catch {}
      setSubmittedAtMs(inferredSubmittedAt);
      setTtlNow(now);
    },
    [setTtlNow],
  );

  const clearLeadDraft = useCallback(() => {
    setSubmitting(false);
    setStep(1);
    resetStep1Lead(true);
    setErrorMessage("");
    setRetryAfterSeconds(null);
    setSubmittedAtMs(null);
    setTtlNow(Date.now());
    try {
      resetAnalyticsSessionId();
    } catch {}
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
      return name.trim().length > 0 && phoneOk && emailOk;
    }
    return (
      !!leadRowId &&
      eventDate.trim().length > 0 &&
      eventTime.trim().length > 0 &&
      eventAddress.trim().length > 0
    );
  }, [emailOk, eventAddress, eventDate, eventTime, leadRowId, name, phoneOk, step, submitting]);

  function reset() {
    setOpen(false);
    cardLead?.setConsultOpen(false);
    clearLeadDraft();
  }

  async function onPrimary() {
    if (!canNext) return;
    if (step === 1) {
      setErrorMessage("");
      setSubmitting(true);
      try {
        await ensureStep1RowId();
        setStep(2);
      } catch (e: unknown) {
        const err = e instanceof Error ? (e as Error & { retry_after_seconds?: number }) : null;
        if (err?.retry_after_seconds) {
          setRetryAfterSeconds(err.retry_after_seconds);
          // Ensure the reset panel appears even if sessionStorage wasn't set yet.
          markSubmittedNow(err.retry_after_seconds);
        } else if (String(err?.message ?? "").includes("Lead sudah pernah dikirim untuk session ini")) {
          markSubmittedNow();
        }
        setErrorMessage(err?.message ?? "Tidak bisa menyimpan data. Periksa koneksi lalu coba lagi.");
      } finally {
        setSubmitting(false);
      }
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
        analytics_session_id: getOrCreateSessionId(),
        web_id: getRequiredWebId(),
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
        // Even if WhatsApp fails, the lead was submitted; lock the UI for TTL.
        markSubmittedNow();
        return;
      }
      markSubmittedNow();
      navigate("/thank-you-page");
    } catch (e: unknown) {
      const err = e instanceof Error ? (e as Error & { retry_after_seconds?: number }) : null;
      if (err?.retry_after_seconds) {
        setRetryAfterSeconds(err.retry_after_seconds);
        // Ensure the reset panel appears even if sessionStorage wasn't set yet.
        markSubmittedNow(err.retry_after_seconds);
      } else if (String(err?.message ?? "").includes("Lead sudah pernah dikirim untuk session ini")) {
        markSubmittedNow();
      }
      setErrorMessage(err?.message ?? "Terjadi kesalahan. Coba lagi.");
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
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  step={900}
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

          {errorMessage ? (
            <p className="text-center text-[0.65rem] font-medium text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {submittedAtMs ? (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-center">
              <p className="text-[0.65rem] text-muted-foreground">
                Lead sudah pernah dikirim untuk session ini.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                disabled={submitting}
                onClick={() => {
                  try {
                    clearWeddingPackageLeadBrowserSession(getRequiredWebId());
                    resetAnalyticsSessionId();
                  } catch {}
                  clearLeadDraft();
                }}
              >
                Mulai konsultasi baru
              </Button>
              {retryAfterSeconds ? (
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  Coba lagi dalam ~{Math.max(1, Math.ceil(retryAfterSeconds))} detik.
                </p>
              ) : null}
            </div>
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
              {step === 2
                ? submitting
                  ? "Mengirim..."
                  : "Kirim"
                : submitting
                  ? "Menyimpan..."
                  : "Lanjut"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
