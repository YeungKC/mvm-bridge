import { Chain, configureChains, createClient, createStorage } from "wagmi"
import { InjectedConnector } from "wagmi/connectors/injected"
import { WalletConnectConnector } from "wagmi/connectors/walletConnect"
import { jsonRpcProvider } from "wagmi/providers/jsonRpc"

const chains: Chain[] = [
  {
    id: 73927,
    name: "Mixin Virtual Machine",
    blockExplorers: {
      default: {
        name: "Mixin Virtual Machine",
        url: "https://scan.mvm.dev",
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

const { provider } = configureChains(chains, [
  jsonRpcProvider({
    rpc: (chain) => ({ http: chain.rpcUrls.default }),
  }),
])

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
  provider: provider,
})

export default web3client
