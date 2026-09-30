export type Listing = { seller: string; price: bigint };

export type ChainPiece = {
  id: number;
  mintPrice: bigint;
  uniqueness: bigint;
  owner: string | null;
  listing: Listing | null;
};

export type ChainTokenomics = {
  collectionSize: bigint;
  creatorPrimaryBps: bigint;
  protocolPrimaryBps: bigint;
  royaltyBps: bigint;
  marketFeeBps: bigint;
  minListPrice: bigint;
  minted: bigint;
};

/** Turn cvToValue / cvToJSON wrappers into plain numbers, strings, and objects. */
export function unwrapClarity(raw: unknown): unknown {
  if (raw === null || raw === undefined) return raw ?? null;
  if (typeof raw !== "object") return raw;
  if (Array.isArray(raw)) return raw.map(unwrapClarity);

  const obj = raw as { type?: string; value?: unknown };
  if (typeof obj.type === "string" && "value" in obj) {
    if (obj.value === null || obj.type === "(optional none)") return null;
    if (obj.type === "uint" || obj.type === "int") {
      return typeof obj.value === "bigint" ? obj.value : BigInt(String(obj.value));
    }
    if (obj.type === "bool") return Boolean(obj.value);
    if (obj.type.startsWith("(tuple") && obj.value && typeof obj.value === "object") {
      const tuple: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj.value as Record<string, unknown>)) {
        tuple[key] = unwrapClarity(value);
      }
      return tuple;
    }
    if (obj.type === "principal" || obj.type.startsWith("(principal")) {
      return typeof obj.value === "string" ? obj.value : unwrapClarity(obj.value);
    }
    return unwrapClarity(obj.value);
  }

  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) record[key] = unwrapClarity(value);
  return record;
}

export function clarityUint(raw: unknown): bigint | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "bigint") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return BigInt(Math.trunc(raw));
  if (typeof raw === "string" && /^-?\d+$/.test(raw)) return BigInt(raw);
  if (typeof raw === "object") {
    const obj = raw as { type?: string; value?: unknown };
    if (obj.type === "uint" || obj.type === "int") return clarityUint(obj.value);
    if ("value" in obj && obj.value !== undefined) return clarityUint(obj.value);
  }
  return null;
}

export function clarityPrincipal(raw: unknown): string | null {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (raw && typeof raw === "object" && "value" in raw) {
    const value = (raw as { value: unknown }).value;
    if (value === null) return null;
    return clarityPrincipal(value);
  }
  return null;
}

export function formatStx(ustx: bigint): string {
  const negative = ustx < 0n;
  const value = negative ? -ustx : ustx;
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  const text = fraction ? `${whole}.${fraction}` : String(whole);
  return negative ? `-${text}` : text;
}

export function parseStxInput(input: string): bigint | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const micro = `${fraction}000000`.slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(micro);
}

export function parsePiece(id: number, raw: unknown): ChainPiece {
  const unwrapped = unwrapClarity(raw);
  if (!unwrapped || typeof unwrapped !== "object") throw new Error(`Piece ${id} could not be read`);
  const row = unwrapped as Record<string, unknown>;
  const mintPrice = clarityUint(row.price);
  const uniqueness = clarityUint(row.uniqueness);
  if (mintPrice === null || uniqueness === null) throw new Error(`Piece ${id} is missing its price`);

  let listing: Listing | null = null;
  if (row.listing && typeof row.listing === "object") {
    const item = row.listing as Record<string, unknown>;
    const seller = clarityPrincipal(item.seller);
    const price = clarityUint(item.price);
    if (seller && price !== null) listing = { seller, price };
  }

  return {
    id,
    mintPrice,
    uniqueness,
    owner: clarityPrincipal(row.owner),
    listing,
  };
}

export function parseTokenomics(raw: unknown): ChainTokenomics {
  const unwrapped = unwrapClarity(raw);
  if (!unwrapped || typeof unwrapped !== "object") throw new Error("Tokenomics could not be read");
  const row = unwrapped as Record<string, unknown>;
  const read = (key: string) => {
    const value = clarityUint(row[key]);
    if (value === null) throw new Error(`Missing ${key}`);
    return value;
  };
  return {
    collectionSize: read("collection-size"),
    creatorPrimaryBps: read("creator-primary-bps"),
    protocolPrimaryBps: read("protocol-primary-bps"),
    royaltyBps: read("royalty-bps"),
    marketFeeBps: read("market-fee-bps"),
    minListPrice: read("min-list-price"),
    minted: read("minted"),
  };
}

export function bpsLabel(bps: bigint): string {
  const whole = bps / 100n;
  const fraction = bps % 100n;
  if (fraction === 0n) return `${whole}%`;
  return `${whole}.${fraction.toString().padStart(2, "0").replace(/0$/, "")}%`;
}
