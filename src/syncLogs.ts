import { db, isPostgresAvailable, getStore, saveLocalStore } from './db.ts';
import { syncLogs } from './schema.ts';
import { desc } from 'drizzle-orm';

export async function addSyncLog(
  eventType: string,
  description: string,
  userEmail?: string,
  fileUrl?: string
): Promise<any> {
  const store = getStore();
  const nextId = store.syncLogs.length > 0 ? Math.max(...store.syncLogs.map(l => l.id)) + 1 : 1;
  const newLog = {
    id: nextId,
    eventType,
    description,
    userEmail: userEmail || 'sistema@venequip.com',
    fileUrl: fileUrl || null,
    createdAt: new Date().toISOString(),
  };

  store.syncLogs.unshift(newLog);
  // Keep last 200 logs
  if (store.syncLogs.length > 200) {
    store.syncLogs = store.syncLogs.slice(0, 200);
  }
  saveLocalStore(store);

  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      await db.insert(syncLogs).values({
        eventType,
        description,
        userEmail: userEmail || 'sistema@venequip.com',
        fileUrl: fileUrl || null,
      });
    }
  } catch (error) {
    // Non-fatal
  }

  return newLog;
}

export async function getSyncLogs(limitCount = 50): Promise<any[]> {
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const dbLogs = await db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(limitCount);
      if (dbLogs && dbLogs.length > 0) {
        return dbLogs;
      }
    }
  } catch (error: any) {
    // Non-fatal
  }

  const store = getStore();
  return [...store.syncLogs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitCount);
}
