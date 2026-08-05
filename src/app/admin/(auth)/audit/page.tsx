import { getDb } from '@/lib/db';
import { getUser } from '@/app/actions/user';
import AdminAuditClient from '@/components/AdminAuditClient';
import { redirect } from 'next/navigation';


export default async function AdminAuditPage() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    redirect('/admin/login');
  }

  const db = getDb();
  const initialAuditLogs = db.auditLogs || [];
  const users = db.users || [];
  const childrenData = db.children || [];
  const classes = db.classes || [];

  return (
    <AdminAuditClient 
      initialAuditLogs={initialAuditLogs}
      users={users}
      childrenData={childrenData}
      classes={classes}
    />
  );
}
