import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";

export function WeddingFaqSection() {
  return (
    <section id="home-faq" className="scroll-mt-24 bg-background pb-20">
      <div className="mx-auto max-w-[90rem] px-2.5 md:px-6">
        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border bg-card px-3 py-6 shadow-sm md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">FAQ</h2>
            <p className="mt-3 text-muted-foreground">
              Pertanyaan yang sering ditanyakan sebelum memesan layanan wedding organizer &amp; dokumentasi.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Apa saja yang dicakup oleh Vialdi Wedding?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Kami menyediakan dokumentasi foto &amp; video (termasuk paket dengan album), kolaborasi dengan vendor
                  rias dan busana, serta pendampingan dekorasi pelaminan sesuai paket yang dipilih.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Bagaimana cara memilih paket yang tepat?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Setelah konsultasi gratis, kami merekomendasikan durasi tim, jumlah fotografer / videografer, dan add-on
                  berdasarkan skala acara (rumah, outdoor, hotel, atau gedung).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Kapan hasil foto dan video biasanya selesai?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Waktu penyelesaian bervariasi per paket. Untuk paket prioritas, estimasi hasil foto utama dapat lebih
                  cepat — detail tertuang di proposal resmi.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Apakah revisi editing dimungkinkan?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Ya, dalam batas wajar dan sesuai kesepakatan di kontrak. Tujuan kami adalah hasil yang Anda banggakan
                  tanpa mengorbankan kualitas artistik.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>Apakah melayani luar kota?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Silakan sampaikan kota dan venue pada formulir kontak. Biaya transport &amp; akomodasi tim (jika
                  diperlukan) akan dijelaskan secara transparan.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}

