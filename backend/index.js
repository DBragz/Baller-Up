const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
		methods: ['GET', 'POST', 'OPTIONS'],
	})
);

// SQLite setup
const dbFile = process.env.DB_FILE || path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
	db.run(
		`CREATE TABLE IF NOT EXISTS queue (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE NOT NULL,
			position INTEGER NOT NULL,
			created_at INTEGER NOT NULL
		)`
	);
});

// Helpers
function normalizeName(name) {
	return String(name || '')
		.trim()
		.replace(/\s+/g, ' ');
}

// List queue
app.get('/api/queue', (_req, res) => {
	db.all('SELECT name FROM queue ORDER BY position ASC', [], (err, rows) => {
		if (err) return res.status(500).json({ error: 'Database error' });
		res.json({ queue: rows.map((r) => r.name) });
	});
});

// Join queue
app.post('/api/join', (req, res) => {
	const name = normalizeName(req.body?.name);
	if (!name) {
		return res.status(400).json({ error: 'Name is required' });
	}
	// Check exists
	db.get('SELECT 1 FROM queue WHERE LOWER(name)=LOWER(?)', [name], (err, row) => {
		if (err) return res.status(500).json({ error: 'Database error' });
		if (row) return res.status(409).json({ error: 'Already in queue' });
		// Get next position and insert
		db.get('SELECT COALESCE(MAX(position), 0) AS maxPos FROM queue', [], (err2, r) => {
			if (err2) return res.status(500).json({ error: 'Database error' });
			const nextPos = (r?.maxPos || 0) + 1;
			db.run(
				'INSERT INTO queue (name, position, created_at) VALUES (?, ?, ?)',
				[name, nextPos, Date.now()],
				(insErr) => {
					if (insErr) return res.status(500).json({ error: 'Database error' });
					db.all('SELECT name FROM queue ORDER BY position ASC', [], (lErr, rows) => {
						if (lErr) return res.status(500).json({ error: 'Database error' });
						res.status(201).json({ queue: rows.map((rr) => rr.name) });
					});
				}
			);
		});
	});
});

// Leave queue (by name)
app.post('/api/leave', (req, res) => {
	const name = normalizeName(req.body?.name);
	if (!name) {
		return res.status(400).json({ error: 'Name is required' });
	}
	// Delete and then compact positions
	db.get('SELECT position FROM queue WHERE LOWER(name)=LOWER(?)', [name], (gErr, row) => {
		if (gErr) return res.status(500).json({ error: 'Database error' });
		if (!row) return res.status(404).json({ error: 'Name not found in queue' });
		const removedPos = row.position;
		db.run('DELETE FROM queue WHERE LOWER(name)=LOWER(?)', [name], (dErr) => {
			if (dErr) return res.status(500).json({ error: 'Database error' });
			// Shift down positions greater than removed
			db.run('UPDATE queue SET position = position - 1 WHERE position > ?', [removedPos], (uErr) => {
				if (uErr) return res.status(500).json({ error: 'Database error' });
				db.all('SELECT name FROM queue ORDER BY position ASC', [], (lErr, rows) => {
					if (lErr) return res.status(500).json({ error: 'Database error' });
					res.json({ queue: rows.map((r) => r.name) });
				});
			});
		});
	});
});

// Advance to next player
app.post('/api/next', (_req, res) => {
	// Get first in queue
	db.get('SELECT id, name, position FROM queue ORDER BY position ASC LIMIT 1', [], (err, row) => {
		if (err) return res.status(500).json({ error: 'Database error' });
		if (!row) return res.status(200).json({ next: null, queue: [] });
		const nextName = row.name;
		db.run('DELETE FROM queue WHERE id = ?', [row.id], (dErr) => {
			if (dErr) return res.status(500).json({ error: 'Database error' });
			// Shift remaining
			db.run('UPDATE queue SET position = position - 1 WHERE position > ?', [row.position], (uErr) => {
				if (uErr) return res.status(500).json({ error: 'Database error' });
				db.all('SELECT name FROM queue ORDER BY position ASC', [], (lErr, rows) => {
					if (lErr) return res.status(500).json({ error: 'Database error' });
					res.json({ next: nextName, queue: rows.map((r) => r.name) });
				});
			});
		});
	});
});

app.listen(port, () => {
	console.log(`Baller Up backend listening on http://localhost:${port}`);
});


