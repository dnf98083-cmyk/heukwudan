# ⚔️ 흑우단 공략 사이트

세나리버스(세븐나이츠 리버스) 길드 **흑우단**의 길드전 공략 및 기록 관리 웹앱입니다.

🔗 **배포 주소**: https://heukwudan.vercel.app

---

## 주요 기능

### 🗡️ 길드전 공격 (`/attack`)
- 상대 방어팀 목록 확인 및 공략 검색
- 공격덱 등록 및 관리
- 공격 결과(승/패) 기록
- 패배 시 속공 계산기로 바로 이동 (성 · 상대닉네임 · 영웅 정보 자동 전달)

### 🛡️ 방어팀 공략 (`/defense`)
- 우리 길드 방어팀 등록 (영웅 최대 3명)
- 진형 배치 편집기 (선택된 영웅만 배치 가능) + 펫 슬롯
- 공략 안 등록: 케이스 이름, 반지 추천, 속공, 스킬순서, 장비 세팅, 조건/설명/팁
- 공략 안 수정 / 삭제

### ⚡ 속공 계산기 (`/speed-calc`)
- 공격덱과 상대 방어팀 영웅이 자동으로 불러와짐
- 실제 전투에서 관찰한 순서대로 칩 클릭 → 전투 순서 슬롯에 자동 배치
- 아군 속공 수치 직접 입력
- **분석하기**: 전투 순서 + 아군 속공 기반으로 적군 속공 범위 유추
  - 각 적군 영웅의 속공 최소~최대 범위 표시
  - 적군 최대 속공 = 기본속공(역할군별) + 96
  - 전체 합산 범위 표시
- **저장하기**: 오늘의 길드전 페이지에 기록 저장

### 📅 오늘의 길드전 (`/guild-war`)
- 속공 계산기에서 저장된 기록을 9개 성별로 정리
  - 외성 1~5, 내성 1~3, 본성
- 각 기록: 승/패, 상대 닉네임, 방어팀, 공격덱, 속공 순서, 범위, 기록자
- 방어팀 공략 페이지 바로가기 링크
- 관리자: 개별 삭제 · 전체 초기화

### 🏆 랭킹 (`/records`)
- 공격 승률 순위
- 수비 승률 순위
- 관리자: 기록 초기화

### 📖 영웅 도감 (`/heroes`)
- 전체 영웅 목록 및 역할군 정보 확인

### 👥 회원 관리 (`/admin`, 관리자 전용)
- 길드원 계정 생성
- 역할 부여 (관리자 / 연구원 / 길드원)
- 계정 삭제

---

## 권한 체계

| 역할 | 설명 |
|------|------|
| 슈퍼개발자 | 최고 권한 (DB 미저장, 환경변수로만 관리) |
| 관리자 | 기록 초기화, 회원 관리, 팀/덱 수정·삭제 |
| 연구원 | 방어팀 공략 추가·수정 |
| 길드원 | 조회 및 기록 저장 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.2.10 (App Router) |
| 언어 | TypeScript (strict) |
| DB | Supabase (PostgreSQL + RLS) |
| 인증 | iron-session (쿠키 암호화) |
| 스타일 | Tailwind CSS + shadcn/ui |
| 배포 | Vercel |

---

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 루트에 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

SESSION_SECRET=your_session_secret_32chars_min

SUPER_DEV_ID=your_super_dev_id
SUPER_DEV_PASSWORD=your_super_dev_password
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되지 않습니다. API Route 서버에서만 사용합니다.

### 3. Supabase 테이블 생성

`supabase/migrations/` 폴더의 SQL 파일들을 순서대로 Supabase SQL Editor에서 실행합니다.

**speed_records 테이블** (최신):

```sql
create table if not exists speed_records (
  id uuid primary key default gen_random_uuid(),
  castle_type text not null,
  opponent_name text,
  result text,
  enemy_heroes text[] not null default '{}',
  ally_heroes text[] not null default '{}',
  deck_id uuid,
  defense_team_id uuid,
  battle_order text[] not null default '{}',
  ally_speeds jsonb not null default '{}',
  enemy_speeds jsonb not null default '{}',
  enemy_speed_ranges jsonb,
  ally_total int not null default 0,
  enemy_total int not null default 0,
  recorder_name text not null,
  recorded_at timestamptz not null default now()
);

alter table speed_records enable row level security;

create policy "anyone can read speed_records"
  on speed_records for select using (true);

create policy "logged in users can insert speed_records"
  on speed_records for insert with check (true);

create policy "service role can delete speed_records"
  on speed_records for delete using (true);
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속

---

## 프로젝트 구조

```
src/
├── app/
│   ├── attack/          # 길드전 공격 페이지
│   ├── defense/         # 방어팀 공략 페이지
│   ├── guild-war/       # 오늘의 길드전 (속공 기록)
│   ├── speed-calc/      # 속공 계산기
│   ├── records/         # 랭킹 페이지
│   ├── heroes/          # 영웅 도감
│   ├── admin/           # 회원 관리 (관리자 전용)
│   ├── login/           # 로그인
│   └── api/             # API Routes
│       ├── auth/        # 로그인·로그아웃·세션 조회
│       ├── speed-records/  # 속공 기록 CRUD
│       └── admin/       # 관리자 전용 API
├── components/
│   ├── layout/          # Navbar
│   └── ui/              # shadcn 컴포넌트 + HeroPicker, FormationEditor
└── lib/
    ├── supabase/        # client / server / admin 클라이언트
    ├── session.ts       # iron-session 설정
    └── constants.ts     # 역할군 색상 등 상수
```

---

## 역할군별 기본 속공

속공 계산기에서 적군 속공 최대치 추정에 사용:

| 역할군 | 기본 속공 | 최대 속공 (기본 + 96) |
|--------|-----------|----------------------|
| 방어형 | 19 | 115 |
| 지원형 | 19 | 115 |
| 만능형 | 25 | 121 |
| 마법형 | 29 | 125 |
| 공격형 | 29 | 125 |

---

## 개발 이력

| 단계 | 내용 |
|------|------|
| 초기 세팅 | Next.js 프로젝트 구조, Supabase 연동, 기본 라우팅 |
| 인증 시스템 | iron-session 기반 4단계 권한 체계, 슈퍼개발자는 DB 미저장 |
| 영웅 도감 | 107명 영웅 데이터 마이그레이션, 역할군 분류 |
| 방어팀 공략 | 진형 편집기, 영웅 3명 제한, 선택 영웅만 배치 가능 |
| 길드전 공격 | 공격덱 관리, 승패 기록, 상대팀 검색 |
| 랭킹 | 공격/수비 승률 집계, 관리자 초기화 기능 |
| 회원 관리 | 관리자 전용 계정 생성·역할 부여·삭제 |
| 속공 계산기 | 전투 순서 기반 적군 속공 범위 유추, 성 9종류 |
| 오늘의 길드전 | 속공 기록을 성별로 분류하여 표시 |
| 방어팀 공략 개선 | 진형에 펫 슬롯 추가, 공략 안 필드 개편 (케이스이름/반지/속공/스킬순서/장비/팁) |

---

## 배포

Vercel + GitHub 자동 배포로 운영합니다.  
`main` 브랜치 push → Vercel 자동 빌드 및 배포.
