import { AssetResponse, MixinApi, Registry } from '@mixin.dev/mixin-node-sdk'
import { DepositRequest } from '@mixin.dev/mixin-node-sdk/dist/client/types/external'
import axios from 'axios'
import dayjs from 'dayjs'
import { difference, flatten, merge, sortBy } from 'lodash'
import { useMemo } from 'react'
import { QueryClient, useQueries, useQuery, useQueryClient } from 'react-query'
import { createWebStoragePersistor } from 'react-query/createWebStoragePersistor-experimental'
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { useAccount, useBalance, useContractWrite, useSignMessage } from 'wagmi'
import BridgeABI from './abi/bridgeABI.json'
import AssetABI from './abi/assetABI.json'

import {
  XIN_ASSET_ID,
  REGISTRY_ADDRESS,
  MVM_RPC_URI,
  BRIDGE_ADDRESS,
  EMPTY_ADDRESS,
} from '../constant'
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
    },
  },
})

const localStoragePersistor = createWebStoragePersistor({
  storage: window.localStorage,
})

// eslint-disable-next-line @typescript-eslint/no-floating-promises
persistQueryClient({
  queryClient,
  persistor: localStoragePersistor,
  maxAge: Infinity,
})

export { queryClient }

interface RegisteredUser {
  contract: string
  created_at: string
  full_name: string
  user_id: string
  session_id: string
  key: {
    client_id: string
    private_key: string
    session_id: string
  }
}

export const useRegisteredUser = () => {
  const { data } = useAccount()
  const address = data?.address

  const message = useMemo(
    () =>
      keccak256(
        toUtf8Bytes(
          `MVM:Bridge:Proxy:8MfEmL3g8s-PoDpZ4OcDCUDQPDiH4u1_OmxB0Aaknzg:${
            address ?? ''
          }`
        )
      ),
    [address]
  )
  const { signMessageAsync } = useSignMessage({ message })

  return useQuery(
    ['register', address],
    async () => {
      if (!address) return
      const signature = (await signMessageAsync()).slice(2)

      console.log(
        [
          `address: ${address}`,
          `original message: MVM:Bridge:Proxy:8MfEmL3g8s-PoDpZ4OcDCUDQPDiH4u1_OmxB0Aaknzg:${address}`,
          `keccak256: ${message}`,
          `signature: ${signature}`,
        ].join('\n')
      )

      const response = await axios.post<{ user: RegisteredUser }>(
        'https://bridge.pinstripe.mvm.dev/users',
        {
          public_key: address,
          signature: signature,
        }
      )
      return response.data.user
    },
    {
      cacheTime: Infinity,
      staleTime: 1000 * 60,
      retry: false,
      enabled: false,
    }
  )
}

export const useMixinApi = () => {
  const { data } = useRegisteredUser()
  if (!data) return
  return MixinApi({
    keystore: {
      ...data,
      ...data.key,
    },
  })
}

export const useMe = () => {
  const { data } = useRegisteredUser()

  const api = useMixinApi()
  return useQuery(['me', data?.user_id], () => api?.user.profile(), {
    cacheTime: Infinity,
    staleTime: 1000 * 60 * 5,
    enabled: !!api,
  })
}

export const useAssets = () => {
  const { data } = useRegisteredUser()

  const api = useMixinApi()
  return useQuery(['assets', data?.user_id], () => api?.asset.fetchList(), {
    cacheTime: Infinity,
    enabled: !!api,
  })
}

export const useAsset = (assetId: string) => {
  const { data } = useRegisteredUser()

  const api = useMixinApi()
  return useQuery(
    ['asset', data?.user_id, assetId],
    () => api?.asset.fetch(assetId),
    {
      cacheTime: Infinity,
      staleTime: 1000 * 60 * 5,
      enabled: !!api,
    }
  )
}

export const useTopAssets = () => {
  const api = MixinApi()
  return useQuery(['topAsset'], () => api.network.topAssets(), {
    cacheTime: Infinity,
    staleTime: 1000 * 60 * 5,
    enabled: !!api,
  })
}

export const useDeposits = (
  request: Partial<Omit<DepositRequest, 'offset'>>,
  { enable }: { enable?: boolean } = {}
) => {
  const { data } = useRegisteredUser()

  const api = useMixinApi()

  return useQuery(
    ['deposits', data?.user_id, request],
    () =>
      api?.external.deposits({
        ...request,
        limit: request.limit ?? 500,
      } as unknown as DepositRequest),
    {
      enabled: !!api && (enable ?? true),
      refetchInterval: 1000 * 6,
    }
  )
}

export const useCacheAssets = () => {
  const { data: user } = useRegisteredUser()
  const queries = useQueryClient()
    .getQueryCache()
    .findAll(['asset', user?.user_id])

  const assets = queries
    .map((e) => e.state.data)
    .filter((e) => !!e)
    .map((e) => e as AssetResponse)

  return assets
}

export const useAllDeposits = () => {
  const api = useMixinApi()
  const { data } = useRegisteredUser()

  const cacheAssets = useCacheAssets()
  const { data: assets = [] } = useAssets()

  const requests = useMemo(
    () =>
      difference(
        cacheAssets.concat(assets).map((e) => ({
          asset: e.asset_id,
          destination: e.destination,
          tag: e.tag,
        }))
      ),
    [cacheAssets, assets]
  )

  const queriesResults = useQueries(
    requests.map((request) => {
      return {
        queryKey: ['deposits', data?.user_id, request],
        queryFn: () =>
          api?.external.deposits({
            ...request,
            limit: 500,
          } as unknown as DepositRequest),
        enabled: !!api && !!request.destination,
        refetchInterval: 1000 * 12,
      }
    })
  )

  return useMemo(() => {
    const deposits = flatten(queriesResults.map((e) => e.data))
      .filter((e) => !!e)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map((e) => e!)
    return sortBy(deposits, (e) => -dayjs(e.created_at).valueOf())
  }, [queriesResults])
}

export const useAssetContract = (assetId: string) => {
  const { data } = useAsset(assetId)

  return useQuery(
    ['assetContract', data?.asset_id],
    async () =>
      (await new Registry({
        address: REGISTRY_ADDRESS,
        uri: MVM_RPC_URI,
      }).fetchAssetContract(data?.asset_id ?? '')) as string,
    {
      enabled: !!data?.asset_id,
      cacheTime: Infinity,
      staleTime: 1000 * 60 * 60 * 24,
    }
  )
}

export const useUserContract = (userId?: string) => {
  return useQuery(
    ['userContract', userId],
    async () => {
      const address = (await new Registry({
        address: REGISTRY_ADDRESS,
        uri: MVM_RPC_URI,
      }).fetchUserContract(userId ?? '')) as string
      if (address === EMPTY_ADDRESS) throw new Error('User not found')
      return address
    },
    {
      enabled: !!userId,
      cacheTime: Infinity,
      staleTime: 1000 * 60,
    }
  )
}

export const useMvmBalance = (assetId: string) => {
  const account = useAccount()
  const { data } = useAssetContract(assetId)

  const balance = useBalance({
    addressOrName: account.data?.address,
    formatUnits: 18,
    cacheTime: Infinity,
    enabled: assetId === XIN_ASSET_ID,
  })

  const tokenBalance = useBalance({
    addressOrName: account.data?.address,
    token: data,
    formatUnits: 8,
    cacheTime: Infinity,
    enabled: assetId !== XIN_ASSET_ID && !!data,
  })

  if (assetId === XIN_ASSET_ID) return balance

  return tokenBalance
}

export const useUser = (userId: string | undefined) => {
  const api = useMixinApi()
  return useQuery(['user', userId], () => api?.user.fetch(userId ?? ''), {
    enabled: !!api && !!userId,
    cacheTime: Infinity,
    staleTime: 1000 * 60,
  })
}

export const useBridgeExtra = (payload: {
  extra?: string
  receivers?: string[]
  threshold?: number
}) =>
  useQuery(
    ['bridgeExtra', payload],
    async () =>
      '0x' +
      (
        await axios.post<{ extra: string }>('https://bridge.mvm.dev/extra', {
          ...payload,
          threshold: payload.threshold ?? 1,
        })
      ).data.extra,
    {
      cacheTime: Infinity,
      staleTime: 1000 * 60 * 60 * 24,
      enabled: !!payload.receivers?.length,
    }
  )

export const useBridgeContractWrite = (
  ...args: Parameters<typeof useContractWrite> extends [unknown, ...infer args]
    ? args
    : never
) =>
  useContractWrite(
    {
      addressOrName: BRIDGE_ADDRESS,
      contractInterface: BridgeABI,
    },
    args[0],
    merge(args[1], {
      overrides: {
        gasLimit: 21000 * 20,
      },
    })
  )

export const useAssetContractWrite = (
  address: string,
  ...args: Parameters<typeof useContractWrite> extends [unknown, ...infer args]
    ? args
    : never
) =>
  useContractWrite(
    {
      addressOrName: address,
      contractInterface: AssetABI,
    },
    args[0],
    merge(args[1], {
      overrides: {
        gasLimit: 21000 * 20,
      },
    })
  )
