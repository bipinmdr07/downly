import { pauseAria2cDownload } from '@/lib/aria2c'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid download ID' })
  }

  try {
    await pauseAria2cDownload(id)

    res.status(200).json({ message: 'Download paused' })
  } catch (error) {
    console.error('Failed to pause download:', error)
    res.status(500).json({ error: 'Failed to pause download' })
  }
}
