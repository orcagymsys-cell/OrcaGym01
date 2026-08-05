'use client';

import { useEffect, useState } from 'react';
import { getAboutUs } from '@/app/actions/admin';
import AdminAboutEditor from '@/components/AdminAboutEditor';

const defaultAboutUs = {
  company_name_th: 'บริษัท ออก้ายิม จำกัด',
  company_name_en: 'ORCA GYM CO., LTD.',
  registration_number: '0105569135935',
  business_description: 'สถาบันสอนและฝึกทักษะกีฬายิมนาสติก กายกรรม โยคะ การเต้นรำ ทุกรูปแบบ และเชียร์ลีดเดอร์',
  address: '289/240 ซอย ร่มเกล้า 6/1 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510'
};

export default function AdminAboutPage() {
  const [aboutUsData, setAboutUsData] = useState<any>(defaultAboutUs);


  useEffect(() => {
    getAboutUs().then(res => { if (res) setAboutUsData(res); }).catch(() => {});
  }, []);

  return (
    <div className="p-4 md:p-8">
      <AdminAboutEditor initialData={aboutUsData} />
    </div>
  );
}
