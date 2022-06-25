import React from "react"
import Assets from "./Assets"
import ConnectModal from "./ConnectModal"
import { Routes, Route } from "react-router-dom"
import { Asset } from "./Asset"
import AllDepositing from "./AllDepositing"

function App() {
  return (
    <>
      <Routes>
        <Route path="/">
          <Route index element={<Assets />} />
          <Route path="asset/:assetId" element={<Asset />} />
          <Route path="all-depositing" element={<AllDepositing />} />
        </Route>
      </Routes>
      <ConnectModal />
    </>
  )
}

export default App
