import hero640 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=640&format=webp";
import hero960 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=960&format=webp";
import hero1280 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=1280&format=webp";
import hero1600 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=1600&format=webp";

/**
 * `src` memakai ~960w sebagai fallback utama: selaras slot mobile (≈360–400px × DPR 2–3) + preload build,
 * sehingga LCP jarang “upgrade” dari file terlalu kecil ke yang lebih besar.
 */
export const WEDDING_HERO_IMAGE_SRC = hero960;

export const WEDDING_HERO_IMAGE_SRCSET = `${hero640} 640w, ${hero960} 960w, ${hero1280} 1280w, ${hero1600} 1600w`;
