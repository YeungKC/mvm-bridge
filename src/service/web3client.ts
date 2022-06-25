import { Chain, createClient, createStorage } from "wagmi"
import { InjectedConnector } from "wagmi/connectors/injected"
import { WalletConnectConnector } from "wagmi/connectors/walletConnect"

const chains: Chain[] = [
  {
    id: 73927,
    name: "Mixin Virtual Machine",
    blockExplorers: {
      default: {
        name: "Mixin Virtual Machine",
        url: "https://scan.mvm.dev/",
      },
    },
    rpcUrls: {
      default: "https://geth.mvm.dev",
    },
    network: "Mixin Virtual Machine",
    nativeCurrency: {
      name: "Mixin",
      symbol: "XIN",
      decimals: 18,
    },
  },
]

export const mvmChainId = chains[0].id

const web3client = createClient({
  autoConnect: true,
  storage: createStorage({ storage: window.localStorage }),
  connectors: [
    new InjectedConnector({ chains: chains }),
    new WalletConnectConnector({
      chains: chains,
      options: {
        qrcode: true,
      },
    }),
  ],
})

export default web3client
