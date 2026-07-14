-- Supabase Trinity Tree Complete Setup SQL Script
-- Run this script in the Supabase SQL Editor.

-- Enable PostgreSQL extensions
create extension if not exists "uuid-ossp";

-- Create Enums
create type user_role as enum ('global_admin', 'admin', 'customer');
create type appointment_status as enum ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show');
create type payment_status as enum ('Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', 'Refunded');
create type financial_record_type as enum ('Estimate', 'Invoice', 'Charge', 'Payment', 'Credit', 'Refund', 'Expense', 'Other');
create type work_status as enum ('Scheduled', 'In Progress', 'Completed', 'Cancelled');

-- Create Tables

-- 1. profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role not null default 'customer',
  full_name text not null,
  email text not null,
  phone text,
  secondary_phone text,
  service_address text,
  billing_address text,
  city text,
  state text,
  zip_code text,
  preferred_contact_method text,
  account_status text not null default 'active', -- 'active' or 'disabled'
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 2. customers (explicit profile link or decoupled record for assignment management)
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  secondary_phone text,
  service_address text,
  billing_address text,
  city text,
  state text,
  zip_code text,
  preferred_contact_method text,
  account_status text not null default 'active', -- 'active' or 'disabled'
  general_notes text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 3. admin_customer_assignments
create table if not exists public.admin_customer_assignments (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.profiles(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique(admin_id, customer_id)
);

-- 4. appointments
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  title text not null,
  service_address text,
  status appointment_status not null default 'Scheduled',
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  appointment_notes text,
  internal_notes text,
  customer_visible_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 5. work_records
create table if not exists public.work_records (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  assigned_employee_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status work_status not null default 'Scheduled',
  date_started timestamp with time zone,
  date_completed timestamp with time zone,
  internal_notes text,
  customer_visible_summary text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 6. customer_notes
create table if not exists public.customer_notes (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  work_record_id uuid references public.work_records(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  visibility text not null check (visibility in ('internal', 'customer')),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 7. financial_records
create table if not exists public.financial_records (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  work_record_id uuid references public.work_records(id) on delete set null,
  record_type financial_record_type not null,
  description text not null,
  amount_in_cents integer not null, -- stored as integer cents
  transaction_date timestamp with time zone not null default timezone('utc'::text, now()),
  due_date timestamp with time zone,
  payment_status payment_status not null default 'Draft',
  payment_method text,
  reference_number text,
  internal_memo text,
  customer_visible_description text,
  customer_visible boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 8. documents
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  work_record_id uuid references public.work_records(id) on delete set null,
  document_type text not null, -- 'receipt', 'estimate', 'invoice', etc.
  original_filename text not null,
  storage_path text not null, -- path within bucket
  mime_type text,
  file_size integer,
  description text,
  customer_visible boolean not null default false,
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 9. work_photos
create table if not exists public.work_photos (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  work_record_id uuid references public.work_records(id) on delete cascade not null,
  storage_path text not null,
  description text,
  customer_visible boolean not null default false,
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 10. website_pages
create table if not exists public.website_pages (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique, -- 'home', 'about'
  slug text not null unique, -- '/', '/about'
  seo_title text,
  seo_description text,
  published_status boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 11. website_content_blocks
create table if not exists public.website_content_blocks (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid references public.website_pages(id) on delete cascade not null,
  block_type text not null, -- 'heading', 'paragraph', 'image', 'image_text', 'cta', 'gallery_preview', 'divider', 'contact'
  sort_order integer not null default 0,
  heading text,
  body text,
  image_path text,
  image_alt_text text,
  button_label text,
  button_url text,
  alignment text not null default 'left', -- 'left', 'center', 'right'
  published_status boolean not null default true,
  config jsonb default '{}'::jsonb, -- additional configuration parameters
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 12. gallery_items
create table if not exists public.gallery_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  caption text,
  alt_text text,
  category text,
  storage_path text not null,
  display_order integer not null default 0,
  published_status boolean not null default true,
  is_cover boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 13. company_settings
create table if not exists public.company_settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value text,
  description text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 14. audit_logs
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);


-- Triggers for updated_at

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger trg_customers_updated_at before update on public.customers for each row execute procedure public.handle_updated_at();
create trigger trg_appointments_updated_at before update on public.appointments for each row execute procedure public.handle_updated_at();
create trigger trg_work_records_updated_at before update on public.work_records for each row execute procedure public.handle_updated_at();
create trigger trg_customer_notes_updated_at before update on public.customer_notes for each row execute procedure public.handle_updated_at();
create trigger trg_financial_records_updated_at before update on public.financial_records for each row execute procedure public.handle_updated_at();
create trigger trg_website_pages_updated_at before update on public.website_pages for each row execute procedure public.handle_updated_at();
create trigger trg_website_content_blocks_updated_at before update on public.website_content_blocks for each row execute procedure public.handle_updated_at();
create trigger trg_gallery_items_updated_at before update on public.gallery_items for each row execute procedure public.handle_updated_at();
create trigger trg_company_settings_updated_at before update on public.company_settings for each row execute procedure public.handle_updated_at();


-- Authorization Helper Functions

create or replace function public.is_global_admin()
returns boolean security definer set search_path = public as $$
declare
  r user_role;
begin
  select role into r from public.profiles where id = auth.uid() and account_status = 'active';
  return (r = 'global_admin');
end;
$$ language plpgsql;

create or replace function public.is_admin()
returns boolean security definer set search_path = public as $$
declare
  r user_role;
begin
  select role into r from public.profiles where id = auth.uid() and account_status = 'active';
  return (r = 'global_admin' or r = 'admin');
end;
$$ language plpgsql;

create or replace function public.is_customer_user()
returns boolean security definer set search_path = public as $$
declare
  r user_role;
begin
  select role into r from public.profiles where id = auth.uid() and account_status = 'active';
  return (r = 'customer');
end;
$$ language plpgsql;

create or replace function public.is_assigned_to_customer(cust_id uuid)
returns boolean security definer set search_path = public as $$
begin
  return exists (
    select 1 from public.admin_customer_assignments
    where admin_id = auth.uid() and customer_id = cust_id
  );
end;
$$ language plpgsql;

create or replace function public.can_access_customer(cust_id uuid)
returns boolean security definer set search_path = public as $$
declare
  r user_role;
begin
  select role into r from public.profiles where id = auth.uid() and account_status = 'active';
  if r = 'global_admin' then
    return true;
  elsif r = 'admin' then
    return exists (
      select 1 from public.admin_customer_assignments
      where admin_id = auth.uid() and customer_id = cust_id
    );
  elsif r = 'customer' then
    return exists (
      select 1 from public.customers
      where id = cust_id and profile_id = auth.uid() and account_status = 'active'
    );
  else
    return false;
  end if;
end;
$$ language plpgsql;


-- Row Level Security Enablement

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.admin_customer_assignments enable row level security;
alter table public.appointments enable row level security;
alter table public.work_records enable row level security;
alter table public.customer_notes enable row level security;
alter table public.financial_records enable row level security;
alter table public.documents enable row level security;
alter table public.work_photos enable row level security;
alter table public.website_pages enable row level security;
alter table public.website_content_blocks enable row level security;
alter table public.gallery_items enable row level security;
alter table public.company_settings enable row level security;
alter table public.audit_logs enable row level security;


-- Row Level Security Policies

-- profiles
create policy "Profiles read policy" on public.profiles
  for select using (
    auth.uid() = id or public.is_admin()
  );

create policy "Profiles update policy" on public.profiles
  for update using (
    auth.uid() = id or public.is_global_admin()
  );

create policy "Profiles insert policy" on public.profiles
  for insert with check (
    public.is_global_admin()
  );

-- customers
create policy "Customers read policy" on public.customers
  for select using (
    public.is_global_admin() or
    (public.is_admin() and public.is_assigned_to_customer(id)) or
    (profile_id = auth.uid() and account_status = 'active')
  );

create policy "Customers insert policy" on public.customers
  for insert with check (
    public.is_global_admin()
  );

create policy "Customers update policy" on public.customers
  for update using (
    public.is_global_admin() or
    (public.is_admin() and public.is_assigned_to_customer(id))
  );

-- admin_customer_assignments
create policy "Assignments read policy" on public.admin_customer_assignments
  for select using (
    public.is_global_admin() or admin_id = auth.uid()
  );

create policy "Assignments write policy" on public.admin_customer_assignments
  for all using (
    public.is_global_admin()
  );

-- appointments
create policy "Appointments read policy" on public.appointments
  for select using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id)) or
    (public.is_customer_user() and public.can_access_customer(customer_id))
  );

create policy "Appointments write policy" on public.appointments
  for all using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id))
  );

-- work_records
create policy "Work records read policy" on public.work_records
  for select using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id)) or
    (public.is_customer_user() and public.can_access_customer(customer_id))
  );

create policy "Work records write policy" on public.work_records
  for all using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id))
  );

-- customer_notes
create policy "Customer notes read policy" on public.customer_notes
  for select using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id)) or
    (public.is_customer_user() and public.can_access_customer(customer_id) and visibility = 'customer')
  );

create policy "Customer notes write policy" on public.customer_notes
  for all using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id))
  );

-- financial_records
create policy "Financial records read policy" on public.financial_records
  for select using (
    public.is_global_admin() or
    (public.is_customer_user() and public.can_access_customer(customer_id) and customer_visible = true)
  );

create policy "Financial records write policy" on public.financial_records
  for all using (
    public.is_global_admin()
  );

-- documents
create policy "Documents read policy" on public.documents
  for select using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id)) or
    (public.is_customer_user() and public.can_access_customer(customer_id) and customer_visible = true)
  );

create policy "Documents write policy" on public.documents
  for all using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id))
  );

-- work_photos
create policy "Work photos read policy" on public.work_photos
  for select using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id)) or
    (public.is_customer_user() and public.can_access_customer(customer_id) and customer_visible = true)
  );

create policy "Work photos write policy" on public.work_photos
  for all using (
    public.is_global_admin() or
    (public.is_admin() and public.can_access_customer(customer_id))
  );

-- website_pages
create policy "Website pages public read" on public.website_pages
  for select using (true);

create policy "Website pages admin manage" on public.website_pages
  for all using (public.is_global_admin());

-- website_content_blocks
create policy "Content blocks public read" on public.website_content_blocks
  for select using (published_status = true or public.is_global_admin());

create policy "Content blocks admin manage" on public.website_content_blocks
  for all using (public.is_global_admin());

-- gallery_items
create policy "Gallery items public read" on public.gallery_items
  for select using (published_status = true or public.is_global_admin());

create policy "Gallery items admin manage" on public.gallery_items
  for all using (public.is_global_admin());

-- company_settings
create policy "Company settings read policy" on public.company_settings
  for select using (true);

create policy "Company settings admin manage" on public.company_settings
  for all using (public.is_global_admin());

-- audit_logs
create policy "Audit logs admin view" on public.audit_logs
  for select using (public.is_global_admin());

create policy "Audit logs insert policy" on public.audit_logs
  for insert with check (true);


-- Automatic user creation trigger on auth.users (Optional, but highly useful for profiles)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, account_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'::user_role),
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Initial Pages and Content Setup

insert into public.website_pages (name, slug, seo_title, seo_description) values
  ('home', '/', 'Trinity Tree - Tree Services & Landscaping', 'Your number one choice for tree care, removal, pruning, and landscape services.'),
  ('about', '/about', 'About Us - Trinity Tree', 'Learn more about Trinity Tree, our values, our experience, and our passionate team.');

insert into public.website_content_blocks (page_id, block_type, sort_order, heading, body, alignment)
select
  id as page_id,
  'heading' as block_type,
  0 as sort_order,
  'Welcome to Trinity Tree' as heading,
  'Premium tree removal, pruning, and emergency storm damage care in your local community. Dedicated to safety and structural tree health.' as body,
  'center' as alignment
from public.website_pages where name = 'home';

insert into public.website_content_blocks (page_id, block_type, sort_order, heading, body, alignment)
select
  id as page_id,
  'paragraph' as block_type,
  1 as sort_order,
  'Who We Are' as heading,
  'Founded on the pillars of professionalism, customer integrity, and environmental care, Trinity Tree has spent over a decade perfecting safe tree trimming, deep canopy pruning, and total tree removals.' as body,
  'left' as alignment
from public.website_pages where name = 'about';

insert into public.company_settings (key, value, description) values
  ('company_name', 'Trinity Tree', 'The legal or display name of the company.'),
  ('support_phone', '(800) 555-0199', 'Primary business support phone number.'),
  ('support_email', 'contact@trinitytree.com', 'Primary contact email.'),
  ('office_address', '100 Trinity Way, Chicago, IL 60611', 'Physical office address.');
