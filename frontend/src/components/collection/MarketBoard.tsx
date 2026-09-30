"use client";

import Link from "next/link";
import { pieceById } from "@/collection/catalog";
import { formatStx } from "@/collection/clarity";
import { useCollection } from "@/collection/useCollection";
import { ArtFrame } from "./ArtFrame";
import { TradeActions } from "./TradeActions";

export function MarketBoard() {
  const chain = useCollection();
  const listings = (chain.pieces ?? []).filter((piece) => piece.listing);

  return (
    <div className="page-wrap">
      <section className="hero hero-compact">
        <p className="section-kicker">Marketplace</p>
        <h1>Relist the edition</h1>
        <p className="lede">
          A sale pays 5% to the artist, 2.5% to the protocol, and the remainder to the seller. The NFT sits in escrow
          until it sells or the seller cancels.
        </p>
        {chain.error ? <p className="tx-note tx-note-bad">{chain.error}</p> : null}
      </section>

      {!chain.deployed ? <p className="quiet">The market reads listings from the testnet contract.</p> : null}
      {chain.deployed && chain.loading && !chain.pieces ? <p className="quiet">Reading listings…</p> : null}
      {chain.deployed && chain.pieces && listings.length === 0 ? (
        <p className="empty-market">Nothing is listed. Mint a work, then set a price of at least 1 STX.</p>
      ) : null}

      <section className="market-list">
        {listings.map((live) => {
          const catalog = pieceById(live.id);
          if (!catalog || !live.listing) return null;
          return (
            <article key={live.id} className="market-row">
              <Link href={`/piece/${live.id}`} className="market-art">
                <ArtFrame id={live.id} label={catalog.name} />
              </Link>
              <div>
                <p className="section-kicker">{catalog.tier}</p>
                <h2>{catalog.name}</h2>
                <p className="ask">{formatStx(live.listing.price)} STX</p>
                <p className="quiet">
                  Seller <span className="contract-id">{live.listing.seller}</span>
                </p>
                <TradeActions catalog={catalog} chain={live} deployed={chain.deployed} onDone={chain.refresh} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
