'use client';

import { useEffect, useState } from 'react';
import AdminScheduleMatrix from '@/components/AdminScheduleMatrix';
import { getScheduleMatrix, getAdminMembersData } from '@/app/actions/admin';

export default function AdminSchedulePage() {
  const [data, setData] = useState<any>({ classes: [], schedules: [], bookings: [] });
  const [membersData, setMembersData] = useState<any>({ children: [], parents: [], classes: [] });

  useEffect(() => {
    getScheduleMatrix().then(res => { if (res) setData(res); }).catch(() => {});
    getAdminMembersData().then(res => { if (res) setMembersData(res); }).catch(() => {});
  }, []);

  return (
    <AdminScheduleMatrix 
      classes={data.classes || []} 
      schedules={data.schedules || []} 
      bookings={data.bookings || []}
      childrenData={membersData.children || []}
      parents={membersData.parents || []}
    />
  );
}
