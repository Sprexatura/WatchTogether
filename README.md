# WatchTogether MVP

AGENTS.md 기반 Sidecar YouTube Donation MVP 초기 세팅입니다.

## Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Supabase

## 1) 설치

```bash
npm install
```

## 2) 환경변수

`.env.example`를 복사해 `.env.local` 생성:

```bash
cp .env.example .env.local
```

필수 값:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3) DB 스키마 적용

Supabase SQL editor에서 `supabase/schema.sql` 실행.

## 4) 실행

```bash
npm run dev
```

## 구현된 라우트

- `POST /api/rooms/create`
- `GET /api/rooms/[roomId]`
- `POST /api/submissions`
- `POST /api/host/submissions/[id]/approve`
- `POST /api/host/submissions/[id]/reject`
- `POST /api/host/load`
- `POST /api/host/pause`
- `POST /api/host/stop`
- `GET /api/host/queue`

## 페이지

- `/` Create Room
- `/room/[roomId]` Viewer sidecar
- `/host/[roomId]?token=...` Host console

## 참고

현재는 polling(1초) 중심의 기본 동작입니다. Realtime 구독/YouTube IFrame Player 정밀 드리프트 보정은 다음 단계에서 고도화하면 됩니다.
