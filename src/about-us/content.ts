/** Copy halaman About Us (Bahasa Indonesia). Edit di sini tanpa menyentuh JSX. */

import { isWeddingSite } from "@/site/siteVariant";

const aboutSeoAgency = {
  title: "Tentang Kami — vialdi.id | Cerita, nilai, dan cara kami mendampingi",
  description:
    "Kenali vialdi.id: digital marketing agency yang mengutamakan empati, data, dan eksekusi jernih — dari akuisisi lead hingga funnel yang terbaca untuk marketing, sales, dan leadership.",
} as const;

const aboutSeoWedding = {
  title: "Tentang Kami — Vialdi Wedding | Cerita, nilai, dan cara kami mendampingi",
  description:
    "Kenali Vialdi Wedding: wedding organizer yang memahami tekanan persiapan pernikahan—vendor, keluarga, dan hari-H. Cerita kami, positioning, nilai kerja, dan langkah berikutnya.",
} as const;

export const aboutSeo = isWeddingSite() ? aboutSeoWedding : aboutSeoAgency;

const heroAgency = {
  eyebrow: "Tentang kami",
  title: "Kami percaya pertumbuhan bisnis layak didampingi dengan empati, data, dan eksekusi yang jernih.",
  lead: "vialdi.id hadir sebagai digital marketing agency yang tidak hanya bicara soal traffic, tetapi soal alur: bagaimana calon pelanggan menemukan Anda, mempercayai Anda, dan memilih Anda tanpa membuat tim Anda kehabisan napas.",
} as const;

const heroWedding = {
  eyebrow: "Tentang Vialdi Wedding",
  title: "Pernikahan Anda layak dirayakan dengan tenang—bukan habis lelah di meja perencanaan.",
  lead: "Vialdi Wedding hadir sebagai pendamping organisasi pernikahan: kami membantu merapikan konsep, menyelaraskan vendor, dan mengawasi jalannya acara agar Anda dan keluarga bisa fokus pada momen, bukan pada kebingungan jadwal.",
} as const;

export const hero = isWeddingSite() ? heroWedding : heroAgency;

/** Storytelling + empati + benang merah masalah → arah solusi (detail solusi di layanan & konsultasi). */
export const storyEmpathy = {
  ...(isWeddingSite()
    ? {
        title: "Cerita kami dimulai dari keramaian yang sama seperti milik Anda",
        paragraphs: [
          "Banyak pasangan mengatakan hal yang sama di awal: senang, berdebar, lalu perlahan kewalahan. Daftar vendor panjang, pertanyaan dari keluarga yang datang bertubi-tubi, undangan yang belum rampung, dan detail kecil yang tiba-tiba terasa besar ketika hari-H semakin dekat. Itu wajar. Menikah bukan sekadar acara satu hari—itu banyak keputusan yang harus bertemu dalam satu garis waktu.",
          "Di sinilah empati menjadi fondasi kami. Kami tidak mengecilkan kekhawatiran Anda, dan kami tidak menjual janji “sempurna tanpa celah”. Yang kami tawarkan adalah kejelasan: apa yang menjadi tanggung jawab organizer, apa yang perlu diputuskan bersama, dan bagaimana rundown bisa dipegang teguh tanpa membuat Anda merasa sendirian di tengah hiruk-pikuk.",
          "Solusi bagi kami bukan rumus ajaib, melainkan kerja nyata—komunikasi yang rapi, prioritas yang disepakati, dan tim lapangan yang mengerti protokol keluarga serta alur acara. Ketika tekanan turun, ruang untuk bahagia—yang seharusnya menjadi inti pernikahan—baru benar-benar terasa.",
        ],
      }
    : {
        title: "Cerita dimulai dari keresahan yang sama",
        paragraphs: [
          'Di balik laporan iklan, spreadsheet, dan notifikasi platform, sering kali ada pertanyaan yang berat: "Sudah spend segini, kenapa closing belum stabil?" Waktu pemilik bisnis terbatas, ekspektasi besar, dan ruang untuk trial-error semakin sempit. Kami mengerti karena perasaan itu yang juga mendorong kami untuk membangun cara kerja yang lebih manusiawi.',
          "Kami tidak menjanjikan jalan pintas. Yang kami tawarkan adalah pendampingan: mendengarkan konteks bisnis Anda, merapikan prioritas, lalu mengeksekusi langkah demi langkah agar funnel digital Anda terbaca oleh tim marketing, sales, maupun leadership.",
        ],
      }),
} as const;

export const positioning = {
  ...(isWeddingSite()
    ? {
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
      }
    : {
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
            body: 'Narasi, aset, dan titik sentuh digital yang konsisten agar brand Anda terasa utuh, bukan sekadar "ada di online".',
          },
          {
            title: "Digital optimization",
            body: "Iterasi berbasis data: mengurangi gesekan di funnel, memperjelas tracking, dan memperbaiki konversi secara bertahap.",
          },
        ],
      }),
} as const;

export type Milestone = { year: string; title: string; body: string };

/** Garis waktu naratif; sesuaikan fakta bisnis kapan pun siap—fokus pada arah, bukan angka klaim. */
export const milestones: Milestone[] = [
  ...(isWeddingSite()
    ? [
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
      ]
    : [
        {
          year: "2023",
          title: "Titik awal yang disengaja",
          body: 'Perjalanan vialdi.id dimulai pada 2023, ketika kami memutuskan membangun rumah digital di bawah PT. Integrasi Visual Digital Indonesia dengan fokus membantu perusahaan merapikan akuisisi lead dan eksekusi digital secara bertahap, bukan sekadar "kampanye sekejap".',
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
          year: "SEKARANG",
          title: "Fokus pada dampak yang terasa",
          body: "Hari ini, kami tetap berpegang pada hal sederhana: komunikasi rutin, ekspektasi yang jujur, dan optimasi yang bisa dirasakan tim Anda bukan hanya angka di dashboard.",
        },
      ]),
];

export const milestonesIntro = {
  ...(isWeddingSite()
    ? {
        title: "Perjalanan singkat—bukan pamer angka, melainkan arah kerja",
        subtitle:
          "Setiap tahun mengajarkan detail baru dari setiap venue dan keluarga. Yang tidak berubah: kami mendampingi, bukan mengambil alih momen yang seharusnya milik Anda.",
      }
    : {
        title: "Perjalanan singkat—tanpa dramatisasi angka",
        subtitle:
          "Kami menyimpan ruang untuk fakta yang akan Anda lengkapi sendiri. Yang pasti: arah kerja kami konsisten sejak awal.",
      }),
} as const;

export const values = {
  ...(isWeddingSite()
    ? {
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
      }
    : {
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
      }),
} as const;

export const founder = {
  ...(isWeddingSite()
    ? {
        name: "Octa Vialdi",
        role: "Founder — Vialdi Wedding",
        quote:
          "Pernikahan bukan proyek iklan yang harus viral—ini momen manusiawi yang hanya berjalan sekali. Investasikan ketenangan Anda pada perencanaan yang jujur dan pelaksanaan yang bisa dipertanggungjawabkan.",
        bio: "Di balik Vialdi Wedding, Octa membangun komunikasi yang tenang namun tegas: setiap keputusan acara harus bisa dijelaskan kepada pasangan dan keluarga, bukan hanya terdengar bagus di atas kertas.",
        imageAlt: "Octa Vialdi, Founder Vialdi Wedding",
      }
    : {
        name: "Octa Vialdi",
        role: "Founder / Chief Executive Officer",
        quote:
          "Investasikan waktu Anda pada hal yang dapat dipertanggungjawabkan. Jika funnel digital bisa dirapikan lebih awal, Anda mengurangi trial-error yang mahal bukan hanya dalam biaya iklan, tapi dalam energi tim.",
        bio: "Di balik vialdi.id, Octa membangun komunikasi yang tenang namun tegas: setiap keputusan marketing harus bisa dijelaskan ke bisnis bukan hanya ke algoritma platform.",
        imageAlt: "Octa Vialdi, Founder vialdi.id",
      }),
} as const;

export const cta = {
  ...(isWeddingSite()
    ? {
        title: "Ingin cerita pernikahan Anda kami dengar lebih dalam?",
        subtitle:
          "Ceritakan venue impian, dinamika keluarga, dan hal yang membuat Anda cemas—tanpa tekanan. Dari situ kami bantu uraikan langkah yang masuk akal, termasuk apa yang bisa dimulai sekarang dan apa yang bisa menunggu.",
        buttonLabel: "Hubungi kami",
      }
    : {
        title: "Ingin cerita bisnis Anda kami dengar lebih dalam?",
        subtitle:
          "Ceritakan konteks, target, dan kendala Anda tanpa tekanan. Dari situ kami bantu uraikan langkah yang masuk akal.",
        buttonLabel: "Hubungi kami",
      }),
} as const;
