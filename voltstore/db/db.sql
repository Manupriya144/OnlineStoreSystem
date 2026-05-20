create table profiles (
  id uuid primary key,
  full_name text,
  phone text,
  role text not null default 'customer',
  created_at timestamptz default now()
  email text
);

create table categories (
  id int8 generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamptz default now()
);

create table brands (
  id int8 generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamptz default now()
);

create table products (
  id int8 generated always as identity primary key,
  category_id int8 references categories(id) on delete set null,
  brand_id int8 references brands(id) on delete set null,
  name text not null,
  slug text not null unique,
  model text,
  short_description text,
  description text,
  price numeric not null default 0,
  stock_qty int4 not null default 0,
  sku text unique,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table product_images (
  id int8 generated always as identity primary key,
  product_id int8 not null references products(id) on delete cascade,
  image_path text not null,
  is_primary bool not null default false,
  created_at timestamptz default now()
);

create table product_specs (
  id int8 generated always as identity primary key,
  product_id int8 not null references products(id) on delete cascade,
  spec_name text not null,
  spec_value text not null
);

create table addresses (
  id int8 generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  district text,
  postal_code text,
  country text not null default 'Sri Lanka',
  is_default bool not null default false,
  created_at timestamptz default now()
);

create table cart_items (
  id int8 generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  product_id int8 not null references products(id) on delete cascade,
  quantity int4 not null default 1,
  created_at timestamptz default now()
);

create table orders (
  id int8 generated always as identity primary key,
  order_number text not null unique,
  user_id uuid not null references profiles(id),
  address_id int8 references addresses(id) on delete set null,
  order_status text not null default 'pending',
  payment_status text not null default 'pending',
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  total_amount numeric not null default 0,
  currency text not null default 'LKR',
  notes text,
  created_at timestamptz default now()
);

create table order_items (
  id int8 generated always as identity primary key,
  order_id int8 not null references orders(id) on delete cascade,
  product_id int8 references products(id) on delete set null,
  product_name text not null,
  product_slug text,
  unit_price numeric not null,
  quantity int4 not null,
  line_total numeric not null
);

create table payments (
  id int8 generated always as identity primary key,
  order_id int8 not null references orders(id) on delete cascade,
  provider text not null,
  payment_method text,
  provider_ref text,
  amount numeric not null,
  currency text not null default 'LKR',
  status text not null default 'pending',
  failure_reason text,
  gateway_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table repair_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  device_type text not null,
  brand text,
  model text,
  issue_description text not null,
  image_url text,
  preferred_date date,
  contact_name text not null,
  contact_phone text not null,
  status text default 'pending',
  created_at timestamptz default now()
);