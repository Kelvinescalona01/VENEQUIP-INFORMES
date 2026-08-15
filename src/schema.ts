import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table with password support for created accounts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or system generated ID
  email: text('email').notNull().unique(),
  password: text('password'), // Password for custom created credentials
  name: text('name'),
  role: text('role').default('technician').notNull(), // 'admin' | 'technician' | 'supervisor' | 'manager'
  status: text('status').default('active').notNull(), // 'active' | 'inactive'
  specialty: text('specialty'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'reports' table for persistent storage of technical reports
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reportId: text('report_id').notNull().unique(),
  numeroServicio: text('numero_servicio'),
  cliente: text('cliente'),
  modelo: text('modelo'),
  serialEquipo: text('serial_equipo'),
  sucursal: text('sucursal'),
  fecha: text('fecha'),
  createdByUid: text('created_by_uid'),
  reportData: text('report_data').notNull(), // JSON stringified InformeTecnico
  driveFileId: text('drive_file_id'),
  driveFileUrl: text('drive_file_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'sync_logs' table for logging Google Drive / Sheets / Gmail activities
export const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),
  description: text('description').notNull(),
  userEmail: text('user_email'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').defaultNow(),
});
