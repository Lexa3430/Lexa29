"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";
import NetworkBadge from "./NetworkBadge";

function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="site-header" ref={headerRef}>
      <Link href="/" className="brand" onClick={close}>
        <strong>LEXA</strong>
        <span>29</span>
      </Link>
      <button
        className="nav-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span className={open ? "nav-toggle-bars is-open" : "nav-toggle-bars"} aria-hidden="true" />
      </button>
      <nav id="site-nav" className={open ? "nav-links is-open" : "nav-links"}>
        <Link href="/market" onClick={close}>
          Market
        </Link>
        <a href="/#tokenomics" onClick={close}>
          Tokenomics
        </a>
        <NetworkBadge />
        <WalletConnect />
      </nav>
    </header>
  );
}

export default Header;
