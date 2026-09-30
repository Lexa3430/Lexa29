import { describe, expect, it } from "vitest";
import { PIECES } from "./catalog";
import { bpsLabel, formatStx, parsePiece, parseStxInput } from "./clarity";

describe("collection clarity helpers", () => {
  it("formats and parses STX amounts", () => {
    expect(formatStx(20_000_000n)).toBe("20");
    expect(formatStx(12_500_000n)).toBe("12.5");
    expect(parseStxInput("10")).toBe(10_000_000n);
    expect(parseStxInput("1.25")).toBe(1_250_000n);
    expect(parseStxInput("0.0000001")).toBeNull();
  });

  it("reads the wrapped tuple returned by testnet read-only calls", () => {
    const piece = parsePiece(9, {
      type: "(tuple (listing (optional none)) (owner (optional none)) (price uint) (uniqueness uint))",
      value: {
        listing: { type: "(optional none)", value: null },
        owner: { type: "(optional none)", value: null },
        price: { type: "uint", value: "15000000" },
        uniqueness: { type: "uint", value: "70" },
      },
    });
    expect(piece.mintPrice).toBe(15_000_000n);
    expect(piece.uniqueness).toBe(70n);
    expect(piece.owner).toBeNull();
    expect(piece.listing).toBeNull();
  });

  it("reads a piece tuple from cvToValue shapes", () => {
    const piece = parsePiece(1, {
      price: { type: "uint", value: "20000000" },
      uniqueness: 100n,
      owner: null,
      listing: { seller: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", price: 8_000_000n },
    });
    expect(piece.mintPrice).toBe(20_000_000n);
    expect(piece.listing?.price).toBe(8_000_000n);
    expect(bpsLabel(250n)).toBe("2.5%");
    expect(bpsLabel(500n)).toBe("5%");
  });

  it("keeps every catalog price inside the edition range", () => {
    expect(PIECES).toHaveLength(29);
    for (const piece of PIECES) {
      expect(piece.mintUstx).toBeGreaterThanOrEqual(10_000_000);
      expect(piece.mintUstx).toBeLessThanOrEqual(20_000_000);
    }
  });
});
