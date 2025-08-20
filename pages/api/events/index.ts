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
  req.on('close', () => {
    res.end()
    globalClients = globalClients.filter(client => client !== res)
  })
}
