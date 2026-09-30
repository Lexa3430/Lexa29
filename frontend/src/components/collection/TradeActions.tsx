"use client";

import { useEffect, useRef, useState } from "react";
import { Cl } from "@stacks/transactions";
import { useAtomValue } from "jotai";
import {
  useAtelier29_Buy,
  useAtelier29_CancelListing,
  useAtelier29_ListWork,
  useAtelier29_Mint,
} from "@/generated/hooks";
import { formatStx, parseStxInput, type ChainPiece } from "@/collection/clarity";
import { TOKENOMICS, type PieceCatalog } from "@/collection/catalog";
import { addressAtom, isMountedAtom } from "@/store/wallet";
import { TxNote } from "./TxNote";

function shortAddress(value: string) {
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}

export function TradeActions({
  catalog,
  chain,
  deployed,
  onDone,
}: {
  catalog: PieceCatalog;
  chain: ChainPiece | null;
  deployed: boolean;
  onDone: () => void;
}) {
  const address = useAtomValue(addressAtom);
  const mounted = useAtomValue(isMountedAtom);
  const mint = useAtelier29_Mint();
  const list = useAtelier29_ListWork();
  const cancel = useAtelier29_CancelListing();
  const buy = useAtelier29_Buy();
  const [ask, setAsk] = useState(formatStx(BigInt(catalog.mintUstx)));
  const [formError, setFormError] = useState<string | null>(null);
  const seen = useRef<string | null>(null);

  useEffect(() => {
    const confirmed = [mint, list, cancel, buy].find((hook) => hook.txStatus === "success" && hook.txid);
    if (confirmed?.txid && seen.current !== confirmed.txid) {
      seen.current = confirmed.txid;
      onDone();
    }
  }, [buy, cancel, list, mint, onDone]);

  if (!chain) {
    return (
      <p className="quiet">
        {deployed ? "Reading this work from testnet…" : "Minting starts once the contract is on testnet."}
      </p>
    );
  }

  const listing = chain.listing;
  const mine = Boolean(address && chain.owner === address);
  const selling = Boolean(address && listing?.seller === address);
  const busy = mint.loading || list.loading || cancel.loading || buy.loading;

  const mintWork = () => {
    void mint.call([Cl.uint(catalog.id)]).catch(() => undefined);
  };

  const buyWork = () => {
    void buy.call([Cl.uint(catalog.id)]).catch(() => undefined);
  };

  const cancelWork = () => {
    void cancel.call([Cl.uint(catalog.id)]).catch(() => undefined);
  };

  const listWork = () => {
    const price = parseStxInput(ask);
    if (price === null || price < BigInt(TOKENOMICS.minListUstx)) {
      setFormError("Enter a list price of at least 1 STX.");
      return;
    }
    setFormError(null);
    void list.call([Cl.uint(catalog.id), Cl.uint(price)]).catch(() => undefined);
  };

  return (
    <div className="trade">
      {!mounted || !address ? <p className="quiet">Connect a testnet wallet to mint, list, or buy.</p> : null}

      {!listing && !chain.owner ? (
        <button className="btn btn-gold" disabled={!address || busy} onClick={mintWork}>
          Mint for {formatStx(chain.mintPrice)} STX
        </button>
      ) : null}

      {listing && !selling ? (
        <button className="btn btn-gold" disabled={!address || busy} onClick={buyWork}>
          Buy for {formatStx(listing.price)} STX
        </button>
      ) : null}

      {selling ? (
        <button className="btn btn-ghost" disabled={busy} onClick={cancelWork}>
          Cancel listing
        </button>
      ) : null}

      {mine && !listing ? (
        <form
          className="list-form"
          onSubmit={(event) => {
            event.preventDefault();
            listWork();
          }}
        >
          <label htmlFor={`ask-${catalog.id}`}>List price in STX</label>
          <div className="list-row">
            <input
              id={`ask-${catalog.id}`}
              inputMode="decimal"
              value={ask}
              onChange={(event) => setAsk(event.target.value)}
            />
            <button className="btn btn-gold" disabled={busy} type="submit">
              List
            </button>
          </div>
        </form>
      ) : null}

      {chain.owner && !mine && !listing ? (
        <p className="quiet">Held by {shortAddress(chain.owner)}. It is not listed.</p>
      ) : null}
      {selling ? <p className="quiet">You listed this work. Cancel it to take it back, or wait for a buyer.</p> : null}

      {formError ? <p className="tx-note tx-note-bad">{formError}</p> : null}
      <TxNote tx={mint} />
      <TxNote tx={list} />
      <TxNote tx={cancel} />
      <TxNote tx={buy} />
    </div>
  );
}
