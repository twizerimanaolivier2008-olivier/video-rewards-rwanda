import { useState, useEffect } from 'react'
import api from '../utils/api'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    accountType: 'free',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/users?limit=200')
      setUsers(response.data.users || response.data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
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
        await api.put(`/admin/users/${editingId}`, {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phone,
          role: formData.role,
          account_type: formData.accountType,
        })
        setFormSuccess('User updated successfully!')
      } else {
        await api.post('/admin/users', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          account_type: formData.accountType,
        })
        setFormSuccess('User created successfully!')
      }

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
        accountType: 'free',
      })
      setEditingId(null)
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (user) => {
    setFormData({
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      email: user.email || '',
      phone: user.phoneNumber || user.phone_number || '',
      password: '',
      role: user.role || 'user',
      accountType: user.accountType || user.account_type || 'free',
    })
    setEditingId(user.id)
    setShowForm(true)
    setFormError('')
    setFormSuccess('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/status`)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.firstName || user.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.lastName || user.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phoneNumber || user.phone_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
    title: { fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1a1a1a' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    addButton: { padding: '10px 20px', backgroundColor: '#15803d', color: '#fff', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.95rem' },
    controls: { display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' },
    searchInput: { flex: '1', minWidth: '200px', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none' },
    select: { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', backgroundColor: '#fff', outline: 'none' },
    formCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', marginBottom: '1.5rem' },
    formTitle: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#1a1a1a' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.375rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none' },
    formActions: { display: 'flex', gap: '1rem', marginTop: '1rem' },
    saveButton: { padding: '10px 24px', backgroundColor: '#15803d', color: '#fff', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' },
    cancelButton: { padding: '10px 24px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' },
    errorText: { color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' },
    successText: { color: '#15803d', fontSize: '0.85rem', marginBottom: '0.5rem' },
    tableContainer: { overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#fff' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px 12px', backgroundColor: '#f9fafb', fontWeight: '600', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '0.85rem', color: '#374151' },
    actionButtons: { display: 'flex', gap: '0.5rem' },
    editButton: { padding: '4px 12px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.8rem' },
    deleteButton: { padding: '4px 12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.8rem' },
    toggleButton: { padding: '4px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.8rem' },
    loading: { textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' },
    roleBadge: (role) => ({
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      backgroundColor: role === 'admin' ? '#fef3c7' : '#f0fdf4',
      color: role === 'admin' ? '#92400e' : '#15803d',
    }),
    statusBadge: (active) => ({
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      backgroundColor: active ? '#f0fdf4' : '#fef2f2',
      color: active ? '#15803d' : '#dc2626',
    }),
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading users...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Manage Users</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user', accountType: 'free' }) }} style={styles.addButton}>
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>{editingId ? 'Edit User' : 'Create New User'}</h3>
          {formError && <p style={styles.errorText}>{formError}</p>}
          {formSuccess && <p style={styles.successText}>{formSuccess}</p>}
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleFormChange} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleFormChange} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} style={styles.input} required />
              </div>
              {!editingId && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleFormChange} style={styles.input} required />
                </div>
              )}
              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <select name="role" value={formData.role} onChange={handleFormChange} style={styles.select}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Account Type</label>
                <select name="accountType" value={formData.accountType} onChange={handleFormChange} style={styles.select}>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
            <div style={styles.formActions}>
              <button type="submit" disabled={submitLoading} style={styles.saveButton}>
                {submitLoading ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} style={styles.cancelButton}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.controls}>
        <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.searchInput} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={styles.select}>
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>No users found</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.firstName || user.first_name || '—'} {user.lastName || user.last_name || ''}</td>
                  <td style={styles.td}>{user.email || '—'}</td>
                  <td style={styles.td}>{user.phoneNumber || user.phone_number || '—'}</td>
                  <td style={styles.td}><span style={styles.roleBadge(user.role)}>{user.role || 'user'}</span></td>
                  <td style={styles.td}><span style={styles.statusBadge(user.isActive ?? user.is_active ?? true)}>{user.isActive === false || user.is_active === false ? 'Inactive' : 'Active'}</span></td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button onClick={() => handleEdit(user)} style={styles.editButton}>Edit</button>
                      <button onClick={() => handleToggleStatus(user)} style={styles.toggleButton}>
                        {user.isActive === false || user.is_active === false ? 'Activate' : 'Deactivate'}
                      </button>
                      <button onClick={() => handleDelete(user.id)} style={styles.deleteButton}>Delete</button>
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

export default AdminUsers
