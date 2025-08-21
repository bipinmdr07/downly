declare global {
  var clients: any[];
  var activeDownloads: Map<string, any>;
}

global.clients = global.clients || []
global.activeDownloads = global.activeDownloads || new Map()

export let globalClients = global.clients
export const globalActiveDownloads = global.activeDownloads
