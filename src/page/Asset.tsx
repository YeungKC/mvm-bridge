import { useParams } from "react-router-dom"
import { Spinner } from "../components/common/Spinner"
import { useAsset, useDeposits } from "../service/hook"
import { DepositRequest, ExternalTransactionResponse } from "@mixin.dev/mixin-node-sdk/dist/client/types/external"
import dayjs from "dayjs"
import { useMemo } from "react"
import relativeTime from "dayjs/plugin/relativeTime"
import RoundedButton from "../components/common/RoundedButton"
import { DialogModal } from "../components/common/Modal"
import { useToggle } from "react-use"
import { QRCodeSVG } from "qrcode.react"

export const Asset = () => {
  const params = useParams()
  const assetId = params["assetId"]!

  const { data, isFetching } = useAsset(assetId)

  const [addressDialogOpened, addressDialogOpenedToggle] = useToggle(false)

  if (isFetching)
    return (
      <div className="container flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  return (
    <>
      <div className=" container flex flex-col justify-center items-center gap-4 p-6 pt-20">
        <img alt="icon" src={data?.icon_url} width={64} height={64} />
        <div>
          {data?.symbol} ({data?.name})
        </div>

        <RoundedButton onClick={addressDialogOpenedToggle}>Address</RoundedButton>

        <Depositing />
      </div>
      <AddressDialog isOpen={addressDialogOpened} onDismiss={addressDialogOpenedToggle} />
    </>
  )
}

const AddressDialog = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const params = useParams()
  const assetId = params["assetId"]!
  const { data } = useAsset(assetId)

  return (
    <DialogModal isOpen={isOpen} onDismiss={() => onDismiss()} containerClassName="gap-2">
      <div>Transfer</div>
      <span className=" text-slate-500">{data?.destination}</span>
      <QRCodeSVG value={data?.destination ?? ""} size={256} />
    </DialogModal>
  )
}

const Depositing = () => {
  const params = useParams()
  const assetId = params["assetId"]!
  const { data } = useAsset(assetId)
  const { data: deposits } = useDeposits(
    {
      asset: assetId,
      destination: data?.destination,
    } as unknown as DepositRequest,
    {
      enable: !!assetId && !!data?.destination,
    }
  )

  return (
    <>
      <div className="self-stretch">Depositing</div>
      <div className="self-stretch">
        {deposits.map((e) => (
          <DepositItem data={e} />
        ))}
        {deposits.length === 0 && <div className="text-center">No deposits</div>}
      </div>
    </>
  )
}

const DepositItem = ({ data }: { data: ExternalTransactionResponse }) => {
  const params = useParams()
  const assetId = params["assetId"]!
  const { data: asset } = useAsset(assetId)

  const fromNow = useMemo(() => {
    dayjs.extend(relativeTime)
    return dayjs(data.created_at).fromNow()
  }, [data.created_at])

  return (
    <div className="flex flex-row gap-2 items-center justify-between bg-white p-4 first:rounded-t-2xl last:rounded-2xl">
      <div>
        {data.amount} {asset?.symbol}
      </div>
      <div className="flex flex-col items-end ">
        <div>
          {data.confirmations}/{data.threshold} confirmations
        </div>
        <div>{fromNow}</div>
      </div>
    </div>
  )
}
