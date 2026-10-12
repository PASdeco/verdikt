"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Wallet as WalletIcon, X } from "lucide-react";
import { legacyInjected, startDiscovery, subscribeWallets, type DiscoveredWallet } from "@/lib/wallets";

const STUDIONET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || 61999);
const STUDIONET_RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC || "https://studio.genlayer.com/api";
const STUDIONET_EXPLORER = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER || "https://explorer-studio.genlayer.com";

interface WalletCtx {
  address: string | null;
  provider: EthereumProvider | null;
  walletName: string | null;
  wallets: DiscoveredWallet[];
  chainOk: boolean;
  connecting: boolean;
  modalOpen: boolean;
  error: string | null;
  openModal: () => void;
  closeModal: () => void;
  selectWallet: (rdns: string | null) => Promise<void>;
  disconnect: () => void;
  switchToStudioNet: () => Promise<void>;
}

const Ctx = createContext<WalletCtx | null>(null);

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider.");
  return ctx;
}

function firstAddress(value: unknown): string | null {
  if (!Array.isArray(value) || typeof value[0] !== "string") return null;
  return value[0];
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<EthereumProvider | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [chainOk, setChainOk] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discover EIP-6963 wallets (Rabby, Zerion, MetaMask, …).
  useEffect(() => {
    startDiscovery();
    const unsub = subscribeWallets(setWallets);
    const t = setTimeout(() => startDiscovery(), 800);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);

  const checkChain = useCallback(async (p: EthereumProvider) => {
    try {
      const id = (await p.request({ method: "eth_chainId" })) as string;
      setChainOk(parseInt(id, 16) === STUDIONET_CHAIN_ID);
    } catch {
      setChainOk(false);
    }
  }, []);

  // Restore last-used wallet silently (no popup: eth_accounts only).
  useEffect(() => {
    try {
      const last = localStorage.getItem("verdikt-wallet-rdns");
      if (!last) return;
      const pick = async () => {
        const match = wallets.find((w) => w.rdns === last);
        const p = match?.provider ?? (last === "injected" ? legacyInjected() : null);
        if (!p) return;
        try {
          const accs = await p.request({ method: "eth_accounts" });
          const addr = firstAddress(accs);
          if (addr) {
            setProvider(p);
            setAddress(addr);
            setWalletName(match?.name ?? "Wallet");
            void checkChain(p);
          }
        } catch {}
      };
      void pick();
    } catch {}
  }, [wallets, checkChain]);

  // Follow account + chain changes on the active provider.
  useEffect(() => {
    if (!provider) return;
    const onAcc = (...args: unknown[]) => {
      const addr = firstAddress(args[0]);
      setAddress(addr);
      if (!addr) {
        setProvider(null);
        setWalletName(null);
      }
    };
    const onChain = (...args: unknown[]) => {
      const id = args[0] as string;
      setChainOk(parseInt(id, 16) === STUDIONET_CHAIN_ID);
    };
    provider.on?.("accountsChanged", onAcc);
    provider.on?.("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAcc);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [provider]);

  const selectWallet = useCallback(async (rdns: string | null) => {
    setError(null);
    setConnecting(true);
    try {
      const match = rdns ? wallets.find((w) => w.rdns === rdns) : null;
      const p = match?.provider ?? legacyInjected();
      if (!p) {
        setError("No wallet found. Install Rabby, Zerion, or MetaMask to continue.");
        if (!match) window.open("https://ethereum.org/en/wallets/find-wallet/", "_blank", "noopener,noreferrer");
        return;
      }
      const accs = await p.request({ method: "eth_requestAccounts" });
      const addr = firstAddress(accs);
      if (!addr) throw new Error("The wallet did not return an account.");
      setProvider(p);
      setAddress(addr);
      setWalletName(match?.name ?? "Injected wallet");
      try { localStorage.setItem("verdikt-wallet-rdns", match?.rdns ?? "injected"); } catch {}
      await checkChain(p);
      setModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connection failed.";
      setError(/rejected|denied|cancelled/i.test(msg) ? "Connection rejected in wallet." : msg);
    } finally {
      setConnecting(false);
    }
  }, [wallets, checkChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setWalletName(null);
    try { localStorage.removeItem("verdikt-wallet-rdns"); } catch {}
  }, []);

  const switchToStudioNet = useCallback(async () => {
    const p = provider ?? legacyInjected();
    if (!p) {
      setError("Connect a wallet first.");
      return;
    }
    const hexId = "0x" + STUDIONET_CHAIN_ID.toString(16);
    try {
      await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
      setChainOk(true);
    } catch (e: unknown) {
      const code = (e as { code?: number })?.code;
      if (code === 4902) {
        try {
          await p.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: hexId,
              chainName: "GenLayer StudioNet",
              rpcUrls: [STUDIONET_RPC],
              nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
              blockExplorerUrls: [STUDIONET_EXPLORER],
            }],
          });
          setChainOk(true);
        } catch {
          setError("Could not add StudioNet to the wallet.");
        }
      } else {
        setError("Please switch to StudioNet in the wallet.");
      }
    }
  }, [provider]);

  const value = useMemo(() => ({
    address, provider, walletName, wallets, chainOk, connecting, modalOpen, error,
    openModal: () => { setError(null); setModalOpen(true); },
    closeModal: () => setModalOpen(false),
    selectWallet, disconnect, switchToStudioNet,
  }), [address, provider, walletName, wallets, chainOk, connecting, modalOpen, error, selectWallet, disconnect, switchToStudioNet]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {modalOpen && <WalletModal />}
    </Ctx.Provider>
  );
}

function WalletModal() {
  const { wallets, connecting, error, closeModal, selectWallet } = useWallet();
  const injected = legacyInjected();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      startDiscovery();
      setDismissed(true);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const showFallback = dismissed && wallets.length === 0;

  return (
    <div role="dialog" aria-modal="true" aria-label="Connect wallet" onClick={closeModal}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div className="card" onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, display: "flex", gap: 8, alignItems: "center" }}>
            <WalletIcon size={20} /> Connect wallet
          </h2>
          <button className="btn btn-ghost" aria-label="Close" onClick={closeModal} style={{ padding: "8px 10px" }}><X size={16} /></button>
        </div>
        <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: "0 0 16px" }}>
          Choose Rabby, Zerion, MetaMask or any EVM wallet. Browsing stays read-only until you sign.
        </p>
        <div style={{ display: "grid", gap: 8 }} role="list">
          {wallets.map((w) => (
            <button key={w.rdns || w.uuid} role="listitem" className="btn btn-ghost" disabled={connecting}
              onClick={() => void selectWallet(w.rdns)}
              style={{ justifyContent: "flex-start", gap: 12, textTransform: "none", letterSpacing: 0, fontSize: 15 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.icon} alt="" width={28} height={28} style={{ borderRadius: 6, background: "#fff" }} />
              {w.name}
            </button>
          ))}
          {showFallback && injected && (
            <button className="btn btn-ghost" disabled={connecting} onClick={() => void selectWallet(null)}
              style={{ justifyContent: "flex-start", gap: 12, textTransform: "none", letterSpacing: 0, fontSize: 15 }}>
              <WalletIcon size={24} /> Browser wallet
            </button>
          )}
          {showFallback && !injected && (
            <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>
              No wallet detected. Install{" "}
              <a href="https://rabby.io" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Rabby</a>,{" "}
              <a href="https://zerion.io" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Zerion</a> or{" "}
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>MetaMask</a>, then refresh.
            </p>
          )}
          {!dismissed && wallets.length === 0 && (
            <p style={{ fontSize: 14, color: "var(--ink-muted)" }} aria-live="polite">Looking for wallets…</p>
          )}
        </div>
        {connecting && <p style={{ fontSize: 13 }} aria-live="polite">Confirm in the wallet…</p>}
        {error && <p role="alert" style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>}
        <p className="font-mono2" style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 16 }}>
          StudioNet · chain 61999 · prototype, no real funds. Only the last-used wallet is remembered — never keys.
        </p>
      </div>
    </div>
  );
}
