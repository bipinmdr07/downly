import { Download } from "./pages/api/downloads"

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startDownload, updateDownloadProgress } = require("@/pages/api/downloads")
    const { dbAll, initDB } = require("@/lib/db")

    try {
      await initDB()
    } catch (error) {
      console.error(error)
      console.error('Error when initializting database')
    }

    const downloads = await dbAll('SELECT * FROM downloads WHERE status not in (?, ?)', ['paused', 'completed'])

    console.log(`Resuming past ${downloads.length} downloads.`)

    downloads.forEach((download: Download) => {
      updateDownloadProgress(download.id, 'downloading')
      startDownload(download)
    })
  }
}
