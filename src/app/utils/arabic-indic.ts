const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

/** Western digits → Arabic-Indic (mushaf-style ayah numbers). */
export function toArabicIndic(value: number): string {
  return String(value).replace(/\d/g, d => ARABIC_INDIC[parseInt(d, 10)] ?? d);
}
