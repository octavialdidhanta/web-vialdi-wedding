import { BeforeAfterShowcase } from "@/1-home/sections/BeforeAfterShowcase";

/** Kolom kanan di samping Janji — hanya Before & After. */
export function JanjiCompanionColumn() {
  return (
    <div className="min-w-0">
      <BeforeAfterShowcase />
    </div>
  );
}
