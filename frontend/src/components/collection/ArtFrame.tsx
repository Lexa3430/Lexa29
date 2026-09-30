"use client";

import { useEffect, useState } from "react";
import { revealArtwork } from "@/collection/reveal";

export function ArtFrame({ id, label }: { id: number; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setSvg(null);
    setFailed(false);
    revealArtwork(id)
      .then((markup) => {
        if (active) setSvg(markup);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="art-frame" aria-label={label}>
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null}
      {!svg && !failed ? <div className="art-frame-waiting">Opening the seal</div> : null}
      {failed ? <div className="art-frame-waiting">This seal could not be opened</div> : null}
    </div>
  );
}
