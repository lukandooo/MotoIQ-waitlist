# MotoIQ — waitlist

Landing waitlisty dla **motoiq.app**. Astro (SSR) + Supabase + Cloudflare Pages.

## Stack

- **Astro 4** — SSR, output: server
- **@astrojs/cloudflare** — adapter na Cloudflare Workers/Pages
- **Supabase** — baza zapisów (free tier, 500 MB)
- **Cloudflare Pages** — hosting + edge functions (free)
- **Porkbun** — domena (zostaje, tylko zmieniamy DNS)

## Co dostaniesz

Jeden landing pod `/` z formularzem (imię + email), endpoint `/api/subscribe`
zapisujący do Supabase, honeypot przeciw botom, walidacja po stronie serwera,
obsługa duplikatów (ten sam email = ciche „ok, już jesteś"), responsywny dark UI
w stylu deski rozdzielczej.

---

## 1. Lokalnie

```bash
cd motoiq
npm install
cp .dev.vars.example .dev.vars   # uzupełnij wartościami z Supabase
npm run dev
```

Otwórz http://localhost:4321.

---

## 2. Supabase — setup (jednorazowo, ~3 min)

1. Wejdź na https://supabase.com → **New project**.
   - Region: **Frankfurt (eu-central-1)** — najbliżej PL.
   - Zapisz hasło DB (gdziekolwiek, choć nie będzie Ci tu potrzebne).
2. Po utworzeniu projektu, **SQL Editor** → wklej:

```sql
create table public.waitlist (
  id          bigserial primary key,
  name        text not null,
  email       text not null unique,
  created_at  timestamptz default now(),
  ip_country  text,
  source      text default 'landing'
);

-- Tabela jest pisana wyłącznie przez service_role z Twojego endpointu.
-- Anon key nie ma żadnego dostępu — RLS ON, brak policies.
alter table public.waitlist enable row level security;
```

3. **Project Settings → API** → skopiuj:
   - `Project URL` → to będzie `SUPABASE_URL`
   - `service_role` key (sekcja "Project API keys", ten **secret**, nie anon)
     → to będzie `SUPABASE_SERVICE_KEY`

> ⚠️ `service_role` key omija RLS. **Nigdy** nie wrzucaj go do frontu ani do
> publicznego repo. Tutaj używamy go tylko po stronie serwera w endpoincie
> `/api/subscribe`, który chodzi na Cloudflare Workers.

Wklej oba do `.dev.vars` dla lokalnego dev.

---

## 3. Deploy na Cloudflare Pages

### Opcja A — przez Git (zalecana)

1. Push tego folderu na GitHub (prywatne repo wystarczy).
2. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**.
3. Wybierz repo, ustaw:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. **Environment variables → Production**, dodaj:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (zaznacz „Encrypt")
5. **Save and Deploy**. Po ~1 min masz adres `motoiq-waitlist.pages.dev`.

### Opcja B — Wrangler CLI (bez Gita)

```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=motoiq-waitlist
# Dodaj secrets w panelu Pages → Settings → Env vars
```

---

## 4. Podpięcie domeny motoiq.app (Porkbun → Cloudflare)

Cloudflare lubi mieć całą domenę u siebie — to daje proxy, SSL, analytics
za darmo. Procedura:

1. **Cloudflare dashboard → Add a site → wpisz `motoiq.app`** → plan Free.
2. Cloudflare zeskanuje DNS i poda Ci **2 nameservery**, np.:
   ```
   ada.ns.cloudflare.com
   rick.ns.cloudflare.com
   ```
3. Wejdź na Porkbun → twoja domena → **Authoritative Nameservers** → wklej te
   dwa zamiast obecnych Porkbunowych. Zapisz.
4. Propagacja: zwykle 5–30 min, max 24h. Cloudflare pingnie Cię mailem gdy
   gotowe.
5. W Cloudflare Pages → projekt `motoiq-waitlist` → **Custom domains → Set up
   a custom domain** → wpisz `motoiq.app` oraz osobno `www.motoiq.app`.
   Cloudflare sam doda rekordy DNS.
6. SSL — Cloudflare ogarnia sam, certyfikat dostajesz w ciągu kilku minut.

Po tym `https://motoiq.app` powinno pokazać Twój landing.

---

## 5. Eksport listy (gdy będziesz gotów wysłać mailing)

W Supabase: **Table Editor → waitlist → ... → Export to CSV**.
Albo SQL:

```sql
select email, name, created_at from waitlist order by created_at;
```

---

## 6. Co dorzucić później (gdy będzie potrzeba)

- **Auto-responder** — dorzuć Resend, ~10 linijek w `/api/subscribe.ts` po
  udanym `insert`. Masz 3000 maili/msc free, w sam raz.
- **Analytics** — Cloudflare Web Analytics: w dashboard CF → Analytics →
  Web Analytics → dodaj snippet do `Base.astro`. Albo Plausible — własny
  skrypt w `<head>`.
- **Rate limiting** — Cloudflare ma builtin (Security → WAF → Rate limiting
  rules), darmowe do 10k req/msc.
- **Podziękowanie/redirect** — osobna strona `/success` jeśli wolisz niż
  inline komunikat.

---

## Struktura plików

```
motoiq/
├── astro.config.mjs           # adapter Cloudflare, SSR
├── package.json
├── tsconfig.json
├── .dev.vars.example          # template lokalnych envów
├── public/
│   └── favicon.svg
└── src/
    ├── env.d.ts               # typy dla Cloudflare runtime
    ├── styles/
    │   └── global.css         # zmienne, dark theme
    ├── layouts/
    │   └── Base.astro         # html + fonty
    └── pages/
        ├── index.astro        # landing + formularz
        └── api/
            └── subscribe.ts   # endpoint POST → Supabase
```
