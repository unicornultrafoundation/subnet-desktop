export enum AppStatus {
  running = "running",
  created = "created",
  stopped = "stopped",
  paused = "paused",
  pausing = "pausing",
  unknown = "unknown",
  notfound = "notfound",
}

export interface App {
  id: `0x${string}`;
  peer_id: string;
  owner: `0x${string}`;
  name: string;
  symbol: string;
  budget: `0x${string}`;
  spent_budget: string;
  max_nodes: string;
  min_cpu: string;
  min_gpu: string;
  min_memory: string;
  min_upload_bandwidth: string;
  min_download_bandwidth: string;
  node_count: string;
  price_per_cpu: string;
  price_per_gpu: string;
  price_per_memory_gb: string;
  price_per_storage_gb: string;
  price_per_bandwidth_gb: string;
  status: AppStatus;
  metadata: {
    appInfo: {
      name: string;
      description: string;
      logo: string;
      website: string;
    };
    containerConfig: {
      image: string;
      command: string[] | null;
      env: Record<string, string> | null;
      resources: {
        cpu: string;
        memory: string;
        storage: string;
      };
      ports: {
        containerPort: number;
        protocol: string;
      } | null;
      volumes: {
        name: string;
        mountPath: string;
      };
    };
    contactInfo: {
      email: string;
      github: string;
    };
  };
}

export interface AppUsage {
  usedCpu: `0x${string}`;
  usedGpu: `0x${string}`;
  usedMemory: `0x${string}`;
  usedStorage: `0x${string}`;
  usedUploadBytes: `0x${string}`;
  usedDownloadBytes: `0x${string}`;
  duration: `0x${string}`;
}
