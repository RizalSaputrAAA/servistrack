-- Jalankan SETELAH 01_schema.sql
insert into shops (id, name, address, phone) values
 ('11111111-1111-1111-1111-111111111111', 'Servis Laptop Mitra Pontianak', 'Pontianak, Kalimantan Barat', '081234567890');

insert into parts (shop_id, code, name, category, stock, min_stock, price_buy, price_sell)
select '11111111-1111-1111-1111-111111111111', v.* from (values
 ('ADP-65-LEN','Adaptor 65W Lenovo','adaptor',6,3,95000,175000),
 ('ADP-65-ASUS','Adaptor 65W Asus','adaptor',4,3,100000,185000),
 ('ADP-90-GAM','Adaptor 90W Gaming','adaptor',2,2,175000,295000),
 ('BAT-ASUS-X','Baterai Asus X-series','baterai',2,2,280000,450000),
 ('BAT-LEN-IP','Baterai Lenovo IdeaPad','baterai',3,2,250000,420000),
 ('LCD-14-30','LCD 14" 30 pin','LCD',1,1,420000,750000),
 ('LCD-15-30','LCD 15.6" 30 pin','LCD',2,1,480000,820000),
 ('LCD-14-40','LCD 14" 40 pin slim','LCD',1,1,550000,900000),
 ('KB-ACER-A','Keyboard Acer Aspire','keyboard',4,2,85000,165000),
 ('KB-LEN-IP','Keyboard Lenovo IdeaPad','keyboard',3,2,95000,180000),
 ('KB-ASUS-X','Keyboard Asus X-series','keyboard',2,2,110000,195000),
 ('RAM-8-D4','RAM DDR4 8GB SODIMM','RAM',5,3,230000,380000),
 ('RAM-16-D4','RAM DDR4 16GB SODIMM','RAM',3,2,420000,680000),
 ('RAM-8-D3','RAM DDR3 8GB SODIMM','RAM',2,2,180000,320000),
 ('SSD-256-SATA','SSD SATA 256GB','SSD',8,4,210000,350000),
 ('SSD-512-NVME','SSD NVMe 512GB','SSD',5,3,380000,620000),
 ('SSD-1TB-NVME','SSD NVMe 1TB','SSD',2,2,750000,1150000),
 ('HDD-1TB','HDD 2.5" 1TB','storage',3,2,480000,750000),
 ('FAN-UNI','Fan laptop universal','cooling',10,5,45000,95000),
 ('FAN-ASUS-ROG','Fan Asus ROG','cooling',2,1,150000,280000),
 ('PASTA-TG','Pasta thermal (per gram)','cooling',20,10,8000,25000),
 ('MB-ASUS-A','Motherboard Asus A-series','motherboard',1,1,850000,1450000),
 ('CS-UNI-14','Casing universal 14"','casing',2,1,120000,220000),
 ('HINGE-UNI','Engsel universal','casing',5,2,35000,85000),
 ('USB-HUB','USB hub 4 port','aksesoris',8,3,25000,65000),
 ('KABEL-DC-JACK','Kabel DC jack universal','lainnya',6,3,15000,55000)
) as v(code,name,category,stock,min_stock,price_buy,price_sell);

insert into triage_rules (symptom, diagnosis, cf) values
 ('mati_total','power_charging',0.80),('tidak_charging','power_charging',0.90),('tidak_charging','battery',0.60),
 ('tidak_nyala_sama_sekali','motherboard',0.75),('tidak_nyala_sama_sekali','power_charging',0.60),
 ('blue_screen','storage_os',0.70),('blue_screen','software',0.50),
 ('layar_mati','display',0.80),('layar_mati','motherboard',0.40),
 ('keyboard_error','keyboard',0.90),('touchpad_error','keyboard',0.70),
 ('overheat','overheating',0.85),('overheat','power_charging',0.30),
 ('liquid_damage','liquid_damage',0.95),('liquid_damage','motherboard',0.70),
 ('bunyi_aneh','overheating',0.50),('bunyi_aneh','storage_os',0.40),
 ('wifi_tidak_terdeteksi','network',0.85),('usb_tidak_berfungsi','motherboard',0.55),
 ('baterai_cepat_habis','battery',0.85),('lambat_hang','storage_os',0.65),('lambat_hang','software',0.55),
 ('sistem_tidak_booting','storage_os',0.80),('sistem_tidak_booting','software',0.60);

-- 10 tiket contoh. SV-2026-0003 = tiket untuk demo (menunggu persetujuan, skor tertinggi).
insert into tickets (shop_id, ticket_code, customer_name, customer_phone, device_brand, device_type, symptoms, triage_diagnosis, triage_confidence, triage_score, status, estimated_cost, public_note, created_at) values
 ('11111111-1111-1111-1111-111111111111','SV-2026-0001','Andi Pratama','081100000001','Asus','X441',array['tidak_charging'],'power_charging',0.90,90,'picked_up',175000,'Ganti adaptor.', now() - interval '6 days'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0002','Siti Rahma','081100000002','Lenovo','IdeaPad 330',array['lambat_hang'],'storage_os',0.65,65,'received',null,null, now() - interval '5 hours'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0003','Budi Santoso','081100000003','Acer','Aspire 3',array['layar_mati'],'display',0.80,80,'waiting_approval',900000,'Layar rusak, perlu ganti LCD 14 inch 30 pin. Estimasi pengerjaan 2 hari.', now() - interval '1 day'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0004','Dewi Lestari','081100000004','Acer','Aspire 5',array['bunyi_aneh'],'overheating',0.50,50,'diagnosing',null,null, now() - interval '3 hours'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0005','Rudi Hartono','081100000005','HP','14s',array['usb_tidak_berfungsi'],'motherboard',0.55,55,'in_progress',650000,'Perbaikan jalur USB.', now() - interval '2 days'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0006','Maya Putri','081100000006','Dell','Inspiron 14',array['blue_screen'],'storage_os',0.70,70,'done',500000,'Ganti SSD dan instal ulang.', now() - interval '3 days'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0007','Fajar Nugroho','081100000007','Asus','Vivobook',array['touchpad_error'],'keyboard',0.70,70,'received',null,null, now() - interval '2 hours'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0008','Lina Marlina','081100000008','MSI','Modern 14',array['bunyi_aneh','lambat_hang'],'storage_os',0.79,79,'waiting_approval',480000,'Ganti SSD 256GB.', now() - interval '30 hours'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0009','Hendra Wijaya','081100000009','Toshiba','Satellite',array['wifi_tidak_terdeteksi'],'network',0.85,85,'cancelled',250000,'Ganti modul WiFi.', now() - interval '4 days'),
 ('11111111-1111-1111-1111-111111111111','SV-2026-0010','Nadia Safitri','081100000010','Apple','MacBook Air',array['tidak_nyala_sama_sekali'],'motherboard',0.75,75,'received',null,null, now() - interval '1 hour');

insert into ticket_events (ticket_id, to_status, note, is_public, created_at)
select id, 'received', 'Laptop diterima di toko', true, created_at from tickets;
insert into ticket_events (ticket_id, from_status, to_status, note, is_public, created_at)
select id, 'received', 'diagnosing', 'Teknisi mulai diagnosa', true, created_at + interval '20 minutes'
from tickets where status in ('diagnosing','waiting_approval','in_progress','done','picked_up','cancelled');
insert into ticket_events (ticket_id, from_status, to_status, note, is_public, created_at)
select id, 'diagnosing', 'waiting_approval', 'Penawaran biaya dikirim ke pelanggan', true, created_at + interval '1 hour'
from tickets where status in ('waiting_approval','in_progress','done','picked_up','cancelled');

update tickets set approved = true where status in ('in_progress','done','picked_up');

insert into payments (ticket_id, method, amount)
select id, 'cash', 175000 from tickets where ticket_code = 'SV-2026-0001';
