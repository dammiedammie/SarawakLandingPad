-- Run this once in Supabase: SQL Editor > New query > paste > Run

create table registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  level text not null check (level in ('Diploma','Undergraduate','Postgraduate')),
  programme text not null check (char_length(programme) between 2 and 120),
  destination_university text not null check (char_length(destination_university) between 2 and 120),
  previous_institution text not null check (char_length(previous_institution) between 2 and 120),
  intake_year int not null check (intake_year between 2020 and 2040),
  home_division text not null,
  whatsapp text not null check (char_length(whatsapp) between 7 and 20),
  email text check (char_length(email) <= 120),
  religion text,                      -- optional, private
  needs text[] not null default '{}',
  show_in_directory boolean not null default false,
  consent boolean not null check (consent = true)
);

alter table registrations enable row level security;

-- Visitors may add a registration, but can never read the table.
create policy "anyone can register" on registrations
  for insert to anon with check (consent = true);
grant insert on registrations to anon;

-- The public directory shows ONLY these safe columns, and only for people who opted in.
-- WhatsApp, email and religion are never exposed. You read them in the Supabase dashboard.
create view directory as
  select id, full_name, level, programme, destination_university,
         previous_institution, intake_year, home_division, needs
  from registrations
  where show_in_directory;
grant select on directory to anon;
