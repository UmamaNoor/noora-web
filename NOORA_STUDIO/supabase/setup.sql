-- NOORA STUDIO order-interest table security setup
-- Run in Supabase Dashboard > SQL Editor after confirming public.orders exists.

alter table public.orders enable row level security;

-- Remove broad default grants, then grant only the operations required by the storefront/admin.
revoke all on table public.orders from anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant select on table public.orders to authenticated;
grant update (order_status) on table public.orders to authenticated;

-- Allow visitors to submit an interest request, but not read or modify any orders.
drop policy if exists "Public can submit order requests" on public.orders;
create policy "Public can submit order requests"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- Only the designated admin account can read orders.
drop policy if exists "Admin can view order requests" on public.orders;
create policy "Admin can view order requests"
  on public.orders for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'manomalik3817@gmail.com');

-- Only the designated admin can update the order_status column.
drop policy if exists "Admin can update order status" on public.orders;
create policy "Admin can update order status"
  on public.orders for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'manomalik3817@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'manomalik3817@gmail.com');

-- If id uses an identity/serial sequence, allow inserts to obtain generated IDs.
grant usage, select on all sequences in schema public to anon, authenticated;
