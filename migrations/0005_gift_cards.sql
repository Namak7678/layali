-- LAYALI digital gift cards. Unlike ops_orders (city+SKUs+money only),
-- a gift card is a delivery product: the buyer explicitly supplies the
-- recipient's WhatsApp number so the store can deliver the code there.
-- Nothing beyond what the buyer typed at checkout is stored.
create table if not exists ops_gift_cards (
  id text primary key,              -- booking reference, e.g. GC-4821
  code text not null,               -- redemption code, e.g. LYL-1A2B-3C4D
  amount integer not null,         -- SAR, one of 150 / 300 / 500
  buyer text not null default '',         -- buyer WhatsApp digits
  recipient text not null default '',     -- recipient WhatsApp digits (delivery target)
  sender_name text not null default '',   -- "من: ..."
  note text not null default '',          -- optional gift message
  paid boolean not null default false,
  telegram_sent boolean not null default false,
  delivered boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists ops_gift_cards_code_idx on ops_gift_cards (code);
create index if not exists ops_gift_cards_created_idx on ops_gift_cards (created_at desc);
