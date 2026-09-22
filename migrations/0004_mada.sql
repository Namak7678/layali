-- Public Moyasar publishable key only (pk_test_ / pk_live_). Never store sk_ secrets.
create table if not exists ops_settings (
  k text primary key,
  v text not null
);

alter table ops_orders add column if not exists payment_ref text not null default '';
