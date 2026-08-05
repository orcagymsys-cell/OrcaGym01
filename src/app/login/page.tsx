import LoginForm from '@/components/LoginForm';
import { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Login - ORCA GYMNASTICS',
  description: 'Login to ORCA GYMNASTICS parent portal',
};

export default function LoginPage() {
  return <LoginForm />;
}
