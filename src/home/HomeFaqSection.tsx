import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";

/** FAQ beranda — chunk terpisah agar Radix Accordion tidak ikut parse awal Home. */
export function HomeFaqSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[90rem] px-2.5 md:px-6 pb-20">
        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border bg-card px-2.5 py-6 shadow-sm md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">FAQ</h2>
            <p className="mt-3 text-muted-foreground">
              Pertanyaan yang sering ditanyakan sebelum mulai kerja sama.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Apa yang dimaksud layanan vialdi.id?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  vialdi.id adalah Digital Growth Partner yang membantu bisnis meningkatkan penjualan
                  melalui strategi dan eksekusi end-to-end: lead acquisition, lead activation, digital
                  presence, dan digital optimization.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Masalah bisnis apa yang paling sering kami bantu selesaikan?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Umumnya: leads kurang stabil, biaya iklan naik (CPL/CPA), conversion rate rendah di
                  landing page, follow-up prospek tidak rapi, dan kurangnya insight yang bisa
                  ditindaklanjuti.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Layanan apa saja yang tersedia?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Performance ads (Meta/TikTok/Google), landing page &amp; CRO, creative &amp;
                  copywriting, tracking &amp; analytics, serta reporting &amp; optimasi rutin.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Bagaimana cara kerja dan alur kolaborasinya?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Dimulai dari audit singkat &amp; penentuan KPI, lalu setup tracking dan struktur
                  campaign. Setelah itu masuk fase testing (creative/audience) dan optimasi rutin.
                  Setiap minggu ada update progres + next action yang jelas.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Berapa lama biasanya terlihat hasil?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Tergantung channel dan kesiapan funnel. Umumnya 1–2 minggu untuk fase testing dan
                  baseline data, lalu 3–6 minggu untuk melihat tren performa yang lebih stabil.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Apakah biaya iklan (ad spend) termasuk?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Tidak. Ad spend dibayar langsung ke platform (Meta/TikTok/Google). Fee layanan kami
                  terpisah dan transparan, sesuai scope yang disepakati.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>Apakah ada kontrak dan laporan rutin?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Ya. Kami gunakan proposal + kontrak kerja, dan memberikan laporan rutin (mingguan
                  dan ringkasan bulanan) berisi KPI, insight, serta rekomendasi next action.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
