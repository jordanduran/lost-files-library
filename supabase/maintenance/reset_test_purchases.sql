-- Run the entire query in Supabase SQL Editor whenever you want a fresh test.
-- Deletes ALL test orders (account and guest, including pending checkouts).
-- Keeps accounts, real orders, catalog, storage files, and city votes.
-- Old test download links stop working. Stripe/Resend history is unchanged.
-- Run between checkout tests, then refresh the app and start a NEW checkout.
begin;

-- Freeze the target set and lock these orders against concurrent fulfillment.
create temporary table test_orders_to_remove on commit drop as
  select id from public.orders where is_test = true for update;

delete from public.download_email_codes
where order_id in (select id from test_orders_to_remove);

delete from public.download_browser_sessions
where order_id in (select id from test_orders_to_remove);

delete from public.purchase_emails
where order_id in (select id from test_orders_to_remove);

delete from public.order_access
where order_id in (select id from test_orders_to_remove);

delete from public.order_items
where order_id in (select id from test_orders_to_remove);

delete from public.orders
where id in (select id from test_orders_to_remove);

select count(*) as test_orders_removed from test_orders_to_remove;
commit;
