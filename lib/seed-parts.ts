// Daftar suku cadang awal untuk toko baru, disalin dari supabase/02_seed.sql.
type SeedPart = [string, string, string, number, number, number, number];

export const SEED_PARTS: SeedPart[] = [
  ["ADP-65-LEN", "Adaptor 65W Lenovo", "adaptor", 6, 3, 95000, 175000],
  ["ADP-65-ASUS", "Adaptor 65W Asus", "adaptor", 4, 3, 100000, 185000],
  ["ADP-90-GAM", "Adaptor 90W Gaming", "adaptor", 2, 2, 175000, 295000],
  ["BAT-ASUS-X", "Baterai Asus X-series", "baterai", 2, 2, 280000, 450000],
  ["BAT-LEN-IP", "Baterai Lenovo IdeaPad", "baterai", 3, 2, 250000, 420000],
  ['LCD-14-30', 'LCD 14" 30 pin', "LCD", 1, 1, 420000, 750000],
  ['LCD-15-30', 'LCD 15.6" 30 pin', "LCD", 2, 1, 480000, 820000],
  ['LCD-14-40', 'LCD 14" 40 pin slim', "LCD", 1, 1, 550000, 900000],
  ["KB-ACER-A", "Keyboard Acer Aspire", "keyboard", 4, 2, 85000, 165000],
  ["KB-LEN-IP", "Keyboard Lenovo IdeaPad", "keyboard", 3, 2, 95000, 180000],
  ["KB-ASUS-X", "Keyboard Asus X-series", "keyboard", 2, 2, 110000, 195000],
  ["RAM-8-D4", "RAM DDR4 8GB SODIMM", "RAM", 5, 3, 230000, 380000],
  ["RAM-16-D4", "RAM DDR4 16GB SODIMM", "RAM", 3, 2, 420000, 680000],
  ["RAM-8-D3", "RAM DDR3 8GB SODIMM", "RAM", 2, 2, 180000, 320000],
  ["SSD-256-SATA", "SSD SATA 256GB", "SSD", 8, 4, 210000, 350000],
  ["SSD-512-NVME", "SSD NVMe 512GB", "SSD", 5, 3, 380000, 620000],
  ["SSD-1TB-NVME", "SSD NVMe 1TB", "SSD", 2, 2, 750000, 1150000],
  ['HDD-1TB', 'HDD 2.5" 1TB', "storage", 3, 2, 480000, 750000],
  ["FAN-UNI", "Fan laptop universal", "cooling", 10, 5, 45000, 95000],
  ["FAN-ASUS-ROG", "Fan Asus ROG", "cooling", 2, 1, 150000, 280000],
  ["PASTA-TG", "Pasta thermal (per gram)", "cooling", 20, 10, 8000, 25000],
  ["MB-ASUS-A", "Motherboard Asus A-series", "motherboard", 1, 1, 850000, 1450000],
  ['CS-UNI-14', 'Casing universal 14"', "casing", 2, 1, 120000, 220000],
  ["HINGE-UNI", "Engsel universal", "casing", 5, 2, 35000, 85000],
  ["USB-HUB", "USB hub 4 port", "aksesoris", 8, 3, 25000, 65000],
  ["KABEL-DC-JACK", "Kabel DC jack universal", "lainnya", 6, 3, 15000, 55000],
];

export function seedPartRows(shopId: string) {
  return SEED_PARTS.map(([code, name, category, stock, min_stock, price_buy, price_sell]) => ({
    shop_id: shopId, code, name, category, stock, min_stock, price_buy, price_sell,
  }));
}
