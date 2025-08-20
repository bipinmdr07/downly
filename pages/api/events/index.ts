import { globalClients } from '@/constants/global';
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Content-Encoding', 'none'); // critical

  res.flushHeaders()

  // Add client to array
  globalClients.push(res)

  // Remove client when connection closes
  res.on('close', () => {
    res.end()
    const clientIndex = globalClients.indexOf(res)

    if (clientIndex > -1) { // only splice array when item is found
      globalClients.splice(clientIndex, 1);
    }
  })
}
