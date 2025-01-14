import { useGlobalStore } from '@renderer/state/global'

export const useRequestRPC = () => {
  const { token } = useGlobalStore()

  const requestRPC = async (method: string, params: any[] = [], headers?: Record<string, any>) => {
    const _headers = new Headers()
    _headers.append('Content-Type', 'application/json')
    if (token) {
      _headers.append('Authorization', `Basic ${token} `)
    }

    if (headers) {
      Object.keys(headers).map((key) => {
        _headers.append(key, headers[key])
      })
    }

    const raw = JSON.stringify({
      method,
      params,
      jsonrpc: '2.0',
      id: Date.now()
    })

    const requestOptions: Record<string, any> = {
      method: 'POST',
      headers: _headers,
      body: raw,
      redirect: 'follow'
    }

    const rs = await fetch('http://localhost:8080', requestOptions)
    if (rs.status === 401) {
      console.log('in here')
      throw new Error('Unauthorized')
    }
    const rsJSON = await rs.json()
    if (rsJSON.error) {
      throw new Error(rsJSON.error.message)
    }
    return rsJSON.result
  }

  return {
    requestRPC
  }
}
