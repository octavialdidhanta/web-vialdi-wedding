-- Artikel status "scheduled" dengan scheduled_at <= now() boleh dibaca publik
-- (otomatis "hidup" di situs tanpa cron; status di admin tetap "scheduled" sampai diedit).

drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
  on public.posts for select
  using (
    (
      status = 'published'
      and published_at is not null
      and published_at <= now()
    )
    or (
      status = 'scheduled'
      and scheduled_at is not null
      and scheduled_at <= now()
    )
  );

drop policy if exists "post_tags_select_public" on public.post_tags;
create policy "post_tags_select_public"
  on public.post_tags for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_tags.post_id
        and (
          (
            p.status = 'published'
            and p.published_at is not null
            and p.published_at <= now()
          )
          or (
            p.status = 'scheduled'
            and p.scheduled_at is not null
            and p.scheduled_at <= now()
          )
        )
    )
  );
