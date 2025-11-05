import { useEffect, useMemo, useState } from 'react'

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Other']
const STORAGE_KEY = 'expenses_v1'

function formatToday() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function App() {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date, setDate] = useState(formatToday())
  const [filter, setFilter] = useState('All')
  const [expenses, setExpenses] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'All') return expenses
    return expenses.filter(e => e.category === filter)
  }, [expenses, filter])

  const totalsByCategory = useMemo(() => {
    const totals = {}
    for (const c of CATEGORIES) totals[c] = 0
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    }
    return totals
  }, [expenses])

  const overallTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  // Inline edit state
  const [editingId, setEditingId] = useState(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCat, setEditCat] = useState(CATEGORIES[0])
  const [editDate, setEditDate] = useState(formatToday())

  // Add expense with validation
  function addExpense(e) {
    e.preventDefault()
    const amt = parseFloat(amount)
    const desc = description.trim()
    if (!desc) return
    if (!Number.isFinite(amt) || amt <= 0) return
    if (!CATEGORIES.includes(category)) return

    const newExpense = {
      id: crypto.randomUUID(),
      description: desc,
      amount: +amt.toFixed(2),
      category,
      date: date || formatToday(),
    }
    setExpenses(prev => [newExpense, ...prev])

    // Smart category: show the new item's category immediately
    setFilter(category)

    // Reset other fields for quick entry; keep category for convenience
    setDescription('')
    setAmount('')
    setDate(formatToday())
  }

  // When filter changes and is not All, sync the add form's category
  useEffect(() => {
    if (filter !== 'All') setCategory(filter)
  }, [filter])

  function startEdit(item) {
    setEditingId(item.id)
    setEditDesc(item.description)
    setEditAmount(String(item.amount))
    setEditCat(item.category)
    setEditDate(item.date)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDesc('')
    setEditAmount('')
    setEditCat(CATEGORIES[0])
    setEditDate(formatToday())
  }

  function saveEdit() {
    const desc = editDesc.trim()
    const amt = parseFloat(editAmount)
    if (!desc) return
    if (!Number.isFinite(amt) || amt <= 0) return
    if (!CATEGORIES.includes(editCat)) return

    setExpenses(prev => prev.map(e => (
      e.id === editingId
        ? { ...e, description: desc, amount: +amt.toFixed(2), category: editCat, date: editDate || formatToday() }
        : e
    )))
    cancelEdit()
  }


  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="app">
      <header className="app-header">Expense Tracker</header>

      <section className="card section">
        <h2>Add Expense</h2>
        <form className="form" onSubmit={addExpense}>
          <div className="field">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Lunch"
              required
            />
          </div>
          <div className="field">
            <label>Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="actions">
            <button type="submit">Add</button>
          </div>
        </form>
      </section>

      <section className="card section">
        <div className="section-header">
          <h2>Expenses</h2>
          <div className="filter">
            <label>Filter</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>All</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty">No expenses</td>
                </tr>
              ) : (
                filtered.map(row => (
                  editingId === row.id ? (
                    <tr key={row.id}>
                      <td>
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                      </td>
                      <td>
                        <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" />
                      </td>
                      <td>
                        <select value={editCat} onChange={(e) => setEditCat(e.target.value)}>
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="num">
                        <input type="number" min="0.01" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                      </td>
                      <td>
                        <div className="row">
                          <button onClick={saveEdit}>Save</button>
                          <button className="danger" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td>{row.date}</td>
                      <td>{row.description}</td>
                      <td>{row.category}</td>
                      <td className="num">${row.amount.toFixed(2)}</td>
                      <td>
                        <div className="row">
                          <button onClick={() => startEdit(row)}>Edit</button>
                          <button className="danger" onClick={() => deleteExpense(row.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card section">
        <h2>Totals</h2>
        <div className="totals">
          {CATEGORIES.map(c => (
            <div key={c} className="total-item">
              <div className="label">{c}</div>
              <div className="value">${(totalsByCategory[c] || 0).toFixed(2)}</div>
            </div>
          ))}
          <div className="total-item overall">
            <div className="label">Overall</div>
            <div className="value">${overallTotal.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>Now: {now.toLocaleString()}</div>
      </footer>
    </div>
  )
}

export default App
