import { NextApiRequest, NextApiResponse } from 'next'
import { deleteAria2Download } from '@/lib/aria2c'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const { deleteFile } = JSON.parse(req.body)

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid download ID' })
  }

  if (req.method === 'DELETE') {
    try {
      await deleteAria2Download(id, deleteFile)

      res.status(200).json({ message: 'Download deleted' })
    } catch (error) {
      console.error('Failed to delete download:', error)
      res.status(500).json({ error: 'Failed to delete download' })
    }
  } else {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
