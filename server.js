// ============================================================
// PROJECT 4 — Full Stack Integration
// DecodeLabs Full Stack Internship | Batch 2026
// Developer: Ghasif Ali Noor
// Stack: Node.js + Express + SQL Server + HTML/CSS/JS Frontend
// ============================================================
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { connect, getPool, sql } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── Helper ───────────────────────────────────────────────────
const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ============================================================
//  STATUS
// ============================================================
app.get('/api/status', async (req, res) => {
  try {
    const pool = getPool();
    const s    = await pool.request().query('SELECT COUNT(*) c FROM Students');
    const t    = await pool.request().query('SELECT COUNT(*) c FROM Tasks');
    const done = await pool.request().query('SELECT COUNT(*) c FROM Tasks WHERE Completed=1');
    res.json({
      success  : true,
      server   : 'Running',
      database : 'SQL Server — Project4DB',
      students : s.recordset[0].c,
      tasks    : t.recordset[0].c,
      completed: done.recordset[0].c,
      developer: 'Ghasif Ali Noor',
      batch    : 'DecodeLabs 2026'
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
//  STUDENTS — Full CRUD
// ============================================================

// GET all students
app.get('/api/students', async (req, res) => {
  try {
    const r = await getPool().request()
      .query('SELECT * FROM Students ORDER BY CreatedAt DESC');
    res.json({ success: true, count: r.recordset.length, students: r.recordset });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET one student
app.get('/api/students/:id', async (req, res) => {
  try {
    const r = await getPool().request()
      .input('id', sql.Int, +req.params.id)
      .query('SELECT * FROM Students WHERE Id=@id');
    if (!r.recordset.length)
      return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student: r.recordset[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create student
app.post('/api/students', async (req, res) => {
  try {
    const { name, email, course, grade, status } = req.body;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    if (!email || !isEmail(email))
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    if (!course || course.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Course is required' });

    const pool = getPool();
    const dup  = await pool.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT Id FROM Students WHERE Email=@email');
    if (dup.recordset.length)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const r = await pool.request()
      .input('name',   sql.NVarChar, name.trim())
      .input('email',  sql.NVarChar, email.toLowerCase().trim())
      .input('course', sql.NVarChar, course.trim())
      .input('grade',  sql.NVarChar, grade  || 'N/A')
      .input('status', sql.NVarChar, status || 'Active')
      .query(`INSERT INTO Students(Name,Email,Course,Grade,Status)
              OUTPUT INSERTED.* VALUES(@name,@email,@course,@grade,@status)`);

    res.status(201).json({ success: true, message: 'Student added!', student: r.recordset[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { name, email, course, grade, status } = req.body;
    const pool = getPool();
    const chk  = await pool.request()
      .input('id', sql.Int, +req.params.id)
      .query('SELECT Id FROM Students WHERE Id=@id');
    if (!chk.recordset.length)
      return res.status(404).json({ success: false, message: 'Student not found' });

    const r = await pool.request()
      .input('id',     sql.Int,      +req.params.id)
      .input('name',   sql.NVarChar, name   || null)
      .input('email',  sql.NVarChar, email  ? email.toLowerCase() : null)
      .input('course', sql.NVarChar, course || null)
      .input('grade',  sql.NVarChar, grade  || null)
      .input('status', sql.NVarChar, status || null)
      .query(`UPDATE Students SET
        Name   = ISNULL(@name,   Name),
        Email  = ISNULL(@email,  Email),
        Course = ISNULL(@course, Course),
        Grade  = ISNULL(@grade,  Grade),
        Status = ISNULL(@status, Status)
        OUTPUT INSERTED.* WHERE Id=@id`);

    res.json({ success: true, message: 'Student updated!', student: r.recordset[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const r = await getPool().request()
      .input('id', sql.Int, +req.params.id)
      .query('DELETE FROM Students OUTPUT DELETED.Name WHERE Id=@id');
    if (!r.recordset.length)
      return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: `"${r.recordset[0].Name}" removed` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
//  TASKS — Full CRUD
// ============================================================

// GET all tasks (with student name via JOIN)
app.get('/api/tasks', async (req, res) => {
  try {
    const r = await getPool().request().query(`
      SELECT t.*, s.Name AS StudentName
      FROM Tasks t
      LEFT JOIN Students s ON t.StudentId = s.Id
      ORDER BY t.CreatedAt DESC`);
    res.json({ success: true, count: r.recordset.length, tasks: r.recordset });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, studentId } = req.body;
    if (!title || title.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Title is required' });

    const r = await getPool().request()
      .input('title',       sql.NVarChar, title.trim())
      .input('description', sql.NVarChar, description || '')
      .input('priority',    sql.NVarChar, priority    || 'Medium')
      .input('studentId',   sql.Int,      studentId   || null)
      .query(`INSERT INTO Tasks(Title,Description,Priority,StudentId)
              OUTPUT INSERTED.* VALUES(@title,@description,@priority,@studentId)`);

    res.status(201).json({ success: true, message: 'Task created!', task: r.recordset[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT toggle task complete
app.put('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const r = await getPool().request()
      .input('id', sql.Int, +req.params.id)
      .query(`UPDATE Tasks SET Completed = CASE WHEN Completed=1 THEN 0 ELSE 1 END
              OUTPUT INSERTED.* WHERE Id=@id`);
    if (!r.recordset.length)
      return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task: r.recordset[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const r = await getPool().request()
      .input('id', sql.Int, +req.params.id)
      .query('DELETE FROM Tasks OUTPUT DELETED.Title WHERE Id=@id');
    if (!r.recordset.length)
      return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: `Task "${r.recordset[0].Title}" deleted` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// START
connect().then(() => {
  app.listen(PORT, () => {
    console.log('=========================================');
    console.log('  Project 4 — Full Stack Integration');
    console.log(`  http://localhost:${PORT}`);
    console.log('  Developer: Bahadur Ali');
    console.log('  DecodeLabs — Batch 2026');
    console.log('=========================================');
  });
}).catch(e => { console.error('Failed:', e.message); process.exit(1); });
