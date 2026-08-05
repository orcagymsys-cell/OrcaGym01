import { getDb } from '@/lib/db';

export const runtime = 'edge';

export default async function AboutUsPage() {
  const db = getDb();
  const info = db.aboutUs || {
    company_name_th: 'บริษัท ออก้ายิม จำกัด',
    company_name_en: 'ORCA GYM CO., LTD.',
    registration_number: '0105569135935',
    business_description: 'สถาบันสอนและฝึกทักษะกีฬายิมนาสติก กายกรรม โยคะ การเต้นรำ ทุกรูปแบบ และเชียร์ลีดเดอร์ ให้แก่ เด็ก เยาวชน และบุคคลทั่วไป เมื่อได้รับอนุญาตจากหน่วยงานที่เกี่ยวข้องแล้ว',
    address: '289/240 ซอย ร่มเกล้า 6/1 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510'
  };

  return (
    <div className="flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold text-[#183363] mb-8">About Us</h1>
      
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-2xl font-black text-[#183363] mb-1">{info.company_name_th}</h2>
        <h3 className="text-base font-bold text-[#183363] tracking-wide mb-6">{info.company_name_en}</h3>
        
        <div className="space-y-4 text-slate-700 text-left mx-auto max-w-lg text-sm md:text-base">
          <div className="flex border-b border-slate-200 pb-3">
            <span className="font-bold w-32 text-[#183363] shrink-0">เลขทะเบียน:</span>
            <span className="font-medium text-slate-800">{info.registration_number}</span>
          </div>
          <div className="flex border-b border-slate-200 pb-3">
            <span className="font-bold w-32 text-[#183363] shrink-0">ประกอบธุรกิจ:</span>
            <span className="flex-1 font-medium text-slate-800 leading-relaxed">{info.business_description}</span>
          </div>
          <div className="flex pt-1">
            <span className="font-bold w-32 text-[#183363] shrink-0">ที่ตั้ง:</span>
            <span className="flex-1 font-medium text-slate-800 leading-relaxed">{info.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
