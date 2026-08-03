'use client';

import { useState } from 'react';
import { AboutUsInfo } from '@/lib/types';
import { updateAboutUs } from '@/app/actions/admin';
import { Edit2, Save, X, Building, FileText, MapPin, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminAboutEditor({ initialData }: { initialData: AboutUsInfo }) {
  const [info, setInfo] = useState<AboutUsInfo>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const res = await updateAboutUs(info);
    if (res.error) {
      setMessage(`Error: ${res.error}`);
    } else {
      setMessage('บันทึกข้อมูลเรียบร้อยแล้ว');
      setIsEditing(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#183363]">About Us Management</h1>
          <p className="text-slate-600 text-sm mt-1">จัดการข้อมูลบริษัท ออก้ายิม จำกัด ที่แสดงผลในหน้า About Us สำหรับลูกค้าและผู้ปกครอง</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center space-x-2 bg-[#183363] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#112448] transition-all shadow-md active:scale-95"
        >
          {isEditing ? <X size={18} /> : <Edit2 size={18} />}
          <span>{isEditing ? 'ปิดฟอร์มแก้ไข' : 'ปรับแต่งข้อมูล'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.includes('Error') ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {message}
        </div>
      )}

      {/* Editing Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-blue-200 space-y-5 animate-fade-in">
          <h2 className="text-xl font-black text-[#183363] border-b pb-3 flex items-center space-x-2">
            <Edit2 size={20} className="text-blue-600" />
            <span>แก้ไขข้อมูลบริษัท / About Us</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Building size={14} />
                <span>ชื่อบริษัท (ภาษาไทย)</span>
              </label>
              <input
                type="text"
                value={info.company_name_th}
                onChange={e => setInfo({ ...info, company_name_th: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none font-semibold text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Building size={14} />
                <span>ชื่อบริษัท (ภาษาอังกฤษ)</span>
              </label>
              <input
                type="text"
                value={info.company_name_en}
                onChange={e => setInfo({ ...info, company_name_en: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none font-semibold text-slate-800 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Hash size={14} />
              <span>เลขทะเบียนนิติบุคคล</span>
            </label>
            <input
              type="text"
              value={info.registration_number}
              onChange={e => setInfo({ ...info, registration_number: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none font-semibold text-slate-800 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <FileText size={14} />
              <span>รายละเอียดการประกอบธุรกิจ</span>
            </label>
            <textarea
              rows={3}
              value={info.business_description}
              onChange={e => setInfo({ ...info, business_description: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none font-medium text-slate-800 text-sm leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <MapPin size={14} />
              <span>ที่ตั้งบริษัท</span>
            </label>
            <textarea
              rows={2}
              value={info.address}
              onChange={e => setInfo({ ...info, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none font-medium text-slate-800 text-sm leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-[#183363] text-white rounded-xl font-bold hover:bg-[#112448] disabled:opacity-50 shadow-md"
            >
              <Save size={18} />
              <span>{loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Live Preview Display Card (Matching Reference Design 100%) */}
      <div className="bg-slate-50 p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
        <h2 className="text-[#183363] font-bold text-sm uppercase tracking-widest mb-6">ตัวอย่างการแสดงผลบนหน้าเว็บ (Live Preview)</h2>
        
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
    </div>
  );
}
