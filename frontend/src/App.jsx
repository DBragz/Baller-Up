import { useEffect, useMemo, useState } from 'react'
import './App.css'

const DEFAULT_API_URL = 'http://localhost:4000'

function App() {
  const apiUrl = useMemo(
    () => import.meta.env.VITE_API_URL || DEFAULT_API_URL,
    []
  )

  const [queue, setQueue] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastNext, setLastNext] = useState(null)

  async function fetchQueue() {
    try {
      const res = await fetch(`${apiUrl}/api/queue`)
      const data = await res.json()
      setQueue(Array.isArray(data.queue) ? data.queue : [])
    } catch (e) {
      console.error(e)
      setError('Failed to load queue')
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  async function post(path, body) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      return data
    } catch (e) {
      setError(e.message || 'Request failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const trimmed = name.trim()
    if (!trimmed) return
    const data = await post('/api/join', { name: trimmed })
    if (data) {
      setQueue(data.queue)
      setName('')
    }
  }

  async function handleLeave(n) {
    const target = (n ?? name).trim()
    if (!target) return
    const data = await post('/api/leave', { name: target })
    if (data) {
      setQueue(data.queue)
      if (!n) setName('')
    }
  }

  async function handleNext() {
    const data = await post('/api/next')
    if (data) {
      setQueue(data.queue)
      setLastNext(data.next)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <img src="/baller-up.svg" alt="Baller Up logo" width={200} height={200} style={{ display: 'block' }} />
        <h1 style={{ marginTop: 8, marginBottom: 0, textAlign: 'center' }}>Baller Up</h1>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          style={{ flex: 1, padding: 8 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJoin()
          }}
        />
        <button onClick={handleJoin} disabled={loading || !name.trim()}>
          Join
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Queue ({queue.length})</h2>
        <button onClick={handleNext} disabled={loading || queue.length === 0}>
          Next Up
        </button>
      </div>

      {error && (
        <div style={{ color: 'white', background: '#d33', padding: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {lastNext && (
        <div style={{ color: '#0a0', background: '#e9ffe9', padding: 8, marginBottom: 12 }}>
          Last called: <strong>{lastNext}</strong>
        </div>
      )}

      <ol style={{ paddingLeft: 18 }}>
        {queue.map((n) => (
          <li key={n} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>{n}</span>
            <button onClick={() => handleLeave(n)} disabled={loading}>
              Remove
            </button>
          </li>
        ))}
        {queue.length === 0 && <p style={{ opacity: 0.7 }}>No one in line yet.</p>}
      </ol>

      
    </div>
  )
}

export default App
