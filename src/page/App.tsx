/* eslint-disable react-memo/require-usememo */

/* eslint-disable react-memo/require-memo */
import { Route, Routes } from 'react-router-dom'

import AllDepositing from './AllDepositing'
import { Asset } from './Asset'
import Assets from './Assets'
import ConnectModal from './ConnectModal'

function App() {
  return (
    <>
      <Routes>
        <Route path='/'>
          <Route index element={<Assets />} />
          <Route path='asset/:assetId' element={<Asset />} />
          <Route path='all-depositing' element={<AllDepositing />} />
        </Route>
      </Routes>
      <ConnectModal />
    </>
  )
}

export default App
