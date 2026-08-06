'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Child, User, GymClass } from '@/lib/types';
import { approveChild, approveChildCourse, addCoursesToChild, deleteParentAccount, updateChildCourse } from '@/app/actions/admin';
import { Check, Edit, UserPlus, Users, Key, Phone, BookOpen, Clock, ShieldCheck, Copy, X, Trash2, Bell, BellRing, Edit3 } from 'lucide-react';

function calculateAge(dobStr?: string): string {
  if (!dobStr) return '';
  const [y, m, d] = dobStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
  const birthDate = new Date(y, m - 1, d);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }

  if (years > 0 && months > 0) return `${years} ขวบ ${months} เดือน`;
  if (years > 0) return `${years} ขวบ`;
  if (months > 0) return `${months} เดือน`;
  return 'น้อยกว่า 1 เดือน';
}

export default function AdminMembersClient({ 
  initialChildren,
  initialParents = [],
  classes = []
}: { 
  initialChildren: Child[];
  initialParents?: User[];
  classes?: GymClass[];
}) {
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [parents, setParents] = useState<User[]>(initialParents);
  const [activeTab, setActiveTab] = useState<'parents' | 'children'>('parents');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  useEffect(() => {
    setChildren(initialChildren);
    setParents(initialParents);
  }, [initialChildren, initialParents]);
  
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [addAmount, setAddAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  const [courseSelections, setCourseSelections] = useState<{ [classId: string]: { selected: boolean, count: number | string } }>(() => {
    const initial: { [classId: string]: { selected: boolean, count: number | string } } = {};
    classes.forEach(c => {
      initial[c.id] = { selected: false, count: '' };
    });
    return initial;
  });

  // New Parent Account Modal State
  const [isAddParentOpen, setIsAddParentOpen] = useState(false);
  const [parentForm, setParentForm] = useState({
    username: '',
    password: '',
    full_name: '',
    phone_number: '',
    max_children_allowed: 10,
    amount_paid: '',
    payment_ref_no: '',
    payment_slip_url: '',
    sender_bank_info: '',
    payment_time: '',
    remark: ''
  });
  const [formError, setFormError] = useState('');
  const [createdResult, setCreatedResult] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Stats
  const activeParents = parents.length;

  const [selectedCoursesMap, setSelectedCoursesMap] = useState<{ [childId: string]: string }>({});
  const router = useRouter();

  const [editingChildModal, setEditingChildModal] = useState<{
    childId: string;
    childName: string;
    courseId: string;
    purchasedClasses: number;
    bonusClasses: number;
    totalClasses: number;
    remainingClasses: number;
  } | null>(null);

  const [approvingChildModal, setApprovingChildModal] = useState<{
    childId: string;
    childName: string;
    parentName: string;
    courseId: string;
    purchasedClasses: number;
    bonusClasses: number;
    amountPaid: number;
    paymentRefNo: string;
    paymentSlipUrl: string;
    remark: string;
  } | null>(null);

  const handleSaveChildCourse = async () => {
    if (!editingChildModal) return;
    setLoading(true);
    const calculatedTotal = editingChildModal.purchasedClasses + editingChildModal.bonusClasses;
    const res = await updateChildCourse(editingChildModal.childId, {
      courseId: editingChildModal.courseId,
      purchasedClasses: editingChildModal.purchasedClasses,
      bonusClasses: editingChildModal.bonusClasses,
      totalClasses: calculatedTotal,
      remainingClasses: editingChildModal.remainingClasses
    });

    if (res.success) {
      const gymClass = classes.find(c => c.id === editingChildModal.courseId);
      const title = gymClass?.title || gymClass?.name || 'Orca Cubs Class';
      setChildren(children.map(c => c.id === editingChildModal.childId ? {
        ...c,
        assigned_course_id: editingChildModal.courseId,
        assigned_course_title: title,
        total_classes: calculatedTotal,
        remaining_classes: editingChildModal.remainingClasses
      } as any : c));
      setEditingChildModal(null);
      router.refresh();
    } else {
      alert(res.error || 'เกิดข้อผิดพลาดในการแก้ไขคอร์ส');
    }
    setLoading(false);
  };

  const handleConfirmApproveModal = async () => {
    if (!approvingChildModal) return;
    setLoading(true);
    const { childId, courseId, purchasedClasses, bonusClasses, amountPaid, paymentRefNo, paymentSlipUrl, remark } = approvingChildModal;

    try {
      const targetClass = classes.find(c => c.id === courseId);
      const courseTitle = targetClass?.title || targetClass?.name || 'Orca Cubs Class';
      const total = purchasedClasses + bonusClasses;

      // 1. Get current child to find parent_id
      const { data: child } = await supabase.from('children').select('parent_id, full_name, nickname').eq('id', childId).single();
      if (!child) throw new Error('Child not found');

      // 2. Update user's courses_purchased
      const { data: parentUser } = await supabase.from('users').select('*').eq('id', child.parent_id).single();
      if (parentUser) {
        if (!parentUser.courses_purchased) parentUser.courses_purchased = [];
        let familyCourse = parentUser.courses_purchased.find((cp: any) => cp.class_id === courseId);
        if (!familyCourse) {
          familyCourse = {
            class_id: courseId,
            class_title: courseTitle,
            purchased_classes: purchasedClasses,
            bonus_classes: bonusClasses,
            total_classes: total,
            used_classes: 0,
            remaining_classes: total
          };
          parentUser.courses_purchased.push(familyCourse);
        } else {
          familyCourse.purchased_classes = purchasedClasses;
          familyCourse.bonus_classes = bonusClasses;
          familyCourse.total_classes = total;
          familyCourse.remaining_classes = total;
        }
        await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
      }

      // 3. Update child
      const { error } = await supabase.from('children').update({
        assigned_course_id: courseId,
        assigned_course_title: courseTitle,
        total_classes: total,
        remaining_classes: total,
        status: 'approved',
        course_approval_status: 'approved'
      }).eq('id', childId);
      
      if (error) throw error;

      // 4. Audit Log
      const auditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        admin_id: 'admin_1', // Assuming admin is doing this, could get from session but hardcoded is okay for now or pass via props
        admin_name: 'Admin',
        action_type: 'APPROVE_COURSE',
        target_user_id: parentUser?.id,
        target_user_name: parentUser?.full_name || 'ผู้ปกครอง',
        target_child_id: childId,
        target_child_name: `${child.full_name} (น้อง ${child.nickname})`,
        course_id: courseId,
        course_name: courseTitle,
        purchased_classes: purchasedClasses,
        bonus_classes: bonusClasses,
        total_classes: total,
        remaining_classes: total,
        amount_paid: amountPaid || 0,
        payment_slip_url: paymentSlipUrl || '',
        payment_ref_no: paymentRefNo || '',
        remark: remark || 'อนุมัติสิทธิ์คลาสเรียน'
      };
      await supabase.from('audit_logs').insert([auditLog]);

      setChildren(children.map(c => 
        c.id === childId 
          ? { 
              ...c, 
              assigned_course_id: courseId,
              assigned_course_title: courseTitle,
              total_classes: total,
              remaining_classes: total,
              status: 'approved', 
              course_approval_status: 'approved' 
            } 
          : c
      ));
      setApprovingChildModal(null);
      alert('✅ อนุมัติและล็อคคอร์สเรียบร้อยแล้ว (Approved successfully)');
    } catch (e: any) {
      alert('❌ ' + (e.message || 'เกิดข้อผิดพลาดในการอนุมัติคอร์ส'));
    }
    
    setLoading(false);
  };

  const handleApprove = async (childId: string, courseId?: string) => {
    const targetCourseId = courseId || selectedCoursesMap[childId];
    setLoading(true);
    const res = await approveChildCourse(childId, targetCourseId);
    if (res.success) {
      const targetClass = classes.find(c => c.id === targetCourseId);
      const courseTitle = targetClass?.title || targetClass?.name || 'Orca Cubs Class';
      setChildren(children.map(c => 
        c.id === childId 
          ? { 
              ...c, 
              assigned_course_id: targetCourseId || (c as any).assigned_course_id,
              assigned_course_title: courseTitle,
              status: 'approved', 
              course_approval_status: 'approved' 
            } 
          : c
      ));
      router.refresh();
    } else {
      alert(res.error || 'เกิดข้อผิดพลาดในการอนุมัติสิทธิ์คลาส');
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('slips')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      alert(`อัปโหลดล้มเหลว: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from('slips').getPublicUrl(fileName);
    setParentForm(prev => ({ ...prev, payment_slip_url: data.publicUrl }));
    setIsUploading(false);
  };

  const handleAddCourses = async () => {
    if (!selectedChild) return;
    setLoading(true);
    const res = await addCoursesToChild(selectedChild.id, addAmount);
    if (res.success) {
      setChildren(children.map(c => 
        c.id === selectedChild.id 
          ? { ...c, total_classes: c.total_classes + addAmount, remaining_classes: c.remaining_classes + addAmount }
          : c
      ));
      setSelectedChild(null);
    }
    setLoading(false);
  };

  const handleCreateParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    const coursesPurchased = Object.keys(courseSelections)
      .filter(cId => courseSelections[cId].selected)
      .map(cId => ({
        class_id: cId,
        total_classes: Number(courseSelections[cId].count) || 0
      }));

    if (coursesPurchased.length === 0) {
      setFormError('กรุณาเลือกอย่างน้อย 1 คลาสเรียนและกำหนดจำนวนครั้งที่ซื้อ');
      setLoading(false);
      return;
    }

    try {
      const { data: existingUsers } = await supabase.from('users').select('*');
      const existingUser = existingUsers?.find(u => u.username.toLowerCase() === parentForm.username.trim().toLowerCase());
      if (existingUser) {
        setFormError('Username นี้มีในระบบแล้ว กรุณาเลือก Username อื่น');
        setLoading(false);
        return;
      }

      const coursesPurchasedList = coursesPurchased.map(cp => {
        const cls = classes.find(c => c.id === cp.class_id);
        const count = Number(cp.total_classes) || 0;
        return {
          class_id: cp.class_id,
          class_title: cls?.title || cls?.name || 'ORCA Gymnastics Course',
          purchased_classes: count,
          bonus_classes: 0,
          total_classes: count,
          used_classes: 0,
          remaining_classes: count
        };
      });

      const genId = () => Math.random().toString(36).substr(2, 9);
      const newUser = {
        id: `user_${genId()}`,
        role: 'parent',
        username: parentForm.username.trim(),
        password: parentForm.password?.trim() || 'orca1234',
        full_name: parentForm.full_name.trim(),
        phone_number: parentForm.phone_number.trim(),
        first_login: true,
        max_children_allowed: 10,
        courses_purchased: coursesPurchasedList
      };

      const auditLog = {
        id: `audit_${Date.now()}_${genId()}`,
        timestamp: new Date().toISOString(),
        admin_id: 'admin',
        admin_name: 'Admin',
        action_type: 'REGISTER_PARENT',
        target_user_id: newUser.id,
        target_user_name: newUser.full_name,
        amount_paid: parseFloat(parentForm.amount_paid) || 0,
        payment_ref_no: parentForm.payment_ref_no || '',
        payment_slip_url: parentForm.payment_slip_url || '',
        sender_bank_info: parentForm.sender_bank_info || '',
        payment_time: parentForm.payment_time || '',
        remark: parentForm.remark || `Admin สร้างบัญชีผู้ปกครองใหม่ (${newUser.username})`
      };

      await supabase.from('audit_logs').insert([auditLog]);
      const { error: insertError } = await supabase.from('users').insert([newUser]);

      if (insertError) {
        setFormError(insertError.message);
      } else {
        const userObj = { ...newUser, role: 'parent' as const };
        setCreatedResult(userObj as unknown as User);
        setParents([...parents, userObj as unknown as User]);
      }
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการสร้างบัญชี');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = (user: User) => {
    const coursesStr = user.courses_purchased && user.courses_purchased.length > 0
      ? user.courses_purchased.map(cp => `  • ${cp.class_title}: ${cp.total_classes} ครั้ง`).join('\n')
      : `  • ${user.purchased_course_name || 'ORCA Gymnastics'}: ${user.purchased_classes || 0} ครั้ง`;

    const text = `🎉 บัญชีผู้ใช้งานระบบ ORCA GYMNASTICS
----------------------------------
Username: ${user.username}
Password: ${user.password || 'orca1234'}
ผู้ปกครอง: ${user.full_name}
คลาส & โควต้าที่ซื้อ:
${coursesStr}
----------------------------------
กรุณานำ Username และ Password ไปเข้าสู่ระบบเพื่อลงทะเบียนข้อมูลบุตรหลาน (Add Family Member)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDeleteParent = async (parentId: string, parentName: string) => {
    if (window.confirm(`คุณต้องการลบบัญชีผู้ปกครอง "${parentName}" และข้อมูลบุตรหลานที่เกี่ยวข้องใช่หรือไม่?`)) {
      setLoading(true);
      try {
        const { data: childrenData } = await supabase.from('children').select('id').eq('parent_id', parentId);
        const childrenIds = childrenData?.map(c => c.id) || [];

        if (childrenIds.length > 0) {
          await supabase.from('bookings').delete().in('child_id', childrenIds);
          await supabase.from('children').delete().eq('parent_id', parentId);
        }

        const { error } = await supabase.from('users').delete().eq('id', parentId);

        if (error) {
          alert(`เกิดข้อผิดพลาดในการลบบัญชี: ${error.message}`);
        } else {
          setParents(parents.filter(p => p.id !== parentId));
          setChildren(children.filter(c => c.parent_id !== parentId));
        }
      } catch (err: any) {
        alert(err.message || 'เกิดข้อผิดพลาดในการลบบัญชี');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#183363]">Members & Students</h1>
          <p className="text-slate-600 text-sm mt-1">จัดการบัญชีผู้ปกครอง สิทธิ์การเข้าใช้งาน และข้อมูลนักเรียนทั้งหมดในระบบ</p>
        </div>

        <button 
          onClick={() => {
            const resetSel: { [classId: string]: { selected: boolean, count: number | string } } = {};
            classes.forEach(c => {
              resetSel[c.id] = { selected: false, count: '' };
            });
            setCourseSelections(resetSel);
            setParentForm({
              username: '',
              password: '',
              full_name: '',
              phone_number: '',
              max_children_allowed: 10,
              amount_paid: '',
              payment_ref_no: '',
              payment_slip_url: '',
              sender_bank_info: '',
              payment_time: '',
              remark: ''
            });
            setIsAddParentOpen(true);
            setCreatedResult(null);
            setFormError('');
          }}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 shrink-0"
        >
          <UserPlus size={20} />
          <span>สร้างบัญชีผู้ปกครองใหม่</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('parents')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
            activeTab === 'parents'
              ? 'bg-[#183363] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={18} />
          <span>บัญชีผู้ปกครอง ({parents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('children')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
            activeTab === 'children'
              ? 'bg-[#183363] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck size={18} />
          <span>รายชื่อนักเรียน ({children.length})</span>
        </button>
      </div>

      {/* TAB 1: PARENTS TABLE */}
      {activeTab === 'parents' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/80 text-[#183363] text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                  <th className="p-4">Username</th>
                  <th className="p-4">ชื่อผู้ปกครอง</th>
                  <th className="p-4">เบอร์โทรศัพท์</th>
                  <th className="p-4">คลาส & โควต้าที่ซื้อ</th>
                  <th className="p-4 text-center">การลงทะเบียนบุตรหลาน</th>
                  <th className="p-4 text-center">จัดการข้อมูล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {parents.map(parent => {
                  const parentChildren = children.filter(c => c.parent_id === parent.id);
                  return (
                    <tr key={parent.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-extrabold text-[#183363]">
                        <div className="flex items-center space-x-1.5">
                          <Key size={14} className="text-amber-500 shrink-0" />
                          <span>{parent.username}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{parent.full_name}</td>
                      <td className="p-4 text-slate-600 font-medium">{parent.phone_number || '-'}</td>
                      <td className="p-4">
                        {parent.courses_purchased && parent.courses_purchased.length > 0 ? (
                          <div className="space-y-1">
                            {parent.courses_purchased.map(cp => (
                              <div key={cp.class_id} className="flex items-center justify-between text-xs bg-slate-50 px-2 py-1 rounded-lg border">
                                <span className="font-bold text-[#183363]">{cp.class_title}</span>
                                <span className="text-emerald-700 font-black">
                                  {cp.remaining_classes}/{cp.total_classes} ครั้ง
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-bold text-[#183363] text-xs">
                              {parent.purchased_course_name || 'ORCA Gymnastics'}
                            </span>
                            <span className="text-emerald-600 font-extrabold text-xs">
                              {parent.purchased_classes || 0} ครั้ง/ชั่วโมง
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {parentChildren.length > 0 ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                            เพิ่มแล้ว ({parentChildren.length} คน)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                            ยังไม่ได้เพิ่มบุตรหลาน
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleCopyCredentials(parent)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 transition-all flex items-center justify-center space-x-1"
                            title="คัดลอกข้อมูลรหัสผ่าน"
                          >
                            <Copy size={13} />
                            <span>คัดลอกข้อมูล</span>
                          </button>

                          <button
                            onClick={() => handleDeleteParent(parent.id, parent.full_name)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold border border-rose-200 transition-all flex items-center justify-center space-x-1"
                            title="ลบบัญชีผู้ปกครอง"
                          >
                            <Trash2 size={13} />
                            <span>ลบ Account</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CHILDREN ROSTER TABLE */}
      {activeTab === 'children' && (
        <div className="space-y-4">
          {/* Course Filter Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-2">
              <BookOpen size={18} className="text-blue-600" />
              <span className="font-extrabold text-sm text-[#183363]">กรองตาม Course (Course Student Roster):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCourseFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all border ${
                  courseFilter === 'all'
                    ? 'bg-[#183363] text-white border-[#183363] shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                เด็กทุกคน ({children.length} คน)
              </button>
              {classes.map(c => {
                const count = children.filter(ch => (ch as any).assigned_course_id === c.id || ch.full_name).length;
                const isSelected = courseFilter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCourseFilter(c.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all border ${
                      isSelected
                        ? 'bg-[#183363] text-white border-[#183363] shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.title || c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-100/80 text-[#183363] text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                    <th className="p-4">ชื่อนักเรียน</th>
                    <th className="p-4">ผู้ปกครอง & เบอร์โทร</th>
                    <th className="p-4">Course ที่ลงเรียน</th>
                    <th className="p-4 text-center">ซื้อทั้งหมด</th>
                    <th className="p-4 text-center">คงเหลือ & แจ้งเตือน</th>
                    <th className="p-4 text-center">สถานะตรวจสอบ</th>
                    <th className="p-4 text-center">จัดการคลาส</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {children
                    .filter(ch => courseFilter === 'all' || (ch as any).assigned_course_id === courseFilter)
                    .map(child => {
                      const parent = parents.find(p => p.id === child.parent_id);
                      const isPending = child.status === 'pending' || (child as any).course_approval_status === 'pending';
                      
                      const childCourseId = (child as any).assigned_course_id;
                      const familyCourse = parent?.courses_purchased?.find(cp => cp.class_id === childCourseId || cp.class_title === child.assigned_course_title) || parent?.courses_purchased?.[0];
                      const totalClasses = familyCourse ? familyCourse.total_classes : (child.total_classes || 10);
                      const remainingClasses = familyCourse ? familyCourse.remaining_classes : (child.remaining_classes || 0);

                      const isLowClasses = remainingClasses <= 2;

                      return (
                        <tr key={child.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-800">
                            <div className="flex items-center space-x-2">
                              <span>{child.full_name}</span>
                              {isLowClasses && (
                                <span 
                                  className="relative group inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600 animate-pulse cursor-pointer"
                                  title={`⚠️ แจ้งเตือน: คลาสชั่วโมงเรียนใกล้หมด! เหลือเพียง ${remainingClasses} ครั้ง`}
                                >
                                  <BellRing size={14} className="text-rose-600" />
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-0.5">
                              <span className="text-sky-700 font-extrabold">น้อง {child.nickname}</span>
                              {child.dob && (
                                <span className="px-2 py-0.5 bg-sky-50 text-[#183363] rounded-md font-bold text-[11px] border border-sky-200">
                                  🎂 {calculateAge(child.dob)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium text-xs">
                            <div className="font-bold text-slate-800">{parent?.full_name || 'ผู้ปกครอง'}</div>
                            <div className="text-slate-500 font-semibold">{parent?.phone_number || '-'}</div>
                          </td>
                          <td className="p-4 font-bold text-[#183363] text-xs">
                            {isPending ? (
                              <select
                                value={selectedCoursesMap[child.id] || (child as any).assigned_course_id || (parent?.courses_purchased?.[0]?.class_id) || classes[0]?.id || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedCoursesMap(prev => ({ ...prev, [child.id]: val }));
                                }}
                                className="px-2.5 py-1.5 bg-sky-50 border-2 border-[#183363] text-[#183363] font-black text-xs rounded-xl focus:outline-none cursor-pointer"
                              >
                                {(parent?.courses_purchased && parent.courses_purchased.length > 0 
                                  ? parent.courses_purchased.map(cp => ({ id: cp.class_id, title: cp.class_title }))
                                  : classes.map(c => ({ id: c.id, title: c.title || c.name }))
                                ).map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.title}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>{(child as any).assigned_course_title || 'Orca Cubs Class'}</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-700 text-xs">
                            <div>{totalClasses} ครั้ง</div>
                            {familyCourse?.bonus_classes ? (
                              <div className="text-[10px] text-amber-700 font-extrabold mt-0.5 whitespace-nowrap">
                                (ซื้อ {familyCourse.purchased_classes || (totalClasses - familyCourse.bonus_classes)} + 🎁 แถม {familyCourse.bonus_classes})
                              </div>
                            ) : null}
                          </td>
                          <td className="p-4 text-center font-black text-xs">
                            <div className="flex items-center justify-center space-x-1.5">
                              <span className={remainingClasses <= 2 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-black'}>
                                {remainingClasses} ครั้ง
                              </span>
                              {isLowClasses && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[10px] font-black border border-rose-200">
                                  🔔 ใกล้หมด!
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {isPending ? (
                              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                                ⏳ Pending (รอแอดมินอนุมัติ)
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                                ✅ Approved (อนุมัติแล้ว)
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {isPending ? (
                                <button 
                                  onClick={() => {
                                    const chosenCourseId = selectedCoursesMap[child.id] || (child as any).assigned_course_id || (parent?.courses_purchased?.[0]?.class_id) || classes[0]?.id || '';
                                    const familyCourse = parent?.courses_purchased?.find(cp => cp.class_id === chosenCourseId);
                                    const purchased = familyCourse ? familyCourse.purchased_classes : 10;
                                    const bonus = familyCourse ? familyCourse.bonus_classes : 0;
                                    setApprovingChildModal({
                                      childId: child.id,
                                      childName: `น้อง ${child.nickname} (${child.full_name})`,
                                      parentName: parent?.full_name || 'ผู้ปกครอง',
                                      courseId: chosenCourseId,
                                      purchasedClasses: purchased || 10,
                                      bonusClasses: bonus || 0,
                                      amountPaid: 0,
                                      paymentRefNo: '',
                                      paymentSlipUrl: '',
                                      remark: 'อนุมัติสิทธิ์คลาสเรียน'
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-black shadow-xs transition-all flex items-center space-x-1"
                                >
                                  <Check size={14} />
                                  <span>อนุมัติ</span>
                                </button>
                              ) : null}

                              <button
                                onClick={() => {
                                  const purchased = familyCourse?.purchased_classes !== undefined ? familyCourse.purchased_classes : totalClasses;
                                  const bonus = familyCourse?.bonus_classes || 0;
                                  setEditingChildModal({
                                    childId: child.id,
                                    childName: `น้อง ${child.nickname} (${child.full_name})`,
                                    courseId: (child as any).assigned_course_id || classes[0]?.id || 'class_1',
                                    purchasedClasses: purchased,
                                    bonusClasses: bonus,
                                    totalClasses,
                                    remainingClasses
                                  });
                                }}
                                className="px-3 py-1.5 bg-sky-50 text-[#183363] hover:bg-sky-100 border border-sky-300 rounded-xl text-xs font-black transition-colors flex items-center space-x-1"
                              >
                                <Edit3 size={13} />
                                <span>แก้ไขคอร์ส</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PARENT ACCOUNT MODAL */}
      {isAddParentOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddParentOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            {!createdResult ? (
              <form onSubmit={handleCreateParentSubmit} className="space-y-4">
                <div className="border-b pb-3">
                  <h2 className="text-xl font-black text-[#183363] flex items-center space-x-2">
                    <UserPlus className="text-emerald-600" size={22} />
                    <span>สร้างบัญชีผู้ปกครอง (Create Parent Account)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">แอดมินสร้าง Username & Password และแพ็กเกจเรียนที่ซื้อ เพื่อให้ผู้ปกครองไปเข้าสู่ระบบและกด Add Family Member</p>
                </div>

                {formError && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Key size={13} />
                    <span>Username (ชื่อผู้ใช้เข้าสู่ระบบ)</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น somchai01 หรือ parent_orca"
                    value={parentForm.username}
                    onChange={e => setParentForm({ ...parentForm, username: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none text-sm font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Key size={13} />
                    <span>Password (รหัสผ่านเริ่มต้น)</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น orca1234"
                    value={parentForm.password}
                    onChange={e => setParentForm({ ...parentForm, password: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none text-sm font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล ผู้ปกครอง</label>
                    <input 
                      type="text"
                      placeholder="เช่น นาย สมชาย ใจดี"
                      value={parentForm.full_name}
                      onChange={e => setParentForm({ ...parentForm, full_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                      <Phone size={13} />
                      <span>เบอร์โทรศัพท์</span>
                    </label>
                    <input 
                      type="text"
                      placeholder="เช่น 0812345678"
                      value={parentForm.phone_number}
                      onChange={e => setParentForm({ ...parentForm, phone_number: e.target.value })}
                      className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t border-b py-3 my-2">
                  <label className="block text-xs font-black text-[#183363] flex items-center space-x-1">
                    <BookOpen size={14} className="text-blue-600" />
                    <span>เลือก Course และจำนวนครั้งที่ซื้อ (ตะกร้าเรียนครอบครัว)</span>
                  </label>

                  {classes.map(c => {
                    const isSelected = courseSelections[c.id]?.selected || false;
                    const count = courseSelections[c.id]?.count ?? '';
                    return (
                      <div key={c.id} className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${isSelected ? 'bg-sky-50 border-sky-400' : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'}`}>
                        <label className="flex items-center space-x-2 cursor-pointer font-bold text-sm text-slate-800 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              const checked = e.target.checked;
                              setCourseSelections(prev => ({
                                ...prev,
                                [c.id]: { selected: checked, count: checked ? (prev[c.id]?.count || '') : '' }
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span>{c.title || c.name}</span>
                        </label>

                        {isSelected && (
                          <div className="flex items-center space-x-1 shrink-0">
                            <span className="text-xs font-bold text-slate-600">จำนวน:</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="ระบุจำนวน"
                              value={count}
                              onChange={e => {
                                const val = e.target.value === '' ? '' : (parseInt(e.target.value) || '');
                                setCourseSelections(prev => ({
                                  ...prev,
                                  [c.id]: { selected: true, count: val }
                                }));
                              }}
                              className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-sm font-bold text-center bg-white focus:ring-2 focus:ring-[#183363] outline-none"
                            />
                            <span className="text-xs font-bold text-slate-600">ครั้ง</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* PAYMENT EVIDENCE & VERIFICATION FIELDS */}
                <div className="p-4 bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl space-y-3 shadow-xs">
                  <h4 className="font-black text-[#183363] text-xs flex items-center gap-1.5">
                    💳 หลักฐานการชำระเงิน (Payment Evidence & Anti-Fraud Record)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ยอดเงินที่โอน (บาท)</label>
                      <input 
                        type="number"
                        placeholder="เช่น 5000"
                        value={parentForm.amount_paid}
                        onChange={e => setParentForm({ ...parentForm, amount_paid: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-700 bg-white focus:ring-2 focus:ring-[#183363] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">เลขที่อ้างอิงสลิป (Ref No.)</label>
                      <input 
                        type="text"
                        placeholder="เช่น 20260803143099"
                        value={parentForm.payment_ref_no}
                        onChange={e => setParentForm({ ...parentForm, payment_ref_no: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 bg-white focus:ring-2 focus:ring-[#183363] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ชื่อบัญชีผู้โอน / ธนาคาร</label>
                      <input 
                        type="text"
                        placeholder="เช่น นาย สมชาย ใจดี (กสิกรไทย)"
                        value={parentForm.sender_bank_info}
                        onChange={e => setParentForm({ ...parentForm, sender_bank_info: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-[#183363] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">วัน-เวลาที่โอนเงิน</label>
                      <input 
                        type="text"
                        placeholder="เช่น 03/08/2026 14:30 น."
                        value={parentForm.payment_time}
                        onChange={e => setParentForm({ ...parentForm, payment_time: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-[#183363] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">อัปโหลดสลิปโอนเงิน (ถ้ามี)</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                      {isUploading && <span className="text-xs text-emerald-600 font-bold animate-pulse flex-shrink-0">กำลังอัปโหลด...</span>}
                    </div>
                    {parentForm.payment_slip_url && (
                      <div className="mt-2 text-xs text-emerald-600 flex items-center font-bold">
                        <Check size={14} className="mr-1" /> แนบไฟล์สลิปเรียบร้อยแล้ว
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button 
                    type="button"
                    onClick={() => setIsAddParentOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || isUploading}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 text-sm shadow-md"
                  >
                    {loading ? 'กำลังสร้าง...' : 'สร้างบัญชีผู้ปกครอง'}
                  </button>
                </div>
              </form>
            ) : (
              /* SUCCESS CONFIRMATION CARD */
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#183363]">สร้างบัญชีผู้ปกครองสำเร็จ!</h3>
                  <p className="text-xs text-slate-500 mt-1">คัดลอกข้อมูลนี้ส่งให้ผู้ปกครองสำหรับใช้เข้าสู่ระบบลงทะเบียน</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-sm space-y-2 font-mono">
                  <div><span className="font-bold text-slate-500">Username:</span> <span className="font-black text-[#183363]">{createdResult.username}</span></div>
                  <div><span className="font-bold text-slate-500">Password:</span> <span className="font-black text-[#183363]">{createdResult.password || 'orca1234'}</span></div>
                  <div><span className="font-bold text-slate-500">ผู้ปกครอง:</span> <span className="font-bold text-slate-800">{createdResult.full_name}</span></div>
                  <div><span className="font-bold text-slate-500">คลาสที่ซื้อ:</span> <span className="font-bold text-emerald-700">
                    {createdResult.courses_purchased && createdResult.courses_purchased.length > 0
                      ? createdResult.courses_purchased.map(c => `${c.class_title} (${c.total_classes} ครั้ง)`).join(', ')
                      : `${createdResult.purchased_course_name || 'ไม่ระบุ'} (${createdResult.purchased_classes || 0} ครั้ง)`
                    }
                  </span></div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => handleCopyCredentials(createdResult)}
                    className="w-full py-2.5 bg-[#183363] text-white rounded-xl font-bold hover:bg-[#112448] flex items-center justify-center space-x-2 shadow-md"
                  >
                    <Copy size={18} />
                    <span>{copied ? 'คัดลอกข้อมูลเรียบร้อย!' : 'คัดลอกข้อมูลส่งให้ผู้ปกครอง'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddParentOpen(false)}
                    className="w-full py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD COURSES TO CHILD MODAL */}
      {selectedChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-[#183363] mb-4">เติมชั่วโมงเรียน: น้อง {selectedChild.nickname}</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">จำนวนครั้ง/ชั่วโมงที่ต้องการเพิ่ม</label>
              <input 
                type="number" 
                value={addAmount}
                onChange={e => setAddAmount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#183363]"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedChild(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleAddCourses}
                disabled={loading}
                className="px-5 py-2 bg-[#183363] text-white rounded-xl font-bold hover:bg-[#112448] disabled:opacity-50 shadow-md"
              >
                {loading ? 'กำลังบันทึก...' : 'ตกลง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT COURSE MODAL */}
      {editingChildModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setEditingChildModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#183363] flex items-center space-x-2">
                <Edit3 className="text-sky-600" size={20} />
                <span>แก้ไขคอร์สเรียน & โควต้า (Edit Course)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">{editingChildModal.childName}</p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">คลาสเรียน (Assigned Course)</label>
                <select
                  value={editingChildModal.courseId}
                  onChange={(e) => setEditingChildModal({ ...editingChildModal, courseId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-[#183363] focus:outline-none focus:border-[#183363]"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนชั่วโมงที่ซื้อ (Purchased)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingChildModal.purchasedClasses}
                    onChange={(e) => {
                      const purchased = parseInt(e.target.value) || 0;
                      const total = purchased + editingChildModal.bonusClasses;
                      setEditingChildModal({
                        ...editingChildModal,
                        purchasedClasses: purchased,
                        totalClasses: total
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#183363]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">🎁 ชั่วโมงแถม (Bonus)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingChildModal.bonusClasses}
                    onChange={(e) => {
                      const bonus = parseInt(e.target.value) || 0;
                      const total = editingChildModal.purchasedClasses + bonus;
                      setEditingChildModal({
                        ...editingChildModal,
                        bonusClasses: bonus,
                        totalClasses: total
                      });
                    }}
                    className="w-full p-2.5 border-2 border-amber-300 bg-amber-50/50 rounded-xl font-bold text-amber-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-extrabold text-[#183363] flex items-center justify-between">
                <span>รวมสิทธิ์เรียนทั้งสิ้น (Total Quota):</span>
                <span className="text-xs sm:text-sm font-black text-blue-800">
                  {editingChildModal.purchasedClasses + editingChildModal.bonusClasses} ครั้ง ({editingChildModal.purchasedClasses} ซื้อ + {editingChildModal.bonusClasses} แถม)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนชั่วโมงเรียนคงเหลือ (Remaining Classes)</label>
                <input
                  type="number"
                  min="0"
                  value={editingChildModal.remainingClasses}
                  onChange={(e) => setEditingChildModal({ ...editingChildModal, remainingClasses: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-emerald-700 focus:outline-none focus:border-[#183363]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingChildModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveChildCourse}
                disabled={loading}
                className="px-5 py-2 bg-[#183363] text-white rounded-xl font-bold hover:bg-[#112448] disabled:opacity-50 text-xs shadow-md"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL VERIFICATION & PAYMENT SLIP MODAL */}
      {approvingChildModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border-2 border-emerald-500 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setApprovingChildModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <div className="border-b pb-3 mb-4">
              <h2 className="text-xl font-black text-emerald-800 flex items-center space-x-2">
                <ShieldCheck className="text-emerald-600" size={24} />
                <span>อนุมัติคลาสเรียน & ตรวจสอบหลักฐานการชำระเงิน</span>
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {approvingChildModal.childName} (ผู้ปกครอง: {approvingChildModal.parentName})
              </p>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">คลาสเรียนที่อนุมัติ (Course)</label>
                <select
                  value={approvingChildModal.courseId}
                  onChange={(e) => setApprovingChildModal({ ...approvingChildModal, courseId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-[#183363] focus:outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนชั่วโมงที่ซื้อ (Purchased)</label>
                  <input
                    type="number"
                    min="1"
                    value={approvingChildModal.purchasedClasses}
                    onChange={(e) => setApprovingChildModal({ ...approvingChildModal, purchasedClasses: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">🎁 ชั่วโมงแถม / โปรโมชั่น (Bonus)</label>
                  <input
                    type="number"
                    min="0"
                    value={approvingChildModal.bonusClasses}
                    onChange={(e) => setApprovingChildModal({ ...approvingChildModal, bonusClasses: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border-2 border-amber-300 bg-amber-50/50 rounded-xl font-bold text-amber-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-extrabold text-emerald-900">
                <span>รวมสิทธิ์คลาสที่จะได้รับอนุมัติ:</span>
                <span className="font-black text-sm text-emerald-700">
                  {approvingChildModal.purchasedClasses + approvingChildModal.bonusClasses} ครั้ง ({approvingChildModal.purchasedClasses} ซื้อ + {approvingChildModal.bonusClasses} แถม)
                </span>
              </div>

              {/* PAYMENT VERIFICATION FIELDS */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <h4 className="font-black text-slate-800 text-xs flex items-center gap-1">
                  💳 ตรวจสอบหลักฐานการโอนเงิน (Anti-Fraud Record)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ยอดเงินที่โอน (บาท)</label>
                    <input
                      type="number"
                      placeholder="เช่น 5000"
                      value={approvingChildModal.amountPaid || ''}
                      onChange={(e) => setApprovingChildModal({ ...approvingChildModal, amountPaid: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">เลขที่อ้างอิงสลิป (Ref No.)</label>
                    <input
                      type="text"
                      placeholder="เช่น 20260803124599"
                      value={approvingChildModal.paymentRefNo}
                      onChange={(e) => setApprovingChildModal({ ...approvingChildModal, paymentRefNo: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">URL รูปสลิปโอนเงิน / ลิงก์แนบสลิป (ถ้ามี)</label>
                  <input
                    type="text"
                    placeholder="https://... หรือแนบลิงก์สลิปโอนเงิน"
                    value={approvingChildModal.paymentSlipUrl}
                    onChange={(e) => setApprovingChildModal({ ...approvingChildModal, paymentSlipUrl: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">หมายเหตุเพิ่มเติม (Remark)</label>
                  <input
                    type="text"
                    placeholder="เช่น โอนเงินผ่าน กสิกรไทย / โปรโมชั่น 10 แถม 1"
                    value={approvingChildModal.remark}
                    onChange={(e) => setApprovingChildModal({ ...approvingChildModal, remark: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
              <button
                type="button"
                onClick={() => setApprovingChildModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmApproveModal}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 disabled:opacity-50 text-xs shadow-md flex items-center space-x-1"
              >
                <Check size={16} />
                <span>{loading ? 'กำลังอนุมัติ...' : 'ยืนยันอนุมัติคลาสเรียน & บันทึก Audit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
