'use server';

import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export async function login(username: string, role: 'parent' | 'admin') {
  const db = getDb();
  const cleanUsername = (username || '').trim().toLowerCase();
  const user = db.users.find(u => (u.username || '').trim().toLowerCase() === cleanUsername && u.role === role);
  
  if (!user) {
    return { error: 'Invalid username or role mismatch' };
  }

  const cookieStore = await cookies();
  cookieStore.set('session', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  return { success: true, first_login: user.first_login, role: user.role };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function registerUser(data: { fullName: string; phone: string; password?: string; }) {
  const db = getDb();
  
  // Check for duplicate phone number
  const existingUser = db.users.find(u => u.phone_number === data.phone || u.username === data.phone);
  
  if (existingUser) {
    return { error: 'Phone number already registered. Please use a different number or sign in.' };
  }

  // Generate ID and save
  const newUserId = 'u' + Math.random().toString(36).substr(2, 9);
  
  db.users.push({
    id: newUserId,
    role: 'parent',
    username: data.phone, // Phone number serves as username
    full_name: data.fullName,
    phone_number: data.phone,
    first_login: true
  });
  
  // In a real app we'd save password too, but mocking here
  import('@/lib/db').then(({ saveDb }) => saveDb(db));

  return { success: true };
}
