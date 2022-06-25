import tw from "tailwind-styled-components"
import { useAccount, useConnect, useNetwork } from "wagmi"
import { DialogModal } from "../components/common/Modal"
import RoundedButton from "../components/common/RoundedButton"
import { useRegisteredUser } from "../service/hook"
import { mvmChainId } from "../service/web3client"

const Row = tw.div`flex flex-row items-center justify-between gap-2`

export const ConnectModal = () => {
  const account = useAccount()

  const {
    connect,
    connectors: [connector],
    isConnected,
    status,
  } = useConnect()

  const { activeChain, switchNetwork } = useNetwork()
  const { data, isFetching, refetch } = useRegisteredUser()

  const isMvmChain = activeChain?.id === mvmChainId

  const isOpen = !account || !isConnected || !isMvmChain || !data

  return (
    <DialogModal isOpen={isOpen} containerClassName="gap-3 items-stretch">
      <div className="text-xl mb-4"> Connection steps</div>
      <Row>
        <div>connect:</div>
        <RoundedButton disabled={status === "connecting" || isConnected} onClick={() => connect(connector)}>
          {isConnected ? "connected" : "connect"}
        </RoundedButton>
      </Row>
      <Row>
        <div>registered:</div>
        <RoundedButton disabled={!!data || isFetching} onClick={() => refetch()}>
          {data ? "registered" : isFetching ? "registering" : "register"}
        </RoundedButton>
      </Row>
      <Row>
        <div>switch network:</div>
        <RoundedButton disabled={isMvmChain || !isConnected} onClick={() => switchNetwork?.(mvmChainId)}>
          {isMvmChain ? "success" : "switch"}
        </RoundedButton>
      </Row>
    </DialogModal>
  )
}

export default ConnectModal
