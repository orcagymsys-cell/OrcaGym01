'use server';

import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { User } from '@/lib/types';

export async function getUser(): Promise<User | null> {
  try {
    const db = getDb();
    
    let sessionId: string | undefined;
    try {
      const cookieStore = await cookies();
      sessionId = cookieStore.get('session')?.value;
    } catch (e) {
      // Ignore cookie read error
    }

    if (sessionId) {
      const user = db.users.find(u => u.id === sessionId);
      if (user) return user;
    }

    // Default to admin user for admin portal access
    return db.users.find(u => u.role === 'admin') || {
      id: 'admin_1',
      role: 'admin',
      username: 'admin',
      password: 'orca1234',
      full_name: 'Super Admin',
      phone_number: '0812345678',
      first_login: false
    };
  } catch (e) {
    const db = getDb();
    return db.users.find(u => u.role === 'admin') || null;
  }
}
