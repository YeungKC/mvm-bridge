import { ExternalTransactionResponse } from '@mixin.dev/mixin-node-sdk'
import { DepositRequest } from '@mixin.dev/mixin-node-sdk/dist/client/types/external'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { QRCodeSVG } from 'qrcode.react'
import { memo, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useToggle } from 'react-use'

import RoundedItem from '../../components/RoundedItem'
import { DialogModal } from '../../components/common/Modal'
import RoundedButton from '../../components/common/RoundedButton'
import { Spinner } from '../../components/common/Spinner'
import {
  useAsset,
  useDeposits,
  useMvmBalance,
  useRegisteredUser,
} from '../../service/hook'
import TransferViaMixinUserDialogButton from './TransferViaMixinUserDialogButton'

export const Asset = memo(() => {
  const params = useParams()
  const assetId = params.assetId ?? ''

  const { data, isFetching } = useAsset(assetId)
  const { data: balance } = useMvmBalance(assetId)

  if (isFetching)
    return (
      <div className='container flex h-screen items-center justify-center'>
        <Spinner />
      </div>
    )
  return (
    <>
      <div className='container flex flex-col  items-center justify-center gap-4 p-4 pt-20'>
        <img alt='icon' src={data?.icon_url} width={64} height={64} />
        <div>
          {data?.symbol} ({data?.name})
        </div>

        <div className=' text-xl font-semibold'>
          {balance?.formatted} {data?.symbol}
        </div>

        <div className='flex flex-row gap-2'>
          <AddressDialogButton />
          <TransferViaMixinDialogButton />
          <TransferViaMixinUserDialogButton />
        </div>

        <Depositing />
      </div>
    </>
  )
})

const AddressDialogButton = memo(() => {
  const params = useParams()
  const assetId = params.assetId ?? ''

  const [opened, openedToggle] = useToggle(false)
  const { data } = useAsset(assetId)

  return (
    <>
      <RoundedButton onClick={openedToggle}>Mainnet address</RoundedButton>
      <DialogModal
        isOpen={opened}
        onDismiss={openedToggle}
        containerClassName='gap-2'
      >
        <div>Address</div>
        <span className=' text-slate-500'>{data?.destination}</span>
        <QRCodeSVG value={data?.destination ?? ''} size={256} />
      </DialogModal>
    </>
  )
})

const TransferViaMixinDialogButton = memo(() => {
  const [opened, openedToggle] = useToggle(false)

  const { data } = useRegisteredUser()

  const address = `mixin://transfer/${data?.user_id ?? ''}`

  return (
    <>
      <RoundedButton onClick={openedToggle}>
        Transfer via Mixin QrCode
      </RoundedButton>
      <DialogModal
        isOpen={opened}
        onDismiss={openedToggle}
        containerClassName='gap-2'
      >
        <div>Transfer via Mixin QrCode</div>
        <a href={address} className=' text-center text-slate-500 underline'>
          {address}
        </a>
        <QRCodeSVG value={address} size={256} />
      </DialogModal>
    </>
  )
})

const Depositing = memo(() => {
  const params = useParams()
  const assetId = params.assetId ?? ''
  const { data } = useAsset(assetId)
  const { data: deposits = [] } = useDeposits(
    {
      asset: assetId,
      destination: data?.destination,
      tag: data?.tag,
    } as unknown as DepositRequest,
    {
      enable: !!assetId && !!data?.destination,
    },
  )

  return (
    <>
      <div className='self-stretch'>Depositing</div>
      <div className='self-stretch'>
        {deposits.map((e) => (
          <DepositItem key={e.transaction_id} data={e} />
        ))}
        {deposits.length === 0 && (
          <div className='text-center'>No deposits</div>
        )}
      </div>
    </>
  )
})

const DepositItem = memo(
  ({
    data,
  }: {
    data: Omit<ExternalTransactionResponse, 'created_at'> & {
      created_at: string
    }
  }) => {
    const params = useParams()
    const assetId = params.assetId ?? ''
    const { data: asset } = useAsset(assetId)

    const fromNow = useMemo(() => {
      dayjs.extend(relativeTime)
      return dayjs(data.created_at).fromNow()
    }, [data.created_at])

    return (
      <RoundedItem className='justify-between'>
        <div className='font-semibold'>
          {data.amount} {asset?.symbol}
        </div>
        <div className='flex flex-col items-end text-sm text-slate-500 '>
          <div>
            {data.confirmations}/{data.threshold} confirmations
          </div>
          <div>{fromNow}</div>
        </div>
      </RoundedItem>
    )
  },
)

export default Asset
