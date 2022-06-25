import { ExternalTransactionResponse } from "@mixin.dev/mixin-node-sdk"
import RoundedItem from "../components/RoundedItem"
import { useAllDeposits, useAsset } from "../service/hook"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useMemo } from "react"

export const AllDepositing = () => {
  const deposits = useAllDeposits()

  return (
    <div className=" container p-4 gap-4">
      <div className="text-lg font-bold">All Depositing</div>

      {deposits.length === 0 && <div className="text-center">No deposits</div>}
      {!!deposits.length && (
        <div>
          {deposits.map((e) => (
            <Item data={e} />
          ))}
        </div>
      )}
    </div>
  )
}

const Item = ({ data }: { data: ExternalTransactionResponse }) => {
  const { data: asset } = useAsset(data.asset_id)

  const fromNow = useMemo(() => {
    dayjs.extend(relativeTime)
    return dayjs(data.created_at).fromNow()
  }, [data.created_at])

  return (
    <RoundedItem className="justify-between">
      <div className=" flex flex-row gap-3 items-center justify-center">
        <img alt="icon" src={asset?.icon_url} width={38} height={38} />
        <div className="font-semibold">
          {data.amount} {asset?.symbol}
        </div>
      </div>
      <div className="flex flex-col items-end text-sm text-slate-500 ">
        <div>
          {data.confirmations}/{data.threshold} confirmations
        </div>
        <div>{fromNow}</div>
      </div>
    </RoundedItem>
  )
}

export default AllDepositing
