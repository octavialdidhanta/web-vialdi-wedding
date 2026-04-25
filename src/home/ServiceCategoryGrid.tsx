import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  Globe,
  Megaphone,
  PenTool,
  Settings2,
  Target,
  Users,
} from "lucide-react";

type Category = { label: string; description: string; icon: LucideIcon };

const categories: Category[] = [
  {
    label: "Lead Acquisition",
    description: "Menarik prospek berkualitas lewat iklan, landing page, dan funnel yang rapi.",
    icon: Target,
  },
  {
    label: "Lead Activation",
    description: "Nurturing & follow-up terstruktur agar prospek siap jadi customer.",
    icon: Users,
  },
  {
    label: "Campaign & Ads",
    description: "Strategi, eksekusi, dan optimasi iklan untuk hasil yang terukur.",
    icon: Megaphone,
  },
  {
    label: "Content & Creative",
    description: "Visual & copywriting persuasif untuk meningkatkan engagement dan konversi.",
    icon: PenTool,
  },
  {
    label: "Digital Presence",
    description: "Website & social media yang konsisten untuk memperkuat brand Anda.",
    icon: Globe,
  },
  {
    label: "Project Management",
    description: "Eksekusi rapi, timeline jelas, dan koordinasi yang transparan.",
    icon: ClipboardList,
  },
  {
    label: "Analytics & Reporting",
    description: "Tracking KPI, insight data, dan laporan performa yang mudah dipahami.",
    icon: BarChart3,
  },
  {
    label: "Optimization",
    description: "Improvement berkelanjutan untuk menaikkan conversion rate dan ROI.",
    icon: Settings2,
  },
];

export function ServiceCategoryGrid() {
  return (
    <div className="mx-auto max-w-[90rem] px-2.5 md:px-6">
      <h2 className="text-center text-2xl font-bold tracking-tight text-navy md:text-3xl">
        Layanan Kami
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
        vialdi.id hadir untuk membantu perusahaan Anda dalam memaksimalkan project management,
        akuisisi lead, dan aktivasi prospek dalam mendorong peningkatan penjualan Anda!
      </p>

      <ul className="mt-6 grid grid-cols-4 grid-rows-2 gap-x-1.5 gap-y-2.5 sm:gap-x-2.5 sm:gap-y-3 md:gap-x-4 md:gap-y-4">
        {categories.map(({ label, description, icon: Icon }) => (
          <li key={label} className="flex min-w-0 flex-col items-center text-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-2xl md:h-[5.25rem] md:w-[5.25rem] lg:h-28 lg:w-28">
              <Icon
                className="h-7 w-7 text-accent-orange sm:h-9 sm:w-9 md:h-11 md:w-11 lg:h-12 lg:w-12"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <span className="mt-1 max-w-full px-0.5 text-[0.65rem] font-semibold leading-tight text-navy sm:mt-1.5 sm:text-xs md:text-sm">
              {label}
            </span>
            <span className="mt-1 hidden max-w-[12rem] min-h-[2.6rem] text-xs leading-snug text-muted-foreground md:line-clamp-2 md:block">
              {description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
