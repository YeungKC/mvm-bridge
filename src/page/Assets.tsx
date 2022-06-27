import { useTopAssets } from "../service/hook"
import { Link } from "react-router-dom"
import RoundedItem from "../components/RoundedItem"

export const Assets = () => {
  const { data } = useTopAssets()

  return (
    <div className="container flex flex-col items-stretch p-4 py-20 gap-2">
      <div>
        <RoundedItem $as={Link} to={`/all-depositing`} className=" font-bold">
          All Depositing
        </RoundedItem>
      </div>
      <div className=" text-lg font-bold">Top Assets</div>
      <div>
        {data?.map((e, i) => (
          <RoundedItem key={e.asset_id} $as={Link} to={`/asset/${e.asset_id}`}>
            <img alt="icon" src={e.icon_url} width={38} height={38} />
            <div className="font-bold">{e.symbol}</div>
          </RoundedItem>
        ))}
      </div>
    </div>
  )
}

export default Assets
