import { AssetResponse, MixinApi, RegistryABI } from '@mixin.dev/mixin-node-sdk'
import { DepositRequest } from '@mixin.dev/mixin-node-sdk/dist/client/types/external'
import axios from 'axios'
import dayjs from 'dayjs'
import { difference, flatten, sortBy } from 'lodash'
import { useMemo } from 'react'
import { QueryClient, useQueries, useQuery, useQueryClient } from 'react-query'
import { createWebStoragePersistor } from 'react-query/createWebStoragePersistor-experimental'
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { useAccount, useBalance, useContractRead } from 'wagmi'

import { XIN_ASSET_ID } from '../constant'

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
  return useQuery(
    ['register', address],
    async () => {
      if (!address) return
      const response = await axios.post<{ user: RegisteredUser }>(
        'https://bridge.mvm.dev/users',
        {
          public_key: address,
        },
      )
      return response.data.user
    },
    {
      cacheTime: Infinity,
      staleTime: 1000 * 60 * 5,
    },
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
    },
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
  { enable }: { enable?: boolean } = {},
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
    },
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
        })),
      ),
    [cacheAssets, assets],
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
    }),
  )

  return useMemo(() => {
    const deposits = flatten(queriesResults.map((e) => e.data))
      .filter((e) => !!e)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map((e) => e!)
    return sortBy(deposits, (e) => -dayjs(e.created_at).valueOf())
  }, [queriesResults])
}

export const useAssetContract = (assetId: string, enabled?: boolean) => {
  const { data } = useAsset(assetId)

  const id = useMemo(() => {
    return `0x${assetId.replaceAll('-', '')}`
  }, [assetId])

  const result = useContractRead(
    {
      addressOrName: '0x3c84B6C98FBeB813e05a7A7813F0442883450B1F',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      contractInterface: RegistryABI.abi,
    },
    'contracts',
    {
      args: id,
      cacheTime: Infinity,
      staleTime: 1000 * 60 * 60 * 24,
      enabled: !!data && (enabled ?? true),
    },
  )

  return {
    ...result,
    data: result.data as unknown as string | undefined,
  }
}

export const useMvmBalance = (assetId: string) => {
  const account = useAccount()
  const { data } = useAssetContract(assetId)

  const balance = useBalance({
    addressOrName: account.data?.address,
    formatUnits: 18,
    cacheTime: Infinity,
    staleTime: 1000 * 60,
    enabled: assetId === XIN_ASSET_ID,
  })

  const tokenBalance = useBalance({
    addressOrName: account.data?.address,
    token: data,
    formatUnits: 8,
    cacheTime: Infinity,
    staleTime: 1000 * 60,
    enabled: assetId !== XIN_ASSET_ID && !!data,
  })

  if (assetId === XIN_ASSET_ID) return balance

  return tokenBalance
}
