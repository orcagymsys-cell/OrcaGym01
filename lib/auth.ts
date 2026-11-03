import { SignJWT, jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_dev_secret_orca_gym_2026_super_secure'
);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, secretKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (err) {
    return null;
  }
}

export function isSuperAdmin(user?: { role?: string; user_id?: string; payment_ref_no?: string; [key: string]: any } | null): boolean {
  if (!user) return false;
  if (user.role !== 'admin') return false;
  if (user.payment_ref_no === 'subadmin' || user.payment_ref_no === 'staff') return false;
  return user.user_id === 'admin';
}
