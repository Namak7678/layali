-- LAYALI ops inbox. Unowned rows: city + SKUs + money only. Never names or phones.
create table if not exists ops_orders (
  id text primary key,
  city text not null default '',
  items text not null,
  gift_wrap boolean not null default false,
  promo_on boolean not null default false,
  total integer not null default 0,
  cost integer not null default 0,
  shipping_cost integer not null default 0,
  status text not null default 'new',
  carrier text not null default '',
  tracking text not null default '',
  telegram_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ops_orders_created_idx on ops_orders (created_at desc);

create table if not exists ops_stock (
  sku text primary key,
  slug text not null,
  size_id text not null,
  on_hand integer not null default 12,
  reorder_at integer not null default 4
);

insert into ops_stock (sku, slug, size_id, on_hand, reorder_at) values
  ('riyadh:50', 'riyadh', '50', 12, 4),
  ('riyadh:100', 'riyadh', '100', 12, 4),
  ('jeddah:50', 'jeddah', '50', 12, 4),
  ('jeddah:100', 'jeddah', '100', 12, 4),
  ('oud:12', 'oud', '12', 8, 3),
  ('oud:50', 'oud', '50', 8, 3),
  ('taif:50', 'taif', '50', 12, 4),
  ('taif:100', 'taif', '100', 12, 4),
  ('bakhoor:box', 'bakhoor', 'box', 16, 5),
  ('discovery:set', 'discovery', 'set', 14, 4)
on conflict (sku) do nothing;
