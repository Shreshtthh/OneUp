import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import '@mysten/dapp-kit/dist/index.css'

const queryClient = new QueryClient()

const networks = {
  onechain: {
    url: 'https://rpc-testnet.onelabs.cc:443',
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networks} defaultNetwork="onechain">
          <WalletProvider autoConnect>
            <App />
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgba(13, 13, 13, 0.9)',
                  color: '#fff',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                },
              }}
            />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
