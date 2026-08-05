'use client';

import { useState, useEffect } from 'react';
import AdminLoginForm from './AdminLoginForm';
import AdminMembersClient from './AdminMembersClient';
import AdminScheduleMatrix from './AdminScheduleMatrix';
import AdminAboutEditor from './AdminAboutEditor';
import AdminAuditClient from './AdminAuditClient';
import CourseEditor from './CourseEditor';

import { getAdminMembersData, getScheduleMatrix, getAboutUs, getAuditLogsAction } from '@/app/actions/admin';
import { getClasses } from '@/app/actions/admin-classes';
import { 
  Home, 
  Users, 
  Calendar, 
  Package, 
  ShieldCheck, 
  Info, 
  LogOut, 
  UserPlus, 
  Plus, 
  Pencil, 
  Trash2 
} from 'lucide-react';

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  // Data states
  const [membersData, setMembersData] = useState<any>({ children: [], parents: [], classes: [] });
  const [scheduleData, setScheduleData] = useState<any>({ classes: [], schedules: [], bookings: [] });
  const [aboutData, setAboutData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  
  // Class editor state
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  useEffect(() => {
    // Check if session cookie exists or localStorage login state
    const hasSession = document.cookie.includes('session=') || localStorage.getItem('orca_admin_logged_in') === 'true';
    if (hasSession) {
      setIsLoggedIn(true);
      loadAllData();
    }
    setLoading(false);
  }, []);

  const loadAllData = async () => {
    try {
      const [mRes, sRes, aRes, auditRes, cRes] = await Promise.all([
        getAdminMembersData().catch(() => null),
        getScheduleMatrix().catch(() => null),
        getAboutUs().catch(() => null),
        getAuditLogsAction().catch(() => null),
        getClasses().catch(() => null)
      ]);

      if (mRes) setMembersData(mRes);
      if (sRes) setScheduleData(sRes);
      if (aRes) setAboutData(aRes);
      if (auditRes?.auditLogs) setAuditData(auditRes.auditLogs);
      if (cRes?.classes) setClassesList(cRes.classes);
    } catch (e) {
      console.error("Error loading admin data:", e);
    }
  };

  const handleLoginSuccess = () => {
    localStorage.setItem('orca_admin_logged_in', 'true');
    document.cookie = "session=admin_1; path=/; max-age=604800; SameSite=Lax";
    setIsLoggedIn(true);
    loadAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('orca_admin_logged_in');
    document.cookie = "session=; path=/; max-age=0;";
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold">กำลังโหลดระบบแอดมิน ORCA GYM...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLoginForm onLoginSuccess={handleLoginSuccess} />;
  }


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row w-full">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col items-center py-4 md:py-6 md:h-screen md:sticky md:top-0 shrink-0">
        <div className="w-full px-4 flex items-center justify-between md:flex-col md:justify-center">
          <div className="w-auto md:w-48 bg-[#183363] text-white px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-md">
            <Home size={18} />
            <span className="font-extrabold text-sm md:text-base tracking-wide">ORCA ADMIN</span>
          </div>

          <button 
            onClick={handleLogout}
            className="md:hidden text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center space-x-1"
          >
            <LogOut size={14} />

            <span>ออก</span>
          </button>
        </div>

        <nav className="w-full flex md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-2 px-3 md:px-4 py-3 md:py-0 mt-3 md:mt-6 flex-1 text-xs md:text-sm font-bold no-scrollbar">
          <button 
            onClick={() => { setActiveTab('dashboard'); setEditingClassId(null); }}
            className={`w-full flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2.5 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#183363] text-white shadow-md' : 'text-[#183363] hover:bg-blue-50'}`}
          >
            <Home size={16} />
            <span>HOME</span>
          </button>

          <button 
            onClick={() => { setActiveTab('members'); setEditingClassId(null); }}
            className={`w-full flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2.5 rounded-xl transition-all ${activeTab === 'members' ? 'bg-[#183363] text-white shadow-md' : 'text-[#183363] hover:bg-blue-50'}`}
          >
            <Users size={16} />
            <span>MEMBERS</span>
          </button>

          <button 
            onClick={() => { setActiveTab('classes'); setEditingClassId(null); }}
            className={`w-full flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2.5 rounded-xl transition-all ${activeTab === 'classes' ? 'bg-[#183363] text-white shadow-md' : 'text-[#183363] hover:bg-blue-50'}`}
          >
            <Package size={16} />
            <span>CLASSES</span>
          </button>

          <button 
            onClick={() => { setActiveTab('schedule'); setEditingClassId(null); }}
            className={`w-full flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2.5 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-[#183363] text-white shadow-md' : 'text-[#183363] hover:bg-blue-50'}`}
          >
            <Calendar size={16} />
            <span>SCHEDULE</span>
          </button>

          <button 
            onClick={() => { setActiveTab('audit'); setEditingClassId(null); }}
            className={`w-full flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2.5 rounded-xl transition-all ${activeTab === 'audit' ? 'bg-emerald-700 text-white shadow-md' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'}`}
          >
            <ShieldCheck size={16} />
            <span>AUDIT</span>
          </button>

          <button 
            onClick={() => { setActiveTab('about'); setEditingClassId(null); }}
            className={`w-full flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2.5 rounded-xl transition-all ${activeTab === 'about' ? 'bg-[#183363] text-white shadow-md' : 'text-[#183363] hover:bg-blue-50'}`}
          >
            <Info size={16} />
            <span>ABOUT US</span>
          </button>

          <div className="hidden md:block pt-4 mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold"
            >
              <LogOut size={16} />
              <span>LOG OUT</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main View Display */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto w-full">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h1 className="text-3xl font-black text-[#183363]">Admin Dashboard</h1>
                <p className="text-slate-600 text-sm mt-1">ยินดีต้อนรับสู่ระบบผู้ดูแลระบบ ORCA GYM</p>
              </div>
              
              <button 
                onClick={() => setActiveTab('members')}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 shrink-0"
              >
                <UserPlus size={20} />
                <span>สร้างบัญชีผู้ปกครองใหม่ (Create Parent Account)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button onClick={() => setActiveTab('members')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all text-left block w-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#183363]">บัญชีผู้ปกครอง & นักเรียน</h2>
                  <Users className="text-blue-600" size={24} />
                </div>
                <p className="text-xs text-slate-500 mt-1">คลิกที่นี่เพื่อสร้าง Username/Password และดูรายชื่อนักเรียน</p>
                <div className="mt-4 flex items-center text-xs font-bold text-emerald-600">
                  <span>+ สร้างบัญชีผู้ปกครองใหม่ →</span>
                </div>
              </button>

              <button onClick={() => setActiveTab('schedule')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all text-left block w-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#183363]">Schedule Matrix</h2>
                  <Calendar className="text-[#183363]" size={24} />
                </div>
                <p className="text-xs text-slate-500 mt-1">ดูตารางเรียนและรายชื่อเด็กที่จองในแต่ละรอบ</p>
              </button>

              <button onClick={() => setActiveTab('classes')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all text-left block w-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#183363]">Classes & Pricing</h2>
                  <Package className="text-purple-600" size={24} />
                </div>
                <p className="text-xs text-slate-500 mt-1">จัดการรอบคลาสเรียน รายละเอียด และราคาคลาส</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <AdminMembersClient 
            initialChildren={membersData.children || []} 
            initialParents={membersData.parents || []}
            classes={membersData.classes || []}
          />
        )}

        {activeTab === 'schedule' && (
          <AdminScheduleMatrix 
            classes={scheduleData.classes || []} 
            schedules={scheduleData.schedules || []} 
            bookings={scheduleData.bookings || []}
            childrenData={membersData.children || []}
            parents={membersData.parents || []}
          />
        )}

        {activeTab === 'classes' && (
          <div>
            {editingClassId ? (
              <div>
                <button 
                  onClick={() => setEditingClassId(null)}
                  className="mb-4 text-xs font-bold text-slate-600 bg-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-300"
                >
                  ← กลับสู่รายการคลาสเรียน
                </button>
                <CourseEditor courseId={editingClassId} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h1 className="text-2xl font-black text-[#183363]">Classes & Pricing Management</h1>
                    <p className="text-xs text-slate-500 mt-1">จัดการรายชื่อคลาสเรียน รายละเอียด ราคา และตารางเวลาเรียน</p>
                  </div>
                  <button
                    onClick={() => setEditingClassId('new')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Plus size={18} />
                    <span>สร้างคลาสใหม่</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(classesList.length > 0 ? classesList : membersData.classes || []).map((cls: any) => (
                    <div key={cls.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-extrabold text-lg text-[#183363]">{cls.title || cls.name}</h3>
                          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{cls.age_range || 'ทุกช่วงอายุ'}</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-4 line-clamp-2">{cls.description}</p>
                        <div className="text-sm font-black text-emerald-600">
                          ฿{cls.price ? Number(cls.price).toLocaleString() : 'N/A'} / {cls.total_classes || 10} คลาส
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingClassId(cls.id)}
                          className="flex items-center space-x-1 text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200"
                        >
                          <Pencil size={14} />
                          <span>แก้ไข</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <AdminAuditClient 
            initialAuditLogs={auditData || []} 
            users={membersData.parents || []} 
            childrenData={membersData.children || []} 
            classes={classesList.length > 0 ? classesList : (membersData.classes || [])} 
          />
        )}

        {activeTab === 'about' && (
          <AdminAboutEditor initialData={aboutData || {
            gym_name: 'ORCA GYMNASTICS',
            description: 'ยินดีต้อนรับสู่ ORCA GYM',
            address: '',
            contact_number: '',
            email: '',
            facebook_url: '',
            line_id: '',
            instagram_url: '',
            bank_account_name: '',
            bank_account_number: '',
            bank_name: ''
          }} />
        )}
      </main>
    </div>
  );
}
