import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarRange } from "lucide-react";
import { adminFetchRollupDayBounds } from "@/admin/lib/analyticsAdmin";
import {
  TRAFFIC_DATE_PRESET_LABELS,
  TRAFFIC_DATE_PRESET_ORDER,
  computeTrafficPresetRange,
  dateToJakartaYmd,
  jakartaTodayYmd,
  jakartaYmdToLocalDate,
  type TrafficDatePreset,
} from "@/admin/lib/trafficDashboardDateRange";
import { Button } from "@/share/ui/button";
import { Calendar } from "@/share/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/share/ui/dialog";
import { Label } from "@/share/ui/label";
import { RadioGroup, RadioGroupItem } from "@/share/ui/radio-group";
import { cn } from "@/share/lib/utils";

function formatRangeFooter(fromYmd: string, toYmd: string): string {
  const a = jakartaYmdToLocalDate(fromYmd);
  const b = jakartaYmdToLocalDate(toYmd);
  return `${format(a, "d MMM yyyy")} - ${format(b, "d MMM yyyy")}`;
}

export function TrafficDateRangeControl({
  webId,
  appliedPreset,
  appliedFromYmd,
  appliedToYmd,
  onApply,
}: {
  webId: string;
  appliedPreset: TrafficDatePreset;
  appliedFromYmd: string;
  appliedToYmd: string;
  onApply: (next: { preset: TrafficDatePreset; fromYmd: string; toYmd: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftPreset, setDraftPreset] = useState<TrafficDatePreset>(appliedPreset);
  const [draftFrom, setDraftFrom] = useState(appliedFromYmd);
  const [draftTo, setDraftTo] = useState(appliedToYmd);

  useEffect(() => {
    if (!open) return;
    setDraftPreset(appliedPreset);
    setDraftFrom(appliedFromYmd);
    setDraftTo(appliedToYmd);
  }, [open, appliedPreset, appliedFromYmd, appliedToYmd]);

  const todayYmd = jakartaTodayYmd();
  const todayDate = jakartaYmdToLocalDate(todayYmd);

  function applyPreset(preset: TrafficDatePreset) {
    setDraftPreset(preset);
    if (preset === "maximum") {
      void (async () => {
        const b = await adminFetchRollupDayBounds(webId);
        const bounds = b.min && b.max ? { min: b.min, max: b.max } : null;
        const r = computeTrafficPresetRange("maximum", todayYmd, bounds);
        setDraftFrom(r.from);
        setDraftTo(r.to);
      })();
      return;
    }
    const r = computeTrafficPresetRange(preset, todayYmd, null);
    setDraftFrom(r.from);
    setDraftTo(r.to);
  }

  function onCalendarSelect(range: DateRange | undefined) {
    setDraftPreset("custom");
    if (!range?.from) {
      return;
    }
    const fromY = dateToJakartaYmd(range.from);
    const toY = range.to ? dateToJakartaYmd(range.to) : fromY;
    setDraftFrom(fromY);
    setDraftTo(toY);
  }

  async function handleUpdate() {
    let from = draftFrom;
    let to = draftTo;
    if (draftPreset === "maximum") {
      const b = await adminFetchRollupDayBounds(webId);
      const t = jakartaTodayYmd();
      let min = b.min ?? t;
      let max = b.max ?? t;
      if (min > max) {
        const x = min;
        min = max;
        max = x;
      }
      from = min;
      to = max;
    }
    if (from > to) {
      const x = from;
      from = to;
      to = x;
    }
    onApply({ preset: draftPreset, fromYmd: from, toYmd: to });
    setOpen(false);
  }

  const triggerSummary =
    appliedPreset === "custom"
      ? formatRangeFooter(appliedFromYmd, appliedToYmd)
      : `${TRAFFIC_DATE_PRESET_LABELS[appliedPreset]} · ${formatRangeFooter(appliedFromYmd, appliedToYmd)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-10 w-full max-w-md justify-start gap-2 text-left font-normal sm:max-w-lg"
        >
          <CalendarRange className="size-4 shrink-0 opacity-70" aria-hidden />
          <span className="truncate text-sm">{triggerSummary}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex max-h-[min(92vh,880px)] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl",
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Date range</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <div className="shrink-0 border-b p-4 sm:w-52 sm:border-r sm:border-b-0 sm:p-4">
            <RadioGroup
              value={draftPreset}
              onValueChange={(v) => applyPreset(v as TrafficDatePreset)}
              className="gap-1"
            >
              {TRAFFIC_DATE_PRESET_ORDER.map((key) => (
                <div key={key} className="flex items-center gap-2 py-0.5">
                  <RadioGroupItem value={key} id={`preset-${key}`} />
                  <Label htmlFor={`preset-${key}`} className="cursor-pointer text-sm font-normal">
                    {TRAFFIC_DATE_PRESET_LABELS[key]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="min-w-0 flex-1 overflow-x-auto p-2 sm:p-4">
            <Calendar
              mode="range"
              weekStartsOn={0}
              numberOfMonths={2}
              selected={{
                from: jakartaYmdToLocalDate(draftFrom),
                to: jakartaYmdToLocalDate(draftTo),
              }}
              onSelect={onCalendarSelect}
              disabled={{ after: todayDate }}
              defaultMonth={jakartaYmdToLocalDate(draftTo)}
              className="mx-auto w-fit rounded-md border border-border/60 p-2 shadow-sm"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="text-sm font-medium tabular-nums">{formatRangeFooter(draftFrom, draftTo)}</div>
            <div className="mt-1 text-xs text-muted-foreground">Dates are shown in Jakarta Time</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleUpdate()}>
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
