import type { NextApiRequest, NextApiResponse } from 'next'
import EventEmitter from 'events';

let clients: NextApiResponse[] = []

const stream = new EventEmitter();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Content-Encoding', 'none'); // critical


  stream.on("channel", function(event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify({ counter: data })}\n\n`); // <- the format here is important!
  })

  // Add client to array
  clients.push(res)

  // Remove client when connection closes
  req.on('close', () => {
    res.end()
    clients = clients.filter(client => client !== res)
  })
}

// Utility to broadcast messages
export function broadcast(message: string) {
  clients.forEach(client => {
    const msg = `data: ${message} \n\n`
    // console.log({ msg })
    client.write(msg)
    // if ('flush' in client) {
    //   client.flush(); // flush the data immediately
    // }
  })

  // stream.emit("channel", "myEventName", message)
}
