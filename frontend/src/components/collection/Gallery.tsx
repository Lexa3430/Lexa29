"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PIECES, type Tier } from "@/collection/catalog";
import { formatStx } from "@/collection/clarity";
import { useCollection } from "@/collection/useCollection";
import { ArtFrame } from "./ArtFrame";
import { TokenomicsPanel } from "./TokenomicsPanel";

const FILTERS: Array<Tier | "all"> = ["all", "legendary", "epic", "rare", "uncommon", "common"];

export function Gallery() {
  const chain = useCollection();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const byId = useMemo(() => new Map((chain.pieces ?? []).map((piece) => [piece.id, piece])), [chain.pieces]);
  const visible = PIECES.filter((piece) => filter === "all" || piece.tier === filter);

  return (
    <div className="page-wrap">
      <section className="hero">
        <p className="section-kicker">Sealed edition</p>
        <h1>LEXA 29</h1>
        <p className="lede">
          Twenty-nine unique works, sealed in the app and minted once. Price follows uniqueness, from 10 to 20 STX.
          Owners can relist any piece on the collection market.
        </p>
        <div className="hero-row">
          <Link className="btn btn-gold" href="/market">
            Open market
          </Link>
          <a className="btn btn-ghost" href="#tokenomics">
            Tokenomics
          </a>
        </div>
        {!chain.deployed ? (
          <p className="quiet">The artwork is open here. Minting starts once the contract is on testnet.</p>
        ) : null}
        {chain.error ? <p className="tx-note tx-note-bad">{chain.error}</p> : null}
      </section>

      <div className="filters" role="tablist" aria-label="Filter by tier">
        {FILTERS.map((tier) => (
          <button
            key={tier}
            className={tier === filter ? "chip chip-on" : "chip"}
            onClick={() => setFilter(tier)}
            type="button"
          >
            {tier}
          </button>
        ))}
      </div>

      <section className="grid-works">
        {visible.map((piece) => {
          const live = byId.get(piece.id);
          const listed = live?.listing;
          const price = listed?.price ?? live?.mintPrice ?? BigInt(piece.mintUstx);
          const status = listed ? "Listed" : live?.owner ? "Minted" : "Available";
          return (
            <Link key={piece.id} href={`/piece/${piece.id}`} className="work-card">
              <ArtFrame id={piece.id} label={piece.name} />
              <div className="work-meta">
                <div className="work-topline">
                  <span>{String(piece.id).padStart(2, "0")}</span>
                  <span className={`tier tier-${piece.tier}`}>{piece.tier}</span>
                </div>
                <h2>{piece.name}</h2>
                <p>
                  {formatStx(price)} STX
                  <span>{status}</span>
                </p>
                <small>Uniqueness {live ? String(live.uniqueness) : piece.uniqueness}</small>
              </div>
            </Link>
          );
        })}
      </section>

      <TokenomicsPanel
        terms={chain.tokenomics}
        creator={chain.creator}
        treasury={chain.treasury}
        contractId={chain.contractId}
        onDone={chain.refresh}
      />
    </div>
  );
}
