import { useState, useEffect } from 'react'
import api from '../utils/api'

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    logoUrl: '',
    description: '',
    contactPerson: '',
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/companies?limit=200')
      setCompanies(response.data.companies || response.data)
    } catch (err) {
      console.error('Failed to fetch companies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setSubmitLoading(true)

    try {
      if (editingId) {
        await api.put(`/admin/companies/${editingId}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          logoUrl: formData.logoUrl,
          description: formData.description,
          contact_person: formData.contactPerson,
        })
        setFormSuccess('Company updated successfully!')
      } else {
        await api.post('/admin/companies', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          logoUrl: formData.logoUrl,
          description: formData.description,
          contact_person: formData.contactPerson,
        })
        setFormSuccess('Company created successfully!')
      }

      setFormData({ name: '', email: '', phone: '', website: '', logoUrl: '', description: '', contactPerson: '' })
      setEditingId(null)
      setShowForm(false)
      fetchCompanies()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (company) => {
    setFormData({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      logoUrl: company.logoUrl || company.logo_url || '',
      description: company.description || '',
      contactPerson: company.contactPerson || company.contact_person || '',
    })
    setEditingId(company.id)
    setShowForm(true)
    setFormError('')
    setFormSuccess('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return
    try {
      await api.delete(`/admin/companies/${id}`)
      fetchCompanies()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete company')
    }
  }

  const filteredCompanies = companies.filter((company) => {
    const q = searchQuery.toLowerCase()
    return (
      (company.name || '').toLowerCase().includes(q) ||
      (company.email || '').toLowerCase().includes(q) ||
      (company.contactPerson || company.contact_person || '').toLowerCase().includes(q)
    )
  })

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
    title: { fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1a1a1a' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    addButton: { padding: '10px 20px', backgroundColor: '#15803d', color: '#fff', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.95rem' },
    controls: { display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' },
    searchInput: { flex: '1', minWidth: '200px', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none' },
    formCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', marginBottom: '1.5rem' },
    formTitle: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#1a1a1a' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.375rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none' },
    textarea: { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' },
    formActions: { display: 'flex', gap: '1rem', marginTop: '1rem' },
    saveButton: { padding: '10px 24px', backgroundColor: '#15803d', color: '#fff', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' },
    cancelButton: { padding: '10px 24px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' },
    errorText: { color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' },
    successText: { color: '#15803d', fontSize: '0.85rem', marginBottom: '0.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
    card: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem' },
    logo: { width: '50px', height: '50px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700', color: '#15803d', overflow: 'hidden' },
    logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
    cardName: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a' },
    cardText: { fontSize: '0.85rem', color: '#6b7280' },
    cardLink: { fontSize: '0.85rem', color: '#1d4ed8', textDecoration: 'none' },
    cardActions: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' },
    editButton: { padding: '6px 16px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.85rem' },
    deleteButton: { padding: '6px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.85rem' },
    loading: { textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' },
    empty: { textAlign: 'center', padding: '3rem 1rem', color: '#6b7280', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' },
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading companies...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Manage Companies</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', email: '', phone: '', website: '', logoUrl: '', description: '', contactPerson: '' }) }} style={styles.addButton}>
          {showForm ? 'Cancel' : '+ New Company'}
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>{editingId ? 'Edit Company' : 'Create New Company'}</h3>
          {formError && <p style={styles.errorText}>{formError}</p>}
          {formSuccess && <p style={styles.successText}>{formSuccess}</p>}
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Company Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleFormChange} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleFormChange} style={styles.input} placeholder="https://..." />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Logo URL</label>
                <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleFormChange} style={styles.input} placeholder="https://..." />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contact Person</label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} style={styles.input} />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleFormChange} style={styles.textarea} />
            </div>
            <div style={styles.formActions}>
              <button type="submit" disabled={submitLoading} style={styles.saveButton}>
                {submitLoading ? 'Saving...' : editingId ? 'Update Company' : 'Create Company'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} style={styles.cancelButton}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.controls}>
        <input type="text" placeholder="Search companies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.searchInput} />
      </div>

      {filteredCompanies.length === 0 ? (
        <div style={styles.empty}>No companies found</div>
      ) : (
        <div style={styles.grid}>
          {filteredCompanies.map((company) => (
            <div key={company.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.logo}>
                  {company.logoUrl || company.logo_url ? (
                    <img src={company.logoUrl || company.logo_url} alt={company.name} style={styles.logoImg} />
                  ) : (
                    (company.name || 'C').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div style={styles.cardName}>{company.name}</div>
                  {company.contactPerson && <div style={styles.cardText}>Contact: {company.contactPerson}</div>}
                </div>
              </div>
              {company.email && <div style={styles.cardText}>📧 {company.email}</div>}
              {company.phone && <div style={styles.cardText}>📞 {company.phone}</div>}
              {company.website && <a href={company.website} target="_blank" rel="noreferrer" style={styles.cardLink}>🌐 {company.website}</a>}
              {company.description && <div style={styles.cardText}>{company.description}</div>}
              <div style={styles.cardActions}>
                <button onClick={() => handleEdit(company)} style={styles.editButton}>Edit</button>
                <button onClick={() => handleDelete(company.id)} style={styles.deleteButton}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminCompanies
