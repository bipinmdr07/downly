'use client'

import { useState, useEffect } from 'react'
import { Header } from './Header'
import { AddDownloadForm } from './AddDownloadForm'
import { DownloadList } from '@/components/DownloadList'
import { useToast } from '@/hooks/use-toast'

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
  added_at: Date
}

export function DownloadManager() {
  const [downloads, setDownloads] = useState<Download[]>([])
  const { toast } = useToast()

  // Load downloads from API on mount
  useEffect(() => {
    fetchDownloads()

    const eventSource = new EventSource('/api/events')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'download_update' || data.type === 'progress_update') {
        updateDownload(data.id, data.updates)
      }
    }

    const cleanup = () => {
      eventSource.close()
    }

    window.addEventListener("pagehide", cleanup);
    window.addEventListener("beforeunload", cleanup)

    return () => {
      cleanup()
      window.removeEventListener("pagehide", cleanup);
      window.removeEventListener("beforeunload", cleanup)
    }
  }, [])

  const fetchDownloads = async () => {
    try {
      const response = await fetch('/api/downloads')
      const data = await response.json()
      setDownloads(data)
    } catch (error) {
      console.error('Failed to fetch downloads:', error)
    }
  }

  const addDownload = async (url: string, downloadPath: string) => {
    try {
      const response = await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, downloadPath })
      })

      if (response.ok) {
        const newDownload = await response.json()
        setDownloads(prev => [...prev, newDownload])
        toast({
          title: 'Download Added',
          description: `Started downloading ${newDownload.filename}`,
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to add download',
        variant: 'destructive',
      })
    }
  }

  const updateDownload = (id: string, updates: Partial<Download>) => {
    setDownloads(prev =>
      prev.map(download =>
        download.id === id ? { ...download, ...updates } : download
      )
    )
  }

  const removeDownload = async (id: string, deleteFile: boolean) => {
    try {
      await fetch(`/api/downloads/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ deleteFile })
      })
      setDownloads(prev => prev.filter(download => download.id !== id))
      toast({
        title: 'Download Removed',
        description: 'Download has been removed from the list',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to remove download',
        variant: 'destructive',
      })
    }
  }

  const pauseDownload = async (id: string) => {
    try {
      await fetch(`/api/downloads/${id}/pause`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to pause download:', error)
    }
  }

  const resumeDownload = async (id: string) => {
    try {
      const response = await fetch(`/api/downloads/${id}/resume`, { method: 'POST' })
      const data = await response.json()

      setDownloads(prev => prev.map((item) => item.id === data.id ? data : item))
    } catch (error) {
      console.error('Failed to resume download:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header downloadCount={downloads.length} />
      <main className="container mx-auto p-6 space-y-6">
        <AddDownloadForm onAddDownload={addDownload} />
        <DownloadList
          downloads={downloads}
          onPause={pauseDownload}
          onResume={resumeDownload}
          onRemove={removeDownload}
        />
      </main>
    </div>
  )
}
