import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// import "./index.scss";
import '@/assets/styles/app.scss'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { Buffer } from 'buffer'
// import { wagmiConfig } from '@/config/wagmi'
// import { WagmiProvider } from 'wagmi'
import { Flowbite } from 'flowbite-react'

// globalThis.Buffer = Buffer

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Flowbite theme={{ mode: 'dark' }}>
      <QueryClientProvider client={queryClient}>
        {/* <WagmiProvider config={wagmiConfig}> */}
        <App />
        {/* </WagmiProvider> */}
      </QueryClientProvider>
    </Flowbite>
  </React.StrictMode>
)
