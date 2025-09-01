import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { broadcast } from '@/lib/downloadsEmitter'
import { getDownloadType, startAria2cDownload } from '@/lib/aria2c'
import { dbAll, dbRun } from '@/lib/db'
import { globalActiveDownloads } from '@/constants/global'

export interface Download {
  id: string
  url: string
  filename: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error'
  progress: number
  size?: number
  download_path: string
  speed?: number
  eta?: number
  added_at: string
  updated_at: string
}


// Start wget download process
export function startDownload(download: Download) {
  startAria2cDownload(download)
}


export async function updateDownloadProgress(id: string, progress: number, speed?: number, eta?: number, downloaded?: string, total?: string) {
  const process = globalActiveDownloads.get(id)
  process.progress = progress

  await dbRun(
    `UPDATE downloads SET status = ?, progress = ?, speed = ?, eta = ?, updated_at = CURRENT_TIMESTAMP, downloaded = ?, total = ? WHERE id = ?`,
    ['downloading', progress, speed, eta, id, downloaded, total]
  )

  broadcast(JSON.stringify({
    type: 'progress_update',
    id,
    updates: { progress, speed, eta, status: 'downloading' }
  }))
}

export async function updateDownloadStatus(id: string, status: string, progress?: number) {
  const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP']
  const values: (string | number)[] = [status]

  if (progress !== undefined) {
    updateFields.push('progress = ?')
    values.push(progress)
  }

  values.push(id)

  await dbRun(
    `UPDATE downloads SET ${updateFields.join(', ')} WHERE id = ?`,
    values
  )

  const updates: Record<string, string | number> = { status }
  if (progress !== undefined) updates.progress = progress

  broadcast(JSON.stringify ({
    type: 'download_update',
    id,
    updates
  }) )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const downloads = await dbAll('SELECT * FROM downloads ORDER BY added_at DESC')
      res.status(200).json(downloads)

    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Failed to fetch downloads' })
    }
  } else if (req.method === 'POST') {
    try {
      const { url, downloadPath } = req.body

      if (!url || !downloadPath) {
        return res.status(400).json({ error: 'URL and download path are required' })
      }

      const id = uuidv4()
      const downloadType = getDownloadType(url)
      const newURL = new URL(url)

      let filename = `download_${Date.now()}`
      switch(downloadType) {
        case 'http':
          filename = path.basename(newURL.pathname) || filename
          break
        case 'magnet':
        case 'torrent':
          filename = newURL.searchParams.get('dn') || filename
          break
      }

      const download: Download = {
        id,
        url,
        filename,
        status: 'pending',
        progress: 0,
        download_path: downloadPath,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await dbRun(
        `INSERT INTO downloads (id, url, filename, status, progress, download_path, added_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, url, filename, 'pending', 0, downloadPath, download.added_at, download.updated_at]
      )

      // Start download immediately
      startDownload(download)

      res.status(201).json(download)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Failed to add download' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

