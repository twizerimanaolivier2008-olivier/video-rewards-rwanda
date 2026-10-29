import { useState, useEffect } from 'react'
import api from '../utils/api'

const AdminVideos = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnail: '',
    category: 'general',
    duration: 0,
    rewardPoints: 10,
  })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  const categories = ['general', 'education', 'entertainment', 'music', 'sports', 'news', 'lifestyle']

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/videos')
      setVideos(response.data.videos || response.data)
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' || name === 'rewardPoints' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setSubmitLoading(true)

    try {
      if (editingId) {
        await api.put(`/admin/videos/${editingId}`, formData)
        setFormSuccess('Video updated successfully!')
      } else {
        await api.post('/admin/videos', formData)
        setFormSuccess('Video created successfully!')
      }

      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnail: '',
        category: 'general',
        duration: 0,
        rewardPoints: 10,
      })
      setEditingId(null)
      setShowForm(false)
      fetchVideos()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (video) => {
    setFormData({
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail,
      category: video.category,
      duration: video.duration,
      rewardPoints: video.rewardPoints,
    })
    setEditingId(video._id || video.id)
    setShowForm(true)
    setFormError('')
    setFormSuccess('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return

    try {
      await api.delete(`/admin/videos/${id}`)
      fetchVideos()
    } catch (err) {
      console.error('Failed to delete video:', err)
    }
  }

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' || video.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      color: '#1a1a1a',
    },
    controls: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '1.5rem',
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
    addButton: {
      padding: '10px 20px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.95rem',
    },
    formCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '1.5rem',
    },
    formTitle: {
      fontSize: '1.1rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.375rem',
      fontWeight: '600',
      fontSize: '0.9rem',
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      outline: 'none',
    },
    textarea: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      outline: 'none',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
    },
    formActions: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1rem',
    },
    saveButton: {
      padding: '10px 24px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
    },
    cancelButton: {
      padding: '10px 24px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
    },
    errorText: {
      color: '#dc2626',
      fontSize: '0.85rem',
      marginBottom: '0.5rem',
    },
    successText: {
      color: '#15803d',
      fontSize: '0.85rem',
      marginBottom: '0.5rem',
    },
    tableContainer: {
      overflowX: 'auto',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '10px 12px',
      backgroundColor: '#f9fafb',
      fontWeight: '600',
      fontSize: '0.8rem',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #e5e7eb',
    },
    td: {
      padding: '10px 12px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.85rem',
      color: '#374151',
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    editButton: {
      padding: '4px 12px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.8rem',
    },
    deleteButton: {
      padding: '4px 12px',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.8rem',
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
        <div style={styles.loading}>Loading videos...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={styles.title}>Manage Videos</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          {showForm ? 'Cancel' : '+ New Video'}
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingId ? 'Edit Video' : 'Create New Video'}
          </h3>

          {formError && <p style={styles.errorText}>{formError}</p>}
          {formSuccess && <p style={styles.successText}>{formSuccess}</p>}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  style={styles.input}
                  placeholder="Video title"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  style={styles.select}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Video URL</label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleFormChange}
                  style={styles.input}
                  placeholder="https://..."
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Thumbnail URL</label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleFormChange}
                  style={styles.input}
                  placeholder="https://..."
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Duration (seconds)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleFormChange}
                  style={styles.input}
                  min="0"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Reward Points</label>
                <input
                  type="number"
                  name="rewardPoints"
                  value={formData.rewardPoints}
                  onChange={handleFormChange}
                  style={styles.input}
                  min="1"
                  required
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                style={styles.textarea}
                placeholder="Video description"
                required
              />
            </div>
            <div style={styles.formActions}>
              <button type="submit" disabled={submitLoading} style={styles.saveButton}>
                {submitLoading ? 'Saving...' : editingId ? 'Update Video' : 'Create Video'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({
                    title: '',
                    description: '',
                    videoUrl: '',
                    thumbnail: '',
                    category: 'general',
                    duration: 0,
                    rewardPoints: 10,
                  })
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Duration</th>
              <th style={styles.th}>Points</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                  No videos found
                </td>
              </tr>
            ) : (
              filteredVideos.map((video) => (
                <tr key={video._id || video.id}>
                  <td style={styles.td}>{video.title}</td>
                  <td style={styles.td}>{video.category || 'general'}</td>
                  <td style={styles.td}>
                    {Math.floor((video.duration || 0) / 60)}:
                    {((video.duration || 0) % 60).toString().padStart(2, '0')}
                  </td>
                  <td style={styles.td}>{video.rewardPoints ?? 10}</td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button onClick={() => handleEdit(video)} style={styles.editButton}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(video._id || video.id)} style={styles.deleteButton}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminVideos