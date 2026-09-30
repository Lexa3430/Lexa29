type TxLike = {
  loading: boolean;
  error: Error | null;
  txStatus: string | null;
  txStatusError: string | null;
  explorerUrl: string | null;
};

export function TxNote({ tx }: { tx: TxLike }) {
  if (tx.loading) return <p className="tx-note">Waiting for your wallet…</p>;
  if (tx.error) return <p className="tx-note tx-note-bad">{tx.error.message}</p>;
  if (tx.txStatus === "pending") return <p className="tx-note">Broadcast. Waiting for the chain.</p>;
  if (tx.txStatus === "success") {
    return (
      <p className="tx-note tx-note-ok">
        Confirmed.{" "}
        {tx.explorerUrl ? (
          <a href={tx.explorerUrl} target="_blank" rel="noreferrer">
            View transaction
          </a>
        ) : null}
      </p>
    );
  }
  if (tx.txStatusError) return <p className="tx-note tx-note-bad">{tx.txStatusError}</p>;
  if (tx.txStatus) return <p className="tx-note">{tx.txStatus}</p>;
  return null;
}
