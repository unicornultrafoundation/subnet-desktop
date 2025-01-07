import { defineChain } from "viem";
import { http, createConfig, Config } from "wagmi";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { walletConnect } from "wagmi/connectors";

export const testnetChain = defineChain({
  id: 2484,
  name: "U2U testnet",
  nativeCurrency: { name: "U2U", symbol: "U2U", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-nebulas-testnet.uniultra.xyz"] },
  },
  blockExplorers: {
    default: { name: "U2U Explorer", url: "https://testnet.u2uscan.xyz/" },
  },
});

export const mainnetChain = defineChain({
  id: 39,
  name: "U2U mainnet",
  nativeCurrency: { name: "U2U", symbol: "U2U", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-mainnet.u2u.xyz"] },
  },
  blockExplorers: {
    default: { name: "U2U Explorer", url: "https://u2uscan.xyz/" },
  },
});

export const wagmiConfig: Config = createConfig({
  // chains: [mainnet, sepolia],
  chains: [
    mainnetChain,
    // testnetChain
  ],
  connectors: [
    // injected(),
    // metaMask(),
    // coinbaseWallet({ appName: 'Create Wagmi' }),
    walletConnect({ projectId: 'f6969fb129c0b74c32a8767fd8b9dfac' }),
  ],
  transports: {
    // [testnetChain.id]: http(),
    [mainnetChain.id]: http(),
    // [sepolia.id]: http(),
  },
});

createWeb3Modal({
  metadata: {
    name: "U2U Subnet DePIN",
    description: "U2U Subnet DePIN dashboard",
    url: "http://localhost:5173", // origin must match your domain & subdomain
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  },
  wagmiConfig: wagmiConfig,
  // projectId: import.meta.env.VITE_WC_PROJECT_ID,
  projectId: 'f6969fb129c0b74c32a8767fd8b9dfac',
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
