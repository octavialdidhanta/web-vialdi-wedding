import { useCallback, useEffect, useState } from "react";
import {
  adminListLeadSubmissions,
  adminListProperties,
  type HubLeadSubmissionRow,
  type HubProperty,
} from "@/admin/lib/hubLeads";
import { Button } from "@/share/ui/button";
import { Input } from "@/share/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/share/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/share/ui/table";

const ALL_WEB = "__all__";

function formatDt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminLeadSubmissionsPage() {
  const [properties, setProperties] = useState<HubProperty[]>([]);
  const [webId, setWebId] = useState(ALL_WEB);
  const [formId, setFormId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<HubLeadSubmissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminListProperties()
      .then(setProperties)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Gagal memuat properti"));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminListLeadSubmissions({
        web_id: webId === ALL_WEB ? null : webId,
        form_id: formId.trim() || null,
        from: from.trim() ? new Date(from).toISOString() : null,
        to: to.trim() ? new Date(to).toISOString() : null,
        limit: 100,
        offset: 0,
      });
      setRows(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat lead");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [webId, formId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-w-0 p-6 md:p-8">
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Lead submissions (Hub)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Semua tenant dari <span className="font-mono text-xs">lead_submissions</span> — filter
          menurut property.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] space-y-1">
          <label className="text-xs text-muted-foreground">Property</label>
          <Select value={webId} onValueChange={setWebId}>
            <SelectTrigger>
              <SelectValue placeholder="Semua property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_WEB}>Semua property</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.display_name} ({p.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">form_id</label>
          <Input
            placeholder="contact-main"
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Dari</label>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Sampai</label>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Memuat…" : "Muat ulang"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto no-scrollbar rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dibuat</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telepon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {loading ? "Memuat…" : "Tidak ada data"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDt(r.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.property_display_name ?? r.web_id}</div>
                    <div className="font-mono text-xs text-muted-foreground">{r.web_id}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.form_id} v{r.form_version}
                  </TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.name ?? "—"}</TableCell>
                  <TableCell>{r.email ?? "—"}</TableCell>
                  <TableCell>{r.phone_number ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
}
