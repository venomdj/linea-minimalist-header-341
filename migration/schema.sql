-- =====================================================================
-- Mythical Vault — Full schema export for a fresh Supabase project
-- Run this in the SQL editor of your NEW Supabase project (once).
--
-- Order is important. Do NOT split — run the whole file in one go.
--   1. Extensions
--   2. Enums
--   3. Tables (with EVERY column needed by functions/triggers)
--   4. Grants + RLS + policies
--   5. Functions
--   6. Triggers
-- =====================================================================

-- ---------- 1. Extensions -------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------- 2. Enums ------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin','moderator','user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum
    ('pending','confirmed','shipped','delivered','cancelled','refunded');
exception when duplicate_object then null; end $$;

-- ---------- 3. Tables -----------------------------------------------------

-- profiles
create table if not exists public.profiles (
  id          uuid primary key,
  email       text,
  full_name   text,
  phone       text,
  avatar_url  text,
  address     text,
  address2    text,
  city        text,
  state       text,
  pincode     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- user_roles
create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- products  (NOTE: includes BOTH the new fields (stock/in_stock) AND the
-- legacy fields (stock_quantity/is_in_stock/track_stock) that some
-- functions still reference. Keeping both avoids "column does not exist"
-- errors when the functions/triggers are created later.)
create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text,
  price                numeric not null default 0,
  image_url            text,
  category             text,
  series               text,
  set_name             text,
  edition              text,
  grade                text,
  rarity               text,
  last_sale            numeric,
  verified             boolean not null default true,
  is_new               boolean not null default false,
  featured             boolean not null default false,
  population           integer,
  -- new stock model
  stock                integer not null default 0,
  in_stock             boolean not null default true,
  -- legacy stock model (kept for backwards compatibility w/ functions)
  stock_quantity       integer not null default 0,
  is_in_stock          boolean not null default true,
  track_stock          boolean not null default true,
  low_stock_threshold  integer not null default 5,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- orders
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid,
  order_number       text not null unique,
  status             public.order_status not null default 'pending',
  subtotal           numeric not null default 0,
  shipping_amount    numeric not null default 0,
  shipping_cost      numeric,
  gst_amount         numeric not null default 0,
  total_amount       numeric not null default 0,
  line_items         jsonb   not null default '[]'::jsonb,
  customer_name      text not null,
  customer_email     text not null,
  customer_phone     text,
  shipping_address   text,
  shipping_address2  text,
  shipping_city      text,
  shipping_state     text,
  shipping_pincode   text,
  shipping_method    text,
  payment_method     text not null,
  payment_status     text not null default 'Pending',
  courier_name       text,
  tracking_number    text,
  tracking_url       text,
  notes              text,
  estimated_delivery text,
  stock_deducted     boolean not null default false,
  order_date         timestamptz not null default now(),
  created_at         timestamptz not null default timezone('utc', now()),
  confirmed_at       timestamptz,
  shipped_at         timestamptz,
  delivered_at       timestamptz,
  updated_at         timestamptz not null default now()
);

-- notifications
create table if not exists public.notifications (
  id        uuid primary key default gen_random_uuid(),
  type      text not null default 'order',
  title     text not null,
  message   text,
  order_id  uuid,
  metadata  jsonb not null default '{}'::jsonb,
  read      boolean not null default false,
  read_at   timestamptz,
  created_at timestamptz not null default now()
);

-- prevent duplicate notifications per (order, type)
do $$ begin
  alter table public.notifications
    add constraint notifications_order_type_unique unique (order_id, type);
exception when duplicate_object then null; end $$;

-- email_log
create table if not exists public.email_log (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null,
  email_type  text not null,
  recipient   text not null,
  status      text not null default 'pending',
  provider_id text,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- notification_logs (telegram, etc.)
create table if not exists public.notification_logs (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null,
  channel       text not null default 'telegram',
  status        text not null,
  error_message text,
  created_at    timestamptz default now()
);

-- stock_log (audit trail)
create table if not exists public.stock_log (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid,
  order_id     uuid,
  change_type  text not null,
  quantity     integer not null,
  stock_before integer not null,
  stock_after  integer not null,
  note         text,
  created_at   timestamptz default now()
);

-- ---------- 4. Grants -----------------------------------------------------
grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select, insert, update on public.orders to anon, authenticated;
grant all on public.orders to service_role;

grant select, insert, update on public.notifications to authenticated;
grant insert on public.notifications to anon;
grant all on public.notifications to service_role;

grant select on public.email_log to authenticated;
grant all on public.email_log to service_role;

grant all on public.notification_logs to service_role;
grant all on public.stock_log to service_role;

-- ---------- 5. Enable RLS -------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.user_roles        enable row level security;
alter table public.products          enable row level security;
alter table public.orders            enable row level security;
alter table public.notifications     enable row level security;
alter table public.email_log         enable row level security;
alter table public.notification_logs enable row level security;
alter table public.stock_log         enable row level security;

-- ---------- 6. has_role (needed by policies) ------------------------------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ---------- 7. Policies ---------------------------------------------------
-- profiles
drop policy if exists "Users view own profile"   on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users view own profile"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- user_roles
drop policy if exists "Users can view their own roles" on public.user_roles;
drop policy if exists "Admins can view all roles"      on public.user_roles;
drop policy if exists "Admins can manage roles"        on public.user_roles;
create policy "Users can view their own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins can view all roles"      on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins can manage roles"        on public.user_roles for all    to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- products
drop policy if exists "Anyone can view products"   on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;
create policy "Anyone can view products"   on public.products for select using (true);
create policy "Admins can insert products" on public.products for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admins can update products" on public.products for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Admins can delete products" on public.products for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- orders
drop policy if exists "Anyone can create order"     on public.orders;
drop policy if exists "Users view own orders"       on public.orders;
drop policy if exists "Admins full access on orders" on public.orders;
create policy "Anyone can create order"     on public.orders for insert to anon, authenticated with check (user_id is null or (auth.uid() is not null and auth.uid() = user_id));
create policy "Users view own orders"       on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "Admins full access on orders" on public.orders for all   to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- notifications
drop policy if exists "Admins view notifications"     on public.notifications;
drop policy if exists "Admins update notifications"   on public.notifications;
drop policy if exists "System can insert notifications" on public.notifications;
create policy "Admins view notifications"     on public.notifications for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins update notifications"   on public.notifications for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "System can insert notifications" on public.notifications for insert to anon, authenticated with check (true);

-- email_log
drop policy if exists "Service role full access on email_log" on public.email_log;
drop policy if exists "Users can view their own email log"    on public.email_log;
create policy "Service role full access on email_log" on public.email_log for all to service_role using (true) with check (true);
create policy "Users can view their own email log"    on public.email_log for select to authenticated
  using (order_id in (select id from public.orders where user_id = auth.uid()));

-- notification_logs
drop policy if exists "Service role only" on public.notification_logs;
create policy "Service role only" on public.notification_logs for all using (false);

-- ---------- 8. Functions (created AFTER tables exist) --------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create or replace function public.handle_order_status_timestamps()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.status = new.status then
    new.updated_at = now(); return new;
  end if;
  case new.status
    when 'confirmed' then new.confirmed_at = coalesce(new.confirmed_at, now());
    when 'shipped'   then new.shipped_at   = coalesce(new.shipped_at,   now());
    when 'delivered' then new.delivered_at = coalesce(new.delivered_at, now());
    else null;
  end case;
  new.updated_at = now();
  return new;
end; $$;

create or replace function public.create_order_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (type,title,message,order_id,metadata)
  values (
    'order',
    'New order ' || new.order_number,
    new.customer_name || ' placed an order for ₹' || new.total_amount::text,
    new.id,
    jsonb_build_object(
      'order_number',  new.order_number,
      'customer_name', new.customer_name,
      'customer_email',new.customer_email,
      'total_amount',  new.total_amount,
      'status',        new.status
    )
  )
  on conflict on constraint notifications_order_type_unique do nothing;
  return new;
end; $$;

create or replace function public.sync_in_stock()
returns trigger language plpgsql as $$
begin
  if new.stock = 0 then
    new.in_stock := false;
  elsif new.stock > 0 and old.stock = 0 then
    new.in_stock := true;
  end if;
  return new;
end; $$;

create or replace function public.sync_in_stock_flag()
returns trigger language plpgsql as $$
begin
  new.is_in_stock := (new.stock_quantity > 0);
  return new;
end; $$;

-- ---------- 9. Triggers --------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists products_sync_in_stock on public.products;
create trigger products_sync_in_stock before update on public.products
  for each row execute function public.sync_in_stock();

drop trigger if exists products_sync_in_stock_flag on public.products;
create trigger products_sync_in_stock_flag before insert or update on public.products
  for each row execute function public.sync_in_stock_flag();

drop trigger if exists orders_status_timestamps on public.orders;
create trigger orders_status_timestamps before insert or update on public.orders
  for each row execute function public.handle_order_status_timestamps();

drop trigger if exists orders_create_notification on public.orders;
create trigger orders_create_notification after insert on public.orders
  for each row execute function public.create_order_notification();

-- Auto-create profile when a new auth user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Done. Next: run storage.sql, then deploy edge functions.
-- =====================================================================
