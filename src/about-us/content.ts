/** Copy halaman About Us (Bahasa Indonesia). Edit di sini tanpa menyentuh JSX. */

export const aboutSeo = {
  title: "Tentang Kami — vialdi.id | Octa Vialdi & cerita perjalanan kami",
  description:
    "Kenali vialdi.id dan Octa Vialdi: mitra digital marketing yang memahami tekanan bisnis—lead, funnel, dan eksekusi yang terukur. Cerita singkat, nilai kerja, dan langkah selanjutnya.",
} as const;

export const hero = {
  eyebrow: "Tentang kami",
  title:
    "Kami percaya pertumbuhan bisnis layak didampingi dengan empati, data, dan eksekusi yang jernih.",
  lead: "vialdi.id hadir sebagai digital marketing agency yang tidak hanya bicara soal traffic, tetapi soal alur: bagaimana calon pelanggan menemukan Anda, mempercayai Anda, dan memilih Anda tanpa membuat tim Anda kehabisan napas.",
} as const;

export const storyEmpathy = {
  title: "Cerita dimulai dari keresahan yang sama",
  paragraphs: [
    "Di balik laporan iklan, spreadsheet, dan notifikasi platform, sering kali ada pertanyaan yang berat: “Sudah spend segini, kenapa closing belum stabil?” Waktu pemilik bisnis terbatas, ekspektasi besar, dan ruang untuk trial-error semakin sempit. Kami mengerti karena perasaan itu yang juga mendorong kami untuk membangun cara kerja yang lebih manusiawi.",
    "Kami tidak menjanjikan jalan pintas. Yang kami tawarkan adalah pendampingan: mendengarkan konteks bisnis Anda, merapikan prioritas, lalu mengeksekusi langkah demi langkah agar funnel digital Anda terbaca oleh tim marketing, sales, maupun leadership.",
  ],
} as const;

export const positioning = {
  title: "Positioning kami: digital marketing yang mengarah ke bisnis",
  subtitle:
    "Sebagai digital marketing agency, kami memosisikan diri sebagai mitra pertumbuhan: menghubungkan strategi kanal digital dengan tujuan bisnis yang konkret.",
  pillars: [
    {
      title: "Lead acquisition & activation",
      body: "Dari perhatian pertama hingga respons yang layak ditindaklanjuti sales tanpa mengorbankan kualitas prospek.",
    },
    {
      title: "Digital presence",
      body: "Narasi, aset, dan titik sentuh digital yang konsisten agar brand Anda terasa utuh, bukan sekadar “ada di online”.",
    },
    {
      title: "Digital optimization",
      body: "Iterasi berbasis data: mengurangi gesekan di funnel, memperjelas tracking, dan memperbaiki konversi secara bertahap.",
    },
  ],
} as const;

export type Milestone = { year: string; title: string; body: string };

/** 2023 fixed; sisanya naratif aman tanpa angka klaim—ganti kapan pun siap. */
export const milestones: Milestone[] = [
  {
    year: "2023",
    title: "Titik awal yang disengaja",
    body: "Perjalanan vialdi.id dimulai pada 2023, ketika kami memutuskan membangun rumah digital di bawah PT. Integrasi Visual Digital Indonesia dengan fokus membantu perusahaan merapikan akuisisi lead dan eksekusi digital secara bertahap, bukan sekadar “kampanye sekejap”.",
  },
  {
    year: "2024",
    title: "Memperdalam eksekusi funnel",
    body: "Kami menghabiskan waktu untuk menyelaraskan proses: discovery, audit aset, prioritas pekerjaan, dan ritme review agar setiap iterasi punya alas yang jelas dan bisa dijelaskan ke stakeholders.",
  },
  {
    year: "2025",
    title: "Kolaborasi lintas industri",
    body: "Pengalaman melayani berbagai karakter bisnis mengajar kami fleksibilitas: tiap industri punya bahasa, siklus jual, dan risiko berbeda. Kami terus menyesuaikan playbook tanpa kehilangan prinsip: transparansi dan akuntabilitas.",
  },
  {
    year: "Sekarang",
    title: "Fokus pada dampak yang terasa",
    body: "Hari ini, kami tetap berpegang pada hal sederhana: komunikasi rutin, ekspektasi yang jujur, dan optimasi yang bisa dirasakan tim Anda bukan hanya angka di dashboard.",
  },
];

export const values = {
  title: "Cara kami bekerja—agar Anda tidak merasa sendirian",
  subtitle: "Nilai ini bukan dekorasi; ini filter agar kolaborasi tetap sehat.",
  items: [
    {
      title: "Empati sebelum slide deck",
      body: "Kami mendengarkan beban operasional Anda: kapasitas tim, tekanan target, dan batasan realistis baru membahas taktik.",
    },
    {
      title: "Transparansi progres",
      body: "Apa yang jalan, apa yang perlu diubah, dan apa yang membutuhkan keputusan Anda disampaikan tanpa dikemas berlebihan.",
    },
    {
      title: "Iterasi berbasis bukti",
      body: "Data dipakai untuk memutuskan langkah berikutnya, bukan untuk menyalahkan. Kami suka eksperimen, dengan batas dan hipotesis yang jelas.",
    },
  ],
} as const;

export const founder = {
  name: "Octa Vialdi",
  role: "Founder / Chief Executive Officer",
  quote:
    "Investasikan waktu Anda pada hal yang dapat dipertanggungjawabkan. Jika funnel digital bisa dirapikan lebih awal, Anda mengurangi trial-error yang mahal bukan hanya dalam biaya iklan, tapi dalam energi tim.",
  bio: "Di balik vialdi.id, Octa membangun komunikasi yang tenang namun tegas: setiap keputusan marketing harus bisa dijelaskan ke bisnis bukan hanya ke algoritma platform.",
  imageAlt: "Octa Vialdi, Founder & CEO vialdi.id",
} as const;

export const cta = {
  title: "Ingin cerita bisnis Anda kami dengar lebih dalam?",
  subtitle:
    "Ceritakan konteks, target, dan kendala Anda tanpa tekanan. Dari situ kami bantu uraikan langkah yang masuk akal.",
  buttonLabel: "Hubungi kami",
} as const;
