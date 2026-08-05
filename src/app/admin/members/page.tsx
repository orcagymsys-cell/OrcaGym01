'use client';

import { useEffect, useState } from 'react';
import AdminMembersClient from '@/components/AdminMembersClient';
import { getAdminMembersData } from '@/app/actions/admin';

export default function AdminMembersPage() {
  const [data, setData] = useState<any>({ children: [], parents: [], classes: [] });

  useEffect(() => {
    getAdminMembersData().then(res => {
      if (res) setData(res);
    }).catch(() => {});
  }, []);
  
  return (
    <AdminMembersClient 
      initialChildren={data.children || []} 
      initialParents={data.parents || []}
      classes={data.classes || []}
    />
  );
}

