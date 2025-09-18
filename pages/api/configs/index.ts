import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      config: {
        isDocker: process.env.IS_DOCKER === 'true',
        downloadPath: process.env.DOWNLOAD_LOCATION
      }
    })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(403).end(`Method ${req.method} Not Allowed`)
  }
}
