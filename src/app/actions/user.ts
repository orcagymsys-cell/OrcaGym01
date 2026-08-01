'use server';

import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { User } from '@/lib/types';

export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return null;
  }

  const db = getDb();
  const user = db.users.find(u => u.id === sessionId);

  return user || null;
}
