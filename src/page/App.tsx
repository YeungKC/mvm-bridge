import React from "react"
import Assets from "./Assets"
import ConnectModal from "./ConnectModal"
import { Routes, Route } from "react-router-dom"
import { Asset } from "./Asset"

function App() {
  return (
    <>
      <Routes>
        <Route path="/">
          <Route index element={<Assets />} />
          <Route path="asset/:assetId" element={<Asset />} />
        </Route>
      </Routes>
      <ConnectModal />
    </>
  )
}

export default App
