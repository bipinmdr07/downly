import EventEmitter from "events";

export const downloadEmitter = new EventEmitter();

import { globalClients } from '@/constants/global'

export function broadcast(message: string) {
  downloadEmitter.emit("update", message)
}

const onUpdate = (message: string) => {
  globalClients.forEach((client) => {
    client.write(`data: ${message} \n\n`)
  })
}

downloadEmitter.on("update", onUpdate)
