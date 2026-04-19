import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BriefcaseBusiness,
  Cake,
  GraduationCap,
  Heart,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

type Category = { label: string; description: string; icon: LucideIcon };

const categories: Category[] = [
  {
    label: "Wedding",
    description: "Dokumentasi hari bahagia lengkap dengan tim profesional.",
    icon: Heart,
  },
  {
    label: "Prewedding",
    description: "Konsep kreatif untuk cerita cinta sebelum hari H.",
    icon: Sparkles,
  },
  {
    label: "Maternity",
    description: "Kehangatan kehamilan diabadikan dengan sentuhan lembut.",
    icon: Baby,
  },
  {
    label: "Family",
    description: "Momen kebersamaan keluarga yang hangat dan natural.",
    icon: UsersRound,
  },
  {
    label: "Personal",
    description: "Portrait personal untuk profil, branding, atau koleksi pribadi.",
    icon: UserRound,
  },
  {
    label: "Birthday",
    description: "Perayaan ulang tahun penuh warna dan energi positif.",
    icon: Cake,
  },
  {
    label: "Graduation",
    description: "Pencapaian akademik yang layak dirayakan dengan gaya.",
    icon: GraduationCap,
  },
  {
    label: "Com Pro",
    description: "Company profile dan visual bisnis yang meyakinkan.",
    icon: BriefcaseBusiness,
  },
];

export function ServiceCategoryGrid() {
  return (
    <div className="mx-auto max-w-[90rem] px-4 md:px-6">
      <h2 className="text-center text-2xl font-bold tracking-tight text-navy md:text-3xl">
        Layanan Vialdi Wedding
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
        Dari hari pernikahan hingga dokumentasi profesional — kami siap menemani setiap babak
        penting perjalanan Anda.
      </p>

      <ul className="mt-6 grid grid-cols-4 grid-rows-2 gap-x-1.5 gap-y-2.5 sm:gap-x-2.5 sm:gap-y-3 md:gap-x-4 md:gap-y-4">
        {categories.map(({ label, description, icon: Icon }) => (
          <li key={label} className="flex min-w-0 flex-col items-center text-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.9_0.04_300)] to-[oklch(0.97_0.015_95)] shadow-md sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-2xl md:h-[5.25rem] md:w-[5.25rem] lg:h-28 lg:w-28">
              <Icon
                className="h-7 w-7 text-[oklch(0.48_0.18_300)] drop-shadow-sm sm:h-9 sm:w-9 md:h-11 md:w-11 lg:h-12 lg:w-12"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <span className="mt-1 max-w-full px-0.5 text-[0.65rem] font-semibold leading-tight text-navy sm:mt-1.5 sm:text-xs md:text-sm">
              {label}
            </span>
            <span className="mt-0.5 hidden text-xs leading-snug text-muted-foreground md:block">
              {description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
