export interface ResourceInfo {
  region: {
    region: string
    country: string
  }
  peer_id: string
  cpu: {
    count: number
    name: string
  }
  gpu: {
    count: number
    name: string
  }
  memory: {
    total: number
    used: number
  }
  bandwidth: {
    latency: number
    upload: number
    download: number
  }
}

export interface NodeAuth {
  username: string
  password: string
}
