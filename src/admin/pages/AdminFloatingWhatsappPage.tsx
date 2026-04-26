import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchHomeFloatingWhatsappSettings,
  HOME_FLOATING_WHATSAPP_QUERY_KEY,
  normalizePhoneDigits,
  saveHomeFloatingWhatsappSettings,
} from "@/share/homeFloatingWhatsappSettings";
import { Button } from "@/share/ui/button";
import { Input } from "@/share/ui/input";
import { Label } from "@/share/ui/label";
import { Switch } from "@/share/ui/switch";
import { Textarea } from "@/share/ui/textarea";
import { cn } from "@/share/lib/utils";

const ID_CC = "62";

/** Digit setelah +62 untuk tampilan / input (tanpa 0 di depan). */
function nationalFromStored(phone_digits: string | null): string {
  if (!phone_digits) return "";
  let d = phone_digits.replace(/\D/g, "");
  if (d.startsWith(ID_CC)) d = d.slice(ID_CC.length);
  while (d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Saat mengetik / paste: hanya angka, hilangkan 62 di depan jika ada, lalu 0 di depan. */
function sanitizeNationalInput(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith(ID_CC)) d = d.slice(ID_CC.length);
  while (d.startsWith("0")) d = d.slice(1);
  return d;
}

export function AdminFloatingWhatsappPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: HOME_FLOATING_WHATSAPP_QUERY_KEY,
    queryFn: fetchHomeFloatingWhatsappSettings,
  });

  const [isEnabled, setIsEnabled] = useState(false);
  const [phoneNationalInput, setPhoneNationalInput] = useState("");
  const [prefill, setPrefill] = useState("");

  useEffect(() => {
    if (!data) return;
    setIsEnabled(data.is_enabled);
    setPhoneNationalInput(nationalFromStored(data.phone_digits));
    setPrefill(data.prefill_message ?? "");
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const national = sanitizeNationalInput(phoneNationalInput);
      const phone_digits =
        national.length > 0 ? normalizePhoneDigits(`${ID_CC}${national}`) : null;
      if (isEnabled && (!phone_digits || phone_digits.length < 8 || phone_digits.length > 15)) {
        throw new Error(
          "Lengkapi nomor setelah +62 (total 8–15 digit termasuk 62) saat tombol diaktifkan.",
        );
      }
      if (prefill.length > 2000) {
        throw new Error("Sapaan maksimal 2000 karakter.");
      }
      await saveHomeFloatingWhatsappSettings({
        is_enabled: isEnabled,
        phone_digits,
        prefill_message: prefill,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...HOME_FLOATING_WHATSAPP_QUERY_KEY] });
      toast.success("Pengaturan WhatsApp disimpan.");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan.";
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground" aria-busy>
        Memuat pengaturan…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-destructive">
        {error instanceof Error ? error.message : "Gagal memuat data."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-navy">
          <MessageCircle className="h-7 w-7 shrink-0" aria-hidden />
          Tombol WhatsApp beranda
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ikon mengambang di halaman utama mengarah ke{" "}
          <span className="font-medium text-foreground">wa.me</span> dengan nomor dan sapaan di
          bawah. Nonaktifkan untuk menyembunyikan tombol di situs publik.
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between gap-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="wa-enabled" className="text-base">
              Tampilkan tombol WhatsApp
            </Label>
            <p className="text-xs text-muted-foreground">
              Matikan untuk menyembunyikan ikon di beranda tanpa menghapus nomor.
            </p>
          </div>
          <Switch
            id="wa-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            aria-label="Aktifkan tombol WhatsApp mengambang"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-phone">Nomor WhatsApp</Label>
          <div
            className={cn(
              "flex h-10 min-w-0 overflow-hidden rounded-md border border-input bg-background text-sm ring-offset-background",
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
              save.isPending && "pointer-events-none opacity-50",
            )}
          >
            <span
              className="flex shrink-0 items-center border-r border-input bg-muted/50 px-3 font-medium tabular-nums text-muted-foreground"
              aria-hidden
            >
              +62
            </span>
            <Input
              id="wa-phone"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="81281714855"
              value={phoneNationalInput}
              onChange={(e) => setPhoneNationalInput(sanitizeNationalInput(e.target.value))}
              disabled={save.isPending}
              className="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-describedby="wa-phone-hint"
            />
          </div>
          <p id="wa-phone-hint" className="text-xs text-muted-foreground">
            Isi nomor seluler tanpa 0 di depan. Kode negara +62 sudah disetel. Tempel nomor lengkap
            (mis. 62812…) pun akan disesuaikan otomatis.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-prefill">Sapaan / pesan awal (opsional)</Label>
          <Textarea
            id="wa-prefill"
            rows={4}
            maxLength={2000}
            placeholder="Halo Vialdi Wedding, saya ingin bertanya tentang paket…"
            value={prefill}
            onChange={(e) => setPrefill(e.target.value)}
            disabled={save.isPending}
            className="min-h-[6rem] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Akan terisi otomatis di kotak chat WhatsApp (maks. 2000 karakter).
          </p>
        </div>

        <Button type="button" disabled={save.isPending} onClick={() => void save.mutateAsync()}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
