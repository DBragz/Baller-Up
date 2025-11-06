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
  const [goodScore, setGoodScore] = useState(0)
  const [badScore, setBadScore] = useState(0)

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
      ; (async () => {
        try {
          const res = await fetch(`${apiUrl}/api/scores`)
          const data = await res.json()
          if (typeof data.good === 'number') setGoodScore(data.good)
          if (typeof data.bad === 'number') setBadScore(data.bad)
        } catch (e) {
          // ignore, keep defaults
        }
      })()
  }, [])
  async function updateScores(nextGood, nextBad) {
    try {
      const res = await fetch(`${apiUrl}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(typeof nextGood === 'number' ? { good: nextGood } : {}),
          ...(typeof nextBad === 'number' ? { bad: nextBad } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update scores')
      if (typeof data.good === 'number') setGoodScore(data.good)
      if (typeof data.bad === 'number') setBadScore(data.bad)
    } catch (e) {
      setError(e.message || 'Failed to update scores')
    }
  }


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
    <div className="app-container">
      <div className="header">
        <img src="/baller-up.svg" alt="Baller Up logo" className="logo-img" />
        <h1 className="title">Baller Up</h1>
      </div>
      <div className="scores-container">
        <div className="score-card good">
          <h2 className="score-title">Good Guys</h2>
          <div className="score-display">
            <button
              className="score-button"
              onClick={() => {
                const next = Math.max(0, goodScore - 1)
                setGoodScore(next)
                updateScores(next, undefined)
              }}
              disabled={loading}
            >-</button>
            <span className="score-value">{goodScore}</span>
            <button
              className="score-button"
              onClick={() => {
                const next = goodScore + 1
                setGoodScore(next)
                updateScores(next, undefined)
              }}
              disabled={loading}
            >+</button>
          </div>
        </div>
        <div className="score-card bad">
          <h2 className="score-title">Bad Guys</h2>
          <div className="score-display">
            <button
              className="score-button"
              onClick={() => {
                const next = Math.max(0, badScore - 1)
                setBadScore(next)
                updateScores(undefined, next)
              }}
              disabled={loading}
            >-</button>
            <span className="score-value">{badScore}</span>
            <button
              className="score-button"
              onClick={() => {
                const next = badScore + 1
                setBadScore(next)
                updateScores(undefined, next)
              }}
              disabled={loading}
            >+</button>
          </div>
        </div>
      </div>

      <div className="name-input-container">
        <input
          className="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJoin()
          }}
        />
        <button className="join-button" onClick={handleJoin} disabled={loading || !name.trim()}>
          Join
        </button>
      </div>

      <div className="queue-header">
        <h2 className="queue-title">Queue ({queue.length})</h2>
        <button className="next-button" onClick={handleNext} disabled={loading || queue.length === 0}>
          Next Up
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {lastNext && (
        <div className="success-message">
          Last called: <strong>{lastNext}</strong>
        </div>
      )}

      <ol className="queue-list">
        {queue.map((n) => (
          <li key={n} className="queue-item">
            <span className="queue-item-name">{n}</span>
            <button className="remove-button" onClick={() => handleLeave(n)} disabled={loading}>
              Remove
            </button>
          </li>
        ))}
        {queue.length === 0 && <p className="empty-queue">No one in line yet.</p>}
      </ol>
    </div>
  )
}

export default App
