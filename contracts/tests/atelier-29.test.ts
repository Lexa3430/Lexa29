import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { PIECES, TOKENOMICS, mintUstx } from "../../scripts/pieces.mjs";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contract = `${deployer}.atelier-29`;

function stxOf(address: string): bigint {
  const assets = simnet.getAssetsMap();
  const stx = assets.get("STX");
  return BigInt(stx?.get(address) ?? 0);
}

describe("atelier-29", () => {
  it("exposes 29 uniqueness-priced works between 10 and 20 STX", () => {
    expect(PIECES).toHaveLength(29);
    for (const piece of PIECES) {
      expect(piece.stx).toBeGreaterThanOrEqual(10);
      expect(piece.stx).toBeLessThanOrEqual(20);
      const price = simnet.callReadOnlyFn(
        "atelier-29",
        "get-mint-price",
        [Cl.uint(piece.id)],
        deployer,
      );
      expect(price.result).toBeOk(Cl.uint(mintUstx(piece)));
      const score = simnet.callReadOnlyFn(
        "atelier-29",
        "get-uniqueness",
        [Cl.uint(piece.id)],
        deployer,
      );
      expect(score.result).toBeOk(Cl.uint(piece.uniqueness));
    }

    const invalid = simnet.callReadOnlyFn(
      "atelier-29",
      "get-mint-price",
      [Cl.uint(30)],
      deployer,
    );
    expect(invalid.result).toBeErr(Cl.uint(102));
  });

  it("splits a primary mint 90/10 and rejects a second mint", () => {
    const piece = PIECES[0];
    const price = BigInt(mintUstx(piece));
    const creatorBefore = stxOf(deployer);
    const treasuryBefore = stxOf(contract);
    const buyerBefore = stxOf(wallet1);

    const { result } = simnet.callPublicFn("atelier-29", "mint", [Cl.uint(piece.id)], wallet1);
    expect(result).toBeOk(Cl.uint(piece.id));

    const protocol = (price * BigInt(TOKENOMICS.protocolPrimaryBps)) / 10_000n;
    const creatorShare = price - protocol;
    expect(stxOf(wallet1)).toBe(buyerBefore - price);
    expect(stxOf(deployer)).toBe(creatorBefore + creatorShare);
    expect(stxOf(contract)).toBe(treasuryBefore + protocol);

    const owner = simnet.callReadOnlyFn("atelier-29", "get-owner", [Cl.uint(piece.id)], deployer);
    expect(owner.result).toBeOk(Cl.some(Cl.standardPrincipal(wallet1)));

    const again = simnet.callPublicFn("atelier-29", "mint", [Cl.uint(piece.id)], wallet2);
    expect(again.result).toBeErr(Cl.uint(103));
  });

  it("tracks the highest minted id", () => {
    simnet.callPublicFn("atelier-29", "mint", [Cl.uint(5)], wallet1);
    simnet.callPublicFn("atelier-29", "mint", [Cl.uint(2)], wallet1);
    const last = simnet.callReadOnlyFn("atelier-29", "get-last-token-id", [], deployer);
    expect(last.result).toBeOk(Cl.uint(5));
    const count = simnet.callReadOnlyFn("atelier-29", "get-minted-count", [], deployer);
    expect(count.result).toBeOk(Cl.uint(2));
  });

  it("escrows a listing, blocks transfer, and returns the work on cancel", () => {
    simnet.callPublicFn("atelier-29", "mint", [Cl.uint(8)], wallet1);
    const listed = simnet.callPublicFn(
      "atelier-29",
      "list-work",
      [Cl.uint(8), Cl.uint(12_000_000)],
      wallet1,
    );
    expect(listed.result).toBeOk(Cl.bool(true));

    const owner = simnet.callReadOnlyFn("atelier-29", "get-owner", [Cl.uint(8)], deployer);
    expect(owner.result).toBeOk(Cl.some(Cl.contractPrincipal(deployer, "atelier-29")));

    const moved = simnet.callPublicFn(
      "atelier-29",
      "transfer",
      [Cl.uint(8), Cl.standardPrincipal(wallet1), Cl.standardPrincipal(wallet2)],
      wallet1,
    );
    expect(moved.result).toBeErr(Cl.uint(109));

    const stranger = simnet.callPublicFn("atelier-29", "cancel-listing", [Cl.uint(8)], wallet2);
    expect(stranger.result).toBeErr(Cl.uint(101));

    simnet.callPublicFn("atelier-29", "mint", [Cl.uint(9)], wallet2);
    const dust = simnet.callPublicFn(
      "atelier-29",
      "list-work",
      [Cl.uint(9), Cl.uint(1)],
      wallet2,
    );
    expect(dust.result).toBeErr(Cl.uint(105));

    const cancel = simnet.callPublicFn("atelier-29", "cancel-listing", [Cl.uint(8)], wallet1);
    expect(cancel.result).toBeOk(Cl.bool(true));
    const returned = simnet.callReadOnlyFn("atelier-29", "get-owner", [Cl.uint(8)], deployer);
    expect(returned.result).toBeOk(Cl.some(Cl.standardPrincipal(wallet1)));
  });

  it("pays royalty, protocol fee, and seller on a secondary sale", () => {
    const id = 12;
    simnet.callPublicFn("atelier-29", "mint", [Cl.uint(id)], wallet1);
    const ask = 10_000_000n;
    simnet.callPublicFn("atelier-29", "list-work", [Cl.uint(id), Cl.uint(ask)], wallet1);

    const creatorBefore = stxOf(deployer);
    const sellerBefore = stxOf(wallet1);
    const buyerBefore = stxOf(wallet2);
    const treasuryBefore = stxOf(contract);

    const self = simnet.callPublicFn("atelier-29", "buy", [Cl.uint(id)], wallet1);
    expect(self.result).toBeErr(Cl.uint(108));

    const bought = simnet.callPublicFn("atelier-29", "buy", [Cl.uint(id)], wallet2);
    expect(bought.result).toBeOk(Cl.bool(true));

    const royalty = (ask * BigInt(TOKENOMICS.royaltyBps)) / 10_000n;
    const fee = (ask * BigInt(TOKENOMICS.marketFeeBps)) / 10_000n;
    const payout = ask - royalty - fee;

    expect(stxOf(wallet2)).toBe(buyerBefore - ask);
    expect(stxOf(wallet1)).toBe(sellerBefore + payout);
    expect(stxOf(deployer)).toBe(creatorBefore + royalty);
    expect(stxOf(contract)).toBe(treasuryBefore + fee);

    const owner = simnet.callReadOnlyFn("atelier-29", "get-owner", [Cl.uint(id)], deployer);
    expect(owner.result).toBeOk(Cl.some(Cl.standardPrincipal(wallet2)));

    const listing = simnet.callReadOnlyFn("atelier-29", "get-listing", [Cl.uint(id)], deployer);
    expect(listing.result).toBeOk(Cl.none());
  });

  it("lets the new owner relist after a sale", () => {
    simnet.callPublicFn("atelier-29", "mint", [Cl.uint(20)], wallet1);
    simnet.callPublicFn("atelier-29", "list-work", [Cl.uint(20), Cl.uint(8_000_000)], wallet1);
    simnet.callPublicFn("atelier-29", "buy", [Cl.uint(20)], wallet2);
    const relist = simnet.callPublicFn(
      "atelier-29",
      "list-work",
      [Cl.uint(20), Cl.uint(9_500_000)],
      wallet2,
    );
    expect(relist.result).toBeOk(Cl.bool(true));
    const listing = simnet.callReadOnlyFn("atelier-29", "get-listing", [Cl.uint(20)], deployer);
    expect(listing.result).toBeOk(
      Cl.some(
        Cl.tuple({
          seller: Cl.standardPrincipal(wallet2),
          price: Cl.uint(9_500_000),
        }),
      ),
    );
  });

  it("lets only the creator withdraw protocol fees", () => {
    simnet.callPublicFn("atelier-29", "mint", [Cl.uint(29)], wallet1);
    const empty = simnet.callPublicFn("atelier-29", "withdraw-treasury", [], wallet1);
    expect(empty.result).toBeErr(Cl.uint(100));

    const treasury = stxOf(contract);
    expect(treasury).toBeGreaterThan(0n);
    const creatorBefore = stxOf(deployer);
    const withdrawn = simnet.callPublicFn("atelier-29", "withdraw-treasury", [], deployer);
    expect(withdrawn.result).toBeOk(Cl.uint(treasury));
    expect(stxOf(contract)).toBe(0n);
    expect(stxOf(deployer)).toBe(creatorBefore + treasury);

    const drained = simnet.callPublicFn("atelier-29", "withdraw-treasury", [], deployer);
    expect(drained.result).toBeErr(Cl.uint(110));
  });

  it("rejects listing and buying works that are not held", () => {
    const missing = simnet.callPublicFn(
      "atelier-29",
      "list-work",
      [Cl.uint(3), Cl.uint(2_000_000)],
      wallet1,
    );
    expect(missing.result).toBeErr(Cl.uint(104));
    const unlisted = simnet.callPublicFn("atelier-29", "buy", [Cl.uint(3)], wallet2);
    expect(unlisted.result).toBeErr(Cl.uint(107));
  });

  it("keeps metadata updates owner-only", () => {
    const denied = simnet.callPublicFn(
      "atelier-29",
      "set-base-uri",
      [Cl.stringAscii("https://example.com/{id}")],
      wallet1,
    );
    expect(denied.result).toBeErr(Cl.uint(100));

    const updated = simnet.callPublicFn(
      "atelier-29",
      "set-base-uri",
      [Cl.stringAscii("https://example.com/nft/{id}.json")],
      deployer,
    );
    expect(updated.result).toBeOk(
      Cl.tuple({
        notification: Cl.stringAscii("token-metadata-update"),
        payload: Cl.tuple({
          "token-class": Cl.stringAscii("nft"),
          "contract-id": Cl.contractPrincipal(deployer, "atelier-29"),
        }),
      }),
    );
  });
});
