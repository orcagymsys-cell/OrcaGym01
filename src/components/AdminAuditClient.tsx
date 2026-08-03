'use client';

import { useState, useMemo } from 'react';
import { AuditLog, User, Child, GymClass } from '@/lib/types';
import { Calendar, Search, ShieldCheck, UserPlus, Award, CreditCard, Eye, X, Filter } from 'lucide-react';

export default function AdminAuditClient({
  initialAuditLogs,
  users,
  childrenData,
  classes
}: {
  initialAuditLogs: AuditLog[];
  users: User[];
  childrenData: Child[];
  classes: GymClass[];
}) {
  const [logs, setLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayLogs = initialAuditLogs.some(l => (l.timestamp || l.created_at || '').startsWith(todayStr));
    return hasTodayLogs ? todayStr : '';
  });
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');
  const [activeSlipModal, setActiveSlipModal] = useState<AuditLog | null>(null);

  // Quick Date Setters
  const setTodayDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const setYesterdayDate = () => {
    const dObj = new Date();
    dObj.setDate(dObj.getDate() - 1);
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const setAllTimeDate = () => {
    setSelectedDate('');
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Date filter
      if (selectedDate) {
        const logDateStr = log.timestamp ? log.timestamp.split('T')[0] : '';
        if (logDateStr !== selectedDate) return false;
      }

      // Action type filter
      if (selectedActionType !== 'ALL' && log.action_type !== selectedActionType) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const adminName = (log.admin_name || '').toLowerCase();
        const parentName = (log.target_user_name || '').toLowerCase();
        const childName = (log.target_child_name || '').toLowerCase();
        const courseName = (log.course_name || '').toLowerCase();
        const refNo = (log.payment_ref_no || '').toLowerCase();
        const remark = (log.remark || '').toLowerCase();

        return (
          adminName.includes(q) ||
          parentName.includes(q) ||
          childName.includes(q) ||
          courseName.includes(q) ||
          refNo.includes(q) ||
          remark.includes(q)
        );
      }

      return true;
    });
  }, [logs, selectedDate, selectedActionType, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const targetLogs = filteredLogs;
    const parentRegistrations = targetLogs.filter(l => l.action_type === 'REGISTER_PARENT').length;
    const courseApprovals = targetLogs.filter(l => l.action_type === 'APPROVE_COURSE').length;
    const totalBonusGranted = targetLogs.reduce((acc, l) => acc + (l.bonus_classes || 0), 0);
    const totalAmountVerified = targetLogs.reduce((acc, l) => acc + (l.amount_paid || 0), 0);

    return {
      parentRegistrations,
      courseApprovals,
      totalBonusGranted,
      totalAmountVerified
    };
  }, [filteredLogs]);

  // Format Helper
  const formatTimeStr = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-emerald-600" size={28} />
            <h1 className="text-2xl md:text-3xl font-black text-[#183363]">Daily Audit & Fraud Prevention</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            รายงานตรวจสอบการทำงานของ Admin บันทึกประวัติการสร้างบัญชี การอนุมัติคลาส ชั่วโมงแถม และการโอนเงินเพื่อป้องกันการทุจริต 100%
          </p>
        </div>

        {/* Date Selector & Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-sky-50 p-3 rounded-2xl border-2 border-[#183363] shadow-xs">
          <div className="flex items-center space-x-2 mr-2">
            <Calendar className="text-[#183363]" size={20} />
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase">วันที่ตรวจสอบ:</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-[#183363] font-black text-sm focus:outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-1 border-l border-sky-300 pl-2">
            <button 
              onClick={setTodayDate}
              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all ${
                selectedDate === new Date().toISOString().split('T')[0] 
                  ? 'bg-[#183363] text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              วันนี้
            </button>
            <button 
              onClick={setYesterdayDate}
              className="px-2.5 py-1 text-xs font-extrabold bg-white text-slate-700 hover:bg-sky-100 border border-sky-200 rounded-lg transition-all"
            >
              เมื่อวาน
            </button>
            <button 
              onClick={setAllTimeDate}
              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all ${
                selectedDate === '' 
                  ? 'bg-[#183363] text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              แสดงทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">บัญชีผู้ปกครองใหม่</p>
            <h3 className="text-2xl font-black text-[#183363]">{stats.parentRegistrations} <span className="text-xs font-extrabold text-slate-400">บัญชี</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">อนุมัติคลาสเรียน</p>
            <h3 className="text-2xl font-black text-emerald-600">{stats.courseApprovals} <span className="text-xs font-extrabold text-slate-400">รายการ</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">ชั่วโมงแถม (Bonus Granted)</p>
            <h3 className="text-2xl font-black text-amber-600">{stats.totalBonusGranted} <span className="text-xs font-extrabold text-slate-400">ครั้ง</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">ยอดเงินโอนตรวจสอบแล้ว</p>
            <h3 className="text-2xl font-black text-indigo-700">฿ {stats.totalAmountVerified.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ Admin, ผู้ปกครอง, ชื่อเด็ก, คลาส, เลขที่สลิปโอนเงิน หรือหมายเหตุ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#183363]"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="text-slate-500" size={18} />
          <select 
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">กิจกรรมทั้งหมด (All Actions)</option>
            <option value="APPROVE_COURSE">อนุมัติคลาสเรียน (Approve Course)</option>
            <option value="REGISTER_PARENT">สร้างบัญชีผู้ปกครอง (Register Parent)</option>
            <option value="CANCEL_BOOKING">ยกเลิกการจองคลาส (Cancel Booking)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#183363] text-white text-xs font-black">
              <th className="p-3.5 border-r border-[#2a4a8c]">วัน-เวลา (Timestamp)</th>
              <th className="p-3.5 border-r border-[#2a4a8c]">กิจกรรม (Action)</th>
              <th className="p-3.5 border-r border-[#2a4a8c]">ผู้ดำเนินการ (Admin)</th>
              <th className="p-3.5 border-r border-[#2a4a8c]">ผู้ปกครอง / เด็ก</th>
              <th className="p-3.5 border-r border-[#2a4a8c]">คลาสเรียน (Course)</th>
              <th className="p-3.5 border-r border-[#2a4a8c] text-center">ซื้อ / แถม / รวม</th>
              <th className="p-3.5 border-r border-[#2a4a8c] text-right">ยอดเงิน / สลิปโอน</th>
              <th className="p-3.5">หมายเหตุ (Remark)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                  ❄️ ไม่พบประวัติกิจกรรมในช่วงเวลา หรือเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const isApproval = log.action_type === 'APPROVE_COURSE';
                const isRegister = log.action_type === 'REGISTER_PARENT';
                const isCancel = log.action_type === 'CANCEL_BOOKING';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-600 whitespace-nowrap border-r border-slate-100">
                      {formatTimeStr(log.timestamp || log.created_at || '')}
                    </td>

                    <td className="p-3.5 border-r border-slate-100 whitespace-nowrap">
                      {isApproval && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✅ อนุมัติคลาสเรียน
                        </span>
                      )}
                      {isRegister && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                          👤 สร้างบัญชีผู้ปกครอง
                        </span>
                      )}
                      {isCancel && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          ❌ ยกเลิกคลาสเรียน
                        </span>
                      )}
                      {!isApproval && !isRegister && !isCancel && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          ⚙️ {log.action_type}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 border-r border-slate-100 font-extrabold text-[#183363]">
                      {log.admin_name || 'Admin System'}
                    </td>

                    <td className="p-3.5 border-r border-slate-100">
                      <div className="font-extrabold text-slate-800">{log.target_user_name || '-'}</div>
                      {log.target_child_name && (
                        <div className="text-[11px] font-semibold text-sky-700 mt-0.5">
                          👶 {log.target_child_name}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 border-r border-slate-100 font-bold text-slate-700">
                      {log.course_name || '-'}
                    </td>

                    <td className="p-3.5 border-r border-slate-100 text-center">
                      {isApproval ? (
                        <div className="font-extrabold">
                          <span>{log.purchased_classes || 0}</span>
                          <span className="text-amber-600 mx-1">+{log.bonus_classes || 0}</span>
                          <span className="text-emerald-700 font-black"> = {log.total_classes || 0} ครั้ง</span>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>

                    <td className="p-3.5 border-r border-slate-100 text-right">
                      {log.amount_paid ? (
                        <div className="font-black text-indigo-700 text-sm">
                          ฿{log.amount_paid.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold">-</span>
                      )}

                      {log.payment_ref_no && (
                        <div className="text-[10px] font-extrabold text-slate-500 mt-0.5">
                          Ref: {log.payment_ref_no}
                        </div>
                      )}
                      {log.sender_bank_info && (
                        <div className="text-[10px] font-bold text-sky-800 mt-0.5">
                          {log.sender_bank_info}
                        </div>
                      )}

                      {log.payment_slip_url && (
                        <button 
                          onClick={() => setActiveSlipModal(log)}
                          className="mt-1 inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                        >
                          <Eye size={12} />
                          <span>ดูสลิปโอนเงิน</span>
                        </button>
                      )}
                    </td>

                    <td className="p-3.5 font-semibold text-slate-600 max-w-xs truncate" title={log.remark}>
                      {log.remark || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Slip Modal */}
      {activeSlipModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border-2 border-sky-300">
            <button 
              onClick={() => setActiveSlipModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-2 text-[#183363] border-b pb-3 mb-4">
              <CreditCard size={22} className="text-emerald-600" />
              <h3 className="font-black text-lg">หลักฐานการโอนเงิน (Payment Slip)</h3>
            </div>

            <div className="space-y-3 mb-4 text-xs font-semibold text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ผู้ปกครอง:</span>
                <span className="font-extrabold text-[#183363]">{activeSlipModal.target_user_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">เด็ก / สิทธิ์คลาส:</span>
                <span className="font-extrabold text-slate-800">{activeSlipModal.target_child_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ยอดเงินโอน:</span>
                <span className="font-black text-emerald-600 text-sm">฿{activeSlipModal.amount_paid?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">เลขที่อ้างอิง (Ref No.):</span>
                <span className="font-mono font-bold text-slate-800">{activeSlipModal.payment_ref_no || 'N/A'}</span>
              </div>
              {activeSlipModal.sender_bank_info && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ผู้โอน / ธนาคาร:</span>
                  <span className="font-bold text-sky-800">{activeSlipModal.sender_bank_info}</span>
                </div>
              )}
              {activeSlipModal.payment_time && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">วัน-เวลาโอน:</span>
                  <span className="font-bold text-slate-800">{activeSlipModal.payment_time}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ผู้อนุมัติ (Admin):</span>
                <span className="font-bold text-blue-700">{activeSlipModal.admin_name}</span>
              </div>
            </div>

            {/* Slip Image */}
            <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200 text-center overflow-hidden max-h-80 flex items-center justify-center">
              {activeSlipModal.payment_slip_url ? (
                <img 
                  src={activeSlipModal.payment_slip_url} 
                  alt="Payment Slip" 
                  className="max-h-72 object-contain rounded-xl shadow-xs" 
                />
              ) : (
                <div className="p-8 text-slate-400 font-bold">
                  🖼️ ไม่พบไฟล์รูปสลิป (บันทึกเฉพาะยอดเงินและเลข Ref No.)
                </div>
              )}
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => setActiveSlipModal(null)}
                className="w-full py-2.5 bg-[#183363] text-white font-black text-sm rounded-xl hover:bg-blue-900 transition-all shadow-xs"
              >
                ปิดหน้าต่าง (Close Window)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
