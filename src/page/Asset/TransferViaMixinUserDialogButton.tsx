import { ethers } from 'ethers'
import { round } from 'lodash'
import { memo, useMemo, useState, useCallback, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { useToggle } from 'react-use'
import { DialogModal } from '../../components/common/Modal'
import RoundedButton from '../../components/common/RoundedButton'
import SpinnerModal from '../../components/common/SpinnerModal'
import { InputItem } from '../../components/form/InputItem'
import { XIN_ASSET_ID } from '../../constant'
import {
  useRegisteredUser,
  useBridgeExtra,
  useAssetContract,
  useUser,
  useBridgeContractWrite,
  useAssetContractWrite,
} from '../../service/hook'

const useTransfer = (onUserNotFound: () => void) => {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [validUserId, setValidUserId] = useState<string | undefined>(undefined)
  const [memo, setMemo] = useState<string | undefined>(undefined)
  const [amount, setAmount] = useState<string | undefined>(undefined)

  const submit = useCallback(
    (
      userId: string | undefined,
      memo: string | undefined,
      amount: string | undefined,
    ) => {
      setUserId(userId)
      setMemo(memo)
      setAmount(amount)
    },
    [],
  )

  const assetId = useParams().assetId ?? ''
  const isXin = assetId === XIN_ASSET_ID
  const value = useMemo(() => {
    if (!amount) return
    if (isXin) {
      return Number(amount).toFixed(8)
    } else {
      return round(ethers.utils.parseUnits(amount, 8).toNumber())
    }
  }, [amount, isXin])

  const overrideValue = useMemo(() => {
    if (assetId !== XIN_ASSET_ID) return
    if (!value) return
    return ethers.utils.parseEther(`${value}`)
  }, [assetId, value])

  const {
    data: { contract: userContract } = {},
    isLoading: isUserContractLoading,
  } = useRegisteredUser()
  const { data: extra, isLoading: isExtraLoading } = useBridgeExtra({
    extra: memo,
    receivers: validUserId ? [validUserId] : undefined,
  })
  const { data: assetContractAddress, isLoading: isAssetContractLoading } =
    useAssetContract(assetId)
  const { data: user, isLoading: isUserLoading } = useUser(userId)

  useEffect(() => {
    if (!user || !userId) return

    if (user.user_id === userId) {
      setValidUserId(userId)
      return
    }

    onUserNotFound()
    setUserId(undefined)
    setValidUserId(undefined)
    setMemo(undefined)
    setAmount(undefined)
  }, [onUserNotFound, user, user?.user_id, userId])

  const {
    data: transferXinData,
    write: transferXin,
    isLoading: isTransferXinLoading,
    isIdle: isTransferXinIdle,
    error: transferXinError,
    reset: transferXinReset,
  } = useBridgeContractWrite({
    functionName: 'release',
    args: [userContract, extra],
    overrides: {
      value: overrideValue,
    },
  })

  const {
    data: transferERC20Data,
    write: transferERC20,
    isLoading: isTransferERC20Loading,
    isIdle: isTransferERC20Idle,
    error: transferERC20Error,
    reset: transferERC20Reset,
  } = useAssetContractWrite({
    addressOrName: assetContractAddress ?? '',
    functionName: 'transferWithExtra',
    args: [userContract, value, extra],
  })

  useEffect(() => {
    if (
      (isXin && isTransferXinIdle && userContract && extra && overrideValue) ||
      (!isXin &&
        isTransferERC20Idle &&
        assetContractAddress &&
        userContract &&
        value &&
        extra)
    ) {
      isXin ? transferXin() : transferERC20()
    }
  }, [
    assetContractAddress,
    extra,
    isTransferERC20Idle,
    isTransferXinIdle,
    isXin,
    overrideValue,
    transferERC20,
    transferXin,
    userContract,
    value,
  ])

  const isLoading =
    !!userId &&
    (isUserContractLoading ||
      isExtraLoading ||
      isAssetContractLoading ||
      isUserLoading ||
      isTransferXinLoading ||
      isTransferERC20Loading)

  return {
    submit,
    isLoading,
    data: isXin ? transferXinData : transferERC20Data,
    error: isXin ? transferXinError : transferERC20Error,
    reset: isXin ? transferXinReset : transferERC20Reset,
  }
}

export const TransferViaMixinUserDialogButton = memo(() => {
  const assetId = useParams().assetId ?? ''
  const [opened, openedToggle] = useToggle(false)

  const { control, handleSubmit, setError } = useForm()

  const minValue = useMemo(() => {
    return assetId === XIN_ASSET_ID
      ? ethers.utils.formatUnits(1, 18)
      : ethers.utils.formatUnits(1, 8)
  }, [assetId])

  const onUserNotFound = useCallback(() => {
    setError('userId', {
      type: 'manual',
      message: 'User not found',
    })
  }, [setError])

  const { submit, data, isLoading, error, reset } = useTransfer(onUserNotFound)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit: SubmitHandler<any> = useCallback(
    ({
      userId,
      memo,
      amount,
    }: {
      userId: string
      memo?: string
      amount: string
    }) => {
      submit(userId, memo, amount)
    },
    [submit],
  )

  const onDismiss = useCallback(() => {
    submit(undefined, undefined, undefined)
    reset()
  }, [reset, submit])

  return (
    <>
      <RoundedButton onClick={openedToggle}>
        Transfer via Mixin User
      </RoundedButton>
      <DialogModal
        isOpen={opened}
        onDismiss={openedToggle}
        containerClassName='gap-2 container items-stretch'
      >
        <div className='mb-6 self-center text-xl font-bold'>
          Transfer via Mixin User
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-empty-function */}
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col'>
          <InputItem
            name='userId'
            label='User ID'
            control={control}
            // eslint-disable-next-line react-memo/require-usememo
            rules={{
              required: 'User ID is required',
              pattern: {
                value:
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
                message: 'User ID must be a valid UUID',
              },
            }}
          />
          <InputItem name='memo' label='Memo' control={control} />
          <InputItem
            name='amount'
            label='Amount'
            type='text'
            control={control}
            // eslint-disable-next-line react-memo/require-usememo
            rules={{
              required: 'Amount is required',
              min: {
                value: minValue,
                message: `Amount must be greater than ${minValue}`,
              },
            }}
          />
          <RoundedButton $as='input' type='submit' className='px-8' />
        </form>
      </DialogModal>
      <DialogModal isOpen={!!data?.hash} onDismiss={onDismiss}>
        <div className='mb-6 self-center text-xl font-bold'>
          Successfully transferred
        </div>
        <a href={`https://scan.mvm.dev/tx/${data?.hash ?? ''}`}>
          hash: {data?.hash}
        </a>
      </DialogModal>
      <DialogModal isOpen={!!error} onDismiss={onDismiss}>
        <div className='mb-6 self-center text-xl font-bold'>
          Transfer failed
        </div>
        <div>{error?.message ?? ''}</div>
      </DialogModal>
      <SpinnerModal isOpen={isLoading} />
    </>
  )
})

export default TransferViaMixinUserDialogButton
