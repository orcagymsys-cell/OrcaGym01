import AdminLoginForm from '@/components/AdminLoginForm';
import { Metadata } from 'next';

export const runtime = 'edge';


export const metadata: Metadata = {
  title: 'Admin Login - ORCA GYMNASTICS',
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
