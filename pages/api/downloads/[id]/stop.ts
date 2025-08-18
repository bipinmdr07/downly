import { NextApiRequest, NextApiResponse } from 'next'
import sqlite3 from 'sqlite3'
import { promisify } from 'util'

const DB_PATH = './downloads.db'
const db = new sqlite3.Database(DB_PATH)
const dbRun = promisify(db.run.bind(db))

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
    // Kill the wget process
    if (global.activeDownloads && global.activeDownloads.has(id)) {
      const process = global.activeDownloads.get(id)
      process.kill('SIGKILL')
      global.activeDownloads.delete(id)
    }

    // Update database - reset progress and set to error status
    await dbRun(
      'UPDATE downloads SET status = ?, progress = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['error', id]
    )

    res.status(200).json({ message: 'Download stopped' })
  } catch (error) {
    console.error('Failed to stop download:', error)
    res.status(500).json({ error: 'Failed to stop download' })
  }
}
