import tw from "tailwind-styled-components"
import { useTopAssets } from "../service/hook"
import { Link } from "react-router-dom"

const Item = tw(Link)`
p-5
bg-white
flex
flex-row
gap-3
first:rounded-t-2xl
last:rounded-2xl
`

export const Assets = () => {
  const { data } = useTopAssets()

  return (
    <div className="container flex flex-col items-stretch py-20">
      {data?.map((e, i) => (
        <Item to={`/asset/${e.asset_id}`}>
          <img alt="icon" src={e.icon_url} width={38} height={38} />
          <div className="font-bold">{e.symbol}</div>
        </Item>
      ))}
    </div>
  )
}

export default Assets
