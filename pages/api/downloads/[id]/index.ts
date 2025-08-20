import { NextApiRequest, NextApiResponse } from 'next'
import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { globalActiveDownloads } from '@/constants/global'

const DB_PATH = './downloads.db'
const db = new sqlite3.Database(DB_PATH)
const dbRun = promisify(db.run.bind(db))
const dbGet = promisify(db.get.bind(db))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const { deleteFile } = JSON.parse(req.body)

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid download ID' })
  }

  if (req.method === 'DELETE') {
    try {
      // Get download info before deletion
      const download = await dbGet('SELECT * FROM downloads WHERE id = ?', [id])

      if (!download) {
        return res.status(404).json({ error: 'Download not found' })
      }

      // Kill the process if it's running
      if (globalActiveDownloads && globalActiveDownloads.has(id)) {
        const process = globalActiveDownloads.get(id)
        process.kill('SIGKILL')
        globalActiveDownloads.delete(id)
      }

      // Optionally delete the file
      try {
        const filePath = path.join(download.download_path, download.filename)

        if (deleteFile) {
          await fs.unlink(filePath)
        }
      } catch (fileError) {
        // File might not exist or be partially downloaded, that's ok
        console.log('Could not delete file:', fileError)
      }

      // Remove from database
      await dbRun('DELETE FROM downloads WHERE id = ?', [id])

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
