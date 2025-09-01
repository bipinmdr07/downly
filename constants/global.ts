import { ChildProcess } from "child_process";
export type DownloadType = 'http' | 'magnet' | 'torrent'

export interface ActiveDownload {
  process: ChildProcess,
  downloadType: DownloadType,
  progress: number,
  speed: number,
  downloaded: number,
  eta: number,
  total: number,
  status: string,
}

declare global {
  var clients: any[];
  var activeDownloads: Map<string, any>;
}

global.clients = global.clients || []
global.activeDownloads = global.activeDownloads || new Map<string, ActiveDownload>()

export let globalClients = global.clients
export const globalActiveDownloads = global.activeDownloads
