"use client";

import { useCallback, useEffect, useState } from "react";
import { Cl } from "@stacks/transactions";
import {
  atelier29_getCreator,
  atelier29_getPiece,
  atelier29_getTokenomics,
  atelier29_getTreasuryBalance,
} from "@/generated/contracts";
import deployments from "@/generated/deployments.json";
import { PIECES } from "@/collection/catalog";
import {
  clarityPrincipal,
  clarityUint,
  parsePiece,
  parseTokenomics,
  type ChainPiece,
  type ChainTokenomics,
} from "@/collection/clarity";

type DeploymentFile = {
  contracts?: Record<string, { contract_id?: string }>;
};

export const ATELIER_CONTRACT_ID =
  (deployments as DeploymentFile).contracts?.["atelier-29"]?.contract_id ?? "";

export function useCollection() {
  const [pieces, setPieces] = useState<ChainPiece[] | null>(null);
  const [tokenomics, setTokenomics] = useState<ChainTokenomics | null>(null);
  const [creator, setCreator] = useState<string | null>(null);
  const [treasury, setTreasury] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ATELIER_CONTRACT_ID) {
      setPieces(null);
      setTokenomics(null);
      setCreator(null);
      setTreasury(null);
      setError(null);
      return;
    }

    const sender = ATELIER_CONTRACT_ID.split(".")[0];
    setLoading(true);
    try {
      const [rows, terms, creatorRaw, treasuryRaw] = await Promise.all([
        Promise.all(
          PIECES.map(async (piece) =>
            parsePiece(piece.id, await atelier29_getPiece([Cl.uint(piece.id)], sender)),
          ),
        ),
        atelier29_getTokenomics([], sender).then(parseTokenomics),
        atelier29_getCreator([], sender),
        atelier29_getTreasuryBalance([], sender),
      ]);
      setPieces(rows);
      setTokenomics(terms);
      setCreator(clarityPrincipal(creatorRaw));
      setTreasury(clarityUint(treasuryRaw));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The collection could not be read");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    pieces,
    tokenomics,
    creator,
    treasury,
    loading,
    error,
    refresh,
    deployed: Boolean(ATELIER_CONTRACT_ID),
    contractId: ATELIER_CONTRACT_ID,
  };
}

export type CollectionState = ReturnType<typeof useCollection>;
