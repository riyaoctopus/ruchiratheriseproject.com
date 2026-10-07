// Single source of truth for figures the JS layer needs (form options,
// indicative price calculator). All copy/prose lives directly in index.html
// so content stays crawlable without JS. Keep this in sync with the PRICE_*
// constants and unit tables if the brochure figures ever change.

export const CONFIGURATIONS = [
  { label: "2 BHK", sbaRange: [1443, 1776] },
  { label: "3 BHK", sbaRange: [1826, 2057] },
  { label: "3.5 BHK", sbaRange: [2609, 2977] },
  { label: "4 BHK", sbaRange: [3261, 3726] },
  { label: "Duplex", sbaRange: [6891, 6902] },
  { label: "Not sure yet", sbaRange: null },
];

export const PRICE_PSF = 11999;

export function formatIndicativePrice(sba) {
  const price = sba * PRICE_PSF;
  return `₹${(price / 1e7).toFixed(2)} Cr`;
}
