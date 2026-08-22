import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
  var _isPgConnected: boolean | undefined;
}

const DB_FILE_PATH = path.join(process.cwd(), 'app_database.json');

export interface LocalStoreData {
  users: Array<{
    id: number;
    uid: string;
    email: string;
    password?: string | null;
    name?: string | null;
    role: string;
    status: string;
    specialty?: string | null;
    phone?: string | null;
    createdAt: string;
  }>;
  reports: Array<{
    id: number;
    reportId: string;
    numeroServicio?: string | null;
    cliente?: string | null;
    modelo?: string | null;
    serialEquipo?: string | null;
    sucursal?: string | null;
    fecha?: string | null;
    createdByUid?: string | null;
    reportData: string;
    driveFileId?: string | null;
    driveFileUrl?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  syncLogs: Array<{
    id: number;
    eventType: string;
    description: string;
    userEmail?: string | null;
    fileUrl?: string | null;
    createdAt: string;
  }>;
}

const DEFAULT_STORE: LocalStoreData = {
  users: [
    {
      id: 1,
      uid: 'admin_kescalonaccv',
      email: 'kescalonaccv@gmail.com',
      password: 'admin',
      name: 'KELVIN ESCALONA',
      role: 'admin',
      status: 'active',
      specialty: 'Administrador General del Sistema',
      phone: '+58 414 1234567',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      uid: 'admin_mlinares',
      email: 'mlinares@ccvenequip.com',
      password: 'admin',
      name: 'M. LINARES',
      role: 'admin',
      status: 'active',
      specialty: 'Administrador Principal de Operaciones y Servicios',
      phone: '+58 414 7654321',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 3,
      uid: 'admin_escalonabyby08',
      email: 'escalonabyby08@gmail.com',
      password: 'admin',
      name: 'KELVIN ESCALONA',
      role: 'admin',
      status: 'active',
      specialty: 'Administrador General del Sistema',
      phone: '+58 414 1234567',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 4,
      uid: 'test_venequip_user',
      email: 'prueba@venequip.com',
      password: 'venequip2026',
      name: 'Usuario de Prueba Venequip',
      role: 'technician',
      status: 'active',
      specialty: 'Técnico Especialista de Pruebas Caterpillar',
      phone: '+58 412 9876543',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  reports: [],
  syncLogs: [
    {
      id: 1,
      eventType: 'SYSTEM_INIT',
      description: 'Sistema inicializado con almacenamiento persistente centralizado Venequip.',
      userEmail: 'kescalonaccv@gmail.com',
      fileUrl: null,
      createdAt: new Date().toISOString(),
    },
  ],
};

let inMemoryStore: LocalStoreData = { ...DEFAULT_STORE };

// Load persistent data from disk if exists
export function loadLocalStore(): LocalStoreData {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryStore = {
        users: Array.isArray(parsed.users) ? parsed.users : DEFAULT_STORE.users,
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
        syncLogs: Array.isArray(parsed.syncLogs) ? parsed.syncLogs : [],
      };
    } else {
      saveLocalStore(DEFAULT_STORE);
    }
  } catch (err: any) {
    console.warn('Error reading app_database.json, using in-memory store:', err.message);
  }
  return inMemoryStore;
}

// Save persistent data to disk
export function saveLocalStore(data: LocalStoreData): void {
  try {
    inMemoryStore = data;
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('Error writing app_database.json:', err.message);
  }
}

// Helper to access current store
export function getStore(): LocalStoreData {
  if (!inMemoryStore.users || inMemoryStore.users.length === 0) {
    return loadLocalStore();
  }
  return inMemoryStore;
}

// Initial load
loadLocalStore();

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || 'localhost',
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || '',
      database: process.env.SQL_DB_NAME || 'postgres',
      max: 10,
      connectionTimeoutMillis: 3000,
    });

    global._postgresPool.on('error', (err) => {
      // Suppress unhandled connection errors so they do not crash the app
      global._isPgConnected = false;
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Checks if Postgres is reachable without throwing errors
 */
export async function isPostgresAvailable(): Promise<boolean> {
  if (global._isPgConnected === false) return false;
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return false;
  }
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    global._isPgConnected = true;
    return true;
  } catch {
    global._isPgConnected = false;
    return false;
  }
}

/**
 * Ensures required database tables exist on server startup
 */
export async function initializeDatabaseSchema(): Promise<void> {
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            uid TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT,
            name TEXT,
            role TEXT NOT NULL DEFAULT 'technician',
            status TEXT NOT NULL DEFAULT 'active',
            specialty TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            report_id TEXT NOT NULL UNIQUE,
            numero_servicio TEXT,
            cliente TEXT,
            modelo TEXT,
            serial_equipo TEXT,
            sucursal TEXT,
            fecha TEXT,
            created_by_uid TEXT,
            report_data TEXT NOT NULL,
            drive_file_id TEXT,
            drive_file_url TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS sync_logs (
            id SERIAL PRIMARY KEY,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            user_email TEXT,
            file_url TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('PostgreSQL / Cloud SQL tables initialized successfully.');
      } finally {
        client.release();
      }
    } else {
      console.log('Local persistent database storage active (app_database.json). Ready for all operations.');
    }
  } catch (err: any) {
    console.warn('Database initialization note:', err.message);
  }
}
