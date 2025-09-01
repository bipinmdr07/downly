import { Download } from "./pages/api/downloads"

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startDownload } = require("@/pages/api/downloads")
    const { dbAll, initDB } = require("@/lib/db")
    const { checkAria2cInstalled } = require("@/lib/aria2c")

    try {
      await initDB()
    } catch (error) {
      console.error(error)
      console.error('Error when initializting database')
    }

    const isAriaInstalled = await checkAria2cInstalled()

    if (!isAriaInstalled) {
      console.error("Missing dependency aria2c, please install and try again")
      process.exit(1)
    }

    const downloads = await dbAll('SELECT * FROM downloads WHERE status not in (?, ?)', ['paused', 'completed'])

    console.log(`Resuming ${downloads.length} downloads.`)

    downloads.forEach((download: Download) => {
      startDownload(download)
    })
  }
}
