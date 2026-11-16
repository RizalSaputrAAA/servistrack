-- OPSIONAL: mempercepat laporan per rentang tanggal. Hanya menambah index, tidak mengubah data.
-- AMAN dijalankan berulang kali. Fitur laporan tetap jalan tanpa file ini (hanya lebih lambat jika data sangat banyak).
create index if not exists idx_payments_paid_at on payments (paid_at);
create index if not exists idx_sub_invoices_paid_at on sub_invoices (paid_at) where status = 'paid';
