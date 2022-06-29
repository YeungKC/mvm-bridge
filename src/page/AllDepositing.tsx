import { ExternalTransactionResponse } from '@mixin.dev/mixin-node-sdk'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { memo, useMemo } from 'react'

import RoundedItem from '../components/RoundedItem'
import { useAllDeposits, useAsset } from '../service/hook'

export const AllDepositing = memo(() => {
  const deposits = useAllDeposits()

  return (
    <div className=' container gap-4 p-4'>
      <div className='text-lg font-bold'>All Depositing</div>

      {deposits.length === 0 && <div className='text-center'>No deposits</div>}
      {!!deposits.length && (
        <div>
          {deposits.map((e) => (
            <Item key={e.transaction_id} data={e} />
          ))}
        </div>
      )}
    </div>
  )
})

const Item = memo(({ data }: { data: ExternalTransactionResponse }) => {
  const { data: asset } = useAsset(data.asset_id)

  const fromNow = useMemo(() => {
    dayjs.extend(relativeTime)
    return dayjs(data.created_at).fromNow()
  }, [data.created_at])

  return (
    <RoundedItem className='justify-between'>
      <div className=' flex flex-row items-center justify-center gap-3'>
        <img alt='icon' src={asset?.icon_url} width={38} height={38} />
        <div className='font-semibold'>
          {data.amount} {asset?.symbol}
        </div>
      </div>
      <div className='flex flex-col items-end text-sm text-slate-500 '>
        <div>
          {data.confirmations}/{data.threshold} confirmations
        </div>
        <div>{fromNow}</div>
      </div>
    </RoundedItem>
  )
})

export default AllDepositing
