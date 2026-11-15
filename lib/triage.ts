// Mesin triage: Certainty Factor (CF) dengan 24 aturan.
export const SYMPTOMS = [
  { code: "mati_total", label: "Mati total" },
  { code: "tidak_charging", label: "Tidak mau charging" },
  { code: "blue_screen", label: "Blue screen / BSOD" },
  { code: "overheat", label: "Overheat / cepat panas" },
  { code: "layar_mati", label: "Layar mati / blank" },
  { code: "keyboard_error", label: "Keyboard error" },
  { code: "touchpad_error", label: "Touchpad tidak berfungsi" },
  { code: "liquid_damage", label: "Kena cairan" },
  { code: "tidak_nyala_sama_sekali", label: "Tidak nyala sama sekali" },
  { code: "bunyi_aneh", label: "Bunyi aneh dari dalam" },
  { code: "wifi_tidak_terdeteksi", label: "WiFi tidak terdeteksi" },
  { code: "usb_tidak_berfungsi", label: "USB tidak berfungsi" },
  { code: "baterai_cepat_habis", label: "Baterai cepat habis" },
  { code: "lambat_hang", label: "Lambat / hang" },
  { code: "sistem_tidak_booting", label: "Sistem tidak mau booting" },
];

// [gejala, diagnosis, CF]
export const RULES: [string, string, number][] = [
  ["mati_total", "power_charging", 0.8],
  ["tidak_charging", "power_charging", 0.9],
  ["tidak_charging", "battery", 0.6],
  ["tidak_nyala_sama_sekali", "motherboard", 0.75],
  ["tidak_nyala_sama_sekali", "power_charging", 0.6],
  ["blue_screen", "storage_os", 0.7],
  ["blue_screen", "software", 0.5],
  ["layar_mati", "display", 0.8],
  ["layar_mati", "motherboard", 0.4],
  ["keyboard_error", "keyboard", 0.9],
  ["touchpad_error", "keyboard", 0.7],
  ["overheat", "overheating", 0.85],
  ["overheat", "power_charging", 0.3],
  ["liquid_damage", "liquid_damage", 0.95],
  ["liquid_damage", "motherboard", 0.7],
  ["bunyi_aneh", "overheating", 0.5],
  ["bunyi_aneh", "storage_os", 0.4],
  ["wifi_tidak_terdeteksi", "network", 0.85],
  ["usb_tidak_berfungsi", "motherboard", 0.55],
  ["baterai_cepat_habis", "battery", 0.85],
  ["lambat_hang", "storage_os", 0.65],
  ["lambat_hang", "software", 0.55],
  ["sistem_tidak_booting", "storage_os", 0.8],
  ["sistem_tidak_booting", "software", 0.6],
];

export function triage(symptoms: string[]) {
  const acc: Record<string, number> = {};
  for (const s of symptoms || []) {
    for (const [sym, dx, cf] of RULES) {
      if (sym !== s) continue;
      // CF_gabungan = CF1 + CF2 * (1 - CF1)
      acc[dx] = acc[dx] === undefined ? cf : acc[dx] + cf * (1 - acc[dx]);
    }
  }
  const sorted = Object.entries(acc).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return { diagnosis: null as string | null, confidence: 0, score: 0 };
  const confidence = Math.round(sorted[0][1] * 100) / 100;
  return { diagnosis: sorted[0][0], confidence, score: Math.round(confidence * 100) };
}
