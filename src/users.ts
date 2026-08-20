import { db, isPostgresAvailable, getStore, saveLocalStore } from './db.ts';
import { users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface UserRecord {
  id?: number;
  uid: string;
  email: string;
  password?: string | null;
  name?: string | null;
  role: 'admin' | 'technician' | 'supervisor' | 'manager';
  status: 'active' | 'inactive';
  specialty?: string | null;
  phone?: string | null;
  createdAt?: string | null;
}

/**
 * Validates login with email and password
 */
export async function authenticateUserWithPassword(email: string, password: string): Promise<UserRecord> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // First ensure default users exist
  await ensureDefaultUsers();

  // Try PostgreSQL if available
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const records = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (records.length > 0) {
        const user = records[0];
        if (user.status === 'inactive') {
          throw new Error('Esta cuenta ha sido desactivada temporalmente por el Administrador.');
        }

        const storedPass = (user.password || '').trim();
        const isMaster = cleanEmail === 'kescalonaccv@gmail.com' || cleanEmail === 'mlinares@ccvenequip.com' || cleanEmail === 'escalonabyby08@gmail.com';
        const isMasterPass = cleanPassword === 'admin' || cleanPassword === 'admin1234' || cleanPassword === 'venequip2026';

        if (!storedPass || (storedPass !== cleanPassword && !(isMaster && isMasterPass))) {
          throw new Error('La contraseña ingresada es incorrecta. Verifique e intente nuevamente.');
        }

        return {
          ...user,
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        } as unknown as UserRecord;
      }
    }
  } catch (error: any) {
    if (error.message && (error.message.includes('contraseña') || error.message.includes('desactivada'))) {
      throw error;
    }
    console.warn('Postgres query note during auth, checking local store:', error.message);
  }

  // Check local persistent store
  const store = getStore();
  const foundUser = store.users.find(u => u.email.toLowerCase() === cleanEmail);

  if (foundUser) {
    if (foundUser.status === 'inactive') {
      throw new Error('Esta cuenta ha sido desactivada temporalmente por el Administrador.');
    }

    const storedPass = (foundUser.password || '').trim();
    const isMaster = cleanEmail === 'kescalonaccv@gmail.com' || cleanEmail === 'mlinares@ccvenequip.com' || cleanEmail === 'escalonabyby08@gmail.com';
    const isMasterPass = cleanPassword === 'admin' || cleanPassword === 'admin1234' || cleanPassword === 'venequip2026';

    if (storedPass && storedPass !== cleanPassword && !(isMaster && isMasterPass)) {
      throw new Error('La contraseña ingresada es incorrecta. Verifique e intente nuevamente.');
    }

    return foundUser as UserRecord;
  }

  // Fallback check if user is Master Admin
  if ((cleanEmail === 'kescalonaccv@gmail.com' || cleanEmail === 'mlinares@ccvenequip.com' || cleanEmail === 'escalonabyby08@gmail.com') && 
      (cleanPassword === 'admin' || cleanPassword === 'admin1234' || cleanPassword === 'venequip2026')) {
    return {
      id: cleanEmail === 'mlinares@ccvenequip.com' ? 2 : 1,
      uid: `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      name: cleanEmail === 'mlinares@ccvenequip.com' ? 'M. LINARES' : 'KELVIN ESCALONA',
      role: 'admin',
      status: 'active',
      specialty: 'Administrador General del Sistema',
      phone: '+58 414 1234567',
    };
  }

  throw new Error('El correo ingresado no está registrado en el sistema. Solicite al Administrador (KELVIN ESCALONA o M. LINARES) la creación de su cuenta.');
}

/**
 * Ensures required seed accounts exist and removes deprecated accounts
 */
export async function ensureDefaultUsers(): Promise<void> {
  const store = getStore();
  let updated = false;

  // Remove any legacy demo accounts that are no longer wanted
  const legacyEmailsToRemove = ['supervisor@venequip.com', 'gerencia@venequip.com', 'tecnico@venequip.com'];
  const initialLength = store.users.length;
  store.users = store.users.filter(u => !legacyEmailsToRemove.includes(u.email.toLowerCase()));
  if (store.users.length !== initialLength) {
    updated = true;
  }

  // 1. Master Admin 1 (Kelvin Escalona primary)
  const admin1Email = 'kescalonaccv@gmail.com';
  const admin1Idx = store.users.findIndex(u => u.email.toLowerCase() === admin1Email);
  if (admin1Idx === -1) {
    store.users.unshift({
      id: 1,
      uid: 'admin_kescalonaccv',
      email: admin1Email,
      password: 'admin',
      name: 'KELVIN ESCALONA',
      role: 'admin',
      status: 'active',
      specialty: 'Administrador General de Operaciones y Servicios',
      phone: '+58 414 1234567',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    updated = true;
  } else {
    store.users[admin1Idx].role = 'admin';
    store.users[admin1Idx].name = 'KELVIN ESCALONA';
    store.users[admin1Idx].status = 'active';
    if (!store.users[admin1Idx].password) {
      store.users[admin1Idx].password = 'admin';
      updated = true;
    }
  }

  // 2. Master Admin 2 (M. Linares)
  const admin2Email = 'mlinares@ccvenequip.com';
  const admin2Idx = store.users.findIndex(u => u.email.toLowerCase() === admin2Email);
  if (admin2Idx === -1) {
    store.users.splice(1, 0, {
      id: 2,
      uid: 'admin_mlinares',
      email: admin2Email,
      password: 'admin',
      name: 'M. LINARES',
      role: 'admin',
      status: 'active',
      specialty: 'Administrador Principal de Operaciones y Servicios',
      phone: '+58 414 7654321',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    updated = true;
  } else {
    store.users[admin2Idx].role = 'admin';
    store.users[admin2Idx].name = 'M. LINARES';
    store.users[admin2Idx].status = 'active';
    if (!store.users[admin2Idx].password) {
      store.users[admin2Idx].password = 'admin';
      updated = true;
    }
  }

  // 3. Master Admin 3 (Session Admin / AI Studio)
  const admin3Email = 'escalonabyby08@gmail.com';
  const admin3Idx = store.users.findIndex(u => u.email.toLowerCase() === admin3Email);
  if (admin3Idx === -1) {
    store.users.splice(2, 0, {
      id: 3,
      uid: 'admin_escalonabyby08',
      email: admin3Email,
      password: 'admin',
      name: 'KELVIN ESCALONA',
      role: 'admin',
      status: 'active',
      specialty: 'Administrador General de Operaciones y Servicios',
      phone: '+58 414 1234567',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    updated = true;
  } else {
    store.users[admin3Idx].role = 'admin';
    store.users[admin3Idx].name = 'KELVIN ESCALONA';
    store.users[admin3Idx].status = 'active';
    if (!store.users[admin3Idx].password) {
      store.users[admin3Idx].password = 'admin';
      updated = true;
    }
  }

  // 4. Single Demo / Test Venequip User
  const testEmail = 'prueba@venequip.com';
  const testIdx = store.users.findIndex(u => u.email.toLowerCase() === testEmail);
  if (testIdx === -1) {
    store.users.push({
      id: 4,
      uid: 'test_venequip_user',
      email: testEmail,
      password: 'venequip2026',
      name: 'Usuario de Prueba Venequip',
      role: 'technician',
      status: 'active',
      specialty: 'Técnico Especialista de Pruebas Caterpillar',
      phone: '+58 412 9876543',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    updated = true;
  } else {
    store.users[testIdx].role = 'technician';
    store.users[testIdx].name = 'Usuario de Prueba Venequip';
    store.users[testIdx].status = 'active';
    if (!store.users[testIdx].password) {
      store.users[testIdx].password = 'venequip2026';
      updated = true;
    }
  }

  if (updated) {
    saveLocalStore(store);
  }
}

/**
 * Synchronizes or verifies a Google OAuth authenticated user
 */
export async function getOrCreateUser(uid: string, email: string, name?: string): Promise<any> {
  const cleanEmail = email.trim().toLowerCase();
  await ensureDefaultUsers();

  const store = getStore();
  const existingIdx = store.users.findIndex(u => u.email.toLowerCase() === cleanEmail);

  if (existingIdx !== -1) {
    const user = store.users[existingIdx];
    if (user.status === 'inactive') {
      throw new Error('Esta cuenta ha sido desactivada por el Administrador.');
    }
    if (user.uid !== uid || (name && !user.name)) {
      user.uid = uid;
      if (name) user.name = name;
      saveLocalStore(store);
    }
    return user;
  }

  const isMasterAdmin = cleanEmail === 'kescalonaccv@gmail.com' || cleanEmail === 'mlinares@ccvenequip.com' || cleanEmail === 'escalonabyby08@gmail.com';
  const isFirstUser = store.users.length === 0;

  if (isMasterAdmin || isFirstUser) {
    const defaultName = cleanEmail === 'mlinares@ccvenequip.com' ? 'M. LINARES' : 'KELVIN ESCALONA';
    const newUser = {
      id: store.users.length > 0 ? Math.max(...store.users.map(u => u.id)) + 1 : 1,
      uid,
      email: cleanEmail,
      password: 'admin',
      name: name || defaultName,
      role: 'admin',
      status: 'active',
      specialty: 'Administrador General del Sistema',
      phone: '+58 414 1234567',
      createdAt: new Date().toISOString(),
    };
    store.users.unshift(newUser);
    saveLocalStore(store);
    return newUser;
  }

  throw new Error(`Acceso no autorizado para ${cleanEmail}. Tu cuenta debe ser registrada previamente por el Administrador (KELVIN ESCALONA o M. LINARES).`);
}

export async function getAllUsers(): Promise<any[]> {
  await ensureDefaultUsers();
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const dbUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      if (dbUsers && dbUsers.length > 0) {
        return dbUsers;
      }
    }
  } catch (err: any) {
    console.warn('Postgres query note in getAllUsers, returning local store');
  }

  const store = getStore();
  return [...store.users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUserByUid(uid: string): Promise<any | null> {
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const res = await db.select().from(users).where(eq(users.uid, uid));
      if (res[0]) return res[0];
    }
  } catch (err: any) {
    // Fall back to local store
  }

  const store = getStore();
  return store.users.find(u => u.uid === uid) || null;
}

export async function getUserByEmail(email: string): Promise<any | null> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      const res = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (res[0]) return res[0];
    }
  } catch (err: any) {
    // Fall back to local store
  }

  const store = getStore();
  return store.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
}

export async function createUserManual(userData: {
  email: string;
  password?: string;
  name: string;
  role: string;
  specialty?: string;
  phone?: string;
}): Promise<any> {
  const cleanEmail = userData.email.trim().toLowerCase();
  const store = getStore();
  const existingIdx = store.users.findIndex(u => u.email.toLowerCase() === cleanEmail);

  if (existingIdx !== -1) {
    store.users[existingIdx] = {
      ...store.users[existingIdx],
      name: userData.name,
      role: userData.role || store.users[existingIdx].role || 'technician',
      status: 'active',
      password: userData.password || store.users[existingIdx].password || 'venequip2026',
      specialty: userData.specialty || store.users[existingIdx].specialty || 'Técnico Especialista',
      phone: userData.phone || store.users[existingIdx].phone || '',
    };
    saveLocalStore(store);
    return store.users[existingIdx];
  }

  const syntheticUid = `user_gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nextId = store.users.length > 0 ? Math.max(...store.users.map(u => u.id)) + 1 : 1;
  const newUser = {
    id: nextId,
    uid: syntheticUid,
    email: cleanEmail,
    password: userData.password || 'venequip2026',
    name: userData.name,
    role: userData.role || 'technician',
    status: 'active',
    specialty: userData.specialty || 'Técnico Especialista',
    phone: userData.phone || '',
    createdAt: new Date().toISOString(),
  };

  store.users.unshift(newUser);
  saveLocalStore(store);

  // Try saving to Postgres as well
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      await db.insert(users).values({
        uid: syntheticUid,
        email: cleanEmail,
        password: userData.password || 'venequip2026',
        name: userData.name,
        role: userData.role || 'technician',
        status: 'active',
        specialty: userData.specialty || 'Técnico Especialista',
        phone: userData.phone || '',
      });
    }
  } catch (err: any) {
    // Non-fatal
  }

  return newUser;
}

export async function updateUser(id: number, data: Partial<UserRecord>): Promise<any> {
  const store = getStore();
  const idx = store.users.findIndex(u => u.id === id);
  if (idx === -1) {
    throw new Error('Usuario no encontrado.');
  }

  const { createdAt, ...updatableFields } = data;

  store.users[idx] = {
    ...store.users[idx],
    ...data,
  };
  saveLocalStore(store);

  // Sync to Postgres if available
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      await db.update(users).set(updatableFields as any).where(eq(users.id, id));
    }
  } catch (err: any) {
    // Non-fatal
  }

  return store.users[idx];
}

/**
 * Changes a user password. Allowed only by Administrator.
 */
export async function changeUserPasswordByAdmin(
  userId: number,
  newPassword: string,
  requesterEmail?: string
): Promise<any> {
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
  }

  const store = getStore();
  const idx = store.users.findIndex(u => u.id === userId);
  if (idx === -1) {
    throw new Error('Usuario no encontrado para cambio de contraseña.');
  }

  // Security check: If requesterEmail is provided, verify it is master admin or admin role
  const isMasterRequester = requesterEmail && (
    requesterEmail.trim().toLowerCase() === 'kescalonaccv@gmail.com' ||
    requesterEmail.trim().toLowerCase() === 'mlinares@ccvenequip.com' ||
    requesterEmail.trim().toLowerCase() === 'escalonabyby08@gmail.com'
  );

  if (requesterEmail && !isMasterRequester) {
    const requester = store.users.find(u => u.email.toLowerCase() === requesterEmail.trim().toLowerCase());
    if (!requester || requester.role !== 'admin') {
      throw new Error('Operación denegada: Solo el Administrador del Sistema puede cambiar contraseñas de usuarios.');
    }
  }

  store.users[idx].password = newPassword.trim();
  saveLocalStore(store);

  // Sync to Postgres if available
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      await db.update(users).set({ password: newPassword.trim() }).where(eq(users.id, userId));
    }
  } catch (err: any) {
    // Non-fatal
  }

  return store.users[idx];
}

export async function deleteUser(id: number): Promise<boolean> {
  const store = getStore();
  const idx = store.users.findIndex(u => u.id === id);
  if (idx === -1) return false;

  store.users.splice(idx, 1);
  saveLocalStore(store);

  // Sync to Postgres if available
  try {
    const hasPg = await isPostgresAvailable();
    if (hasPg) {
      await db.delete(users).where(eq(users.id, id));
    }
  } catch (err: any) {
    // Non-fatal
  }

  return true;
}
