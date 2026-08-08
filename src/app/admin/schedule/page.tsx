'use client';

import { useEffect, useState } from 'react';
import AdminScheduleMatrix from '@/components/AdminScheduleMatrix';
import { getScheduleMatrix, getAdminMembersData } from '@/app/actions/admin';

export default function AdminSchedulePage() {
  const [data, setData] = useState<any>({ classes: [], schedules: [], bookings: [] });
  const [membersData, setMembersData] = useState<any>({ children: [], parents: [], classes: [] });

  useEffect(() => {
    getScheduleMatrix().then(res => { 
      if (res) {
        console.log("AdminSchedulePage fetched matrix data:", res);
        setData(res); 
      }
    }).catch(e => console.error(e));
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
