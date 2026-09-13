'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { Child } from '@/lib/types';

export default function EditChildPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const childId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [mounted, setMounted] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [dob, setDob] = useState('2020-05-05');
  const [gender, setGender] = useState('Girl');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalHours, setTotalHours] = useState<number>(2);
  const [parentPurchased, setParentPurchased] = useState<number>(6);
  const [familyChildren, setFamilyChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function loadChild() {
      try {
        const targetId = childId || 'c_demo_1';
        let c = await store.getChildById(targetId);

        if (!c) {
          const allChildren = await store.getChildren();
          if (allChildren.length > 0) {
            c = allChildren[0];
          } else {
            c = {
              id: targetId,
              parent_id: 'u_parent',
              full_name: 'สบายตา สบายใจ',
              nickname: 'น้องเย็นสบาย',
              dob: '2020-05-05',
              gender: 'Girl',
              avatar: 'girl',
              status: 'approved',
              course_name: 'Orca Cubs',
              total_hours: 12,
              used_hours: 2,
              expiry_date: ''
            };
          }
        }

        setChild(c);
        setFullName(c.full_name || '');
        setNickname(c.nickname || '');
        setDob(c.dob || '2020-05-05');
        setGender(c.gender || 'Girl');
        setPhotoDataUrl(c.photo_url || null);
        setTotalHours(c.total_hours || 2);

        const u = store.getCurrentUser();
        setParentPurchased(u?.purchased_hours || 6);

        const famC = await store.getChildren(c.parent_id);
        setFamilyChildren(famC || []);
      } catch (err) {
        console.error('Error loading child for edit:', err);
      } finally {
        setLoading(false);
      }
    }
    loadChild();
  }, [mounted, childId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoDataUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = childId || (child ? child.id : 'c_demo_1');

    if (!fullName.trim() || !nickname.trim() || !dob) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const updates: Partial<Child> = {
      full_name: fullName.trim(),
      nickname: nickname.trim(),
      dob,
      gender,
      avatar: gender.toLowerCase() === 'boy' ? 'boy' : 'girl',
      photo_url: photoDataUrl || undefined,
      total_hours: totalHours
    };

    await store.updateChild(targetId, updates);
    showToast(`อัปเดตข้อมูล ${nickname} เรียบร้อยแล้ว`);
    router.push(`/student/${targetId}`);
  };

  const handleDelete = async () => {
    const targetId = childId || (child ? child.id : 'c_demo_1');
    if (confirm(`คุณต้องการลบข้อมูลสมาชิกคนนี้ออกจากระบบใช่หรือไม่?\n\n⚠️ การลบจะไม่สามารถย้อนกลับได้`)) {
      await store.deleteChild(targetId);
      showToast(`ลบข้อมูลเรียบร้อยแล้ว`);
      router.push('/home');
    }
  };

  if (!mounted || loading) {
    return <div className="p-8 text-center text-slate-500 font-sans">กำลังโหลดข้อมูลสำหรับแก้ไข...</div>;
  }

  const previewSrc = photoDataUrl || (gender === 'Boy' ? '🧒🏼' : '👧🏻');

  return (
    <div className="font-sans max-w-xl mx-auto pb-4 px-2">
      <div className="mb-2">
        <BackButton text="◀ Back (ยกเลิก)" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-[#001a3a] text-center mb-3 font-sans flex items-center justify-center gap-1.5 flex-wrap">
        <span>✏️ Edit Student Information</span>
        <span className="font-normal text-base sm:text-lg text-slate-700">(แก้ไขข้อมูลเด็ก)</span>
      </h2>

      {/* Photo Upload / Change Box */}
      <div className="relative w-20 h-20 mx-auto mb-1 cursor-pointer">
        <label htmlFor="editPhotoInput" className="cursor-pointer block w-full h-full">
          <div className="w-full h-full rounded-full border-[3px] border-sky-600 bg-sky-100 flex items-center justify-center text-3xl overflow-hidden shadow-inner">
            {typeof previewSrc === 'string' && (previewSrc.startsWith('data:image') || previewSrc.startsWith('http')) ? (
              <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span>{previewSrc}</span>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-sky-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow">
            📷
          </div>
        </label>
        <input
          type="file"
          id="editPhotoInput"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <div className="text-center text-[11px] text-slate-500 font-normal mb-3">
        (แตะที่รูปเพื่ออัปโหลดหรือเปลี่ยนรูปถ่ายเด็ก)
      </div>

      <form onSubmit={handleSave} className="w-full max-w-[320px] mx-auto text-left space-y-3">
        <div>
          <label className="block text-sm font-bold text-[#001a3a] mb-0.5">
            Child's Full Name:
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-9 px-3.5 border-[1.5px] border-[#486581] rounded-full text-[#102a43] text-sm focus:outline-none focus:border-[#001a3a]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#001a3a] mb-0.5">
            Nickname:
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full h-9 px-3.5 border-[1.5px] border-[#486581] rounded-full text-[#102a43] text-sm focus:outline-none focus:border-[#001a3a]"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-bold text-[#001a3a] mb-1">
            Date of Birth <span className="text-sm text-slate-500 font-normal">(กดรูปปฏิทินด้านขวาเพื่อเลือกวันเกิด)</span>:
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full h-9 px-3.5 border-[1.5px] border-[#486581] rounded-full text-[#102a43] text-sm focus:outline-none focus:border-[#001a3a]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#001a3a] mb-0.5">
            Gender:
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full h-9 px-3.5 border-[1.5px] border-[#486581] rounded-full text-[#102a43] text-sm focus:outline-none focus:border-[#001a3a]"
            required
          >
            <option value="Girl">Girl (เด็กหญิง)</option>
            <option value="Boy">Boy (เด็กชาย)</option>
          </select>
        </div>

        {/* Hour Allocation / Top Up Field */}
        <div className="pt-1 font-['Anuphan',sans-serif]">
          {(() => {
            const otherChildrenAllocated = familyChildren
              .filter(fc => fc.id !== (child ? child.id : ''))
              .reduce((sum, fc) => sum + (fc.total_hours || 0), 0);
            const maxAllowedForThisChild = Math.max(totalHours, parentPurchased - otherChildrenAllocated);

            return (
              <div className="bg-sky-50/80 border border-sky-200 p-3 rounded-2xl">
                <label className="block text-xs font-bold text-[#001a3a] mb-1">
                  โควต้าชั่วโมงเรียนสะสมที่จัดสรรให้น้อง:
                </label>
                <select
                  value={totalHours}
                  onChange={(e) => setTotalHours(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-[#486581] rounded-full text-[#102a43] text-xs font-bold bg-white focus:outline-none focus:border-[#001a3a]"
                >
                  {Array.from({ length: maxAllowedForThisChild }).map((_, idx) => {
                    const val = idx + 1;
                    return (
                      <option key={val} value={val}>
                        {val} ครั้ง {val > (child?.total_hours || 0) ? `(เติม +${val - (child?.total_hours || 0)} ครั้งจากตะกร้าครอบครัว)` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-500 font-normal mt-1">
                  * สามารถปรับเพิ่มชั่วโมงโดยดึงจากโควต้าคงเหลือในตะกร้าครอบครัวได้
                </p>
              </div>
            );
          })()}
        </div>

        {/* Save Button */}
        <div className="pt-1">
          <button type="submit" className="btn-primary-orca text-[18px] py-2 mb-2 shadow-sm">
            Save Changes
          </button>
        </div>

        {/* Delete Family Member Button */}
        <button
          type="button"
          onClick={handleDelete}
          className="w-full max-w-[300px] bg-rose-50 text-rose-600 border border-rose-300 font-bold text-sm py-2 rounded-[22px] mx-auto block hover:bg-rose-100 active:scale-95 transition-all text-center shadow-xs"
        >
          🗑️ Delete Family Member
        </button>
      </form>
    </div>
  );
}
