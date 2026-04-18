import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitContactLead } from "@/contact/api";
import { useContactPageMeta } from "@/contact/useContactPageMeta";
import {
  bidangUsahaOptions,
  jabatanOptions,
  jenisUsahaOptions,
  kebutuhanOptions,
} from "@/contact/options";
import { Header } from "@/share/Header";
import { Footer } from "@/share/Footer";
import { Button } from "@/share/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/share/ui/card";
import { Input } from "@/share/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/share/ui/select";
import { Textarea } from "@/share/ui/textarea";

type Step = 1 | 2 | 3;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function normalizePhone(v: string) {
  const trimmed = v.trim();
  const compact = trimmed.replace(/[\s().-]/g, "");

  if (compact.startsWith("+")) {
    const digits = compact.slice(1).replace(/[^\d]/g, "");
    return `+${digits}`;
  }

  const digitsOnly = compact.replace(/[^\d]/g, "");
  if (/^(0?8\d{8,13})$/.test(digitsOnly)) {
    const national = digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly;
    return `+62${national}`;
  }

  const digits = compact.replace(/[^\d]/g, "");
  return digits.length ? `+${digits}` : "";
}

function isValidPhone(v: string) {
  const normalized = normalizePhone(v);
  const digits = normalized.replace(/[^\d]/g, "");
  return normalized.startsWith("+") && digits.length >= 9 && digits.length <= 15;
}

export function ContactPage() {
  useContactPageMeta();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [leadVialdiId, setLeadVialdiId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Step 1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState<{ phone: boolean; email: boolean }>({
    phone: false,
    email: false,
  });

  // Step 2
  const [industry, setIndustry] = useState<string>("");
  const [businessType, setBusinessType] = useState<"B2B" | "B2C" | "">("");

  // Step 3
  const [jobTitle, setJobTitle] = useState("");
  const [needs, setNeeds] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");

  const phoneOk = isValidPhone(phone);
  const emailOk = isValidEmail(email);

  const canNext = useMemo(() => {
    if (submitting) return false;
    if (step === 1) return name.trim() && phoneOk && emailOk;
    if (step === 2) return !!leadVialdiId && industry.trim() && businessType;
    return !!leadVialdiId && jobTitle.trim() && needs.trim() && officeAddress.trim();
  }, [
    businessType,
    emailOk,
    industry,
    jobTitle,
    leadVialdiId,
    name,
    needs,
    officeAddress,
    phoneOk,
    step,
    submitting,
  ]);

  async function onNext() {
    if (!canNext) return;
    setSubmitting(true);
    setErrorMessage("");
    try {
      if (step === 1) {
        const res = await submitContactLead({
          step: 1,
          name: name.trim(),
          phone_number: phone.trim(),
          email: email.trim(),
        });
        setLeadVialdiId(res.id);
        setStep(2);
        return;
      }

      if (step === 2) {
        const res = await submitContactLead({
          step: 2,
          id: leadVialdiId!,
          industry,
          business_type: businessType as "B2B" | "B2C",
        });
        setLeadVialdiId(res.id);
        setStep(3);
        return;
      }

      await submitContactLead({
        step: 3,
        id: leadVialdiId!,
        job_title: jobTitle,
        needs,
        office_address: officeAddress,
      });
      navigate("/thank-you-page");
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8">
            <div className="text-sm font-semibold text-muted-foreground">Kontak</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Mulai dari sini, kami bantu rancang strategi growth bisnismu.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cukup 3 langkah singkat (±30 detik). Informasi ini membantu kami memberi rekomendasi
              awal yang relevan tanpa komitmen.
            </p>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Step {step} / 3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Tenang, ini untuk menghubungi kamu terkait konsultasi saja—bukan spam.
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nama</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama kamu"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nomor telepon</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      placeholder="Contoh: 0812xxxxxxx"
                      inputMode="tel"
                    />
                    {touched.phone && !phoneOk ? (
                      <div className="text-xs font-medium text-destructive">
                        Nomor telepon tidak valid. Gunakan 9–15 digit (contoh: 0812xxxxxxx atau
                        +62812xxxxxxx).
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="nama@perusahaan.com"
                      inputMode="email"
                    />
                    {touched.email && !emailOk ? (
                      <div className="text-xs font-medium text-destructive">
                        Email tidak valid. Pastikan formatnya seperti nama@perusahaan.com.
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Supaya rekomendasi kami tepat, bantu jawab konteks bisnisnya dulu.
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bidang usaha</label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bidang usaha" />
                      </SelectTrigger>
                      <SelectContent>
                        {bidangUsahaOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Jenis usaha</label>
                    <Select
                      value={businessType}
                      onValueChange={(v) => setBusinessType(v as "B2B" | "B2C")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis usaha" />
                      </SelectTrigger>
                      <SelectContent>
                        {jenisUsahaOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Terakhir, pilih kebutuhan utama. Kami akan respon dengan langkah paling relevan.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Jabatan</label>
                      <Select value={jobTitle} onValueChange={setJobTitle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {jabatanOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Kebutuhan</label>
                      <Select value={needs} onValueChange={setNeeds}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kebutuhan" />
                        </SelectTrigger>
                        <SelectContent>
                          {kebutuhanOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Alamat kantor</label>
                    <Textarea
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      placeholder="Alamat kantor / domisili bisnis"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                {errorMessage ? (
                  <div className="mr-auto text-xs font-medium text-destructive">{errorMessage}</div>
                ) : null}
                <Button onClick={onNext} disabled={!canNext}>
                  {step === 3
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
      </div>
      <Footer />
    </div>
  );
}
