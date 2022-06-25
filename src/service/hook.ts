import { QueryClient, useQueries, useQuery, useQueryClient } from "react-query"
import { persistQueryClient } from "react-query/persistQueryClient-experimental"
import { createWebStoragePersistor } from "react-query/createWebStoragePersistor-experimental"
import axios from "axios"
import { useAccount } from "wagmi"
import { AssetResponse, MixinApi } from "@mixin.dev/mixin-node-sdk"
import { DepositRequest } from "@mixin.dev/mixin-node-sdk/dist/client/types/external"
import { difference, flatten, sortBy } from "lodash"
import { useMemo } from "react"
import dayjs from "dayjs"

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
  return useQuery<RegisteredUser>(
    ["register", address],
    async () => {
      if (!address) return
      return (
        await axios.post("https://bridge.mvm.dev/users", {
          public_key: address,
        })
      ).data.user
    },
    {
      cacheTime: Infinity,
      staleTime: 1000 * 60 * 5,
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
  return useQuery(["me", data?.user_id], () => api!.user.profile(), {
    cacheTime: Infinity,
    staleTime: 1000 * 60 * 5,
    enabled: !!api,
  })
}

export const useAssets = () => {
  const { data } = useRegisteredUser()

  const api = useMixinApi()
  return useQuery(["assets", data?.user_id], () => api!.asset.fetchList(), {
    cacheTime: Infinity,
    enabled: !!api,
  })
}

export const useAsset = (assetId: string) => {
  const { data } = useRegisteredUser()

  const api = useMixinApi()
  return useQuery(["asset", data?.user_id, assetId], () => api!.asset.fetch(assetId), {
    cacheTime: Infinity,
    staleTime: 1000 * 60 * 5,
    enabled: !!api,
  })
}

export const useTopAssets = () => {
  const api = MixinApi()
  return useQuery(["topAsset"], () => api!.network.topAssets(), {
    cacheTime: Infinity,
    staleTime: 1000 * 60 * 5,
    enabled: !!api,
  })
}

export const useDeposits = (request: Partial<Omit<DepositRequest, "offset">>, { enable }: { enable?: boolean } = {}) => {
  const { data } = useRegisteredUser()

  const api = useMixinApi()

  return useQuery(["deposits", data?.user_id, request], () => api!.external.deposits({ ...request, limit: request.limit || 500 } as unknown as DepositRequest), {
    enabled: !!api && (enable ?? true),
    refetchInterval: 1000 * 6,
  })
}

export const useCacheAssets = () => {
  const { data: user } = useRegisteredUser()
  const queries = useQueryClient().getQueryCache().findAll(["asset", user?.user_id])

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
        queryKey: ["deposits", data?.user_id, request],
        queryFn: () => api!.external.deposits({ ...request, limit: 500 } as unknown as DepositRequest),
        enabled: !!api && !!request?.destination,
        refetchInterval: 1000 * 12,
      }
    })
  )

  return useMemo(() => {
    const deposits = flatten(queriesResults.map((e) => e.data))
      .filter((e) => !!e)
      .map((e) => e!)
    return sortBy(deposits, (e) => -dayjs(e.created_at).valueOf())
  }, [queriesResults])
}
