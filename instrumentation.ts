export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { dbAll, startDownload, updateDownloadProgress } = require("@/pages/api/downloads")

    const downloads = await dbAll('SELECT * FROM downloads WHERE status not in (?, ?)', ['paused', 'completed'])

    downloads.forEach((download) => {
      updateDownloadProgress(download.id, 'downloading')
      startDownload(download)
    })
  }
}
