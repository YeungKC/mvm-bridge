import { memo, useCallback } from 'react'
import tw from 'tailwind-styled-components'
import { useAccount, useConnect, useNetwork, useSwitchNetwork } from 'wagmi'

import { DialogModal } from '../components/common/Modal'
import RoundedButton from '../components/common/RoundedButton'
import { useRegisteredUser } from '../service/hook'
import { mvmChainId } from '../service/web3client'

const Row = tw.div`flex flex-row items-center justify-between gap-2`

export const ConnectModal = memo(() => {
  const { address, status, isConnected } = useAccount()

  const {
    connect,
    connectors: [connector],
  } = useConnect()

  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const { data, isFetching, isError, refetch } = useRegisteredUser()

  const isMvmChain = chain?.id === mvmChainId

  const isOpen = !address || !isConnected || !isMvmChain || !data

  const connectCallback = useCallback(
    () => connect({ connector }),
    [connect, connector],
  )
  const register = useCallback(() => refetch(), [refetch])
  const switchMVM = useCallback(
    () => switchNetwork?.(mvmChainId),
    [switchNetwork],
  )
  return (
    <DialogModal isOpen={isOpen} containerClassName='gap-3 items-stretch'>
      <div className='mb-4 text-xl'> Connection steps</div>
      <Row>
        <div>connect:</div>
        <RoundedButton
          disabled={status === 'connecting' || isConnected}
          onClick={connectCallback}
        >
          {isConnected ? 'connected' : 'connect'}
        </RoundedButton>
      </Row>
      <Row>
        <div>registered:</div>
        <RoundedButton disabled={isFetching || !isError} onClick={register}>
          {data ? 'registered' : isFetching ? 'registering' : 'register'}
        </RoundedButton>
      </Row>
      <Row>
        <div>switch network:</div>{' '}
        <RoundedButton
          disabled={isMvmChain || !isConnected}
          onClick={switchMVM}
        >
          {isMvmChain ? 'success' : 'switch'}
        </RoundedButton>
      </Row>
    </DialogModal>
  )
})

export default ConnectModal
