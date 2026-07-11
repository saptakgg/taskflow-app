import pg from 'pg';
const { Pool } = pg;

// Initialize connection pool if DATABASE_URL is available
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for serverless databases like Neon
  });
}

// In-memory fallback (Note: Serverless is stateless, so this will reset on cold starts)
let inMemoryTodos = [];
let tablesInitialized = false;

// Initialize DB schema
async function initializeSchema(client) {
  if (tablesInitialized) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id VARCHAR(60) PRIMARY KEY,
      title TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'General',
      priority VARCHAR(20) DEFAULT 'medium',
      due_date VARCHAR(20),
      completed BOOLEAN DEFAULT FALSE,
      notes TEXT,
      completed_at VARCHAR(100),
      subtasks JSONB DEFAULT '[]'::jsonb
    );
  `);
  tablesInitialized = true;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // If no DB connection, fall back to in-memory/JSON operations
  if (!pool) {
    console.warn("WARNING: DATABASE_URL is not set. Falling back to in-memory stateless array.");
    return handleInMemory(req, res);
  }

  let client;
  try {
    client = await pool.connect();
    await initializeSchema(client);

    switch (req.method) {
      case 'GET': {
        const { rows } = await client.query('SELECT * FROM todos ORDER BY id DESC');
        // Map db columns (snake_case) to frontend properties (camelCase)
        const todos = rows.map(row => ({
          id: row.id,
          title: row.title,
          category: row.category,
          priority: row.priority,
          dueDate: row.due_date,
          completed: row.completed,
          notes: row.notes || '',
          completedAt: row.completed_at,
          subtasks: row.subtasks || []
        }));
        return res.status(200).json(todos);
      }

      case 'POST': {
        const { id, title, category, priority, dueDate, completed, notes, completedAt, subtasks } = req.body;
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }
        const insertQuery = `
          INSERT INTO todos (id, title, category, priority, due_date, completed, notes, completed_at, subtasks)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
          RETURNING *
        `;
        const values = [
          id || crypto.randomUUID(),
          title,
          category || 'General',
          priority || 'medium',
          dueDate || null,
          completed || false,
          notes || '',
          completedAt || null,
          JSON.stringify(subtasks || [])
        ];
        const { rows } = await client.query(insertQuery, values);
        return res.status(201).json(rows[0]);
      }

      case 'PUT': {
        const { id, title, category, priority, dueDate, completed, notes, completedAt, subtasks } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }
        
        // Find existing record to preserve fields if not provided
        const { rows: existing } = await client.query('SELECT * FROM todos WHERE id = $1', [id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        const updateQuery = `
          UPDATE todos
          SET title = $1, category = $2, priority = $3, due_date = $4, completed = $5, notes = $6, completed_at = $7, subtasks = $8::jsonb
          WHERE id = $9
          RETURNING *
        `;
        const values = [
          title !== undefined ? title : existing[0].title,
          category !== undefined ? category : existing[0].category,
          priority !== undefined ? priority : existing[0].priority,
          dueDate !== undefined ? dueDate : existing[0].due_date,
          completed !== undefined ? completed : existing[0].completed,
          notes !== undefined ? notes : existing[0].notes,
          completedAt !== undefined ? completedAt : existing[0].completed_at,
          subtasks !== undefined ? JSON.stringify(subtasks) : JSON.stringify(existing[0].subtasks || []),
          id
        ];
        const { rows } = await client.query(updateQuery, values);
        return res.status(200).json(rows[0]);
      }

      case 'DELETE': {
        // ID could be passed in query or body
        const id = req.query.id || req.body.id;
        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }
        await client.query('DELETE FROM todos WHERE id = $1', [id]);
        return res.status(200).json({ success: true, message: `Task ${id} deleted` });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    if (client) client.release();
  }
}

// In-Memory stateless handler
function handleInMemory(req, res) {
  switch (req.method) {
    case 'GET':
      return res.status(200).json(inMemoryTodos);
    case 'POST': {
      const todo = req.body;
      if (!todo.title) return res.status(400).json({ error: 'Title is required' });
      todo.id = todo.id || crypto.randomUUID();
      inMemoryTodos.push(todo);
      return res.status(201).json(todo);
    }
    case 'PUT': {
      const { id } = req.body;
      const index = inMemoryTodos.findIndex(t => t.id === id);
      if (index === -1) return res.status(404).json({ error: 'Task not found' });
      inMemoryTodos[index] = { ...inMemoryTodos[index], ...req.body };
      return res.status(200).json(inMemoryTodos[index]);
    }
    case 'DELETE': {
      const id = req.query.id || req.body.id;
      inMemoryTodos = inMemoryTodos.filter(t => t.id !== id);
      return res.status(200).json({ success: true });
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
