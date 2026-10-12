"use client";

/**
 * EIP-6963 multi-wallet discovery. Rabby, Zerion, MetaMask, Coinbase, OKX,
 * Rainbow and other EVM wallets announce themselves via
 * `eip6963:announceProvider`; we collect them so the user can pick.
 * Legacy single-injected wallets still work through `window.ethereum`.
 */

export interface DiscoveredWallet {
  rdns: string;
  name: string;
  icon: string;
  uuid: string;
  provider: EthereumProvider;
}

type Listener = (wallets: DiscoveredWallet[]) => void;

const found = new Map<string, DiscoveredWallet>();
const listeners = new Set<Listener>();
let listening = false;

function emit() {
  const list = [...found.values()];
  listeners.forEach((fn) => fn(list));
}

function onAnnounce(event: Event) {
  const detail = (event as EIP6963AnnounceEvent).detail;
  if (!detail?.info || !detail?.provider) return;
  const key = detail.info.rdns || detail.info.uuid;
  if (!found.has(key)) {
    found.set(key, {
      rdns: detail.info.rdns,
      name: detail.info.name,
      icon: detail.info.icon,
      uuid: detail.info.uuid,
      provider: detail.provider,
    });
    emit();
  }
}

export function startDiscovery(): () => void {
  if (typeof window === "undefined") return () => {};
  if (!listening) {
    listening = true;
    window.addEventListener("eip6963:announceProvider", onAnnounce);
  }
  // Ask wallets to announce (again — late loads re-announce).
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  return () => {};
}

export function subscribeWallets(fn: Listener): () => void {
  listeners.add(fn);
  fn([...found.values()]);
  return () => {
    listeners.delete(fn);
  };
}

export function legacyInjected(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}
