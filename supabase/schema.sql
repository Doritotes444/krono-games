-- ============================================================================
-- KRONO GAME STORE — Esquema Relacional PostgreSQL + Row Level Security (RLS)
-- Compatible con Supabase (Auth + PostgreSQL + Edge Functions)
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. PERFILES DE USUARIO (vinculados a auth.users de Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone_co text,
  document_id text,
  department_co text,
  city_co text,
  role text not null default 'customer' check (role in ('customer', 'editor', 'admin')),
  preferences jsonb not null default '{"eras":[],"genres":[],"platforms":[],"budget":"all"}'::jsonb,
  marketing_consent boolean not null default false,
  data_policy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. CATÁLOGO DE VIDEOJUEGOS (500+ registros verificados)
create table if not exists public.games (
  id text primary key,
  slug text unique not null,
  title text not null,
  franchise text,
  developer text not null,
  publisher text not null,
  release_date text,
  year integer,
  era text check (era in ('lanzamiento', 'moderno', 'clasico')),
  case_theme text default 'pc',
  platforms text[] not null default '{}',
  genres text[] not null default '{}',
  description text,
  why_worth_it text,
  esrb text,
  esrb_text text,
  game_modes text[] default '{}',
  players text,
  languages text,
  editions text[] default '{}',
  format text not null default 'Digital',
  availability_status text not null default 'Catálogo informativo · Consultar stock',
  price_usd numeric(10,2) not null default 0,
  original_price_usd numeric(10,2),
  discount_percent integer not null default 0,
  score integer,
  rating_source text,
  cover_url text,
  official_back_cover_url text,
  official_disc_url text,
  trailer_id text,
  sources jsonb not null default '[]'::jsonb,
  stock_physical integer not null default 0,
  stock_digital integer not null default 0,
  is_active boolean not null default true,
  last_updated date not null default current_date,
  created_at timestamptz not null default now()
);

-- 3. NOTICIAS VERIFICADAS CON FUENTES
create table if not exists public.news_articles (
  id text primary key,
  title text not null,
  summary text not null,
  image_url text,
  published_at date not null,
  verified_at date not null default current_date,
  source_name text not null,
  source_url text not null,
  category text not null,
  verification_type text not null check (verification_type in ('Oficial', 'Anuncio oficial', 'Actualización', 'Medio especializado', 'Rumor / Reporte')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. LISTA DE DESEOS / FAVORITOS
create table if not exists public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- 5. CUPONES VALIDADOS EN SERVIDOR
create table if not exists public.coupons (
  code text primary key,
  discount_percent integer not null check (discount_percent between 1 and 90),
  description text not null,
  active boolean not null default true,
  max_uses integer,
  current_uses integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 6. PEDIDOS (SOLO COLOMBIA · ESTADOS VERIFICADOS POR PASARELA/WEBHOOK)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  country text not null default 'CO' check (country = 'CO'),
  department_co text not null,
  city_co text not null,
  customer_document text not null,
  customer_phone text not null,
  payment_method text not null check (payment_method in ('visa', 'mastercard', 'paypal', 'nequi', 'corresponsal')),
  payment_provider text not null default 'wompi',
  provider_transaction_id text,
  corresponsal_network text,
  corresponsal_agreement text,
  corresponsal_code text,
  corresponsal_expires_at timestamptz,
  currency text not null default 'COP' check (currency in ('COP', 'USD')),
  fx_rate_used numeric(12,4) not null,
  subtotal_cop bigint not null,
  discount_cop bigint not null default 0,
  tax_cop bigint not null default 0,
  shipping_cop bigint not null default 0,
  total_cop bigint not null,
  coupon_code text references public.coupons(code),
  status text not null default 'pending' check (status in (
    'pending', 'approved', 'rejected', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  game_id text not null references public.games(id),
  title_snapshot text not null,
  edition_type text not null check (edition_type in ('physical', 'digital')),
  quantity integer not null check (quantity > 0),
  unit_price_cop bigint not null
);

-- 7. BIBLIOTECA DIGITAL (SOLO SE CREA TRAS WEBHOOK CONFIRMADO = approved)
create table if not exists public.digital_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  game_id text not null references public.games(id),
  activation_code text not null,
  delivery_channel text not null default 'authorized_distributor',
  revealed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. TICKETS DE SOPORTE Y PQRS
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  topic text not null,
  message text not null,
  consent_accepted boolean not null default false,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now()
);

-- 9. AUDITORÍA ADMINISTRATIVA INMUTABLE
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- FUNCIONES AUXILIARES Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ============================================================================
create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.news_articles enable row level security;
alter table public.wishlists enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.digital_entitlements enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: cada usuario ve y edita solo su perfil; admin consulta según rol
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin_or_editor());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- Catálogo y noticias: lectura pública solo activos; escritura solo admin/editor
create policy "games_public_read" on public.games
  for select using (is_active = true or public.is_admin_or_editor());
create policy "games_admin_write" on public.games
  for all using (public.is_admin_or_editor());

create policy "news_public_read" on public.news_articles
  for select using (true);
create policy "news_admin_write" on public.news_articles
  for all using (public.is_admin_or_editor());

-- Wishlists: estrictamente privadas por usuario
create policy "wishlists_own" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Pedidos y biblioteca digital: usuario solo lee los propios; creación/actualización únicamente vía Edge Function (service_role)
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin_or_editor());
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin_or_editor()))
  );
create policy "entitlements_select_own" on public.digital_entitlements
  for select using (auth.uid() = user_id);

-- Soporte: cualquiera puede crear PQRS; lectura restringida al autor o admin
create policy "tickets_insert_any" on public.support_tickets
  for insert with check (consent_accepted = true);
create policy "tickets_select_own_or_admin" on public.support_tickets
  for select using (auth.uid() = user_id or public.is_admin_or_editor());

-- Auditoría: solo administradores
create policy "audit_admin_only" on public.audit_logs
  for select using (public.is_admin_or_editor());
create policy "audit_insert_admin" on public.audit_logs
  for insert with check (public.is_admin_or_editor());
