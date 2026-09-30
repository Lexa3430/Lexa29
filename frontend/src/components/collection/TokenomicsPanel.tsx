"use client";

import { useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { useAtelier29_WithdrawTreasury } from "@/generated/hooks";
import { TOKENOMICS } from "@/collection/catalog";
import { bpsLabel, formatStx, type ChainTokenomics } from "@/collection/clarity";
import { addressAtom } from "@/store/wallet";
import { TxNote } from "./TxNote";

export function TokenomicsPanel({
  terms,
  creator,
  treasury,
  contractId,
  onDone,
}: {
  terms: ChainTokenomics | null;
  creator: string | null;
  treasury: bigint | null;
  contractId: string;
  onDone: () => void;
}) {
  const address = useAtomValue(addressAtom);
  const withdraw = useAtelier29_WithdrawTreasury();
  const seen = useRef<string | null>(null);
  const creatorShare = terms ? bpsLabel(terms.creatorPrimaryBps) : `${TOKENOMICS.creatorPrimaryBps / 100}%`;
  const protocolShare = terms ? bpsLabel(terms.protocolPrimaryBps) : `${TOKENOMICS.protocolPrimaryBps / 100}%`;
  const royalty = terms ? bpsLabel(terms.royaltyBps) : "5%";
  const fee = terms ? bpsLabel(terms.marketFeeBps) : "2.5%";
  const canWithdraw = Boolean(address && creator && address === creator && treasury && treasury > 0n);

  useEffect(() => {
    if (withdraw.txStatus === "success" && withdraw.txid && seen.current !== withdraw.txid) {
      seen.current = withdraw.txid;
      onDone();
    }
  }, [onDone, withdraw.txStatus, withdraw.txid]);

  return (
    <section className="panel" id="tokenomics">
      <div className="section-kicker">Tokenomics</div>
      <h2>How value moves</h2>
      <div className="stat-grid">
        <article>
          <span>Primary mint</span>
          <strong>{creatorShare} artist</strong>
          <p>{protocolShare} stays in the protocol treasury. Price is fixed by uniqueness, from 10 to 20 STX.</p>
        </article>
        <article>
          <span>Secondary sale</span>
          <strong>{royalty} royalty</strong>
          <p>{fee} marketplace fee. The seller receives the rest. Listings escrow the NFT in the contract.</p>
        </article>
        <article>
          <span>Supply</span>
          <strong>{terms ? `${terms.minted}/${terms.collectionSize}` : "0/29"}</strong>
          <p>One mint per work. Nothing can be minted twice, and the artist cannot seize a sold piece.</p>
        </article>
        <article>
          <span>Treasury</span>
          <strong>{treasury === null ? "—" : `${formatStx(treasury)} STX`}</strong>
          <p>
            Artist
            {creator ? <span className="contract-id">{creator}</span> : " address appears after deployment."}
          </p>
        </article>
      </div>
      {contractId ? <p className="quiet contract-id">{contractId}</p> : null}
      {canWithdraw ? (
        <button
          className="btn btn-ghost"
          disabled={withdraw.loading}
          onClick={() => {
            void withdraw.call([]).catch(() => undefined);
          }}
        >
          Withdraw treasury
        </button>
      ) : null}
      <TxNote tx={withdraw} />
    </section>
  );
}
