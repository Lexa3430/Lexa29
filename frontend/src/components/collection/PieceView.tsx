"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { pieceById } from "@/collection/catalog";
import { bpsLabel, formatStx } from "@/collection/clarity";
import { useCollection } from "@/collection/useCollection";
import { ArtFrame } from "./ArtFrame";
import { TradeActions } from "./TradeActions";

export function PieceView() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const catalog = pieceById(id);
  const chain = useCollection();
  const live = chain.pieces?.find((piece) => piece.id === id) ?? null;

  if (!catalog) {
    return (
      <div className="page-wrap">
        <p className="quiet">This work is not part of LEXA 29.</p>
        <Link href="/">Back to the edition</Link>
      </div>
    );
  }

  const mintPrice = live?.mintPrice ?? BigInt(catalog.mintUstx);
  const uniqueness = live?.uniqueness ?? BigInt(catalog.uniqueness);
  const royalty = chain.tokenomics ? bpsLabel(chain.tokenomics.royaltyBps) : "5%";
  const fee = chain.tokenomics ? bpsLabel(chain.tokenomics.marketFeeBps) : "2.5%";

  return (
    <div className="page-wrap piece-layout">
      <ArtFrame id={catalog.id} label={catalog.name} />
      <div className="piece-copy">
        <Link className="section-kicker" href="/">
          LEXA 29
        </Link>
        <h1>{catalog.name}</h1>
        <p className={`tier tier-${catalog.tier}`}>{catalog.tier}</p>
        <dl className="facts">
          <div>
            <dt>Mint price</dt>
            <dd>{formatStx(mintPrice)} STX</dd>
          </div>
          <div>
            <dt>Uniqueness</dt>
            <dd>{String(uniqueness)}</dd>
          </div>
          <div>
            <dt>On resale</dt>
            <dd>
              {royalty} artist · {fee} market
            </dd>
          </div>
          <div>
            <dt>Ask</dt>
            <dd>{live?.listing ? `${formatStx(live.listing.price)} STX` : "Not listed"}</dd>
          </div>
        </dl>
        {chain.error ? <p className="tx-note tx-note-bad">{chain.error}</p> : null}
        <TradeActions catalog={catalog} chain={live} deployed={chain.deployed} onDone={chain.refresh} />
      </div>
    </div>
  );
}
