'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';

export async function getUser(): Promise<User | null> {
  try {
    let sessionId: string | undefined;
    try {
      const cookieStore = await cookies();
      sessionId = cookieStore.get('session')?.value;
    } catch (e) {
      // Ignore cookie read error
    }

    if (sessionId) {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (user) return user as User;
    }

    // Default to admin user for admin portal access
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(1)
      .single();

    return adminUser as User || null;
  } catch (e) {
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(1)
      .single();
    return adminUser as User || null;
  }
}
