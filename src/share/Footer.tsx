import { Link } from "react-router-dom";
import { TRACK_KEYS } from "@/analytics/trackRegistry";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <h4 className="text-lg font-bold">PT. Integrasi Visual Digital Indonesia</h4>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
            Jl. Tawakal VI A No.104, RT.5/RW.9, Tomang, Kec. Grogol petamburan, Kota Jakarta Barat,
            DKI Jakarta 11440
          </p>
        </div>
        <div>
          <h4 className="text-lg font-bold">Subscribe Now</h4>
          <p className="mt-4 text-sm text-primary-foreground/85">
            Don't miss our future updates! Get Subscribed Today!
          </p>
          <form className="mt-4 flex overflow-hidden rounded-full bg-white p-1">
            <input
              type="email"
              placeholder="Your mail here"
              className="flex-1 bg-transparent px-4 py-2 text-sm text-navy outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              data-track={TRACK_KEYS.footerSubscribe}
              className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              ✉
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-6 py-4 text-xs text-primary-foreground/70 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-xl text-center sm:text-left">
            Kami mencatat kunjungan anonim (tanpa fingerprint) untuk memperbaiki situs. Tidak
            menyimpan data formulir kontak di analytics.
          </p>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <span>©2025 All Rights Reserved.</span>
            <Link
              to="/terms-and-conditions"
              className="font-medium text-primary-foreground/90 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
