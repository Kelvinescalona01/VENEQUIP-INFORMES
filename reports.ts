import { db, isPostgresAvailable, getStore, saveLocalStore } from './db.ts';
import { reports } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { InformeTecnico } from './types';

export async function saveReportToDb(
  reportData: InformeTecnico,
  createdByUid?: string,
  driveFileId?: string,
  driveFileUrl?: string
): Promise<any> {
  const numeroServicio = reportData.encabezado_venequip?.numero_servicio || `REP-${Date.now()}`;
  const reportId = `venequip_${numeroServicio.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const now = new Date().toISOString();

  const store = getStore();
  const existingIdx = store.reports.findIndex(r => r.reportId === reportId);

  let savedRecord: any;

  if (existingIdx !== -1) {
    store.reports[existingIdx] = {
      ...store.reports[existingIdx],
      numeroServicio,
      cliente: reportData.encabezado_venequip?.cliente || '',
      modelo: reportData.encabezado_venequip?.modelo || '',
      serialEquipo: reportData.encabezado_venequip?.serial_equipo || '',
      sucursal: reportData.encabezado_venequip?.sucursal || '',
      fecha: reportData.encabezado_venequip?.fecha || '',
      reportData: JSON.stringify(reportData),
      driveFileId: driveFileId || store.reports[existingIdx].driveFileId || null,
      driveFileUrl: driveFileUrl || store.reports[existingIdx].driveFileUrl || null,
      updatedAt: now,
    };
    savedRecord = store.reports[existingIdx];
  } else {
    const nextId = store.reports.length > 0 ? Math.max(...store.reports.map(r => r.id)) + 1 : 1;
    savedRecord = {
      id: nextId,
      reportId,
      numeroServicio,
      cliente: reportData.encabezado_venequip?.cliente || '',
      modelo: reportData.encabezado_venequip?.modelo || '',
      serialEquipo: reportData.encabezado_venequip?.serial_equipo || '',
      sucursal: reportData.encabezado_venequip?.sucursal || '',
      fecha: reportData.encabezado_venequip?.fecha || '',
      createdByUid: createdByUid || null,
      reportData: JSON.stringify(reportData),
      driveFileId: driveFileId || null,
      driveFileUrl: driveFileUrl || null,
      createdAt: now,
      updatedAt: now,
    };
    store.reports.unshift(savedRecord);
  }

  saveLocalStore(store);

  // Sync to Postgres if available
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const existing = await db.select().from(reports).where(eq(reports.reportId, reportId));
      if (existing.length > 0) {
        await db.update(reports)
          .set({
            numeroServicio,
            cliente: reportData.encabezado_venequip?.cliente || '',
            modelo: reportData.encabezado_venequip?.modelo || '',
            serialEquipo: reportData.encabezado_venequip?.serial_equipo || '',
            sucursal: reportData.encabezado_venequip?.sucursal || '',
            fecha: reportData.encabezado_venequip?.fecha || '',
            reportData: JSON.stringify(reportData),
            driveFileId: driveFileId || existing[0].driveFileId,
            driveFileUrl: driveFileUrl || existing[0].driveFileUrl,
            updatedAt: new Date(),
          })
          .where(eq(reports.reportId, reportId));
      } else {
        await db.insert(reports).values({
          reportId,
          numeroServicio,
          cliente: reportData.encabezado_venequip?.cliente || '',
          modelo: reportData.encabezado_venequip?.modelo || '',
          serialEquipo: reportData.encabezado_venequip?.serial_equipo || '',
          sucursal: reportData.encabezado_venequip?.sucursal || '',
          fecha: reportData.encabezado_venequip?.fecha || '',
          createdByUid: createdByUid || null,
          reportData: JSON.stringify(reportData),
          driveFileId: driveFileId || null,
          driveFileUrl: driveFileUrl || null,
        });
      }
    }
  } catch (err: any) {
    // Non-fatal
  }

  return savedRecord;
}

export async function getAllReports(): Promise<any[]> {
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const dbReports = await db.select().from(reports).orderBy(desc(reports.updatedAt));
      if (dbReports && dbReports.length > 0) {
        return dbReports;
      }
    }
  } catch (error: any) {
    console.warn('Postgres query note in getAllReports, using local store');
  }

  const store = getStore();
  return [...store.reports].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getReportById(reportId: string): Promise<any | null> {
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const res = await db.select().from(reports).where(eq(reports.reportId, reportId));
      if (res[0]) return res[0];
    }
  } catch (error: any) {
    // Fall back
  }

  const store = getStore();
  return store.reports.find(r => r.reportId === reportId) || null;
}

export async function deleteReport(id: number): Promise<boolean> {
  const store = getStore();
  const idx = store.reports.findIndex(r => r.id === id);
  if (idx === -1) return false;

  store.reports.splice(idx, 1);
  saveLocalStore(store);

  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      await db.delete(reports).where(eq(reports.id, id));
    }
  } catch (error: any) {
    // Non-fatal
  }

  return true;
}
