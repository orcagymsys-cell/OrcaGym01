'use server';

import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export async function login(username: string, role: 'parent' | 'admin') {
  try {
    const db = getDb();
    const cleanUsername = (username || '').trim().toLowerCase();
    
    // Find user by username or phone number
    const user = db.users.find(u => 
      ((u.username || '').trim().toLowerCase() === cleanUsername || 
       (u.phone_number || '').trim() === cleanUsername) && 
      (u.role === role || role === 'admin')
    );
    
    if (!user) {
      return { error: 'Username หรือ รหัสผ่านไม่ถูกต้อง' };
    }

    const cookieStore = await cookies();
    cookieStore.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return { success: true, first_login: user.first_login, role: user.role };
  } catch (e: any) {
    return { error: e?.message || 'Authentication error' };
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
  } catch (e) {
    // Ignore error on logout
  }
}

export async function registerUser(data: { fullName: string; phone: string; password?: string; }) {
  try {
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
    
    return { success: true };
  } catch (e: any) {
    return { error: e?.message || 'Registration failed' };
  }
}
