import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getOrCreateSessionId,
  getRequiredWebId,
  readLandingAttributionForLead,
} from "@/analytics/sendAnalyticsBatch";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import {
  AGENCY_BIDANG_USAHA_OPTIONS,
  AGENCY_JABATAN_OPTIONS,
  AGENCY_KEBUTUHAN_OPTIONS,
  buildAgencyEventAddressBlock,
  type AgencyBusinessType,
} from "@/contact/agencyConsultFormConstants";
import { submitWeddingPackageLead } from "@/contact/weddingPackageLeadApi";
import { readLeadIdentity } from "@/contact/leadIdentityStorage";
import { clearWeddingPackageLeadBrowserSession } from "@/contact/weddingPackageLeadSession";
import { isValidEmail, isValidPhone } from "@/contact/leadValidators";
import { useWeddingLeadStep1Autosave } from "@/contact/useWeddingLeadStep1Autosave";
import { useContactPageMeta } from "@/contact/useContactPageMeta";
import { Header } from "@/share/Header";
import { Footer } from "@/share/Footer";
import { Button } from "@/share/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/share/ui/card";
import { Checkbox } from "@/share/ui/checkbox";
import { Input } from "@/share/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/share/ui/select";
import { Textarea } from "@/share/ui/textarea";

type Step = 1 | 2 | 3;

/** Label paket untuk CRM — konsisten dengan alur `wedding-package-lead` di kartu paket. */
const CONTACT_LEAD_PACKAGE_LABEL = "Konsultasi umum — halaman kontak";

function useIsAgencySite(): boolean {
  return useMemo(() => {
    try {
      return getRequiredWebId() === "vialdi";
    } catch {
      return false;
    }
  }, []);
}

export function ContactPage() {
  useContactPageMeta();
  const navigate = useNavigate();
  const isAgencySite = useIsAgencySite();
  const maxStep = isAgencySite ? 3 : 2;

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

  const [bidangUsaha, setBidangUsaha] = useState("");
  const [jenisUsaha, setJenisUsaha] = useState<AgencyBusinessType | "">("");
  const [jabatan, setJabatan] = useState("");
  const [kebutuhan, setKebutuhan] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [ringkasanKebutuhan, setRingkasanKebutuhan] = useState("");

  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);

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
    if (step === 1) {
      return name.trim().length > 0 && phoneOk && emailOk;
    }
    if (isAgencySite) {
      if (step === 2) {
        return (
          bidangUsaha.trim().length > 0 &&
          (jenisUsaha === "B2B" || jenisUsaha === "B2C") &&
          officeAddress.trim().length > 0
        );
      }
      if (step === 3) {
        return (
          !!leadRowId &&
          eventTime.trim().length > 0 &&
          jabatan.trim().length > 0 &&
          kebutuhan.trim().length > 0 &&
          ringkasanKebutuhan.trim().length > 0 &&
          dataProcessingConsent
        );
      }
      return false;
    }
    if (step === 2) {
      return (
        !!leadRowId &&
        eventDate.trim().length > 0 &&
        eventTime.trim().length > 0 &&
        eventAddress.trim().length > 0 &&
        dataProcessingConsent
      );
    }
    return false;
  }, [
    bidangUsaha,
    dataProcessingConsent,
    emailOk,
    eventAddress,
    eventDate,
    eventTime,
    isAgencySite,
    jabatan,
    jenisUsaha,
    kebutuhan,
    leadRowId,
    name,
    officeAddress,
    phoneOk,
    ringkasanKebutuhan,
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
    setBidangUsaha("");
    setJenisUsaha("");
    setJabatan("");
    setKebutuhan("");
    setOfficeAddress("");
    setRingkasanKebutuhan("");
    setEventDate("");
    setEventTime("");
    setEventAddress("");
    setDataProcessingConsent(false);
  }

  async function onPrimary() {
    if (!canNext) return;
    if (step === 1) {
      setErrorMessage("");
      setSubmitting(true);
      try {
        await ensureStep1RowId();
        setDataProcessingConsent(false);
        setStep(2);
      } catch (e: unknown) {
        setErrorMessage(
          e instanceof Error ? e.message : "Tidak bisa menyimpan data. Periksa koneksi lalu coba lagi.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (isAgencySite && step === 2) {
      setDataProcessingConsent(false);
      setStep(3);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const webId = getRequiredWebId();
      const compositeAddress =
        isAgencySite && jenisUsaha
          ? buildAgencyEventAddressBlock({
              bidang: bidangUsaha.trim(),
              jenis: jenisUsaha,
              jabatan: jabatan.trim(),
              kebutuhan: kebutuhan.trim(),
              office: officeAddress.trim(),
              ringkasan: ringkasanKebutuhan.trim(),
            })
          : eventAddress.trim();

      const res2 = await submitWeddingPackageLead({
        step: 2,
        id: leadRowId!,
        ...(!isAgencySite ? { event_date: eventDate.trim() } : {}),
        event_time: eventTime.trim(),
        event_address: compositeAddress,
        attribution: readLandingAttributionForLead(),
        analytics_session_id: getOrCreateSessionId(),
        web_id: webId,
        ...(isAgencySite && jenisUsaha
          ? {
              industry: bidangUsaha.trim(),
              business_type: jenisUsaha,
              job_title: jabatan.trim(),
              needs: kebutuhan.trim(),
              office_address: officeAddress.trim(),
              ringkasan_kebutuhan: ringkasanKebutuhan.trim(),
            }
          : {}),
      });
      if (import.meta.env.DEV && res2.whatsapp?.skipped && res2.whatsapp?.skip_reason) {
        console.warn(
          "[wedding-package-lead] WhatsApp tidak dipanggil —",
          res2.whatsapp.skip_reason,
          "(set WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID di Supabase Edge Function secrets)",
        );
      }
      try {
        clearWeddingPackageLeadBrowserSession(getRequiredWebId());
      } catch {
        /* VITE_WEB_ID */
      }
      navigate("/thank-you-page");
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepIntro = (() => {
    if (step === 1) {
      return isAgencySite
        ? "Tenang, ini untuk menghubungi Anda terkait konsultasi saja — bukan spam. Tidak perlu kartu kredit di sini."
        : "Data hanya untuk menghubungi Anda terkait konsultasi pemasaran digital. Lanjut ke langkah 2 kapan sudah siap — tidak perlu kartu kredit atau pembayaran di sini.";
    }
    if (isAgencySite && step === 2) {
      return "Supaya rekomendasi kami tepat, isi bidang & jenis usaha serta alamat kantor / domisili bisnis.";
    }
    if (isAgencySite && step === 3) {
      return "Terakhir: preferensi kontak, jabatan, kebutuhan utama, dan ringkasan singkat.";
    }
    return "Hampir selesai. Informasi ini membantu tim mempersiapkan diskusi agar tepat sasaran — boleh perkiraan dulu; detail bisa kami rapikan bersama nanti.";
  })();

  const primaryLabel =
    step === 1
      ? submitting
        ? "Menyimpan..."
        : "Lanjut"
      : isAgencySite && step === 2
        ? "Lanjut"
        : submitting
          ? "Mengirim..."
          : "Kirim";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <Header />
      <div className="flex-1 px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto w-full max-w-xl">
          <header className="mb-10 space-y-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kontak
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl">
              Konsultasi dengan Vialdi.ID
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              {isAgencySite
                ? "Tiga langkah singkat — kontak, konteks bisnis, lalu kebutuhan utama dan ringkasan. Data hanya dipakai untuk menghubungi Anda, bukan untuk spam atau dijual ke pihak ketiga."
                : "Ceritakan target pemasaran, channel yang sudah dicoba, dan kendala singkat Anda. Dua langkah singkat — sama seperti form konsultasi paket di situs ini; data hanya dipakai untuk menghubungi Anda, bukan untuk spam atau dijual ke pihak ketiga."}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tidak ada komitmen di tahap ini. Setelah terkirim, tim kami menghubungi Anda untuk diskusi awal — Anda
              bisa berhenti kapan saja sebelum ada kesepakatan tertulis.
            </p>
          </header>

          <Card className="rounded-2xl border border-border bg-card shadow-none">
            <CardHeader className="space-y-2 border-b border-border/60 px-5 pb-4 pt-6 md:px-6">
              <CardTitle className="text-center text-base font-semibold text-navy">
                Langkah {step} dari {maxStep} — konsultasi
              </CardTitle>
              <p className="text-center text-sm leading-relaxed text-muted-foreground">{stepIntro}</p>
            </CardHeader>
            <CardContent className="space-y-5 px-5 pb-6 pt-5 md:px-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="lead-full-name">
                      {isAgencySite ? "Nama" : "Nama lengkap"}
                    </label>
                    <Input
                      id="lead-full-name"
                      name="lead-full-name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAgencySite ? "Nama Anda" : "Nama lengkap"}
                      className="h-10 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="lead-phone">
                      Nomor telepon
                    </label>
                    <Input
                      id="lead-phone"
                      name="lead-phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      placeholder="Contoh: 0812xxxxxxxx"
                      inputMode="tel"
                      className="h-10 text-base"
                    />
                    {touched.phone && !phoneOk ? (
                      <p className="text-xs font-medium text-destructive">
                        Nomor tidak valid (9–15 digit, contoh 0812… atau +62812…).
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="lead-email">
                      Email
                    </label>
                    <Input
                      id="lead-email"
                      name="lead-email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder={isAgencySite ? "nama@perusahaan.com" : "nama@email.com"}
                      inputMode="email"
                      type="email"
                      className="h-10 text-base"
                    />
                    {touched.email && !emailOk ? (
                      <p className="text-xs font-medium text-destructive">Format email tidak valid.</p>
                    ) : null}
                  </div>
                </div>
              ) : isAgencySite && step === 2 ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-foreground">Bidang usaha</span>
                    <Select value={bidangUsaha} onValueChange={setBidangUsaha}>
                      <SelectTrigger className="h-10 text-base" id="agency-bidang">
                        <SelectValue placeholder="Pilih bidang usaha" />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENCY_BIDANG_USAHA_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-foreground">Jenis usaha</span>
                    <Select
                      value={jenisUsaha}
                      onValueChange={(v) => setJenisUsaha(v as AgencyBusinessType)}
                    >
                      <SelectTrigger className="h-10 text-base" id="agency-jenis">
                        <SelectValue placeholder="Pilih jenis usaha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="agency-office">
                      Alamat kantor
                    </label>
                    <Textarea
                      id="agency-office"
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      placeholder="Alamat kantor / domisili bisnis"
                      rows={3}
                      className="min-h-[4.5rem] resize-y text-base leading-relaxed"
                    />
                  </div>
                </div>
              ) : isAgencySite && step === 3 ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="agency-contact-pref">
                      Preferensi waktu dihubungi
                    </label>
                    <Input
                      id="agency-contact-pref"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      placeholder="Contoh: weekday 10:00–12:00 WIB"
                      className="h-10 text-base"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium text-foreground">Jabatan</span>
                      <Select value={jabatan} onValueChange={setJabatan}>
                        <SelectTrigger className="h-10 text-base" id="agency-jabatan">
                          <SelectValue placeholder="Pilih jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENCY_JABATAN_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium text-foreground">Kebutuhan</span>
                      <Select value={kebutuhan} onValueChange={setKebutuhan}>
                        <SelectTrigger className="h-10 text-base" id="agency-kebutuhan">
                          <SelectValue placeholder="Pilih kebutuhan" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENCY_KEBUTUHAN_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="agency-ringkasan">
                      Ringkasan kebutuhan
                    </label>
                    <Textarea
                      id="agency-ringkasan"
                      value={ringkasanKebutuhan}
                      onChange={(e) => setRingkasanKebutuhan(e.target.value)}
                      placeholder="Channel, tujuan, budget kasar, link aset, atau pertanyaan utama."
                      rows={4}
                      className="min-h-[5.5rem] resize-y text-base leading-relaxed"
                    />
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3">
                    <Checkbox
                      id="contact-data-consent"
                      checked={dataProcessingConsent}
                      onCheckedChange={(v) => setDataProcessingConsent(v === true)}
                      className="mt-0.5"
                      aria-required="true"
                    />
                    <label
                      htmlFor="contact-data-consent"
                      className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
                    >
                      Saya setuju pemrosesan data yang saya kirimkan pada formulir ini sesuai bagian formulir,
                      komunikasi, & data di{" "}
                      <Link
                        to="/terms-and-conditions"
                        className="font-medium text-navy underline-offset-2 hover:text-accent-orange hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Syarat & Ketentuan
                      </Link>
                      .
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="contact-pref-date">
                      Target mulai atau tanggal diskusi
                    </label>
                    <Input
                      id="contact-pref-date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-10 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Perkiraan kapan kampanye atau kerja sama ingin dimulai (boleh perkiraan).
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="contact-pref-time">
                      Preferensi waktu dihubungi
                    </label>
                    <Input
                      id="contact-pref-time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      step={900}
                      className="h-10 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Jam yang nyaman untuk dihubungi tim (contoh: siang WIB).
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="contact-context">
                      Ringkasan kebutuhan
                    </label>
                    <Textarea
                      id="contact-context"
                      value={eventAddress}
                      onChange={(e) => setEventAddress(e.target.value)}
                      placeholder="Channel (Meta/Google/TikTok), anggaran kasar, link website atau landing, dan pertanyaan utama Anda."
                      rows={4}
                      className="min-h-[5.5rem] resize-y text-base leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Semakin jelas konteksnya, semakin produktif percakapan pertama — isi sejujurnya Anda; tidak harus
                      sempurna.
                    </p>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3">
                    <Checkbox
                      id="contact-data-consent-wedding"
                      checked={dataProcessingConsent}
                      onCheckedChange={(v) => setDataProcessingConsent(v === true)}
                      className="mt-0.5"
                      aria-required="true"
                    />
                    <label
                      htmlFor="contact-data-consent-wedding"
                      className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
                    >
                      Saya setuju pemrosesan data yang saya kirimkan pada formulir ini sesuai bagian formulir,
                      komunikasi, & data di{" "}
                      <Link
                        to="/terms-and-conditions"
                        className="font-medium text-navy underline-offset-2 hover:text-accent-orange hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Syarat & Ketentuan
                      </Link>
                      .
                    </label>
                  </div>
                </div>
              )}

              {errorMessage ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                {step === 1 ? (
                  <Button type="button" variant="ghost" size="default" className="text-muted-foreground" asChild>
                    <Link to="/">Kembali ke beranda</Link>
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="default" className="text-muted-foreground" onClick={resetForm}>
                    Isi ulang dari awal
                  </Button>
                )}
                <Button
                  type="button"
                  size="default"
                  className="min-w-[8.5rem] rounded-full font-semibold"
                  disabled={!canNext}
                  data-track={TRACK_KEYS.contactCta}
                  onClick={onPrimary}
                >
                  {primaryLabel}
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
