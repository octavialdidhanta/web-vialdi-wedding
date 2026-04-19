/** Copy halaman About Us (Bahasa Indonesia). Edit di sini tanpa menyentuh JSX. */

export const aboutSeo = {
  title: "Tentang Kami — Vialdi Wedding | Cerita, nilai, dan cara kami mendampingi",
  description:
    "Kenali Vialdi Wedding: wedding organizer yang memahami tekanan persiapan pernikahan—vendor, keluarga, dan hari-H. Cerita kami, positioning, nilai kerja, dan langkah berikutnya.",
} as const;

export const hero = {
  eyebrow: "Tentang Vialdi Wedding",
  title: "Pernikahan Anda layak dirayakan dengan tenang—bukan habis lelah di meja perencanaan.",
  lead: "Vialdi Wedding hadir sebagai pendamping organisasi pernikahan: kami membantu merapikan konsep, menyelaraskan vendor, dan mengawasi jalannya acara agar Anda dan keluarga bisa fokus pada momen, bukan pada kebingungan jadwal.",
} as const;

/** Storytelling + empati + benang merah masalah → arah solusi (detail solusi di layanan & konsultasi). */
export const storyEmpathy = {
  title: "Cerita kami dimulai dari keramaian yang sama seperti milik Anda",
  paragraphs: [
    "Banyak pasangan mengatakan hal yang sama di awal: senang, berdebar, lalu perlahan kewalahan. Daftar vendor panjang, pertanyaan dari keluarga yang datang bertubi-tubi, undangan yang belum rampung, dan detail kecil yang tiba-tiba terasa besar ketika hari-H semakin dekat. Itu wajar. Menikah bukan sekadar acara satu hari—itu banyak keputusan yang harus bertemu dalam satu garis waktu.",
    "Di sinilah empati menjadi fondasi kami. Kami tidak mengecilkan kekhawatiran Anda, dan kami tidak menjual janji “sempurna tanpa celah”. Yang kami tawarkan adalah kejelasan: apa yang menjadi tanggung jawab organizer, apa yang perlu diputuskan bersama, dan bagaimana rundown bisa dipegang teguh tanpa membuat Anda merasa sendirian di tengah hiruk-pikuk.",
    "Solusi bagi kami bukan rumus ajaib, melainkan kerja nyata—komunikasi yang rapi, prioritas yang disepakati, dan tim lapangan yang mengerti protokol keluarga serta alur acara. Ketika tekanan turun, ruang untuk bahagia—yang seharusnya menjadi inti pernikahan—baru benar-benar terasa.",
  ],
} as const;

export const positioning = {
  title: "Positioning Vialdi Wedding: organizer yang mengutamakan ketenangan pasangan",
  subtitle:
    "Kami memosisikan diri sebagai mitra perencanaan dan pelaksanaan: menghubungkan impian acara dengan logistik yang bisa dijalankan di dunia nyata—di venue, bersama vendor, dan di depan tamu.",
  pillars: [
    {
      title: "Perencanaan & kurasi vendor",
      body: "Dari gambaran konsep hingga penyelarasan jadwal dan paket mitra, kami membantu Anda memilih langkah yang masuk akal untuk budget, venue, dan skala tamu—tanpa memaksakan layanan yang tidak relevan.",
    },
    {
      title: "Komunikasi keluarga & protokol acara",
      body: "Kami menghargai dinamika keluarga. Rundown, titik protokol, dan briefing tim dirancang agar semua pihak paham perannya—mengurangi gesekan di hari-H dan menjaga suasana tetap hormat.",
    },
    {
      title: "Eksekusi hari-H yang terukur",
      body: "Di lapangan, kami mengutamakan disiplin jadwal, cek ulang titik kritis (dekor, sound, entrance), dan komunikasi singkat antar-vendor agar alur acara berjalan sesuai rencana yang sudah disepakati bersama.",
    },
  ],
} as const;

export type Milestone = { year: string; title: string; body: string };

/** Garis waktu naratif; sesuaikan fakta bisnis kapan pun siap—fokus pada arah, bukan angka klaim. */
export const milestones: Milestone[] = [
  {
    year: "2023",
    title: "Bermula dari kepercayaan di balik kamera",
    body: "Akar kerja kami dekat dengan dokumentasi pernikahan: memahami ritme hari-H, titik emosi, dan seberapa cepat kebingungan kecil bisa mengganggu momen besar. Dari situ tumbuh keyakinan bahwa pasangan butuh lebih dari sekadar “vendor terpisah-pisah”—mereka butuh benang merah.",
  },
  {
    year: "2024",
    title: "Menyatukan potongan-potongan menjadi satu alur",
    body: "Kami memperdalam koordinasi: bagaimana undangan, dekor, rias, hingga catering berbicara dalam satu bahasa acara. Proses discovery menjadi rutinitas—mendengarkan dulu, lalu merapikan prioritas agar keputusan tidak dibuat dalam kepanikan.",
  },
  {
    year: "2025",
    title: "Vialdi Wedding sebagai rumah organisasi pernikahan",
    body: "Nama dan layanan kami diselaraskan untuk positioning wedding organizer: pendampingan dari perencanaan hingga pelaksanaan, dengan mitra vendor yang telah biasa bergerak dalam standar kerja tim kami.",
  },
  {
    year: "Sekarang",
    title: "Fokus pada ketenangan yang bisa Anda rasakan",
    body: "Hari ini kami tetap berpegang pada hal yang sederhana: komunikasi yang jujur, ekspektasi yang tidak dilebih-lebihkan, dan eksekusi yang bisa dijelaskan—kepada Anda, keluarga, dan vendor—tanpa drama yang tidak perlu.",
  },
];

export const milestonesIntro = {
  title: "Perjalanan singkat—bukan pamer angka, melainkan arah kerja",
  subtitle:
    "Setiap tahun mengajarkan detail baru dari setiap venue dan keluarga. Yang tidak berubah: kami mendampingi, bukan mengambil alih momen yang seharusnya milik Anda.",
} as const;

export const values = {
  title: "Cara kami bekerja—agar Anda tidak merasa sendirian",
  subtitle:
    "Nilai ini menjadi filter kolaborasi: kami hanya melangkah jika arahnya membuat pernikahan Anda lebih tenang, bukan lebih rumit.",
  items: [
    {
      title: "Empati sebelum jadwal padat",
      body: "Kami mendengarkan beban Anda—tekanan keluarga, keraguan budget, dan ketakutan hal terlewat—baru bersama-sama merapikan prioritas. Jadwal yang indah tanpa empati hanya menambah stres.",
    },
    {
      title: "Transparansi peran dan tanggung jawab",
      body: "Apa yang dikerjakan tim kami, apa yang menjadi keputusan pasangan, dan apa yang menjadi domain vendor disepakati terbuka. Kami menghindari janji samar yang membuat ekspektasi bertabrakan di hari-H.",
    },
    {
      title: "Disiplin lapangan berbasis rundown",
      body: "Kami percaya pada checklist dan komunikasi singkat antar-tim di venue—bukan improvisasi liar yang mengorbankan protokol keluarga atau kenyamanan tamu.",
    },
  ],
} as const;

export const founder = {
  name: "Octa Vialdi",
  role: "Founder — Vialdi Wedding",
  quote:
    "Pernikahan bukan proyek iklan yang harus viral—ini momen manusiawi yang hanya berjalan sekali. Investasikan ketenangan Anda pada perencanaan yang jujur dan pelaksanaan yang bisa dipertanggungjawabkan.",
  bio: "Di balik Vialdi Wedding, Octa membangun komunikasi yang tenang namun tegas: setiap keputusan acara harus bisa dijelaskan kepada pasangan dan keluarga, bukan hanya terdengar bagus di atas kertas.",
  imageAlt: "Octa Vialdi, Founder Vialdi Wedding",
} as const;

export const cta = {
  title: "Ingin cerita pernikahan Anda kami dengar lebih dalam?",
  subtitle:
    "Ceritakan venue impian, dinamika keluarga, dan hal yang membuat Anda cemas—tanpa tekanan. Dari situ kami bantu uraikan langkah yang masuk akal, termasuk apa yang bisa dimulai sekarang dan apa yang bisa menunggu.",
  buttonLabel: "Hubungi kami",
} as const;
