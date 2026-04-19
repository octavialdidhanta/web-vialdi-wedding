const STORAGE_KEY = "vialdi_wedding_lead_identity_v1";

export type LeadIdentity = {
  name: string;
  phone: string;
  email: string;
};

export function readLeadIdentity(): LeadIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (typeof o.name !== "string" || typeof o.phone !== "string" || typeof o.email !== "string") {
      return null;
    }
    return { name: o.name, phone: o.phone, email: o.email };
  } catch {
    return null;
  }
}

/** Menyimpan identitas kontak setelah langkah 1 sukses (atau saat data valid). */
export function saveLeadIdentity(identity: LeadIdentity): void {
  if (typeof window === "undefined") return;
  try {
    const payload: LeadIdentity = {
      name: identity.name.trim(),
      phone: identity.phone.trim(),
      email: identity.email.trim(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
}
