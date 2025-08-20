import { globalActiveDownloads } from "@/constants/global";
import { Download, updateDownloadProgress, updateDownloadStatus } from "@/pages/api/downloads";
import { spawn } from "child_process";
import path from 'path'

// Global variables to keep track of active downloads.
// Active download processes

// Helper functions
function parseSpeed(speedStr: string): number {
  const match = speedStr.match(/(\d+(?:\.\d+)?)([KMGT]?)/)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = match[2]

  switch (unit) {
    case 'K': return value * 1024
    case 'M': return value * 1024 * 1024
    case 'G': return value * 1024 * 1024 * 1024
    case 'T': return value * 1024 * 1024 * 1024 * 1024
    default: return value
  }
}

function parseETA(etaStr: string): number {
  const match = etaStr.match(/(\d+)([hms])/)
  if (!match) return 0

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 'h': return value * 3600
    case 'm': return value * 60
    case 's': return value
    default: return value
  }
}

// start wget download process
export const startWgetDownload = async (download: Download) => {
  const { id, url, download_path, filename } = download

  const outputPath = path.join(download_path, filename)

  const wgetArgs = [
    '--continue',
    '--progress=bar:force',
    '--show-progress',
    '--timeout=30',
    '--tries=3',
    '--no-check-certificate',
    '-O',
    outputPath,
    url
  ]

  const wget = spawn('wget', wgetArgs)

  // store process references
  globalActiveDownloads.set(id, wget)

  wget.stderr.on('data', (data) => {
    const output = data.toString()

    // Parse wget progress output
    const progressMatch = output.match(/(\d+)%.*?(\d+(?:\.\d+)?[KMGT]?B\/s).*?eta\s+([\dhms\s]+)/i)

    if (progressMatch) {
      const progress = parseInt(progressMatch[1])
      const speed = parseSpeed(progressMatch[2])
      const eta = parseETA(progressMatch[3])

      updateDownloadProgress(id, progress, speed, eta)
    }
  })

  wget.on('close', (code, signal) => {
    globalActiveDownloads.delete(download.id)

    // Interrupted with Ctrl + C key
    if (signal === 'SIGINT') {
      updateDownloadStatus(id, 'paused')
    } else if (code === 0) {
      updateDownloadStatus(id, 'completed', 100)
    } else {
      updateDownloadStatus(id, 'error')
    }
  })
}

