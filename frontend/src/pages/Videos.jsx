import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useVideos } from '../hooks/useVideos'

const Videos = () => {
  const { videos, loading, error, fetchVideos } = useVideos()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const categories = ['all', 'education', 'entertainment', 'music', 'sports', 'news', 'lifestyle']

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' || video.category === categoryFilter
    return matchesSearch && matchesCategory
  })

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
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      color: '#1a1a1a',
    },
    controls: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '2rem',
      alignItems: 'center',
    },
    searchInput: {
      flex: '1',
      minWidth: '200px',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      outline: 'none',
    },
    select: {
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      backgroundColor: '#ffffff',
      outline: 'none',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      border: '1px solid #e5e7eb',
    },
    thumbnail: {
      width: '100%',
      height: '180px',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    thumbnailImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    durationBadge: {
      position: 'absolute',
      bottom: '8px',
      right: '8px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: '#ffffff',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      fontWeight: '600',
    },
    playIcon: {
      fontSize: '3rem',
      color: '#ffffff',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: 0.9,
    },
    cardBody: {
      padding: '1rem',
    },
    cardTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#1a1a1a',
      lineHeight: '1.4',
    },
    cardMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.75rem',
    },
    categoryBadge: {
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
    },
    rewardBadge: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
    },
    watchButton: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.95rem',
      transition: 'background-color 0.2s',
    },
    loading: {
      textAlign: 'center',
      padding: '4rem 1rem',
      fontSize: '1.1rem',
      color: '#6b7280',
    },
    error: {
      textAlign: 'center',
      padding: '4rem 1rem',
      color: '#dc2626',
      fontSize: '1.1rem',
    },
    retryButton: {
      marginTop: '1rem',
      padding: '8px 20px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
    },
    noResults: {
      textAlign: 'center',
      padding: '4rem 1rem',
      color: '#6b7280',
    },
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Videos</h1>
        <div style={styles.loading}>Loading videos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Videos</h1>
        <div style={styles.error}>
          <p>Failed to load videos: {error}</p>
          <button onClick={fetchVideos} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Watch Videos</h1>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={styles.select}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filteredVideos.length === 0 ? (
        <div style={styles.noResults}>
          <p>No videos found matching your criteria.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredVideos.map((video) => (
            <div key={video._id || video.id} style={styles.card}>
              <div style={styles.thumbnail}>
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={styles.thumbnailImg}
                  />
                )}
                <div style={styles.playIcon}>▶</div>
                <span style={styles.durationBadge}>
                  {formatDuration(video.duration || 0)}
                </span>
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{video.title}</h3>
                <div style={styles.cardMeta}>
                  <span style={styles.categoryBadge}>
                    {video.category || 'general'}
                  </span>
                  <span style={styles.rewardBadge}>
                    +{video.rewardPoints || 10} pts
                  </span>
                </div>
                <Link to={`/video/${video._id || video.id}`} style={{ textDecoration: 'none' }}>
                  <button style={styles.watchButton}>Watch Now</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Videos