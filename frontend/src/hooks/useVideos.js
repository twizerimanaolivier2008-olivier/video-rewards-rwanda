import { useState, useEffect } from 'react'
import api from '../utils/api'

export const useVideos = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchVideos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/videos')
      setVideos(response.data.videos || response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const watchVideo = async (videoId) => {
    const response = await api.post(`/videos/${videoId}/watch`)
    return response.data
  }

  const getWatchHistory = async () => {
    const response = await api.get('/videos/history')
    return response.data
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  return {
    videos,
    loading,
    error,
    fetchVideos,
    watchVideo,
    getWatchHistory
  }
}
