-- Jalankan SETELAH membuat 3 user di Supabase > Authentication > Users
-- (owner@servistrack.id, kasir@servistrack.id, teknisi@servistrack.id)
insert into profiles (id, shop_id, full_name, role)
select id, '11111111-1111-1111-1111-111111111111', 'Pemilik Toko', 'owner' from auth.users where email = 'owner@servistrack.id';
insert into profiles (id, shop_id, full_name, role)
select id, '11111111-1111-1111-1111-111111111111', 'Kasir Demo', 'cashier' from auth.users where email = 'kasir@servistrack.id';
insert into profiles (id, shop_id, full_name, role)
select id, '11111111-1111-1111-1111-111111111111', 'Teknisi Demo', 'technician' from auth.users where email = 'teknisi@servistrack.id';
