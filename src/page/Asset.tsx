import { useParams } from "react-router-dom"
import { Spinner } from "../components/common/Spinner"
import { useAsset, useMvmBalance, useDeposits, useRegisteredUser } from "../service/hook"
import { ExternalTransactionResponse } from "@mixin.dev/mixin-node-sdk"
import dayjs from "dayjs"
import { useMemo } from "react"
import relativeTime from "dayjs/plugin/relativeTime"
import RoundedButton from "../components/common/RoundedButton"
import { DialogModal } from "../components/common/Modal"
import { useToggle } from "react-use"
import { QRCodeSVG } from "qrcode.react"
import RoundedItem from "../components/RoundedItem"
import { DepositRequest } from "@mixin.dev/mixin-node-sdk/dist/client/types/external"

export const Asset = () => {
  const params = useParams()
  const assetId = params["assetId"]!

  const { data, isFetching } = useAsset(assetId)
  const { data: balance } = useMvmBalance(assetId)
  console.log(balance)

  const [addressDialogOpened, addressDialogOpenedToggle] = useToggle(false)
  const [mixinDialogOpened, mixinDialogOpenedToggle] = useToggle(false)

  if (isFetching)
    return (
      <div className="container flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  return (
    <>
      <div className=" container flex flex-col justify-center items-center gap-4 p-4 pt-20">
        <img alt="icon" src={data?.icon_url} width={64} height={64} />
        <div>
          {data?.symbol} ({data?.name})
        </div>

        <div className=" font-semibold text-xl">
          {balance?.formatted} {data?.symbol}
        </div>

        <div className="flex flex-row gap-2">
          <RoundedButton onClick={addressDialogOpenedToggle}>Transfer address</RoundedButton>
          <RoundedButton onClick={mixinDialogOpenedToggle}>Transfer via Mixin</RoundedButton>
        </div>

        <Depositing />
      </div>
      <AddressDialog isOpen={addressDialogOpened} onDismiss={addressDialogOpenedToggle} />
      <TransferViaMixinDialog isOpen={mixinDialogOpened} onDismiss={mixinDialogOpenedToggle} />
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

const TransferViaMixinDialog = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const { data } = useRegisteredUser()

  const address = `mixin://transfer/${data?.user_id}`

  return (
    <DialogModal isOpen={isOpen} onDismiss={() => onDismiss()} containerClassName="gap-2">
      <div>Transfer via Mixin</div>
      <a href={address} className=" text-slate-500 text-center underline">
        {address}
      </a>
      <QRCodeSVG value={address ?? ""} size={256} />
    </DialogModal>
  )
}

const Depositing = () => {
  const params = useParams()
  const assetId = params["assetId"]!
  const { data } = useAsset(assetId)
  const { data: deposits = [] } = useDeposits(
    {
      asset: assetId,
      destination: data?.destination,
      tag: data?.tag,
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
    <RoundedItem className="justify-between">
      <div className="font-semibold">
        {data.amount} {asset?.symbol}
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
