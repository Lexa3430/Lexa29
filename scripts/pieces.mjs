/** Public collection facts. Artwork itself is sealed separately. */
export const PIECES = [
  { id: 1, name: "Gilded Meridian", tier: "legendary", stx: 20, uniqueness: 100, motif: "meridian" },
  { id: 2, name: "Obsidian Choir", tier: "legendary", stx: 19, uniqueness: 96, motif: "choir" },
  { id: 3, name: "Solar Reliquary", tier: "legendary", stx: 18, uniqueness: 92, motif: "reliquary" },
  { id: 4, name: "Violet Archive", tier: "epic", stx: 17, uniqueness: 86, motif: "archive" },
  { id: 5, name: "Copper Psalm", tier: "epic", stx: 17, uniqueness: 84, motif: "psalm" },
  { id: 6, name: "Night Orchard", tier: "epic", stx: 16, uniqueness: 80, motif: "orchard" },
  { id: 7, name: "Amber Lattice", tier: "epic", stx: 16, uniqueness: 78, motif: "lattice" },
  { id: 8, name: "Tide Manuscript", tier: "rare", stx: 15, uniqueness: 72, motif: "tide" },
  { id: 9, name: "Marble Signal", tier: "rare", stx: 15, uniqueness: 70, motif: "signal" },
  { id: 10, name: "Ember Index", tier: "rare", stx: 15, uniqueness: 68, motif: "index" },
  { id: 11, name: "Pale Circuit", tier: "rare", stx: 14, uniqueness: 64, motif: "circuit" },
  { id: 12, name: "Harbor Geometry", tier: "rare", stx: 14, uniqueness: 62, motif: "harbor" },
  { id: 13, name: "Iris Threshold", tier: "rare", stx: 14, uniqueness: 60, motif: "threshold" },
  { id: 14, name: "Quiet Alloy", tier: "rare", stx: 14, uniqueness: 58, motif: "alloy" },
  { id: 15, name: "Linen Orbit", tier: "uncommon", stx: 13, uniqueness: 52, motif: "orbit" },
  { id: 16, name: "Cedar Interval", tier: "uncommon", stx: 13, uniqueness: 50, motif: "interval" },
  { id: 17, name: "Glass Current", tier: "uncommon", stx: 13, uniqueness: 48, motif: "current" },
  { id: 18, name: "Paper Moon", tier: "uncommon", stx: 13, uniqueness: 46, motif: "moon" },
  { id: 19, name: "Salt Window", tier: "uncommon", stx: 12, uniqueness: 42, motif: "window" },
  { id: 20, name: "Ink Terrace", tier: "uncommon", stx: 12, uniqueness: 40, motif: "terrace" },
  { id: 21, name: "Moss Ledger", tier: "uncommon", stx: 12, uniqueness: 38, motif: "ledger" },
  { id: 22, name: "Dawn Filament", tier: "uncommon", stx: 12, uniqueness: 36, motif: "filament" },
  { id: 23, name: "Clay Radio", tier: "common", stx: 11, uniqueness: 30, motif: "radio" },
  { id: 24, name: "Blue Ledger", tier: "common", stx: 11, uniqueness: 28, motif: "blue" },
  { id: 25, name: "Soft Meridian", tier: "common", stx: 11, uniqueness: 26, motif: "soft" },
  { id: 26, name: "Open Gallery", tier: "common", stx: 11, uniqueness: 24, motif: "gallery" },
  { id: 27, name: "First Light", tier: "common", stx: 10, uniqueness: 18, motif: "light" },
  { id: 28, name: "Studio North", tier: "common", stx: 10, uniqueness: 14, motif: "studio" },
  { id: 29, name: "Plain Chorus", tier: "common", stx: 10, uniqueness: 10, motif: "chorus" },
];

export const TOKENOMICS = {
  creatorPrimaryBps: 9000,
  protocolPrimaryBps: 1000,
  royaltyBps: 500,
  marketFeeBps: 250,
  minListUstx: 1_000_000,
  bps: 10_000,
};

export function mintUstx(piece) {
  return piece.stx * 1_000_000;
}
