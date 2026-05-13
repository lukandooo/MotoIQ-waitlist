# Zmiana w Supabase

Dorzuciliśmy kolumnę `scale` do tabeli waitlist (skala działalności klienta).

## Jeśli jeszcze NIE robiłeś tabeli waitlist

Użyj tego SQL zamiast starego z README:

```sql
create table public.waitlist (
  id          bigserial primary key,
  name        text not null,
  email       text not null unique,
  scale       text,
  created_at  timestamptz default now(),
  ip_country  text,
  source      text default 'landing'
);

alter table public.waitlist enable row level security;
```

## Jeśli tabela już istnieje (np. testowałeś wcześniej)

Wejdź w Supabase → SQL Editor → uruchom:

```sql
alter table public.waitlist add column if not exists scale text;
```

To wszystko. Endpoint zacznie zapisywać nową kolumnę automatycznie.
