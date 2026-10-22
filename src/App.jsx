import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://localhost:8080/api/employees'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  salary: '',
  dateOfJoining: '',
}

function App() {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [credentials, setCredentials] = useState(null)
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!credentials) return

    let cancelled = false

    async function loadEmployees() {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(API_URL, {
          auth: credentials,
          params: search.trim() ? { q: search.trim() } : {},
        })
        if (!cancelled) setEmployees(response.data)
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 401) {
            setCredentials(null)
            setError('Login failed or your session was rejected. Check your admin credentials.')
          } else {
            setError(err.response?.data?.message || 'Could not load employees. Check that the backend is running.')
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadEmployees()
    return () => {
      cancelled = true
    }
  }, [credentials, search])

  async function login(event) {
    event.preventDefault()
    setError('')
    setCredentials({
      username: loginForm.username,
      password: loginForm.password,
    })
  }

  function startEditing(employee) {
    setEditingId(employee.id)
    setForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      designation: employee.designation || '',
      salary: String(employee.salary ?? ''),
      dateOfJoining: employee.dateOfJoining || '',
    })
    setError('')
    setShowForm(true)
  }

  function startAdding() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
    setShowForm((current) => !current)
  }

  async function addEmployee(event) {
    event.preventDefault()
    if (!credentials) return

    setError('')

    try {
      const employeeData = {
        ...form,
        salary: Number(form.salary),
      }

      if (editingId !== null) {
        await axios.put(`${API_URL}/${editingId}`, employeeData, {
          auth: credentials,
        })
      } else {
        await axios.post(API_URL, employeeData, {
          auth: credentials,
        })
      }

      setForm({ ...emptyForm })
      setEditingId(null)
      setShowForm(false)

      const response = await axios.get(API_URL, {
        auth: credentials,
        params: search.trim() ? { q: search.trim() } : {},
      })
      setEmployees(response.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.response?.status === 401
            ? 'Authentication failed. Please log in again.'
            : 'Could not save employee. Check the fields and try again.')
      )
    }
  }

  async function deleteEmployee(id) {
    if (!window.confirm('Are you sure you want to delete this employee?')) return

    setError('')
    try {
      await axios.delete(`${API_URL}/${id}`, { auth: credentials })
      const response = await axios.get(API_URL, {
        auth: credentials,
        params: search.trim() ? { q: search.trim() } : {},
      })
      setEmployees(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete employee. Please try again.')
    }
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
  }

  function logout() {
    setCredentials(null)
    setEmployees([])
    setLoginForm({ username: '', password: '' })
    setSearch('')
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
  }

  const departments = new Set(employees.map((employee) => employee.department))

  if (!credentials) {
    return (
      <main className="main-content" style={{ maxWidth: 420, margin: '80px auto' }}>
        <section className="form-card">
          <h1>EmployEase Login</h1>
          <p>Sign in using your backend admin credentials.</p>
          {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
          <form onSubmit={login} className="employee-form">
            <input
              placeholder="Admin username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              required
              autoComplete="username"
            />
            <input
              placeholder="Admin password"
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
              autoComplete="current-password"
            />
            <button className="primary-button" type="submit">Sign In</button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">E</div>
          <span>Employ<span className="brand-light">Ease</span></span>
        </div>

        <p className="nav-heading">WORKSPACE</p>
        <div className="nav-item active">▦ <span>Dashboard</span></div>
        <div className="nav-item">♙ <span>Employees</span></div>
        <div className="nav-item">◈ <span>Departments</span></div>

        <div className="sidebar-bottom">
          <div className="avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <small>Management</small>
          </div>
          <button className="secondary-button" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">WORKSPACE / OVERVIEW</p>
            <h1>Employee Dashboard</h1>
            <p className="subtitle">Welcome back! Here's what's happening with your team.</p>
          </div>
          <button className="primary-button" onClick={startAdding}>+ Add Employee</button>
        </header>

        {error && (
          <p role="alert" style={{ color: 'crimson', marginBottom: 16 }}>{error}</p>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">♙</div>
            <p>Total Employees</p>
            <h2>{employees.length}</h2>
            <small>Employees matching your search</small>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">▦</div>
            <p>Departments</p>
            <h2>{departments.size}</h2>
            <small>Unique departments</small>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Active Employees</p>
            <h2>{employees.length}</h2>
            <small>Currently listed employees</small>
          </div>
        </section>

        {showForm && (
          <section className="form-card">
            <h2>{editingId !== null ? 'Edit Employee' : 'Add New Employee'}</h2>
            <form onSubmit={addEmployee} className="employee-form">
              <input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
              <input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
              <input
                placeholder="Email address"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                placeholder="Phone number (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                placeholder="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
              <input
                placeholder="Designation / job title"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                required
              />
              <input
                placeholder="Salary"
                type="number"
                min="0"
                step="0.01"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                required
              />
              <label>
                Date of joining
                <input
                  type="date"
                  value={form.dateOfJoining}
                  onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                {editingId !== null ? 'Update Employee' : 'Save Employee'}
              </button>
              <button className="secondary-button" type="button" onClick={cancelForm}>
                Cancel
              </button>
            </form>
          </section>
        )}

        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>All Employees</h2>
              <p>Manage your team members and their information.</p>
            </div>
            <input
              className="search-input"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && <p>Loading employees...</p>}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>DEPARTMENT</th>
                  <th>JOB TITLE</th>
                  <th>EMAIL</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {employee.firstName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{employee.firstName} {employee.lastName}</strong>
                          <small>{employee.phone || 'No phone provided'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>
                    <td>{employee.email}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => startEditing(employee)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => deleteEmployee(employee.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && employees.length === 0 && (
                  <tr>
                    <td colSpan="5">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
