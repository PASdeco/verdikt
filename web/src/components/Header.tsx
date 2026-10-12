"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useWallet } from "./WalletProvider";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="Verdikt home" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.svg" alt="" width={30} height={30} style={{ color: "var(--ink)" }} />
      {!compact && (
        <span className="font-display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Verdikt<span style={{ color: "var(--accent)" }}>.</span>
        </span>
      )}
    </Link>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<string>("dark");
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "dark");
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("verdikt-theme", next); } catch {}
    setTheme(next);
  }
  return (
    <button onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} className="btn btn-ghost" style={{ padding: "10px 12px" }}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function Header() {
  const { address, walletName, chainOk, openModal, disconnect, switchToStudioNet } = useWallet();
  const [open, setOpen] = useState(false);
  return (
    <header style={{ maxWidth: 1280, margin: "0 auto", padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", fontSize: 14, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase" }}>
      <nav style={{ display: "flex", gap: 28 }} aria-label="Primary" className="hidden md:flex">
        <Link href="/contests">Board</Link>
        <Link href="/how-it-works">Rubric</Link>
        <Link href="/how-it-works#roles">Roles</Link>
      </nav>
      <button className="md:hidden btn btn-ghost" aria-label="Open menu" onClick={() => setOpen(!open)}>{open ? <X size={18}/> : <Menu size={18}/>}</button>
      <Logo />
      <div style={{ display: "flex", gap: 10, alignItems: "center", textTransform: "none", letterSpacing: 0 }}>
        <ThemeToggle />
        {address ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="font-mono2" title={walletName ?? undefined} style={{ fontSize: 12 }}>
              {walletName ? `${walletName} · ` : ""}{address.slice(0, 6)}…{address.slice(-4)}
            </span>
            {!chainOk && (
              <button className="btn btn-accent" onClick={() => void switchToStudioNet()} style={{ textTransform: "uppercase" }}>
                Switch to StudioNet
              </button>
            )}
            <button className="btn btn-ghost" onClick={disconnect}>Disconnect</button>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={openModal}>Connect wallet</button>
        )}
      </div>
      {open && (
        <nav style={{ display: "flex", gap: 16, width: "100%" }} aria-label="Mobile">
          <Link href="/contests">Board</Link>
          <Link href="/how-it-works">Rubric</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      )}
    </header>
  );
}
