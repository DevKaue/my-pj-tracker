import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(process.cwd(), 'data.sqlite');

const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_FILE);

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    organizationId TEXT NOT NULL,
    hourlyRate REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused')),
    createdAt TEXT NOT NULL,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    projectId TEXT NOT NULL,
    hours REAL NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    createdAt TEXT NOT NULL,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

const orgSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório / Name is required'),
  cnpj: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string().min(1),
  hourlyRate: z.number().nonnegative(),
  status: z.enum(['active', 'completed', 'paused']),
});

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().min(1),
  hours: z.number().nonnegative(),
  date: z.string().transform((val) => new Date(val).toISOString()),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

type OrgRow = {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  hourlyRate: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  hours: number;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
};

const mapOrg = (row: OrgRow) => ({ ...row });
const mapProject = (row: ProjectRow) => ({ ...row });
const mapTask = (row: TaskRow) => ({ ...row, date: row.date });

const openApiDoc = {
  openapi: '3.0.0',
  info: {
    title: 'PJ Manager API',
    description: 'API REST para organizações, projetos e tarefas (PT/EN)',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:4000' }],
  tags: [
    { name: 'Organizations', description: 'Organizações / Organizations' },
    { name: 'Projects', description: 'Projetos / Projects' },
    { name: 'Tasks', description: 'Tarefas / Tasks' },
  ],
  paths: {
    '/organizations': {
      get: { tags: ['Organizations'], summary: 'Lista organizações', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Organizations'], summary: 'Cria organização', requestBody: { required: true }, responses: { 201: { description: 'Criado' } } },
    },
    '/organizations/{id}': {
      put: { tags: ['Organizations'], summary: 'Atualiza organização', parameters: [{ name: 'id', in: 'path', required: true }], requestBody: { required: true }, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Organizations'], summary: 'Remove organização', parameters: [{ name: 'id', in: 'path', required: true }], responses: { 204: { description: 'Removido' } } },
    },
    '/projects': {
      get: { tags: ['Projects'], summary: 'Lista projetos (organizationId opcional)', parameters: [{ name: 'organizationId', in: 'query', required: false }], responses: { 200: { description: 'OK' } } },
      post: { tags: ['Projects'], summary: 'Cria projeto', requestBody: { required: true }, responses: { 201: { description: 'Criado' } } },
    },
    '/projects/{id}': {
      put: { tags: ['Projects'], summary: 'Atualiza projeto', parameters: [{ name: 'id', in: 'path', required: true }], requestBody: { required: true }, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Projects'], summary: 'Remove projeto', parameters: [{ name: 'id', in: 'path', required: true }], responses: { 204: { description: 'Removido' } } },
    },
    '/tasks': {
      get: { tags: ['Tasks'], summary: 'Lista tarefas (filtros opcional)', parameters: [{ name: 'projectId', in: 'query' }, { name: 'organizationId', in: 'query' }], responses: { 200: { description: 'OK' } } },
      post: { tags: ['Tasks'], summary: 'Cria tarefa', requestBody: { required: true }, responses: { 201: { description: 'Criado' } } },
    },
    '/tasks/{id}': {
      put: { tags: ['Tasks'], summary: 'Atualiza tarefa', parameters: [{ name: 'id', in: 'path', required: true }], requestBody: { required: true }, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Tasks'], summary: 'Remove tarefa', parameters: [{ name: 'id', in: 'path', required: true }], responses: { 204: { description: 'Removido' } } },
    },
    '/health': {
      get: { tags: ['Health'], summary: 'Healthcheck', responses: { 200: { description: 'OK' } } },
    },
  },
};

const app = express();
app.use(cors());
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', now: new Date().toISOString() });
});

app.get('/organizations', (_req, res) => {
  const rows = db.prepare<[], OrgRow>('SELECT * FROM organizations ORDER BY createdAt DESC').all();
  res.json(rows.map(mapOrg));
});

app.post('/organizations', (req, res, next) => {
  try {
    const data = orgSchema.parse(req.body);
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO organizations (id, name, cnpj, email, phone, createdAt)
       VALUES (@id, @name, @cnpj, @email, @phone, @createdAt)`
    ).run({ id, ...data, createdAt });
    const org = db.prepare<OrgRow, OrgRow>('SELECT * FROM organizations WHERE id = ?').get(id);
    res.status(201).json(mapOrg(org));
  } catch (err) {
    next(err);
  }
});

app.put('/organizations/:id', (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = db.prepare<OrgRow, OrgRow>('SELECT * FROM organizations WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ message: 'Organização não encontrada / Not found' });
    const data = orgSchema.partial().parse(req.body);
    const updated = { ...existing, ...data };
    db.prepare(`UPDATE organizations SET name=@name, cnpj=@cnpj, email=@email, phone=@phone WHERE id=@id`).run({ ...updated, id });
    const org = db.prepare<OrgRow, OrgRow>('SELECT * FROM organizations WHERE id = ?').get(id);
    res.json(mapOrg(org));
  } catch (err) {
    next(err);
  }
});

app.delete('/organizations/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare<OrgRow, OrgRow>('SELECT * FROM organizations WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Organização não encontrada / Not found' });
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM tasks WHERE projectId IN (SELECT id FROM projects WHERE organizationId = ?)').run(id);
    db.prepare('DELETE FROM projects WHERE organizationId = ?').run(id);
    db.prepare('DELETE FROM organizations WHERE id = ?').run(id);
  });
  tx();
  res.status(204).send();
});

app.get('/projects', (req, res) => {
  const { organizationId } = req.query;
  let rows: ProjectRow[] = [];
  if (organizationId) {
    rows = db.prepare<[string], ProjectRow>('SELECT * FROM projects WHERE organizationId = ? ORDER BY createdAt DESC').all(String(organizationId));
  } else {
    rows = db.prepare<[], ProjectRow>('SELECT * FROM projects ORDER BY createdAt DESC').all();
  }
  res.json(rows.map(mapProject));
});

app.post('/projects', (req, res, next) => {
  try {
    const data = projectSchema.parse(req.body);
    const org = db.prepare<OrgRow, OrgRow>('SELECT * FROM organizations WHERE id = ?').get(data.organizationId);
    if (!org) return res.status(400).json({ message: 'Organização inexistente / Unknown organization' });
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO projects (id, name, description, organizationId, hourlyRate, status, createdAt)
       VALUES (@id, @name, @description, @organizationId, @hourlyRate, @status, @createdAt)`
    ).run({ id, ...data, createdAt });
    const project = db.prepare<ProjectRow, ProjectRow>('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(mapProject(project));
  } catch (err) {
    next(err);
  }
});

app.put('/projects/:id', (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = db.prepare<ProjectRow, ProjectRow>('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ message: 'Projeto não encontrado / Not found' });
    const data = projectSchema.partial().parse(req.body);
    if (data.organizationId) {
      const org = db.prepare<OrgRow, OrgRow>('SELECT * FROM organizations WHERE id = ?').get(data.organizationId);
      if (!org) return res.status(400).json({ message: 'Organização inexistente / Unknown organization' });
    }
    const updated = { ...existing, ...data };
    db.prepare(
      `UPDATE projects
       SET name=@name, description=@description, organizationId=@organizationId, hourlyRate=@hourlyRate, status=@status
       WHERE id=@id`
    ).run({ ...updated, id });
    const project = db.prepare<ProjectRow, ProjectRow>('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(mapProject(project));
  } catch (err) {
    next(err);
  }
});

app.delete('/projects/:id', (req, res) => {
  const id = req.params.id;
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM tasks WHERE projectId = ?').run(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  });
  tx();
  const deleted = db.prepare('SELECT changes() as changes').get() as { changes: number };
  if (deleted.changes === 0) return res.status(404).json({ message: 'Projeto não encontrado / Not found' });
  res.status(204).send();
});

app.get('/tasks', (req, res) => {
  const { projectId, organizationId } = req.query;
  let rows: TaskRow[] = [];

  if (projectId) {
    rows = db.prepare<[string], TaskRow>('SELECT * FROM tasks WHERE projectId = ? ORDER BY date DESC, createdAt DESC').all(String(projectId));
  } else if (organizationId) {
    rows = db
      .prepare<[string], TaskRow>(
        `SELECT t.* FROM tasks t
         JOIN projects p ON t.projectId = p.id
         WHERE p.organizationId = ?
         ORDER BY t.date DESC, t.createdAt DESC`
      )
      .all(String(organizationId));
  } else {
    rows = db.prepare<[], TaskRow>('SELECT * FROM tasks ORDER BY date DESC, createdAt DESC').all();
  }
  res.json(rows.map(mapTask));
});

app.post('/tasks', (req, res, next) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const project = db.prepare<ProjectRow, ProjectRow>('SELECT * FROM projects WHERE id = ?').get(parsed.projectId);
    if (!project) return res.status(400).json({ message: 'Projeto inexistente / Unknown project' });
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO tasks (id, title, description, projectId, hours, date, status, createdAt)
       VALUES (@id, @title, @description, @projectId, @hours, @date, @status, @createdAt)`
    ).run({ id, ...parsed, createdAt });
    const task = db.prepare<TaskRow, TaskRow>('SELECT * FROM tasks WHERE id = ?').get(id);
    res.status(201).json(mapTask(task));
  } catch (err) {
    next(err);
  }
});

app.put('/tasks/:id', (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = db.prepare<TaskRow, TaskRow>('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ message: 'Tarefa não encontrada / Not found' });
    const data = taskSchema.partial().parse(req.body);
    if (data.projectId) {
      const project = db.prepare<ProjectRow, ProjectRow>('SELECT * FROM projects WHERE id = ?').get(data.projectId);
      if (!project) return res.status(400).json({ message: 'Projeto inexistente / Unknown project' });
    }
    const updated = { ...existing, ...data };
    db.prepare(
      `UPDATE tasks
       SET title=@title, description=@description, projectId=@projectId, hours=@hours, date=@date, status=@status
       WHERE id=@id`
    ).run({ ...updated, id });
    const task = db.prepare<TaskRow, TaskRow>('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(mapTask(task));
  } catch (err) {
    next(err);
  }
});

app.delete('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ message: 'Tarefa não encontrada / Not found' });
  res.status(204).send();
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API error', err);
  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: 'Dados inválidos / Invalid data', issues: err.issues });
  }
  res.status(500).json({ message: 'Erro interno / Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
