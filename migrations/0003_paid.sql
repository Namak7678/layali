-- Payment flag only. No payer identity. Default unpaid — a booking is not cash.
alter table ops_orders add column if not exists paid boolean not null default false;
