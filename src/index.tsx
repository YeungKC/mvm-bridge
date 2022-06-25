import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./page/App"
import reportWebVitals from "./reportWebVitals"
import { WagmiConfig } from "wagmi"
import web3client from "./service/web3client"
import { QueryClientProvider } from "react-query"
import { queryClient } from "./service/hook"
import { BrowserRouter } from "react-router-dom"

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <React.StrictMode>
    <WagmiConfig client={web3client}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
