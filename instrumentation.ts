import { Download } from "./pages/api/downloads"

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startDownload, updateDownloadProgress } = require("@/pages/api/downloads")
    const { dbAll } = require("@/lib/db")

    const downloads = await dbAll('SELECT * FROM downloads WHERE status not in (?, ?)', ['paused', 'completed'])

    console.log(`Resuming past ${downloads.length} downloads.`)

    downloads.forEach((download: Download) => {
      updateDownloadProgress(download.id, 'downloading')
      startDownload(download)
    })
  }
}
