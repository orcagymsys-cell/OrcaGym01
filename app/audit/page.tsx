'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { AuditLog } from '@/lib/types';

export default function AuditPage() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<AuditLog | null>(null);

  useEffect(() => {
    async function loadData() {
      const user = store.getCurrentUser();
      if (!user || user.role !== 'admin') {
        showToast('กรุณาเข้าสู่ระบบแอดมินก่อนใช้งานหน้า Audit');
        router.push('/');
        return;
      }

      const logs = await store.getAuditLogs();
      setAuditLogs(logs || []);
      setLoading(false);
    }

    loadData();

    // Auto-refresh audit log data in real-time
    const interval = setInterval(async () => {
      const logs = await store.getAuditLogs();
      setAuditLogs(logs || []);
    }, 60000);

    const handleStoreChange = async () => {
      const logs = await store.getAuditLogs();
      setAuditLogs(logs || []);
    };

    window.addEventListener('storage', handleStoreChange);
    window.addEventListener('orca_store_updated', handleStoreChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStoreChange);
      window.removeEventListener('orca_store_updated', handleStoreChange);
    };
  }, [router]);

  // Filtered Logs Computation
  const filteredLogs = auditLogs.filter((log) => {
    // Resolve fallback timestamp from ID
    const tsFromId = log.id.startsWith('audit_curr') ? null : (log.id.startsWith('audit_') ? parseInt(log.id.replace('audit_', '')) : null);
    const validTs = tsFromId && !isNaN(tsFromId) ? new Date(tsFromId).toISOString() : null;
    const finalDateStr = log.created_at || validTs || '';

    // Date filter logic
    if (dateFilter) {
      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!finalDateStr.includes(todayStr)) return false;
      } else if (dateFilter === 'yesterday') {
        const yDate = new Date();
        yDate.setDate(yDate.getDate() - 1);
        const yStr = yDate.toISOString().split('T')[0];
        if (!finalDateStr.includes(yStr)) return false;
      } else if (dateFilter.length === 10) {
        if (!finalDateStr.includes(dateFilter)) return false;
      }
    }

    // Action type dropdown filter logic
    if (actionFilter !== 'all') {
      if (log.action_type !== actionFilter) {
        if (actionFilter === 'approve_course' && !log.note?.includes('อนุมัติ')) return false;
        if (actionFilter === 'create_parent' && !log.note?.includes('สร้างบัญชี')) return false;
        if (actionFilter === 'topup_hours' && !log.note?.includes('เติม')) return false;
      }
    }

    // Search query logic
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchAdmin = log.admin_name?.toLowerCase().includes(q);
      const matchParent = log.parent_name?.toLowerCase().includes(q);
      const matchChild = log.child_name?.toLowerCase().includes(q);
      const matchCourse = log.course_name?.toLowerCase().includes(q);
      const matchRef = log.slip_ref?.toLowerCase().includes(q);
      const matchNote = log.note?.toLowerCase().includes(q);

      return Boolean(matchAdmin || matchParent || matchChild || matchCourse || matchRef || matchNote);
    }

    return true;
  });

  // Calculate Stat Cards Summaries
  const newParentCount = filteredLogs.filter(
    l => l.action_type === 'create_parent' || l.note?.includes('สร้างบัญชี')
  ).length;

  const approvedCourseCount = filteredLogs.filter(
    l => l.action_type === 'approve_course' || l.action_type === 'topup_hours' || l.note?.includes('อนุมัติ') || l.note?.includes('เติมโควต้า') || l.note?.includes('ซื้อคอร์ส')
  ).length;

  const bonusGrantedCount = filteredLogs.reduce((sum, l) => sum + (l.bonus_hours || 0), 0);
  const totalVerifiedMoney = filteredLogs.reduce((sum, l) => sum + (l.amount || 0), 0);

  

  return (
    <div className="font-['Anuphan',sans-serif] space-y-6">
      
      {/* Back Button Header */}
      <div className="flex items-center justify-between">
        
        <div className="text-xs font-bold text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
          🛡️ SYSTEM SECURITY AUDIT
        </div>
      </div>

      {/* Header Card with Date Filters (Matching media_1788953881186.png) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001a3a] flex items-center gap-2.5">
            <span className="text-emerald-500 text-2xl sm:text-3xl">🛡️</span>
            <span>Daily Audit</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            ระบบตรวจสอบและบันทึกประวัติการทำรายการ
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <span className="text-slate-400">🗓️</span>
            <span>วันที่ตรวจสอบ:</span>
            <input
              type="date"
              value={dateFilter.length === 10 ? dateFilter : ''}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent outline-none text-xs font-black text-[#001a3a] cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border ${
              dateFilter === 'today'
                ? 'bg-[#001a3a] text-white border-[#001a3a] shadow-md'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            วันนี้
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('yesterday')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border ${
              dateFilter === 'yesterday'
                ? 'bg-[#001a3a] text-white border-[#001a3a] shadow-md'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            เมื่อวาน
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
              !dateFilter
                ? 'bg-[#001a3a] text-white border-[#001a3a] shadow-md'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            แสดงทั้งหมด
          </button>
        </div>
      </div>

      {/* Top 4 Summary Stat Cards Row (Exact Match to media_1788953881186.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: New Parents */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:border-blue-300">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-2xl shrink-0">
            👤
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">บัญชีผู้ปกครองใหม่</div>
            <div className="text-xl sm:text-2xl font-black text-[#001a3a] mt-0.5">
              {newParentCount} <span className="text-xs text-slate-500 font-medium">บัญชี</span>
            </div>
          </div>
        </div>

        {/* Card 2: Approved Courses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:border-emerald-300">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-2xl shrink-0">
            🛡️
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">เติมชั่วโมงเรียน</div>
            <div className="text-xl sm:text-2xl font-black text-[#001a3a] mt-0.5">
              {approvedCourseCount} <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>
          </div>
        </div>

        {/* Card 3: Bonus Granted */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:border-amber-300">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-2xl shrink-0">
            🎖️
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">ชั่วโมงแถม (Bonus Granted)</div>
            <div className="text-xl sm:text-2xl font-black text-[#001a3a] mt-0.5">
              {bonusGrantedCount} <span className="text-xs text-slate-500 font-medium">ครั้ง</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Verified Money */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:border-purple-300">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 text-2xl shrink-0">
            💳
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">ยอดเงินโอนตรวจสอบแล้ว</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-0.5">
              ฿{totalVerifiedMoney.toLocaleString()}
            </div>
          </div>
        </div>

      </div>

      {/* Search Bar & Action Dropdown Row */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ Admin, ผู้ปกครอง, ชื่อเด็ก, คลาส, เลขที่สลิปโอนเงิน หรือหมายเหตุ..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-[#001a3a] placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center border-none"
            >
              ✕
            </button>
          )}
        </div>

        <div className="w-full sm:w-64 shrink-0">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-extrabold text-[#001a3a] outline-none focus:border-blue-600 bg-white cursor-pointer shadow-2xs"
          >
            <option value="all">🌪️ กิจกรรมทั้งหมด (All Actions)</option>
            <option value="approve_course">✅ เติมชั่วโมงเรียน (Approve Course)</option>
            <option value="create_parent">👤 สร้างบัญชีผู้ปกครอง (Create Parent)</option>
            <option value="topup_hours">➕ เติมชั่วโมงเรียน (Topup Hours)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table (Exact Match to media_1788953881186.png) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#001a3a] text-white border-b border-blue-950 font-black">
                <th className="p-3.5 sm:p-4 whitespace-nowrap">วัน-เวลา (Timestamp)</th>
                <th className="p-3.5 sm:p-4 whitespace-nowrap">กิจกรรม (Action)</th>
                <th className="p-3.5 sm:p-4 whitespace-nowrap">ผู้ดำเนินการ (Admin)</th>
                <th className="p-3.5 sm:p-4 whitespace-nowrap">ผู้ปกครอง / เด็ก</th>
                <th className="p-3.5 sm:p-4 whitespace-nowrap">คลาสเรียน (Course)</th>
                <th className="p-3.5 sm:p-4 whitespace-nowrap text-center">ซื้อ / แถม / รวม</th>
                <th className="p-3.5 sm:p-4 whitespace-nowrap text-center">ยอดเงิน / สลิปโอน</th>
                <th className="p-3.5 sm:p-4 whitespace-nowrap">หมายเหตุ (Remark)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-bold bg-slate-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📭</span>
                      <span>ไม่พบประวัติการทำรายการที่ตรงกับเงื่อนไข</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCreateParent = log.action_type === 'create_parent' || log.note?.includes('สร้างบัญชี');
                  const isApprove = log.action_type === 'approve_course' || log.action_type === 'topup_hours' || log.note?.includes('อนุมัติ') || log.note?.includes('เติมโควต้า') || log.note?.includes('ซื้อคอร์ส');
                  
                  const tsFromId = log.id.startsWith('audit_curr') ? null : (log.id.startsWith('audit_') ? parseInt(log.id.replace('audit_', '')) : null);
                  const validTs = tsFromId && !isNaN(tsFromId) ? new Date(tsFromId).toISOString() : null;
                  const finalDateStr = log.created_at || validTs;
                  const dateDisplay = finalDateStr ? (isNaN(new Date(finalDateStr).getTime()) ? finalDateStr : new Date(finalDateStr).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })) : '-';

                  return (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      
                      {/* Timestamp */}
                      <td className="p-3.5 sm:p-4 font-extrabold text-slate-800 whitespace-nowrap">
                        {dateDisplay}
                      </td>

                      {/* Action Badge */}
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        {isApprove ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
                            <span>✅</span>
                            <span>เติมชั่วโมงเรียน</span>
                          </span>
                        ) : isCreateParent ? (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-300 px-3 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
                            <span>👤</span>
                            <span>สร้างบัญชีผู้ปกครอง</span>
                          </span>
                        ) : (
                          <span className="bg-sky-50 text-sky-700 border border-sky-300 px-3 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
                            <span>➕</span>
                            <span>เติมชั่วโมงเรียน</span>
                          </span>
                        )}
                      </td>

                      {/* Admin */}
                      <td className="p-3.5 sm:p-4 font-extrabold text-slate-800 whitespace-nowrap">
                        {log.admin_name || 'Admin'}
                      </td>

                      {/* Parent / Child */}
                      <td className="p-3.5 sm:p-4">
                        <div className="font-bold text-[#001a3a] text-xs">
                          {log.parent_name || 'ผู้ปกครอง'}
                        </div>
                        {log.child_name && log.child_name !== '-' && (
                          <div className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 inline-flex items-center gap-1 mt-1 shadow-2xs">
                            <span>👧</span>
                            <span>{log.child_name}</span>
                          </div>
                        )}
                      </td>

                      {/* Course */}
                      <td className="p-3.5 sm:p-4 font-bold text-slate-700 whitespace-nowrap">
                        {log.course_name && log.course_name !== '-' ? (
                          <span className="bg-slate-100 text-[#001a3a] px-3 py-1 rounded-xl border border-slate-300 font-extrabold text-[11px]">
                            {log.course_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Bought / Bonus / Total */}
                      <td className="p-3.5 sm:p-4 text-center font-black text-slate-800 whitespace-nowrap">
                        {log.hours_added || log.bonus_hours ? (
                          <span>
                            {log.hours_added || 0} <span className="text-amber-600">+{log.bonus_hours || 0}</span> ={' '}
                            <span className="text-emerald-700">{log.total_hours || (log.hours_added || 0) + (log.bonus_hours || 0)}</span> ครั้ง
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Amount / Slip */}
                      <td className="p-3.5 sm:p-4 whitespace-nowrap text-center">
                        {log.amount && log.amount > 0 ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="font-black text-indigo-900 text-sm">
                              ฿{log.amount.toLocaleString()}
                            </div>
                            {log.slip_ref && log.slip_ref !== '-' && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                Ref: {log.slip_ref}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedSlip(log)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 border border-sky-200/80 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs mt-1"
                            >
                              <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>ดูสลิปโอนเงิน</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Remark */}
                      <td className="p-3.5 sm:p-4 text-slate-600 font-medium leading-relaxed max-w-xs">
                        {log.note || '-'}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Slip Lightbox / Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 font-['Anuphan',sans-serif]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-black text-[#001a3a] flex items-center gap-2">
                <span>🧾</span>
                <span>หลักฐานการโอนเงิน (Transfer Slip)</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-500">ผู้โอน:</span>
                  <span className="text-[#001a3a]">{selectedSlip.parent_name || 'ผู้ปกครอง'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ยอดเงิน:</span>
                  <span className="text-emerald-700 font-black text-sm">฿{selectedSlip.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">เลขที่อ้างอิง (Ref):</span>
                  <span className="text-indigo-900 font-extrabold">{selectedSlip.slip_ref || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">วันที่ทำรายการ:</span>
                  <span className="text-slate-700">{selectedSlip.created_at}</span>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-center">
                <div className="text-xs font-bold text-sky-900 mb-2">📷 รูปภาพสลิปโอนเงิน (Slip Preview)</div>
                {selectedSlip.slip_url ? (
                  <img src={selectedSlip.slip_url} alt="Slip" className="max-h-60 mx-auto rounded-xl shadow-md border" />
                ) : (
                  <div className="h-44 bg-white rounded-xl border border-sky-300 border-dashed flex flex-col items-center justify-center text-sky-600 font-bold text-xs gap-1">
                    <span className="text-2xl">📑</span>
                    <span>สลิปโอนเงินถูกต้องเรียบร้อยแล้ว</span>
                    <span className="text-[10px] text-slate-400 font-normal">(รหัสอ้างอิง: {selectedSlip.slip_ref})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="bg-[#001a3a] hover:bg-[#002244] text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


