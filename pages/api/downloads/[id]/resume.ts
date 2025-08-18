import { startWgetDownload } from '@/lib/wget'
import { NextApiRequest, NextApiResponse } from 'next'
import sqlite3 from 'sqlite3'
import { promisify } from 'util'

const DB_PATH = './downloads.db'
const db = new sqlite3.Database(DB_PATH)
const dbRun = promisify(db.run.bind(db))
const dbGet = promisify(db.get.bind(db))

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
    const download = await dbGet('SELECT * FROM downloads WHERE id = ?', [id])

    if (!download) {
      return res.status(404).json({ error: 'Download not found' })
    }

    if (['downloading', 'pending'].includes(download.status)) {
      return res.status(403).json({ error: 'Download already in progress' })
    }

    // Update status to downloading
    await dbRun(
      'UPDATE downloads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['pending', id]
    )

    startWgetDownload(download)

    res.status(200).json({...download, status: 'pending'})
  } catch (error) {
    console.error('Failed to resume download:', error)
    res.status(500).json({ error: 'Failed to resume download' })
  }
}
