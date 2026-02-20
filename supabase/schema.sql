create table if not exists rooms (
  id text primary key,
  host_token text not null,
  state text not null check (state in ('idle','prepare','playing','paused')) default 'idle',
  current_submission_id uuid null,
  video_id text null,
  start_s int not null default 0,
  end_s int null,
  prepare_started_at timestamptz null,
  seq bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  display_name text null,
  youtube_url text not null,
  video_id text not null,
  start_s int not null,
  end_s int null,
  message text null,
  status text not null check (status in ('pending','approved','rejected','played')) default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz null
);

create index if not exists submissions_room_id_status_created_at_idx
  on submissions (room_id, status, created_at);

alter table rooms
  add constraint rooms_current_submission_fk
  foreign key (current_submission_id)
  references submissions(id)
  on delete set null;
