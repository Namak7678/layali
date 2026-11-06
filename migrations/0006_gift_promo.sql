-- Launch code LAYALI10 discounts what the buyer transfers, not the
-- face value stored in amount (the recipient still receives the full card).
alter table ops_gift_cards add column if not exists promo_on boolean not null default false;
