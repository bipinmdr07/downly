import { globalActiveDownloads } from "@/constants/global";
import fs from 'fs/promises'
import { Download, updateDownloadProgress, updateDownloadStatus } from "@/pages/api/downloads";
import { spawn } from "child_process";
import path from 'path';

import { ActiveDownload, DownloadType } from "@/constants/global";
import { dbGet, dbRun } from "./db";

function detectDownloadType(url: string): DownloadType {
  if (url.startsWith('magnet:')) return 'magnet';
  if (url.endsWith('.torrent') || url.includes('.torrent?')) return 'torrent';
  return 'http';
}

function parseSize(sizeStr: string): number {
  if (!sizeStr) return 0;

  // With --human-readable=false, sizes are in bytes (B)
  // Match patterns like: 54329344B, 536870912B
  const match = sizeStr.match(/(\d+)B/i);
  if (!match) return 0;

  return parseInt(match[1]); // Return the byte value directly
}

function parseSpeed(speedStr: string): number {
  if (!speedStr) return 0;

  // With --human-readable=false, speeds are in bytes (B)
  // Match patterns like: 8000960B
  const match = speedStr.match(/(\d+)B/i);
  if (!match) return 0;

  return parseInt(match[1]); // Return the byte value directly
}

function parseETA(etaStr: string): number {
  if (!etaStr || etaStr === '--') return 0;

  let totalSeconds = 0;

  // Parse formats like: 1h2m3s, 2m30s, 45s, 1h30m
  const hours = etaStr.match(/(\d+)h/);
  const minutes = etaStr.match(/(\d+)m/);
  const seconds = etaStr.match(/(\d+)s/);

  if (hours) totalSeconds += parseInt(hours[1]) * 3600;
  if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
  if (seconds) totalSeconds += parseInt(seconds[1]);

  return totalSeconds;
}

function parseAria2Output(output: string, download: Download): void {
  const { id: downloadId, progress: downloadProgress } = download
  const lines = output.split('\n');

  const downloadProcess: ActiveDownload = globalActiveDownloads.get(downloadId)

  if (!downloadProcess) return;

  downloadProcess.status = '' // resetting status assuming it don't need update

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Parse different aria2c output formats:

    // 1. Standard HTTP/FTP progress: [#4dcb73 54329344B/536870912B(10%) CN:4 DL:8000960B ETA:1m]
    const httpMatch = trimmedLine.match(/\[#[a-f0-9]+\s+([^/]+)\/([^)]+).*?DL:([^\s]+)(?:.*?ETA:([^\]]+))?\]/i);
    if (httpMatch) {
      downloadProcess.downloaded = parseSize(httpMatch[1]);
      downloadProcess.total = parseSize(httpMatch[2]);
      downloadProcess.progress = downloadProcess.total > 0 ? (downloadProcess.downloaded / downloadProcess.total) * 100 : 0;
      downloadProcess.speed = parseSpeed(httpMatch[3]);
      downloadProcess.eta = parseETA(httpMatch[4] || '');

      continue;
    }

    // 2. BitTorrent progress: [#4dcb73 0B/536870912B(0%) CN:0 SEED:12 DL:8000960B UL:256000B]
    const torrentMatch = trimmedLine.match(/\[#[a-f0-9]+\s+([^/]+)\/([^)]+).*?DL:([^\s]+)(?:.*?UL:[^\]]+)?\]/i);
    if (torrentMatch) {
      downloadProcess.downloaded = parseSize(torrentMatch[1]);
      downloadProcess.total = parseSize(torrentMatch[2]);
      downloadProcess.progress = downloadProcess.total > 0 ? (downloadProcess.downloaded / downloadProcess.total) * 100 : 0;
      downloadProcess.speed = parseSpeed(torrentMatch[3]);

      continue;
    }

    // 3. Simple progress format: (50%) [DL:8000960B]
    const simpleMatch = trimmedLine.match(/\((\d+)%\).*?\[DL:([^\]]+)\]/i);
    if (simpleMatch) {
      downloadProcess.progress = parseFloat(simpleMatch[1]); // Keep as float for decimal precision
      downloadProcess.speed = parseSpeed(simpleMatch[2]);
      downloadProcess.eta = 0

      continue;
    }

    // 4. Completion messages
    if (trimmedLine === '(OK):download completed.') {
      // Only update progress and mark as completed if we have actual file progress
      downloadProcess.progress = 100
      downloadProcess.status = 'completed'

      continue;
    }

    // 5. Extract actual filename from aria2c segment file messages
    if (trimmedLine.includes('The segment file') && trimmedLine.includes('.aria2 does not exist')) {
      // Extract filename from: "The segment file /path/to/filename.aria2 does not exist"
      const filenameMatch = trimmedLine.match(/The segment file (.+)\.aria2 does not exist/);
      if (filenameMatch) {
        const fullPath = filenameMatch[1];
        const actualFilename = path.basename(fullPath);
        
        console.log(`Extracted actual filename: ${actualFilename} from path: ${fullPath}`);
        
        // Update the download process with the actual filename
        dbRun('UPDATE downloads SET filename = ? WHERE id = ?', [actualFilename, downloadId])
      }

      continue;
    }

    if (trimmedLine.includes('FILE: [MEMORY][METADATA]')) {
      const downloadProcess = globalActiveDownloads.get(downloadId)
      if (downloadProcess && (downloadProcess.downloadType === 'magnet' || downloadProcess.downloadType === 'torrent')) {
        // Reset progress tracking for the actual file download
        downloadProcess.progress = downloadProgress
      }

      continue
    }

    // 5. Error detection
    if (trimmedLine.includes('error occurred') ||
        trimmedLine.includes('failed to download') ||
        trimmedLine.includes('No such file or directory') ||
        trimmedLine.includes('Connection refused')) {
      console.error(`Download error [${downloadId}]:`, trimmedLine);

      downloadProcess.status = 'error'
      downloadProcess.progress = 0
    }
  }

  // update here
  updateDownloadProgress(downloadId, downloadProcess.progress, downloadProcess.speed, downloadProcess.eta);

  // if status update needed, update the status
  if (downloadProcess.status) {
    updateDownloadStatus(downloadId, downloadProcess.status, downloadProcess.progress)
  }
}

export const startAria2cDownload = async (download: Download): Promise<void> => {
  const { id, url, download_path, filename, progress = 0 } = download;
  await updateDownloadStatus(id, 'pending')

  if (globalActiveDownloads.has(id)) {
    console.warn(`Download ${id} is already active`);
    return;
  }

  const downloadType = detectDownloadType(url);

  // Build aria2c arguments with proper progress outpu  t
  const aria2cArgs = [
    // // Progress output settings - THIS IS THE KEY!
    '--console-log-level=info',    // Enable info level for progress
    '--summary-interval=1',        // Progress summary every second
    '--download-result=default',   // Show download results
    '--human-readable=false',

    // // Basic download options
    '--continue=true',
    '--max-tries=3',
    '--retry-wait=3',
    '--timeout=30',
    '--connect-timeout=10',

    // // Performance settings
    '--max-connection-per-server=10',
    '--split=4',
    '--min-split-size=1M',
    '--max-concurrent-downloads=1',

    // // Output
    '--file-allocation=none',
    `--dir=${download_path}`,
  ];

  // Type-specific arguments
  switch (downloadType) {
    case 'http':
      aria2cArgs.push(
        `--out=${filename}`,
        '--check-certificate=false',
        `${url}`
      );
      break;

    case 'magnet':
    case 'torrent':
      aria2cArgs.push(
        '--enable-dht=true',
        '--check-integrity=false',    // Don't re-download everything
        '--continue=true',            // Resume from where it left off
        '--auto-file-renaming=false', // Don't rename existing files
        '--allow-overwrite=false',    // Don't overwrite existing files
        '--bt-remove-unselected-file=false', // Keep all files
        '--enable-peer-exchange=true',
        '--bt-enable-lpd=true',
        '--seed-time=0',
        `${url}`
      );
      break;
  }

  console.log(`Starting ${downloadType} download: ${filename}`);

  await updateDownloadStatus(id, 'downloading')

  // Spawn aria2c process
  const aria2Process = spawn('aria2c', aria2cArgs, {
    stdio: ['ignore', 'pipe', 'pipe'], // We need both stdout and stderr
  });

  const downloadProcess: ActiveDownload = {
    process: aria2Process,
    progress: progress,
    speed: 0,
    downloaded: 0,
    eta: 0,
    total: 0,
    status: 'pending',
    downloadType,
  };

  globalActiveDownloads.set(id, downloadProcess);

  // Parse STDOUT for progress information
  aria2Process.stdout?.on('data', (data) => {
    const output = data.toString();
    parseAria2Output(output, download);
  });

  // Parse STDERR for additional progress and errors
  aria2Process.stderr?.on('data', (data) => {
    const output = data.toString();
    parseAria2Output(output, download);
  });

  // Handle process completion
  aria2Process.on('close', (code, signal) => {
    console.log(`Download ${id} finished: code=${code}, signal=${signal}`);

    if (signal === 'SIGINT' || code === 7) {
      // SIGINT means user paused, code=7 means aria2c thinks download is incomplete
      // Don't mark as completed - let user resume or restart
      console.log(`Download ${id} was paused or incomplete (code=${code})`);
      updateDownloadStatus(id, 'paused');
    } else if (code === 0 || signal === 'SIGTERM') {
      updateDownloadProgress(id, 100, 0, 0);
      updateDownloadStatus(id, 'completed', 100);
    } else if (code !== null) {
      updateDownloadStatus(id, 'error');
    }
  });

  aria2Process.on('error', (error) => {
    console.error(`Process error [${id}]:`, error.message);
    globalActiveDownloads.delete(id);
    updateDownloadStatus(id, 'error');
  });
};

// Control functions
export const pauseAria2cDownload = async (downloadId: string): Promise<void> => {
  if (globalActiveDownloads.has(downloadId)) {
    const downloadProcess = globalActiveDownloads.get(downloadId);
    await updateDownloadStatus(downloadId, 'paused', downloadProcess.progress);

    downloadProcess.process.kill('SIGINT');
    globalActiveDownloads.delete(downloadId)
  }

};

export const resumeAria2cDownload = async (download: Download): Promise<void> => {
  await startAria2cDownload(download);
};

export const deleteAria2Download = async (downloadId: string, deleteFile: boolean): Promise<void> => {
  const download = await dbGet('SELECT * FROM downloads WHERE id = ?', [downloadId])

  if (!download) {
    throw new Error('Download not found')
  }

  if (globalActiveDownloads.has(downloadId)) {
    const downloadProcess = globalActiveDownloads.get(downloadId)
    downloadProcess.process.kill('SIGKILL')
    globalActiveDownloads.delete(downloadId)
  }

  try {
    const filePath = path.normalize(path.join(download.download_path, download.filename))

    if (deleteFile) {
      const filestat = await fs.stat(filePath)
      if (filestat.isFile()) {
        await fs.unlink(filePath)
        console.log('Deleted file: ', filePath)
      } else if (filestat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true })
        console.log('Deleted directory: ', filePath)
      } else {
        console.log('Path is neither a file or directory.')
      }

      // Delete the .aria2 control file
      const aria2ControlFile = path.resolve(path.normalize(path.join(download.download_path, download.filename + '.aria2')));
      try {
        await fs.access(aria2ControlFile);
        await fs.unlink(aria2ControlFile);
        console.log(`Deleted aria2 control file: ${aria2ControlFile}`);
      } catch (_error) {
        console.log(`Aria2 control file not found: ${aria2ControlFile}`);
      }
    }
  } catch (fileError) {
    console.log({ fileError })
    console.log('Could not delete file: ', fileError)
  }

  // Remove from database
  await dbRun('DELETE FROM downloads WHERE id = ?', [downloadId])
}

export const checkAria2cInstalled = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const checkProcess = spawn('aria2c', ['--version']);
    checkProcess.on('close', (code) => resolve(code === 0));
    checkProcess.on('error', () => resolve(false));
  });
};

export const getDownloadType = detectDownloadType;
