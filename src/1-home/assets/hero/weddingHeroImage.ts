import hero480 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=480&format=webp";
import hero640 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=640&format=webp";
import hero960 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=960&format=webp";
import hero1280 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=1280&format=webp";
import hero1600 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=1600&format=webp";

/** Preload + fallback mobile — 480w cukup untuk slot ~390px × DPR 2–3. */
export const WEDDING_HERO_PRELOAD_WIDTH = 480;
export const WEDDING_HERO_IMAGE_SRC = hero480;

export const WEDDING_HERO_IMAGE_SRCSET = `${hero480} 480w, ${hero640} 640w, ${hero960} 960w, ${hero1280} 1280w, ${hero1600} 1600w`;
