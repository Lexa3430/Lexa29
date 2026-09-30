import { createCipheriv, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PIECES, TOKENOMICS, mintUstx } from "./pieces.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clarPath = join(root, "contracts/contracts/atelier-29.clar");

const PALETTES = {
  legendary: ["#140e09", "#3c2a12", "#f0d48a", "#f7f1e4", "#8d2e2a"],
  epic: ["#110c16", "#2b1740", "#d7b08a", "#efe6f7", "#c084fc"],
  rare: ["#0e1618", "#1c3a40", "#e7d7c3", "#8fd0c8", "#e07a3d"],
  uncommon: ["#14160f", "#303628", "#efe7d8", "#9aab74", "#c4a574"],
  common: ["#171614", "#2c2926", "#f1ece4", "#c7bfb4", "#8e857c"],
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function render(piece) {
  const rand = mulberry32(piece.id * 9973 + piece.uniqueness * 17);
  const ink = PALETTES[piece.tier];
  const pick = () => ink[Math.floor(rand() * ink.length)];
  const n = (min, max) => min + rand() * (max - min);
  const shapes = [];

  shapes.push(`
    <defs>
      <linearGradient id="g${piece.id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${ink[1]}"/>
        <stop offset="1" stop-color="${ink[0]}"/>
      </linearGradient>
      <radialGradient id="r${piece.id}" cx="${n(0.2, 0.8)}" cy="${n(0.15, 0.55)}" r="0.7">
        <stop offset="0" stop-color="${ink[2]}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${ink[0]}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#g${piece.id})"/>
    <rect width="800" height="1000" fill="url(#r${piece.id})"/>
  `);

  const motif = piece.motif;
  if (motif === "meridian" || motif === "soft") {
    for (let i = 0; i < 7; i++) {
      shapes.push(
        `<path d="M40 ${180 + i * 90} C ${n(180, 320)} ${n(80, 220)}, ${n(460, 640)} ${n(200, 420)}, 760 ${160 + i * 88}" fill="none" stroke="${pick()}" stroke-width="${n(1, 6)}" opacity="0.85"/>`,
      );
    }
  } else if (motif === "choir" || motif === "interval" || motif === "ledger" || motif === "blue") {
    let y = 90;
    for (let i = 0; i < 11; i++) {
      const h = n(28, 78);
      shapes.push(`<rect x="70" y="${y}" width="660" height="${h}" fill="${pick()}" opacity="${n(0.25, 0.9)}"/>`);
      y += h + n(8, 22);
    }
  } else if (motif === "reliquary" || motif === "orbit" || motif === "moon" || motif === "radio") {
    const cx = n(280, 520);
    const cy = n(280, 520);
    for (let i = 6; i >= 1; i--) {
      shapes.push(
        `<ellipse cx="${cx}" cy="${cy}" rx="${i * n(36, 58)}" ry="${i * n(28, 50)}" fill="${i % 2 ? pick() : "none"}" stroke="${ink[2]}" stroke-width="1.5" opacity="${0.35 + i * 0.08}"/>`,
      );
    }
  } else if (motif === "archive" || motif === "index" || motif === "studio") {
    for (let i = 0; i < 14; i++) {
      const x = 60 + i * n(42, 52);
      shapes.push(
        `<rect x="${x}" y="${n(80, 220)}" width="${n(16, 36)}" height="${n(420, 760)}" fill="${pick()}" opacity="${n(0.35, 0.95)}"/>`,
      );
    }
  } else if (motif === "psalm" || motif === "light" || motif === "filament") {
    for (let i = 0; i < 18; i++) {
      shapes.push(
        `<line x1="${n(0, 800)}" y1="${n(0, 1000)}" x2="${n(0, 800)}" y2="${n(0, 1000)}" stroke="${pick()}" stroke-width="${n(0.6, 3)}" opacity="0.7"/>`,
      );
    }
  } else if (motif === "orchard" || motif === "chorus" || motif === "current") {
    for (let i = 0; i < 28; i++) {
      shapes.push(
        `<circle cx="${n(60, 740)}" cy="${n(70, 860)}" r="${n(8, 54)}" fill="${pick()}" opacity="${n(0.25, 0.85)}"/>`,
      );
    }
  } else if (motif === "lattice" || motif === "circuit" || motif === "gallery") {
    for (let y = 80; y < 880; y += 70) {
      for (let x = 70; x < 740; x += 70) {
        shapes.push(
          `<rect x="${x}" y="${y}" width="48" height="48" fill="none" stroke="${pick()}" stroke-width="${n(1, 4)}" transform="rotate(${Math.floor(n(0, 45))} ${x + 24} ${y + 24})" opacity="0.8"/>`,
        );
      }
    }
  } else if (motif === "tide" || motif === "harbor") {
    for (let i = 0; i < 9; i++) {
      const y = 140 + i * 80;
      shapes.push(
        `<path d="M0 ${y} Q 200 ${y - n(20, 80)}, 400 ${y} T 800 ${y + n(-30, 30)}" fill="none" stroke="${pick()}" stroke-width="${n(2, 10)}" opacity="0.8"/>`,
      );
    }
  } else if (motif === "signal" || motif === "window" || motif === "threshold") {
    for (let i = 1; i <= 6; i++) {
      const inset = i * 48;
      shapes.push(
        `<rect x="${inset}" y="${inset + 20}" width="${800 - inset * 2}" height="${860 - inset * 2}" fill="none" stroke="${pick()}" stroke-width="${i === 3 ? 8 : 1.5}"/>`,
      );
    }
  } else if (motif === "alloy" || motif === "terrace") {
    for (let i = 0; i < 8; i++) {
      shapes.push(
        `<rect x="${n(40, 500)}" y="${120 + i * 90}" width="${n(180, 520)}" height="${n(36, 70)}" fill="${pick()}" opacity="${n(0.4, 0.95)}" transform="rotate(${n(-8, 8)} 400 500)"/>`,
      );
    }
  } else {
    for (let i = 0; i < 16; i++) {
      shapes.push(
        `<polygon points="${n(80, 400)},${n(80, 400)} ${n(400, 720)},${n(80, 500)} ${n(120, 680)},${n(400, 860)}" fill="${pick()}" opacity="${n(0.2, 0.7)}"/>`,
      );
    }
  }

  for (let i = 0; i < 36; i++) {
    shapes.push(
      `<circle cx="${n(30, 770)}" cy="${n(30, 900)}" r="${n(0.6, 1.8)}" fill="${ink[3]}" opacity="0.45"/>`,
    );
  }

  shapes.push(`
    <rect x="28" y="28" width="744" height="944" fill="none" stroke="${ink[2]}" stroke-width="1.25" opacity="0.8"/>
    <text x="56" y="918" fill="${ink[3]}" font-family="Georgia, serif" font-size="32">${esc(piece.name)}</text>
    <text x="56" y="954" fill="${ink[2]}" font-family="ui-monospace, monospace" font-size="14" letter-spacing="3">LEXA 29  /  ${String(piece.id).padStart(2, "0")}  /  ${esc(piece.tier.toUpperCase())}</text>
  `);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${esc(piece.name)}">${shapes.join("\n")}</svg>`;
}

function assertContractMatches() {
  const source = readFileSync(clarPath, "utf8");
  const grab = (name) => {
    const match = source.match(new RegExp(`\\(define-constant ${name} \\(list([\\s\\S]*?)\\)\\)`));
    if (!match) throw new Error(`Missing ${name} in contract`);
    return match[1]
      .trim()
      .split(/\s+/)
      .map((token) => Number(token.replace("u", "")));
  };
  const prices = grab("MINT_PRICES");
  const scores = grab("UNIQUENESS");
  if (prices.length !== 29 || scores.length !== 29) {
    throw new Error("Contract lists must contain 29 entries");
  }
  PIECES.forEach((piece, index) => {
    if (prices[index] !== mintUstx(piece) || scores[index] !== piece.uniqueness) {
      throw new Error(`Contract drift at id ${piece.id}`);
    }
    if (piece.stx < 10 || piece.stx > 20) throw new Error(`Price out of range for ${piece.id}`);
  });
}

function seal(svg, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(svg, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: data.toString("base64"),
  };
}

assertContractMatches();
const key = randomBytes(32);
const sealed = {
  v: 1,
  alg: "AES-256-GCM",
  pieces: PIECES.map((piece) => ({ id: piece.id, ...seal(render(piece), key) })),
};

const collectionDir = join(root, "frontend/src/collection");
writeFileSync(join(collectionDir, "sealed.json"), JSON.stringify(sealed));
writeFileSync(
  join(collectionDir, "vault-key.ts"),
  `// Decryption key for sealed LEXA 29 artwork.\n// Import this module only from reveal.ts so the gallery is the only reader.\nexport const COLLECTION_VAULT_KEY_HEX = "${key.toString("hex")}";\n`,
);

const catalog = `// Generated by scripts/seal-collection.mjs. Public labels only; artwork stays sealed.
export type Tier = "legendary" | "epic" | "rare" | "uncommon" | "common";

export type PieceCatalog = {
  id: number;
  name: string;
  tier: Tier;
  uniqueness: number;
  mintUstx: number;
  motif: string;
};

export const COLLECTION_SIZE = ${PIECES.length};

export const TOKENOMICS = ${JSON.stringify(TOKENOMICS, null, 2)} as const;

export const PIECES: PieceCatalog[] = ${JSON.stringify(
    PIECES.map((piece) => ({
      id: piece.id,
      name: piece.name,
      tier: piece.tier,
      uniqueness: piece.uniqueness,
      mintUstx: mintUstx(piece),
      motif: piece.motif,
    })),
    null,
    2,
  )};

export function pieceById(id: number) {
  return PIECES.find((piece) => piece.id === id);
}
`;

writeFileSync(join(collectionDir, "catalog.ts"), catalog);
const raw = readFileSync(join(collectionDir, "sealed.json"), "utf8");
if (raw.includes("<svg") || raw.includes("Gilded")) {
  throw new Error("Sealed file leaked plaintext");
}
console.log(`Sealed ${PIECES.length} works`);
