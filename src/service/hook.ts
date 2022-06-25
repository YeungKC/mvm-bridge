import { QueryClient, useInfiniteQuery, useQuery } from "react-query"
import { persistQueryClient } from "react-query/persistQueryClient-experimental"
import { createWebStoragePersistor } from "react-query/createWebStoragePersistor-experimental"
import axios from "axios"
import { useAccount } from "wagmi"
import { MixinApi } from "@mixin.dev/mixin-node-sdk"
import { DepositRequest } from "@mixin.dev/mixin-node-sdk/dist/client/types/external"
import { flatten } from "lodash"
import { useMemo } from "react"

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
  created_at: Date
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
    enabled: !!api,
  })
}

export const useDeposits = (request: Partial<Omit<DepositRequest, "offset">>, { enable }: { enable?: boolean } = {}) => {
  const { data } = useRegisteredUser()

  const api = useMixinApi()

  const result = useInfiniteQuery({
    queryKey: ["deposits", data?.user_id, request],
    queryFn: ({ pageParam }) => api!.external.deposits({ offset: pageParam, ...request, limit: request.limit || 500 } as unknown as DepositRequest),
    getNextPageParam: (response) => (response.length ? response[response.length - 1].created_at : null),
    enabled: !!api && (enable ?? true),
    refetchInterval: 1000 * 3,
  })

  const items = useMemo(() => flatten(result.data?.pages), [result.data?.pages])

  return {
    ...result,
    data: items,
  }
}
