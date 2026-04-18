-- Seed blog data migrated from legacy static content (vialdi.id)

-- Default category
insert into public.blog_categories (id, slug, name)
values ('cccccccc-cc01-4000-8000-000000000001', 'umum', 'Umum')
on conflict (slug) do nothing;

-- Tags
insert into public.blog_tags (id, slug, name) values
  ('dddddddd-dd01-4000-8000-000000000001', 'lead', 'Lead'),
  ('dddddddd-dd02-4000-8000-000000000001', 'funnel', 'Funnel'),
  ('dddddddd-dd03-4000-8000-000000000001', 'copywriting', 'Copywriting'),
  ('dddddddd-dd04-4000-8000-000000000001', 'konten', 'Konten'),
  ('dddddddd-dd05-4000-8000-000000000001', 'analytics', 'Analytics'),
  ('dddddddd-dd06-4000-8000-000000000001', 'iklan', 'Iklan'),
  ('dddddddd-dd07-4000-8000-000000000001', 'konversi', 'Konversi'),
  ('dddddddd-dd08-4000-8000-000000000001', 'website', 'Website'),
  ('dddddddd-dd09-4000-8000-000000000001', 'operasional', 'Operasional')
on conflict (slug) do nothing;

-- Post 1
insert into public.posts (
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url, body_json, body_html, toc_json,
  read_time_minutes, category_id, published_at, scheduled_at
) values (
  'eeeeeeee-ee01-4000-8000-000000000001',
  'lead-tidak-stabil-bukan-akhir-cerita',
  'Lead tidak stabil bukan akhir cerita—ini titik mulai audit funnel',
  'Kalau jumlah prospek naik-turun tiap minggu, masalahnya sering bukan “iklan jelek” saja, melainkan kombinasi penawaran, follow-up, dan tracking.',
  'published', true, 'orange',
  null, null, '{}'::jsonb,
  $html$<section id="kenapa-naik-turun"><h2>Kenapa lead terasa random?</h2><p>Banyak tim melihat dashboard iklan saja, padahal lead sehat adalah hasil rantai: traffic → respons → kualifikasi → penjadwalan → closing. Salah satu mata rantai yang longgar akan membuat angka mingguan terlihat “noise”.</p><p>Mulai dari pertanyaan sederhana: berapa persen lead yang benar-benar masuk ke CRM dalam 24 jam? Berapa yang dihubungi sales dalam 1×24 jam? Tanpa baseline itu, optimasi iklan hanya setengah jalan.</p></section><section id="langkah-audit"><h2>Tiga langkah audit cepat (tanpa spreadsheet monster)</h2><p>Pertama, satukan definisi “lead qualified” antara marketing dan sales. Kedua, cocokkan sumber lead dengan stage pipeline. Ketiga, pilah 10 lead terakhir secara manual—seringkali pola ketidaksesuaian muncul di situ.</p></section><section id="penutup"><h2>Setelah audit, baru bicara skala</h2><p>Menambah budget sebelum merapikan definisi dan SLA follow-up seringkali memperbesar kekacauan, bukan solusi. Rapikan alur dulu; skala iklan menyusul dengan percaya diri.</p></section>$html$,
  '[
    {"id":"kenapa-naik-turun","title":"Kenapa lead terasa random?"},
    {"id":"langkah-audit","title":"Tiga langkah audit cepat (tanpa spreadsheet monster)"},
    {"id":"penutup","title":"Setelah audit, baru bicara skala"}
  ]'::jsonb,
  6,
  'cccccccc-cc01-4000-8000-000000000001',
  '2026-04-02T12:00:00Z',
  null
) on conflict (slug) do nothing;

insert into public.post_tags (post_id, tag_id) values
  ('eeeeeeee-ee01-4000-8000-000000000001', 'dddddddd-dd01-4000-8000-000000000001'),
  ('eeeeeeee-ee01-4000-8000-000000000001', 'dddddddd-dd02-4000-8000-000000000001')
on conflict do nothing;

-- Post 2
insert into public.posts (
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url, body_json, body_html, toc_json,
  read_time_minutes, category_id, published_at, scheduled_at
) values (
  'eeeeeeee-ee02-4000-8000-000000000001',
  'cara-bicara-ke-audiens-tanpa-jargon',
  'Berbicara ke audiens tanpa jargon—tanpa kehilangan kedalaman',
  'Copy yang “pintar” belum tentu copy yang dibaca sampai habis. Ada pola sederhana agar pesan tetap teknis namun manusiawi.',
  'published', false, 'violet',
  null, null, '{}'::jsonb,
  $html$<section id="satu-masalah"><h2>Satu masalah, satu janji, satu bukti</h2><p>Buka dengan masalah yang relevan, lanjutkan dengan janji yang spesifik, tutup paragraf pertama dengan bukti kecil (angka, testimonial singkat, atau demo). Struktur ini membuat pembaca merasa dihargai, bukan dijual.</p></section><section id="jargon"><h2>Jargon boleh—setelah konteks</h2><p>Istilah teknis tidak salah; yang salah adalah meletakkannya sebelum orang mengerti manfaatnya. Gunakan analogi singkat atau contoh konkret, baru masuk ke istilah.</p></section>$html$,
  '[
    {"id":"satu-masalah","title":"Satu masalah, satu janji, satu bukti"},
    {"id":"jargon","title":"Jargon boleh—setelah konteks"}
  ]'::jsonb,
  5,
  'cccccccc-cc01-4000-8000-000000000001',
  '2026-03-28T12:00:00Z',
  null
) on conflict (slug) do nothing;

insert into public.post_tags (post_id, tag_id) values
  ('eeeeeeee-ee02-4000-8000-000000000001', 'dddddddd-dd03-4000-8000-000000000001'),
  ('eeeeeeee-ee02-4000-8000-000000000001', 'dddddddd-dd04-4000-8000-000000000001')
on conflict do nothing;

-- Post 3
insert into public.posts (
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url, body_json, body_html, toc_json,
  read_time_minutes, category_id, published_at, scheduled_at
) values (
  'eeeeeeee-ee03-4000-8000-000000000001',
  'tracking-yang-rapi-menghemat-nerv',
  'Tracking yang rapi menghemat nerv—dan biaya diskusi',
  'Ketika setiap kampanye punya penamaan, UTM, dan konversi yang konsisten, rapat mingguan jadi lebih pendek dan keputusan lebih cepat.',
  'published', false, 'navy',
  null, null, '{}'::jsonb,
  $html$<section id="konvensi"><h2>Konvensi penamaan itu investasi</h2><p>Tim berubah, agency berganti, tetapi konvensi penamaan kampanye dan UTM yang konsisten akan mengurangi misteri data historis. Dokumentasikan sekali, pakai berulang.</p></section><section id="konversi-sekunder"><h2>Konversi sekunder juga berbicara</h2><p>Tidak semua bisnis bisa menghitung purchase langsung dari iklan. Tetapkan mikro-konversi yang masuk akal (chat klik, form mulai, add-to-cart) agar optimasi punya sinyal sebelum deal besar datang.</p></section>$html$,
  '[
    {"id":"konvensi","title":"Konvensi penamaan itu investasi"},
    {"id":"konversi-sekunder","title":"Konversi sekunder juga berbicara"}
  ]'::jsonb,
  7,
  'cccccccc-cc01-4000-8000-000000000001',
  '2026-03-20T12:00:00Z',
  null
) on conflict (slug) do nothing;

insert into public.post_tags (post_id, tag_id) values
  ('eeeeeeee-ee03-4000-8000-000000000001', 'dddddddd-dd05-4000-8000-000000000001'),
  ('eeeeeeee-ee03-4000-8000-000000000001', 'dddddddd-dd06-4000-8000-000000000001')
on conflict do nothing;

-- Post 4
insert into public.posts (
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url, body_json, body_html, toc_json,
  read_time_minutes, category_id, published_at, scheduled_at
) values (
  'eeeeeeee-ee04-4000-8000-000000000001',
  'ritme-review-campaign',
  'Ritme review campaign: mingguan vs bulanan—mana yang cocok?',
  'Terlalu sering review bisa mematikan momentum; terlalu jarang membuat pemborosan terlambat terdeteksi. Ini panduan praktis menyesuaikan ritme.',
  'published', false, 'emerald',
  null, null, '{}'::jsonb,
  $html$<section id="mingguan"><h2>Mingguan untuk fase belajar</h2><p>Saat campaign baru atau setelah perubahan besar (landing, offer, audience), ritme mingguan membantu mendeteksi anomaly lebih cepat. Fokus pada 2–3 KPI saja agar diskusi tidak melebar.</p></section><section id="bulanan"><h2>Bulanan untuk fase stabil</h2><p>Ketika pola sudah stabil, review bulanan cukup untuk arah strategis; pekerjaan mingguan bisa dialihkan ke alert otomatis dan catatan operasional harian.</p></section>$html$,
  '[
    {"id":"mingguan","title":"Mingguan untuk fase belajar"},
    {"id":"bulanan","title":"Bulanan untuk fase stabil"}
  ]'::jsonb,
  4,
  'cccccccc-cc01-4000-8000-000000000001',
  '2026-03-12T12:00:00Z',
  null
) on conflict (slug) do nothing;

insert into public.post_tags (post_id, tag_id) values
  ('eeeeeeee-ee04-4000-8000-000000000001', 'dddddddd-dd06-4000-8000-000000000001'),
  ('eeeeeeee-ee04-4000-8000-000000000001', 'dddddddd-dd09-4000-8000-000000000001')
on conflict do nothing;

-- Post 5
insert into public.posts (
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url, body_json, body_html, toc_json,
  read_time_minutes, category_id, published_at, scheduled_at
) values (
  'eeeeeeee-ee05-4000-8000-000000000001',
  'landing-page-bukan-dekorasi',
  'Landing page bukan dekorasi—ia bagian dari iklan',
  'CTR tinggi dengan konversi rendah sering berarti mismatch antara janji iklan dan halaman tujuan. Sinkronkan pesan, bukti, dan CTA.',
  'published', false, 'orange',
  null, null, '{}'::jsonb,
  $html$<section id="skor-cepat"><h2>Skor cepat: headline vs iklan</h2><p>Baca headline landing sambil mengingat teks iklan utama. Jika koneksi mental tidak langsung terasa, pengunjung akan ragu—dan ragu itu mahal.</p></section><section id="bukti"><h2>Bukti di atas lipatan pertama</h2><p>Logo klien, kutipan singkat, atau angka hasil yang relevan sebaiknya muncul sebelum pengguna scroll jauh. Bukti mendukung keyakinan; CTA memanfaatkan keyakinan itu.</p></section>$html$,
  '[
    {"id":"skor-cepat","title":"Skor cepat: headline vs iklan"},
    {"id":"bukti","title":"Bukti di atas lipatan pertama"}
  ]'::jsonb,
  6,
  'cccccccc-cc01-4000-8000-000000000001',
  '2026-03-05T12:00:00Z',
  null
) on conflict (slug) do nothing;

insert into public.post_tags (post_id, tag_id) values
  ('eeeeeeee-ee05-4000-8000-000000000001', 'dddddddd-dd07-4000-8000-000000000001'),
  ('eeeeeeee-ee05-4000-8000-000000000001', 'dddddddd-dd08-4000-8000-000000000001')
on conflict do nothing;

-- Post 6
insert into public.posts (
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url, body_json, body_html, toc_json,
  read_time_minutes, category_id, published_at, scheduled_at
) values (
  'eeeeeeee-ee06-4000-8000-000000000001',
  'kolaborasi-marketing-sales',
  'Kolaborasi marketing–sales: dari friksi ke ritme',
  'SLA respons yang jelas dan definisi lead yang sama akan mengurangi drama antar divisi lebih dari sekadar “rapat silaturahmi”.',
  'published', false, 'violet',
  null, null, '{}'::jsonb,
  $html$<section id="definisi"><h2>Definisi lead yang sama</h2><p>Marketing dan sales harus menggunakan label yang sama untuk MQL/SQL. Beda definisi = beda ekspektasi = konflik yang berulang.</p></section><section id="sla"><h2>SLA yang realistis</h2><p>Sebutkan jam kerja, channel prioritas, dan eskalasi jika lead panas menunggu terlalu lama. SLA yang terukur lebih kuat dari motivasi semata.</p></section>$html$,
  '[
    {"id":"definisi","title":"Definisi lead yang sama"},
    {"id":"sla","title":"SLA yang realistis"}
  ]'::jsonb,
  5,
  'cccccccc-cc01-4000-8000-000000000001',
  '2026-02-26T12:00:00Z',
  null
) on conflict (slug) do nothing;

insert into public.post_tags (post_id, tag_id) values
  ('eeeeeeee-ee06-4000-8000-000000000001', 'dddddddd-dd01-4000-8000-000000000001'),
  ('eeeeeeee-ee06-4000-8000-000000000001', 'dddddddd-dd09-4000-8000-000000000001')
on conflict do nothing;
