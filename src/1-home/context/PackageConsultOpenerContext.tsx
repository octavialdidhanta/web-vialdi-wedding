import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  /** Bertambah setiap CTA meminta form konsultasi pada kartu paket terbuka. */
  openSeq: number;
  /** Bertambah saat blok paket tidak lagi terlihat di viewport — tutup semua form. */
  closeSeq: number;
  requestOpenAllPackageConsults: () => void;
};

const PackageConsultOpenerContext = createContext<Ctx | null>(null);

const PAKET_SECTION_ID = "paket-dokumentasi";
/** Debounce agar scroll halus / tepi viewport tidak menutup form secara tidak sengaja. */
const HIDE_DEBOUNCE_MS = 220;

export function PackageConsultOpenerProvider({ children }: { children: ReactNode }) {
  const [openSeq, setOpenSeq] = useState(0);
  const [closeSeq, setCloseSeq] = useState(0);

  const requestOpenAllPackageConsults = useCallback(() => {
    setOpenSeq((n) => n + 1);
  }, []);

  const requestCloseAllPackageConsults = useCallback(() => {
    setCloseSeq((n) => n + 1);
  }, []);

  useLayoutEffect(() => {
    if (openSeq === 0) return;
    document.getElementById(PAKET_SECTION_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [openSeq]);

  useEffect(() => {
    const root = document.getElementById(PAKET_SECTION_ID);
    if (!root) return;

    let sectionHasBeenVisible = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          sectionHasBeenVisible = true;
          if (hideTimer !== undefined) {
            clearTimeout(hideTimer);
            hideTimer = undefined;
          }
          return;
        }
        if (!sectionHasBeenVisible) return;
        if (hideTimer !== undefined) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          hideTimer = undefined;
          requestCloseAllPackageConsults();
        }, HIDE_DEBOUNCE_MS);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    obs.observe(root);
    return () => {
      obs.disconnect();
      if (hideTimer !== undefined) clearTimeout(hideTimer);
    };
  }, [requestCloseAllPackageConsults]);

  const value = useMemo(
    () => ({ openSeq, closeSeq, requestOpenAllPackageConsults }),
    [openSeq, closeSeq, requestOpenAllPackageConsults],
  );

  return <PackageConsultOpenerContext.Provider value={value}>{children}</PackageConsultOpenerContext.Provider>;
}

export function usePackageConsultOpenerOptional() {
  return useContext(PackageConsultOpenerContext);
}
