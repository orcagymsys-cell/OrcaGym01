import { supabase } from '@/lib/supabase';
import { getUser } from '@/app/actions/user';
import AdminAuditClient from '@/components/AdminAuditClient';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function AdminAuditPage() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    redirect('/admin/login');
  }

  const { data: auditLogs } = await supabase.from('audit_logs').select('*');
  const { data: usersData } = await supabase.from('users').select('*');
  const { data: childrenData } = await supabase.from('children').select('*');
  const { data: classesData } = await supabase.from('classes').select('*');

  const initialAuditLogs = auditLogs || [];
  const users = usersData || [];
  const childrenDataArray = childrenData || [];
  const classes = classesData || [];

  return (
    <AdminAuditClient 
      initialAuditLogs={initialAuditLogs}
      users={users}
      childrenData={childrenDataArray as any}
      classes={classes}
    />
  );
}
