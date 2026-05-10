import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import {
  adminApproveAnalyticsWebAccess,
  adminListAnalyticsWebAccess,
  adminRevokeAnalyticsWebAccess,
  type AnalyticsWebAccessRow,
} from "@/admin/lib/analyticsWebAccess";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/share/ui/alert-dialog";
import { Button } from "@/share/ui/button";

function formatDt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function shortUuid(id: string): string {
  const t = id.replace(/-/g, "");
  return t.length >= 8 ? `${t.slice(0, 8)}…` : id;
}

/** Nama dari `organizations.company_name`, fallback singkat ke UUID. */
function organizationLabel(r: AnalyticsWebAccessRow): string {
  const name = r.organization_name?.trim();
  if (name) return name;
  return shortUuid(r.organization_id);
}

function organizationTitle(r: AnalyticsWebAccessRow): string {
  const name = r.organization_name?.trim();
  const id = r.organization_id;
  if (name) return `${name} — ${id}`;
  return id;
}

type ConfirmState =
  | null
  | { action: "approve"; row: AnalyticsWebAccessRow }
  | { action: "revoke"; row: AnalyticsWebAccessRow };

export function AdminWebAccessRequestsPage() {
  const qc = useQueryClient();
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmState>(null);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin", "analytics-web-access"],
    queryFn: adminListAnalyticsWebAccess,
  });

  const approve = useMutation({
    mutationFn: adminApproveAnalyticsWebAccess,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "analytics-web-access"] });
      toast.success("Permintaan disetujui");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: adminRevokeAnalyticsWebAccess,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "analytics-web-access"] });
      toast.success("Koneksi diputus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy = approve.isPending || revoke.isPending;

  async function runConfirmAction() {
    if (!pendingConfirm) return;
    const { action, row } = pendingConfirm;
    try {
      if (action === "approve") {
        await approve.mutateAsync({
          organization_id: row.organization_id,
          web_id: row.web_id,
        });
      } else {
        await revoke.mutateAsync({
          organization_id: row.organization_id,
          web_id: row.web_id,
        });
      }
      setPendingConfirm(null);
    } catch {
      /* toast dari mutation */
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="sticky top-0 z-10 -mx-6 flex flex-col gap-4 border-b border-border/60 bg-muted/25 px-6 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-muted/20 md:-mx-8 md:px-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
            <Inbox className="h-7 w-7 shrink-0" aria-hidden />
            Request akses Web ID
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Data dari tabel{" "}
            <span className="font-mono text-xs">public.analytics_web_access</span> — persetujuan akses{" "}
            <span className="font-mono">organization_id</span> ↔{" "}
            <span className="font-mono">web_id</span>. Tombol Setujui mengubah{" "}
            <span className="font-mono text-xs">is_approved</span>. Putuskan koneksi mengembalikan status ke
            menunggu persetujuan.
          </p>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{(error as Error).message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Dibuat</th>
              <th className="px-4 py-3 font-medium">Organization</th>
              <th className="px-4 py-3 font-medium">Web ID</th>
              <th className="px-4 py-3 font-medium">Oleh (user)</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Memuat…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada baris. Pastikan migrasi kebijakan CMS untuk{" "}
                  <span className="font-mono text-xs">analytics_web_access</span> sudah dijalankan, dan
                  ada data di tabel tersebut.
                </td>
              </tr>
            ) : (
              rows.map((r: AnalyticsWebAccessRow) => (
                <tr key={`${r.organization_id}:${r.web_id}`} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDt(r.created_at)}
                  </td>
                  <td
                    className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-navy"
                    title={organizationTitle(r)}
                  >
                    {organizationLabel(r)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-navy">{r.web_id}</td>
                  <td
                    className="max-w-[140px] truncate px-4 py-3 font-mono text-xs"
                    title={r.created_by ?? ""}
                  >
                    {r.created_by ? shortUuid(r.created_by) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.is_approved ? (
                      <span className="text-emerald-700 dark:text-emerald-400">Disetujui</span>
                    ) : (
                      <span className="text-amber-800 dark:text-amber-200">Menunggu</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.is_approved ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={busy}
                        onClick={() => setPendingConfirm({ action: "revoke", row: r })}
                      >
                        Putuskan koneksi
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => setPendingConfirm({ action: "approve", row: r })}
                      >
                        Setujui
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={Boolean(pendingConfirm)}
        onOpenChange={(open) => {
          if (!open && !busy) setPendingConfirm(null);
        }}
      >
        <AlertDialogContent
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingConfirm?.action === "approve" ? "Setujui akses Web ID?" : "Putuskan koneksi?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {pendingConfirm?.action === "approve" ? (
                  <p>
                    Anda akan menyetujui akses analytics untuk{" "}
                    <span className="font-mono font-medium text-foreground">{pendingConfirm.row.web_id}</span> pada
                    organisasi{" "}
                    <span className="font-semibold text-foreground">{organizationLabel(pendingConfirm.row)}</span>
                    .
                  </p>
                ) : pendingConfirm?.action === "revoke" ? (
                  <p>
                    Akses{" "}
                    <span className="font-mono font-medium text-foreground">{pendingConfirm.row.web_id}</span> untuk{" "}
                    <span className="font-semibold text-foreground">{organizationLabel(pendingConfirm.row)}</span> akan
                    dicabut. Status kembali menunggu persetujuan (
                    <span className="font-mono text-xs">is_approved</span> menjadi salah).
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={
                pendingConfirm?.action === "revoke"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                void runConfirmAction();
              }}
            >
              {busy
                ? pendingConfirm?.action === "approve"
                  ? "Menyetujui…"
                  : "Memutuskan…"
                : pendingConfirm?.action === "approve"
                  ? "Ya, setujui"
                  : "Ya, putuskan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
