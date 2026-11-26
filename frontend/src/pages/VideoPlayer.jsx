import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useVideos } from '../hooks/useVideos'
import api from '../utils/api'

const VideoPlayer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { videos, watchVideo } = useVideos()
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [watching, setWatching] = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const [sessionToken, setSessionToken] = useState('')
  const [playing, setPlaying] = useState(false)
  const [sessionMessage, setSessionMessage] = useState('Start a secure watch session before playing to earn rewards.')
  const [relatedVideos, setRelatedVideos] = useState([])

  const playerRef = useRef(null)

  useEffect(() => {
    const found = videos.find((v) => v._id === id || v.id === id)
    if (found) {
      setVideo(found)
      setLoading(false)
      const related = videos.filter((v) => (v._id !== id && v.id !== id) && v.category === found.category)
      setRelatedVideos(related.slice(0, 5))
    } else {
      const fetchVideo = async () => {
        try {
          const response = await api.get(`/videos/${id}`)
          setVideo(response.data)
          const relatedRes = await api.get(`/videos?category=${response.data.category}&limit=5`)
          setRelatedVideos(relatedRes.data.videos || relatedRes.data)
        } catch (err) {
          console.error('Failed to fetch video:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchVideo()
    }
  }, [id, videos])

  const handleWatch = async () => {
    setWatching(true)
    try {
      if (!sessionToken) {
        const session = await api.post(`/videos/${id}/watch/start`)
        setSessionToken(session.data.sessionToken)
        setWatchProgress(0)
        setSessionMessage('Secure session started. Play the video at normal speed; progress is checked by the server.')
        return
      }

      if (watchProgress < 90) {
        setSessionMessage('Keep the video playing. At least 90% of server-verified watch time is required.')
        return
      }

      const result = await api.post(`/videos/${id}/watch/complete`, { sessionToken })
      setWatchProgress(100)
      setSessionMessage(`Reward credited: ${result.data.earnedPoints} points and ${result.data.earnedAmount} RWF.`)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      const message = err.response?.data?.error || 'Could not process this watch session.'
      setSessionMessage(message)
    } finally {
      setWatching(false)
    }
  }

  useEffect(() => {
    if (!sessionToken || !playing) return undefined
    let heartbeatInFlight = false
    const sendHeartbeat = async () => {
      const player = playerRef.current
      if (!player || player.paused || player.seeking || document.visibilityState !== 'visible' || heartbeatInFlight) return
      heartbeatInFlight = true
      try {
        const response = await api.post(`/videos/${id}/watch/progress`, {
          sessionToken,
          currentTimeSeconds: player.currentTime,
        })
        setWatchProgress(response.data.progressPercent || 0)
        if (response.data.canClaimReward) {
          setSessionMessage('You have enough verified watch time. Claim your reward.')
        }
      } catch (err) {
        const message = err.response?.data?.error
        if (message) setSessionMessage(message)
      } finally {
        heartbeatInFlight = false
      }
    }
    const interval = window.setInterval(sendHeartbeat, 5000)
    return () => window.clearInterval(interval)
  }, [id, sessionToken, playing])

  const handleTimeUpdate = () => {
    // UI playback position is not treated as proof of earned watch time.
  }

  const handleVideoEnded = async (event) => {
    setPlaying(false)
    if (!sessionToken) return
    try {
      const response = await api.post(`/videos/${id}/watch/progress`, {
        sessionToken,
        currentTimeSeconds: event.currentTarget.currentTime,
      })
      setWatchProgress(response.data.progressPercent || 0)
      if (response.data.canClaimReward) {
        setSessionMessage('Video finished. Your server-verified watch time qualifies; claim your reward.')
      } else {
        setSessionMessage('The server has not yet recorded enough watch time for this video.')
      }
    } catch (err) {
      setSessionMessage(err.response?.data?.error || 'Could not record the final playback checkpoint.')
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    playerContainer: {
      position: 'relative',
      backgroundColor: '#000000',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '1.5rem',
      aspectRatio: '16/9',
    },
    videoPlayer: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
    progressBar: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: '4px',
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#15803d',
      width: `${watchProgress}%`,
      transition: 'width 0.3s ease',
    },
    videoInfo: {
      marginBottom: '2rem',
    },
    videoTitle: {
      fontSize: '1.75rem',
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: '0.5rem',
    },
    videoDescription: {
      color: '#6b7280',
      lineHeight: '1.6',
      marginBottom: '1rem',
    },
    videoMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      alignItems: 'center',
    },
    rewardBadge: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '4px 14px',
      borderRadius: '20px',
      fontWeight: '700',
      fontSize: '0.95rem',
    },
    categoryBadge: {
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      padding: '4px 14px',
      borderRadius: '20px',
      fontWeight: '600',
      fontSize: '0.9rem',
    },
    watchButton: {
      padding: '12px 32px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '700',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'background-color 0.2s',
    },
    watchButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    successMessage: {
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontWeight: '600',
    },
    sidebarTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    relatedGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    relatedCard: {
      display: 'flex',
      gap: '1rem',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    relatedThumbnail: {
      width: '120px',
      height: '68px',
      backgroundColor: '#f3f4f6',
      borderRadius: '6px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
    },
    relatedInfo: {
      flex: 1,
    },
    relatedTitle: {
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '0.25rem',
    },
    relatedPoints: {
      fontSize: '0.8rem',
      color: '#15803d',
      fontWeight: '600',
    },
    layout: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '2rem',
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#15803d',
      fontWeight: '600',
      marginBottom: '1rem',
    },
    loading: {
      textAlign: 'center',
      padding: '4rem 1rem',
      color: '#6b7280',
    },
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading video...</div>
      </div>
    )
  }

  if (!video) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <p>Video not found</p>
          <Link to="/videos" style={{ color: '#15803d', fontWeight: '600' }}>
            Back to Videos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <Link to="/videos" style={styles.backLink}>
        ← Back to Videos
      </Link>

      <div style={styles.playerContainer}>
        {video.videoUrl && (
          <video
            ref={playerRef}
            src={video.videoUrl}
            style={styles.videoPlayer}
            controls
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={handleVideoEnded}
            onRateChange={(event) => {
              if (event.currentTarget.playbackRate > 1.25) event.currentTarget.playbackRate = 1;
            }}
            onLoadedMetadata={() => setPlaying(false)}
          />
        )}
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
      </div>

      <div style={styles.layout}>
        <div>
          <div style={styles.successMessage} role="status">
            {sessionMessage}
          </div>

          <div style={styles.videoInfo}>
            <h1 style={styles.videoTitle}>{video.title}</h1>
            <p style={styles.videoDescription}>{video.description}</p>

            <div style={styles.videoMeta}>
              <span style={styles.categoryBadge}>{video.category || 'general'}</span>
              <span style={styles.rewardBadge}>
                +{video.rewardPoints || 10} points
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                {formatDuration(video.duration || 0)}
              </span>
            </div>
          </div>

          <button
            onClick={handleWatch}
            disabled={watching || watchProgress >= 100}
            style={{
              ...styles.watchButton,
              ...((watching || watchProgress >= 100) ? styles.watchButtonDisabled : {}),
            }}
          >
            {watching
              ? 'Processing...'
              : watchProgress >= 100
              ? '✓ Reward credited'
              : !sessionToken
              ? '▶ Start secure watch session'
              : watchProgress >= 90
              ? 'Claim reward'
              : 'Keep watching to unlock reward'}
          </button>
        </div>

        <div>
          <h3 style={styles.sidebarTitle}>Related Videos</h3>
          <div style={styles.relatedGrid}>
            {relatedVideos.map((related) => (
              <Link
                key={related._id || related.id}
                to={`/video/${related._id || related.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={styles.relatedCard}>
                  <div style={styles.relatedThumbnail}>▶</div>
                  <div style={styles.relatedInfo}>
                    <div style={styles.relatedTitle}>{related.title}</div>
                    <div style={styles.relatedPoints}>
                      +{related.rewardPoints || 10} pts
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {relatedVideos.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                No related videos found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer