import hero640 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=640&format=webp";
import hero960 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=960&format=webp";
import hero1280 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=1280&format=webp";
import hero1600 from "@/1-home/assets/hero/DSC00768_11zon.webp?w=1600&format=webp";

/**
 * `src` memakai varian terkecil yang masih tajam di slot hero (≈560px lebar kolom di desktop).
 * Browser modern memilih URL yang lebih besar dari `srcSet` sesuai `sizes` + DPR.
 */
export const WEDDING_HERO_IMAGE_SRC = hero640;

export const WEDDING_HERO_IMAGE_SRCSET = `${hero640} 640w, ${hero960} 960w, ${hero1280} 1280w, ${hero1600} 1600w`;
