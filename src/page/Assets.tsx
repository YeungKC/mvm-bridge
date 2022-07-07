import { AssetResponse } from '@mixin.dev/mixin-node-sdk'
import { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'

import RoundedItem from '../components/RoundedItem'
import { WHITELIST } from '../constant'
import { useTopAssets, useMvmBalance } from '../service/hook'

export const Assets = memo(() => {
  const { data } = useTopAssets()
  const filetedList = useMemo(
    () => data?.filter(({ asset_id }) => WHITELIST.includes(asset_id)),
    [data],
  )

  return (
    <div className='container flex flex-col items-stretch gap-2 p-4 py-20'>
      <div>
        <RoundedItem $as={Link} to={`/all-depositing`} className=' font-bold'>
          All Depositing
        </RoundedItem>
      </div>
      <div className=' text-lg font-bold'>Assets</div>
      <div>
        {filetedList?.map((e) => (
          <AssetItem key={e.asset_id} asset={e} />
        ))}
      </div>
    </div>
  )
})

const AssetItem = memo(({ asset }: { asset: AssetResponse }) => {
  const { data } = useMvmBalance(asset.asset_id)

  return (
    <RoundedItem $as={Link} to={`/asset/${asset.asset_id}`}>
      <img alt='icon' src={asset.icon_url} width={38} height={38} />
      <div className='grow font-bold'>{asset.symbol}</div>
      {data && (
        <div className='font-semibold'>
          {data.formatted} {asset.symbol}
        </div>
      )}
    </RoundedItem>
  )
})

export default Assets
