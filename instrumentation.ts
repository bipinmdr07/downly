export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { dbAll, startDownload, updateDownloadProgress } = require("@/pages/api/downloads")

    const downloads = await dbAll('SELECT * FROM downloads WHERE status not in (?, ?)', ['paused', 'completed'])

    console.log(`Resuming past ${downloads.length} downloads.`)

    downloads.forEach((download) => {
      updateDownloadProgress(download.id, 'downloading')
      startDownload(download)
    })
  }
}
