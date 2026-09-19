'use client';
import { useState, useEffect, useRef, Suspense, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { store, isSupabaseConfigured, setupRealtimeSubscriptions, getFamilyBaskets } from '@/lib/supabase';
import WeeklyScheduleAdmin from '@/app/components/WeeklyScheduleAdmin';
import StudentBookingsRoster from '@/app/components/StudentBookingsRoster';
import { showToast } from '@/components/Toast';
import { compressImage } from '@/lib/imageUtils';
import { Child, AuditLog, Booking, UserProfile, PaymentProofRecord } from '@/lib/types';

function calculateAge(dob: string): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '-';
  const today = new Date();
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (today.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      months += 12;
    }
  }

  if (years > 0 && months > 0) {
    return `${years} ปี ${months} เดือน`;
  } else if (years > 0) {
    return `${years} ปี`;
  } else if (months > 0) {
    return `${months} เดือน`;
  } else {
    return `น้อยกว่า 1 เดือน`;
  }
}

function formatThaiShortDate(dateInput: string | Date | undefined | null, includeTime = false): string {
  if (!dateInput) return '-';
  const str = String(dateInput);
  let d: Date;

  if (str.includes('/') && str.split('/').length === 3) {
    const parts = str.split('/');
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year > 2500) year -= 543;
    d = new Date(year, month, day);
  } else {
    d = new Date(str.includes('T') ? str : str.replace(' ', 'T'));
  }

  if (isNaN(d.getTime())) return str;

  const monthShortNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const day = d.getDate();
  const monthStr = monthShortNames[d.getMonth()];
  const year = d.getFullYear() + (d.getFullYear() < 2500 ? 543 : 0);

  let dateStr = `${day} ${monthStr} ${year}`;
  if (includeTime) {
    const timeMatch = str.match(/(\d{2}:\d{2})/);
    if (timeMatch) {
      dateStr += ` ${timeMatch[1]} น.`;
    }
  }
  return dateStr;
}

const DAY_NAMES_THAI: Record<string, string> = {
  Monday: 'วันจันทร์ (Monday)',
  Tuesday: 'วันอังคาร (Tuesday)',
  Wednesday: 'วันพุธ (Wednesday)',
  Thursday: 'วันพฤหัสบดี (Thursday)',
  Friday: 'วันศุกร์ (Friday)',
  Saturday: 'วันเสาร์ (Saturday)',
  Sunday: 'วันอาทิตย์ (Sunday)',
  Everyday: 'ทุกวัน (Everyday)',
};

function AdminDashboardContent() {
  const requestRef = useRef(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;
  const initialTab = (tabParam && ['overview', 'parents', 'members', 'audit', 'schedule', 'quota', 'supabase'].includes(tabParam)) ? (tabParam as any) : 'overview';

  const [activeTab, setActiveTab] = useState<'overview' | 'parents' | 'members' | 'audit' | 'schedule' | 'quota' | 'supabase'>(initialTab);

  useEffect(() => {
    if (tabParam && ['overview', 'parents', 'members', 'audit', 'schedule', 'quota', 'supabase'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    } else {
      setActiveTab('overview');
    }
  }, [tabParam]);
  const [isAuthorized, setIsAuthorized] = useState(() => typeof window !== 'undefined' ? store.getCurrentUser()?.role === 'admin' : false);
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [showCreateParentModal, setShowCreateParentModal] = useState(false);
  const [dismissPendingToast, setDismissPendingToast] = useState(false);
  const [viewDetailsChild, setViewDetailsChild] = useState<Child | null>(null);

  // Create Parent Form State
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('');

  // Payment Proof Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [paymentPayerName, setPaymentPayerName] = useState('');
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentBankOther, setPaymentBankOther] = useState('');
  const [paymentDateTime, setPaymentDateTime] = useState('');
  const [paymentSlipFile, setPaymentSlipFile] = useState<string | null>(null);
  const [selectedSlipPreview, setSelectedSlipPreview] = useState<string | null>(null);
  const [viewPaymentHistoryParent, setViewPaymentHistoryParent] = useState<UserProfile | null>(null);
  const [editingParent, setEditingParent] = useState<UserProfile | null>(null);
  const [editUserId, setEditUserId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editCourseName, setEditCourseName] = useState('Orca Cubs');
  const [editPurchasedHours, setEditPurchasedHours] = useState<number | string>(6);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentRefNo, setEditPaymentRefNo] = useState('');
  const [editPaymentPayerName, setEditPaymentPayerName] = useState('');
  const [editPaymentBank, setEditPaymentBank] = useState('');
  const [editPaymentBankOther, setEditPaymentBankOther] = useState('');
  const [editPaymentDateTime, setEditPaymentDateTime] = useState('');
  const [editPaymentSlipFile, setEditPaymentSlipFile] = useState<string | null>(null);

  // Search & Filter State
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [parentStatusFilter, setParentStatusFilter] = useState('all'); // all, active, free_trial, expired
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  // Top Up / Approve Modal State
  const [topUpChild, setTopUpChild] = useState<Child | null>(null);
  const [topUpParent, setTopUpParent] = useState<UserProfile | null>(null);
  const [courseName, setCourseName] = useState('Orca Cubs');
  const [hoursToAdd, setHoursToAdd] = useState<number | string>('');
  const [topUpNote, setTopUpNote] = useState('');
  const [topUpPaymentAmount, setTopUpPaymentAmount] = useState('');
  const [topUpPaymentRefNo, setTopUpPaymentRefNo] = useState('');
  const [topUpPaymentPayerName, setTopUpPaymentPayerName] = useState('');
  const [topUpPaymentBank, setTopUpPaymentBank] = useState('กสิกรไทย (KBank)');
  const [topUpPaymentBankOther, setTopUpPaymentBankOther] = useState('');
  const [topUpPaymentDateTime, setTopUpPaymentDateTime] = useState('');
  const [topUpPaymentSlipFile, setTopUpPaymentSlipFile] = useState<string | null>(null);

  // Quota Config State
  const [quotaCourse, setQuotaCourse] = useState('Orca Cubs');
  const [quotaDayType, setQuotaDayType] = useState<string>('Tuesday');
  const [quotaSpecificDate, setQuotaSpecificDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quotaSlot, setQuotaSlot] = useState('10:30-12:00');
  const [quotaNumber, setQuotaNumber] = useState(10);
  const [quotas, setQuotas] = useState<Record<string, number>>({});

  // Audit Tab State
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditDateFilter, setAuditDateFilter] = useState('');
  const [selectedAuditSlip, setSelectedAuditSlip] = useState<AuditLog | null>(null);

  // Line Copy Message State
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  // Admin Booking Override Modal State
  const [adminBookingChild, setAdminBookingChild] = useState<Child | null>(null);
  const [adminBookingDate, setAdminBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adminBookingSlot, setAdminBookingSlot] = useState<string>('10:30-12:00');

  const handleAdminBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBookingChild) return;

    const remaining = (adminBookingChild.total_hours - allBookings.filter(b => b.child_id === adminBookingChild.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length);
    if (remaining <= 0) {
      showToast('⚠️ เด็กคนนี้จำนวนชั่วโมงเรียนหมดแล้ว กรุณาเติมชั่วโมงก่อนทำรายการ');
      return;
    }

    const existingDayBookings = await store.getBookings(undefined, adminBookingDate);
    
    // Check double booking for the specific child
    const childAlreadyBooked = existingDayBookings.some(b => b.child_id === adminBookingChild.id && b.time_slot === adminBookingSlot && b.status !== 'Cancelled');
    if (childAlreadyBooked) {
      showToast('⚠️ เด็กคนนี้ถูกจองในรอบเวลานี้ไปแล้ว ไม่สามารถจองซ้ำได้');
      return;
    }
    const quotas = await store.getSlotQuotas();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const adminDayName = dayNames[new Date(adminBookingDate).getDay()];
    const courseKeyName = adminBookingChild.course_name || 'Orca Cubs';

    const coursesList = store.getCoursesSync();
    const matchedCourse = coursesList.find(c => courseKeyName.toLowerCase().includes(c.display_title.toLowerCase()));
    const defaultMaxCapacity = matchedCourse?.max_capacity || 10;

    const maxQuota =
      quotas[`${adminBookingDate}_${courseKeyName}_${adminBookingSlot}`] ??
      quotas[`${adminDayName}_${courseKeyName}_${adminBookingSlot}`] ??
      quotas[`${adminDayName}_${adminBookingSlot}`] ??
      quotas[`Everyday_${courseKeyName}_${adminBookingSlot}`] ??
      quotas[`Everyday_${adminBookingSlot}`] ??
      quotas[`${courseKeyName}_${adminBookingSlot}`] ??
      quotas[`${adminBookingDate}_${adminBookingSlot}`] ??
      defaultMaxCapacity;
    const currentBooked = existingDayBookings.filter(b => b.time_slot === adminBookingSlot && b.status !== 'Cancelled').length;

    if (currentBooked >= maxQuota) {
      showToast(`🔒 รอบเวลา ${adminBookingSlot} ในวันที่ ${adminBookingDate} ที่นั่งเต็มแล้ว (${currentBooked}/${maxQuota})`);
      return;
    }

    const newBooking: Booking = {
      id: 'b_' + Date.now(),
      child_id: adminBookingChild.id,
      child_nickname: adminBookingChild.nickname,
      child_full_name: adminBookingChild.full_name,
      course_name: adminBookingChild.course_name || 'Orca Cubs',
      booking_date: adminBookingDate,
      time_slot: adminBookingSlot,
      status: 'confirmed',
      booked_by_role: 'admin'
    };

    await store.saveBooking(newBooking);
    const newUsed = adminBookingChild.used_hours + 1;
    await store.updateChild(adminBookingChild.id, { used_hours: newUsed });

    const user = store.getCurrentUser();
    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: user?.name || 'แอดมิน Orca',
      child_id: adminBookingChild.id,
      child_name: `${adminBookingChild.full_name} (${adminBookingChild.nickname})`,
      hours_added: 0,
      course_name: adminBookingChild.course_name,
      note: `Admin จองเรียนรอบ ${adminBookingDate} (${adminBookingSlot}) แทนผู้ปกครอง`
    };
    await store.saveAuditLog(newLog);

    showToast(`✅ Admin จองคลาสให้ ${adminBookingChild.nickname} วันที่ ${adminBookingDate} (${adminBookingSlot}) เรียบร้อยแล้ว`);
    setAdminBookingChild(null);

    const cList = await store.getChildren();
    setChildren(cList);
    const logs = await store.getAuditLogs();
    setAuditLogs(logs);
  };



  const isChildOfParent = (c: Child, p: any) => {
    if (!c || !p) return false;

    const cPId = c.parent_id ? String(c.parent_id).toLowerCase().trim() : '';
    if (!cPId) return false; // Prevent empty parent_id from matching everything

    const pId = p.id ? String(p.id).toLowerCase().trim() : '';
    const pUserId = p.user_id ? String(p.user_id).toLowerCase().trim() : '';
    const pEmail = p.email ? String(p.email).toLowerCase().trim() : '';
    const pPhone = p.phone ? String(p.phone).replace(/[^0-9]/g, '') : '';
    const pName = p.name ? String(p.name).toLowerCase().trim() : '';

    if (
      (pId && (pId === cPId || cPId.includes(pId) || pId.includes(cPId))) ||
      (pUserId && (pUserId === cPId || cPId.includes(pUserId) || pUserId.includes(cPId))) ||
      (pEmail && (pEmail === cPId || pEmail.split('@')[0] === cPId.split('@')[0])) ||
      (pPhone && pPhone.length >= 7 && cPId.replace(/[^0-9]/g, '') === pPhone) ||
      (pName && (pName === cPId || cPId.includes(pName) || pName.includes(cPId)))
    ) {
      return true;
    }

    if (pName) {
      const cFullName = (c.full_name || '').toLowerCase().trim();
      const cNickName = (c.nickname || '').toLowerCase().trim();
      const pParts = pName.split(/\s+/);
      const cParts = cFullName.split(/\s+/);

      if (cParts.length > 1 && pParts.length > 1) {
        const cSurname = cParts[cParts.length - 1];
        const pSurname = pParts[pParts.length - 1];
        if (cSurname.length >= 2 && cSurname === pSurname) return true;
      }
    }

    return false;
  };

  useEffect(() => {
    async function loadData() {
      const reqId = ++requestRef.current;
      const user = store.getCurrentUser();
      if (!user || user.role !== 'admin') {
        showToast('กรุณาเข้าสู่ระบบแอดมินก่อนใช้งาน');
        localStorage.removeItem('ORCA_MY_KIDS');
        localStorage.removeItem('ORCA_MY_BOOKINGS');
        fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
        window.location.replace('/');
        return;
      }
      setIsAuthorized(true);

      // --- SWR Pattern: Instant Load from Cache ---
      const cachedUsers = store.getUsersSync();
      setParents(cachedUsers.filter(u => u.role !== 'admin'));
      setChildren(store.getChildrenSync());
      setAuditLogs(store.getAuditLogsSync());
      setDayBookings(store.getBookingsSync().filter(b => b.booking_date === selectedDate));
      setAllBookings(store.getBookingsSync());
      setQuotas(store.getSlotQuotasSync());

      // --- SWR Pattern: Background Fetch from Supabase ---
      const [uList, cList, logs, b, bAll, q] = await Promise.all([
        store.getUsers(),
        store.getChildren(),
        store.getAuditLogs(),
        store.getBookings(undefined, selectedDate),
        store.getBookings(),
        store.getSlotQuotas()
      ]);

      if (reqId !== requestRef.current) return; // Prevent Race Condition

      const parentUsers = uList.filter(u => u.role !== 'admin');
      setParents(parentUsers);
      setChildren(cList);
      setAuditLogs(logs);
      setDayBookings(b);
      setAllBookings(bAll);
      setQuotas(q);
    }
    loadData();

    // Setup Supabase Realtime for instant updates
    const fetchDataBackground = () => {
      Promise.all([
        store.getUsers(), store.getChildren(), store.getAuditLogs(),
        store.getBookings(undefined, selectedDate), store.getBookings(), store.getSlotQuotas()
      ]).then(([uList, cList, logs, b, bAll, q]) => {
        setParents(uList.filter(u => u.role !== 'admin'));
        setChildren(cList);
        setAuditLogs(logs);
        setDayBookings(b);
        setAllBookings(bAll);
        setQuotas(q);
      });
    };

    const cleanupRealtime = setupRealtimeSubscriptions(fetchDataBackground);

    // Fallback: poll every 15 seconds in case Supabase Realtime is disabled on the project
    const pollInterval = setInterval(fetchDataBackground, 15000);

    let syncChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      syncChannel = new BroadcastChannel('orca_store_channel');
      syncChannel.onmessage = () => loadData();
    }

    return () => {
      if (cleanupRealtime) cleanupRealtime();
      if (syncChannel) syncChannel.close();
      clearInterval(pollInterval);
    };
  }, [router, selectedDate]);

  // Helper to extract Username (e.g., napaporn.pu -> napaporn, wanna_sri -> wanna)
  const getAutoUsername = (email: string) => {
    if (!email) return '';
    const emailBeforeAt = email.trim().toLowerCase().split('@')[0] || '';
    return emailBeforeAt.split(/[._]/)[0] || emailBeforeAt;
  };

  // Helper to extract Password (e.g., supattra + last 4 digits of phone -> supattra6547)
  const getAutoPassword = (email: string, phone: string) => {
    const username = getAutoUsername(email);
    const phoneDigits = phone.replace(/\D/g, '').slice(-4) || '1234';
    return username ? `${username}${phoneDigits}` : '';
  };

  // Auto calculate Username and Password
  const handleEmailChange = (val: string) => {
    setNewParentEmail(val);
    const pwd = getAutoPassword(val, newParentPhone);
    if (pwd) {
      setNewParentPassword(pwd);
    }
  };

  const handlePhoneChange = (val: string) => {
    setNewParentPhone(val);
    const pwd = getAutoPassword(newParentEmail, val);
    if (pwd) {
      setNewParentPassword(pwd);
    }
  };

  const handleSendEmailToParent = async (p: any) => {
    const parentEmail = p.email || `${p.user_id}@orcagym.com`;
    const parentName = p.name;
    const parentChildren = children.filter(c => isChildOfParent(c, p));
    const lowHoursInfo = parentChildren
      .filter(c => c.status === 'approved' && (c.total_hours - allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length) <= 2)
      .map(c => `${c.nickname} (เหลือ ${c.total_hours - allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length} ชม.)`)
      .join(', ');

    // Calculate expiration date
    const pkgStartDateStr = p.payment_datetime || p.created_at || '';
    const pkgStartDate = pkgStartDateStr ? new Date(pkgStartDateStr.includes('T') ? pkgStartDateStr : pkgStartDateStr.replace(' ', 'T')) : new Date();
    const validPkgStartDate = isNaN(pkgStartDate.getTime()) ? new Date() : pkgStartDate;
    const hoursNum = p.purchased_hours || 6;
    const mainCourseNameForPricing = parentChildren[0]?.course_name || 'Orca Cubs';
    const mainCourseConfig = coursesListGlobal.find((c: any) => c.display_title.toLowerCase().includes(mainCourseNameForPricing.toLowerCase()) || c.internal_name.toLowerCase().includes(mainCourseNameForPricing.toLowerCase())) || coursesListGlobal[0];
    const pricingOpt = mainCourseConfig?.pricing_options?.find((po: any) => Number(po.times) === hoursNum)
      || (hoursNum === 2 ? mainCourseConfig?.pricing_options?.find((po: any) => po.tag?.toLowerCase().includes('free trial') || po.tag?.toLowerCase().includes('free')) : undefined)
      || (hoursNum === 2 ? coursesListGlobal.flatMap((c: any) => c.pricing_options || []).find((po: any) => po.tag?.toLowerCase().includes('free trial')) : undefined);

    const expiryDate = new Date(validPkgStartDate);
    if (pricingOpt && pricingOpt.duration && pricingOpt.duration !== '-') {
      const durStr = pricingOpt.duration;
      const lower = durStr.toLowerCase();
      const match = durStr.match(/(\d+)/);
      const val = match ? parseInt(match[1], 10) : 0;
      if (lower.includes('day') || lower.includes('วัน')) {
        expiryDate.setDate(expiryDate.getDate() + val);
      } else if (lower.includes('week') || lower.includes('สัปดาห์')) {
        expiryDate.setDate(expiryDate.getDate() + (val * 7));
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + val);
      }
    } else {
      const isFreeCourse = hoursNum === 2;
      if (isFreeCourse) {
        expiryDate.setDate(expiryDate.getDate() + 14);
      } else {
        let months = 2;
        if (hoursNum >= 48) months = 12;
        else if (hoursNum >= 24) months = 6;
        else if (hoursNum >= 12) months = 4;
        expiryDate.setMonth(expiryDate.getMonth() + months);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDay = new Date(expiryDate);
    expDay.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((expDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const dayStr = String(expiryDate.getDate()).padStart(2, '0');
    const monthStr = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const yearStr = expiryDate.getFullYear() + 543;
    const formattedExpiryDate = `${dayStr}/${monthStr}/${yearStr}`;

    const pChildIds = parentChildren.map(c => c.id);
    const pBookingsCount = allBookings.filter(b => b.status !== 'Cancelled' && (pChildIds.includes(b.child_id) || b.child_id === p.id || b.child_id === p.user_id)).length;
    const unbookedCount = Math.max(0, hoursNum - pBookingsCount);
    
    const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0 && unbookedCount > 0;
    const isExpired = daysLeft < 0 && unbookedCount > 0;

    let subject = 'แจ้งเตือนจาก ORCA GYMNASTICS';
    let body = `เรียนคุณ ${parentName},\n\n`;

    if (lowHoursInfo || isExpiringSoon || isExpired) {
      subject = 'แจ้งเตือน: ชั่วโมงเรียนยิมนาสติกหรืออายุคอร์สใกล้หมด';
      body += `ทาง ORCA GYMNASTICS ขอแจ้งให้ทราบถึงสถานะคอร์สเรียนของคุณ ดังนี้:\n\n`;
      
      if (lowHoursInfo) {
        body += `- ชั่วโมงเรียนใกล้หมด: ${lowHoursInfo}\n`;
      }
      
      if (isExpiringSoon) {
        body += `- สิทธิ์การจองคลาสเรียนจะหมดอายุในอีก ${daysLeft} วัน (ครบกำหนดวันที่ ${formattedExpiryDate}) โดยยังมีชั่วโมงเหลืออีก ${unbookedCount} ครั้ง\n`;
      } else if (isExpired) {
        body += `- สิทธิ์การจองคลาสเรียนของคุณหมดอายุแล้วตั้งแต่วันที่ ${formattedExpiryDate} โดยยังมีชั่วโมงเหลืออีก ${unbookedCount} ครั้ง\n`;
      }

      body += `\nกรุณาติดต่อแอดมินเพื่อต่ออายุคอร์สเรียน หรือทำการจองคลาสเรียนก่อนหมดอายุครับ/ค่ะ\n\nขอบคุณครับ\nORCA GYMNASTICS`;
    } else {
      body += `\n\nขอบคุณครับ\nORCA GYMNASTICS`;
    }

    showToast(`⏳ กำลังส่งอีเมลไปยังคุณ ${parentName}...`);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parentEmail, name: parentName, subject, body }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ส่งอีเมลไปยังคุณ ${parentName} (${parentEmail}) สำเร็จ!`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Email error:', err);
      showToast(`❌ เกิดข้อผิดพลาดในการส่งอีเมล: ${err.message}`);
    }
  };

  const handleToggleExpandParent = (parentId: string) => {
    if (expandedParentId === parentId) {
      setExpandedParentId(null);
    } else {
      setExpandedParentId(parentId);
      setTimeout(() => {
        const el = document.getElementById(`parent-children-${parentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 120);
    }
  };

  const handleApproveCourse = async (child: Child) => {
    await store.updateChild(child.id, { status: 'approved' });
    const user = store.getCurrentUser();
    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: user?.name || 'แอดมิน Orca',
      child_id: child.id,
      child_name: `${child.full_name} (${child.nickname})`,
      hours_added: 0,
      course_name: child.course_name,
      note: 'อนุมัติสถานะนักเรียน'
    };
    await store.saveAuditLog(newLog);

    showToast(`✅ อนุมัติคอร์สเรียน ${child.course_name} ให้ ${child.nickname} เรียบร้อยแล้ว`);
    const cList = await store.getChildren();
    setChildren(cList);
  };

  const handleApproveAllPending = async () => {
    const pendingList = children.filter(c => c.status === 'pending');
    if (pendingList.length === 0) return;
    for (const c of pendingList) {
      await store.updateChild(c.id, { status: 'approved' });
    }

    const adminUser = store.getCurrentUser();
    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: adminUser?.name || 'แอดมิน Orca',
      child_name: `นักเรียน ${pendingList.length} รายการ`,
      hours_added: 0,
      note: 'อนุมัติสถานะนักเรียนทั้งหมดรวดเดียว'
    };
    await store.saveAuditLog(newLog);

    showToast(`✅ อนุมัติคอร์สเรียนเรียบร้อยแล้วทั้งหมด ${pendingList.length} รายการ`);
    const cList = await store.getChildren();
    setChildren(cList);
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (confirm(`คุณต้องการลบรายชื่อนักเรียน "${childName}" ออกจากระบบใช่หรือไม่?`)) {
      await store.deleteChild(childId);

      const adminUser = store.getCurrentUser();
      const newLog: AuditLog = {
        id: 'audit_' + Date.now(),
        admin_name: adminUser?.name || 'แอดมิน Orca',
        child_name: childName,
        hours_added: 0,
        note: 'ลบรายชื่อนักเรียน'
      };
      await store.saveAuditLog(newLog);

      showToast(`🗑️ ลบรายชื่อนักเรียน ${childName} เรียบร้อยแล้ว`);
      const cList = await store.getChildren();
      setChildren(cList);
    }
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName || !newParentEmail || !newParentPhone) {
      showToast('กรุณากรอกข้อมูล: ชื่อ-นามสกุล, อีเมล และเบอร์โทรศัพท์ผู้ปกครองให้ครบถ้วน');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newParentEmail.trim())) {
      showToast('กรุณากรอกอีเมลให้ถูกต้องตามรูปแบบสากล (ต้องมี @ และใช้ภาษาอังกฤษเท่านั้น)');
      return;
    }
    const phoneLen = newParentPhone.replace(/\D/g, '').length;
    if (phoneLen < 10 || phoneLen > 12) {
      showToast('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10-12 หลัก)');
      return;
    }
    if (!hoursToAdd) {
      showToast('กรุณาเลือก คลาส & โควต้าที่ซื้อ');
      return;
    }
    // Warn if payment amount is below standard price
    const mainCourseConfigForWarning = coursesListGlobal.find(c => 
      c.display_title.toLowerCase().includes(courseName.toLowerCase()) || 
      c.internal_name.toLowerCase().includes(courseName.toLowerCase())
    );
    const pricingOptForWarning = mainCourseConfigForWarning?.pricing_options?.find((po: any) => Number(po.times) === Number(hoursToAdd));
    
    // Check if free trial via tag
    const isFreeTrial = pricingOptForWarning?.tag?.toLowerCase().includes('free trial') || pricingOptForWarning?.tag?.toLowerCase().includes('free');
    
    const expectedMinStr = pricingOptForWarning?.fee;
    const expectedMin = expectedMinStr ? parseInt(String(expectedMinStr).replace(/,/g, ''), 10) : 0;
    
    const actualAmount = paymentAmount ? Number(paymentAmount) : 0;
    
    // Check if they left payment empty for a non-free course
    if (!isFreeTrial && hoursToAdd) {
      if (!paymentAmount || !paymentPayerName || !paymentBank) {
        showToast('กรุณากรอกข้อมูลหลักฐานการชำระเงินให้ครบถ้วน (จำนวนเงินที่โอน, ชื่อบัญชีผู้โอน, ธนาคารต้นทาง)');
        return;
      }
    }

    if (expectedMin && actualAmount > 0 && actualAmount < expectedMin) {
      const confirmed = window.confirm(`⚠️ ยอดเงินที่กรอก (${actualAmount.toLocaleString()} บาท) ต่ำกว่าราคาปกติสำหรับ ${courseName} ${hoursToAdd} ครั้ง (${expectedMin.toLocaleString()} บาท)\n\nกดตกลงเพื่อยืนยันต่อ หรือยกเลิกเพื่อแก้ไข`);
      if (!confirmed) return;
    }

    let autoUsername = getAutoUsername(newParentEmail);
    
    // Check for duplicate username and auto-increment if needed (e.g. napaporn -> napaporn01)
    const allUsers = await store.getUsers();
    const existingUsernames = new Set(allUsers.map(u => u.user_id?.toLowerCase()));
    
    if (existingUsernames.has(autoUsername.toLowerCase())) {
      let counter = 1;
      let newUsername = `${autoUsername}${counter.toString().padStart(2, '0')}`;
      while (existingUsernames.has(newUsername.toLowerCase())) {
        counter++;
        newUsername = `${autoUsername}${counter.toString().padStart(2, '0')}`;
      }
      autoUsername = newUsername;
    }

    const autoPassword = newParentPassword.trim() || getAutoPassword(newParentEmail, newParentPhone);

    const selectedBank = paymentBank === 'อื่นๆ (ระบุ)' ? (paymentBankOther ? `อื่นๆ (${paymentBankOther})` : 'อื่นๆ') : paymentBank;

    const newParent = {
      id: 'u_' + Date.now(),
      user_id: autoUsername,
      name: newParentName.trim(),
      phone: newParentPhone.trim() || '0800000000',
      email: newParentEmail.trim().toLowerCase(),
      password: autoPassword,
      role: 'parent' as const,
      purchased_hours: Number(hoursToAdd),
      payment_amount: paymentAmount ? Number(paymentAmount) : undefined,
      payment_ref_no: paymentRefNo.trim() || undefined,
      payment_payer_name: paymentPayerName.trim() || undefined,
      payment_bank: selectedBank || undefined,
      payment_datetime: paymentDateTime || undefined,
      payment_slip: paymentSlipFile || undefined,
      created_at: new Date().toISOString(),
    };

    await store.saveUser(newParent);

    const adminUser = store.getCurrentUser();
    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: adminUser?.name || 'แอดมิน Orca',
      parent_name: newParent.name,
      child_name: `ตะกร้าครอบครัว: ${newParent.name}`,
      hours_added: Number(hoursToAdd),
      course_name: courseName,
      amount: paymentAmount ? Number(paymentAmount) : undefined,
      slip_ref: paymentRefNo.trim() || undefined,
      slip_url: paymentSlipFile || undefined,
      bank_name: selectedBank || undefined,
      payer_name: paymentPayerName.trim() || undefined,
      note: `สร้างบัญชีผู้ปกครองใหม่ และเติมโควต้า (+${hoursToAdd} ครั้ง)`
    };
    await store.saveAuditLog(newLog);

    // Format Line Message Template with Payment Proof
    let paymentInfoText = '';
    if (paymentAmount || selectedBank || paymentRefNo || paymentDateTime || paymentPayerName) {
      paymentInfoText = `\n💳 หลักฐานการชำระเงิน:\n` +
        (paymentAmount ? `• จำนวนเงิน: ${Number(paymentAmount).toLocaleString()} บาท\n` : '') +
        (selectedBank ? `• ธนาคาร: ${selectedBank}\n` : '') +
        (paymentPayerName ? `• ชื่อผู้โอน: ${paymentPayerName}\n` : '') +
        (paymentDateTime ? `• วัน-เวลาโอน: ${paymentDateTime.replace('T', ' ')} น.\n` : '') +
        (paymentRefNo ? `• เลขอ้างอิงสลิป: ${paymentRefNo}\n` : '');
    }

    const msg = `🐳 บัญชีใช้งานระบบ ORCA GYMNASTICS\n---------------------------------\nUsername: ${autoUsername}\nPassword: ${autoPassword}\nผู้ปกครอง: ${newParent.name}\nคลาส & โควต้าที่ซื้อ:\n• ${courseName}: ${hoursToAdd} ครั้ง${paymentInfoText}---------------------------------\nกรุณานำ Username และ Password\nไปเข้าสู่ระบบเพื่อลงทะเบียนข้อมูลบุตรหลาน (Add Family Member)`;

    setCopyMessage(msg);
    showToast(`สร้างบัญชีผู้ปกครอง ${newParent.name} สำเร็จ (Username: ${autoUsername})`);
    
    setNewParentName('');
    setNewParentPhone('');
    setNewParentEmail('');
    setNewParentPassword('');
    setPaymentAmount('');
    setPaymentRefNo('');
    setPaymentPayerName('');
    setPaymentBank('');
    setPaymentBankOther('');
    setPaymentDateTime('');
    setPaymentSlipFile(null);
    setShowCreateParentModal(false);

    const uList = await store.getUsers();
    setParents(uList.filter(u => u.role !== 'admin'));
  };

  const handleDeleteParent = async (id: string, name: string) => {
    if (confirm(`คุณต้องการลบบัญชีผู้ปกครอง ${name} ใช่หรือไม่?`)) {
      await store.deleteUser(id);
      
      const adminUser = store.getCurrentUser();
      const newLog: AuditLog = {
        id: 'audit_' + Date.now(),
        admin_name: adminUser?.name || 'แอดมิน Orca',
        parent_name: name,
        child_name: `ตะกร้าครอบครัว: ${name}`,
        hours_added: 0,
        note: 'ลบบัญชีผู้ปกครอง'
      };
      await store.saveAuditLog(newLog);

      showToast(`ลบบัญชีผู้ปกครอง ${name} เรียบร้อยแล้ว`);
      const uList = await store.getUsers();
      setParents(uList.filter(u => u.role !== 'admin'));
    }
  };

  const handleDeletePaymentHistory = async (parentId: string, historyId: string) => {
    if (confirm('คุณต้องการลบประวัติการทำรายการนี้ใช่หรือไม่?')) {
      const parentUser = parents.find(p => p.id === parentId);
      if (parentUser && parentUser.payment_history) {
        const deletedRecord = parentUser.payment_history.find((h: any) => h.id === historyId);
        const updatedHistory = parentUser.payment_history.filter((h: any) => h.id !== historyId);
        await store.saveUser({
          ...parentUser,
          payment_history: updatedHistory
        });

        // Add audit log for deletion to prevent fraud
        if (deletedRecord) {
          const adminUser = store.getCurrentUser();
          const newLog: AuditLog = {
            id: 'audit_' + Date.now(),
            admin_name: adminUser?.name || 'แอดมิน',
            parent_name: parentUser.name,
            child_name: `ตะกร้าครอบครัว: ${parentUser.name}`,
            hours_added: 0,
            note: `[ลบประวัติโอนเงิน] ลบรายการยอด ${deletedRecord.payment_amount || 0} บาท (ได้โควต้า ${deletedRecord.purchased_hours || 0} ครั้ง)`
          };
          await store.saveAuditLog(newLog);
          const currentLogs = await store.getAuditLogs();
          setAuditLogs(currentLogs);
        }

        showToast('ลบประวัติการทำรายการเรียบร้อยแล้ว');
        const uList = await store.getUsers();
        setParents(uList.filter(u => u.role !== 'admin'));
        if (viewPaymentHistoryParent && viewPaymentHistoryParent.id === parentId) {
          const updatedParent = uList.find(u => u.id === parentId);
          if (updatedParent) setViewPaymentHistoryParent(updatedParent);
        }
      }
    }
  };

  const handleStartEditParent = (p: any) => {
    setEditingParent(p);
    setEditUserId(p.user_id || '');
    setEditName(p.name || '');
    setEditEmail(p.email || '');
    setEditPhone(p.phone || '');
    setEditPassword(p.password || '123');
    setEditPurchasedHours(p.purchased_hours !== undefined ? p.purchased_hours : 6);
    const pChildren = children.filter((c) => isChildOfParent(c, p));
    let childCourse = 'Orca Cubs';
    if (pChildren.length > 0 && pChildren[0].course_name) {
      childCourse = pChildren[0].course_name;
    } else if (p.payment_history && p.payment_history.length > 0) {
      const lastHist = p.payment_history[p.payment_history.length - 1];
      if (lastHist.course_name) childCourse = lastHist.course_name;
    }
    const matchedCourse = coursesListGlobal.find(c => c.display_title.toLowerCase().includes(childCourse.toLowerCase()) || childCourse.toLowerCase().includes(c.display_title.toLowerCase()));
    setEditCourseName(matchedCourse ? matchedCourse.display_title : childCourse);
    setEditPaymentAmount(p.payment_amount ? String(p.payment_amount) : '');
    setEditPaymentRefNo(p.payment_ref_no || '');
    setEditPaymentPayerName(p.payment_payer_name || '');
    const bank = p.payment_bank || 'กสิกรไทย (KBank)';
    if (['กสิกรไทย (KBank)', 'ไทยพาณิชย์ (SCB)', 'กรุงเทพ (BBL)', 'กรุงไทย (KTB)', 'กรุงศรีอยุธยา (BAY)', 'ออมสิน (GSB)', 'ทหารไทยธนชาต (ttb)', 'ยูโอบี (UOB)', 'เกียรตินาคินภัทร (KKP)', 'ไทยเครดิต (Thai Credit)'].includes(bank)) {
      setEditPaymentBank(bank);
      setEditPaymentBankOther('');
    } else {
      setEditPaymentBank('อื่นๆ (ระบุ)');
      setEditPaymentBankOther(bank.replace(/^อื่นๆ\s*\(/, '').replace(/\)$/, ''));
    }
    setEditPaymentDateTime(p.payment_datetime || '');
    setEditPaymentSlipFile(p.payment_slip || null);
  };

  const handleSaveEditParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    if (!editName || !editEmail || !editUserId) {
      showToast('กรุณากรอก Username, ชื่อ และอีเมลผู้ปกครอง');
      return;
    }

    const selectedBank = editPaymentBank === 'อื่นๆ (ระบุ)' ? (editPaymentBankOther ? `อื่นๆ (${editPaymentBankOther})` : 'อื่นๆ') : editPaymentBank;

    const currentHistory: PaymentProofRecord[] = editingParent.payment_history ? [...editingParent.payment_history] : [];
    
    // Seed initial payment proof into history if missing
    if (currentHistory.length === 0 && editingParent.purchased_hours > 0) {
      currentHistory.push({
        id: 'pay_init_' + editingParent.id,
        payment_amount: editingParent.payment_amount,
        payment_ref_no: editingParent.payment_ref_no,
        payment_payer_name: editingParent.payment_payer_name,
        payment_bank: editingParent.payment_bank,
        payment_datetime: editingParent.payment_datetime,
        payment_slip: editingParent.payment_slip,
        purchased_hours: editingParent.purchased_hours || 6,
        course_name: (editingParent as any).course_name || editCourseName,
        created_at: editingParent.payment_datetime || editingParent.created_at || new Date().toISOString(),
      });
    }

    const hasPaymentFieldsFilled = Boolean(editPaymentAmount || editPaymentSlipFile || editPaymentRefNo || editPaymentPayerName || editPaymentDateTime);
    const isNewPaymentProof = editPaymentAmount !== String(editingParent.payment_amount || '') ||
      editPaymentRefNo !== (editingParent.payment_ref_no || '') ||
      editPaymentSlipFile !== (editingParent.payment_slip || null) ||
      editPaymentDateTime !== (editingParent.payment_datetime || '');

    if (hasPaymentFieldsFilled && isNewPaymentProof) {
      if (currentHistory.length > 0) {
        const lastIndex = currentHistory.length - 1;
        currentHistory[lastIndex] = {
          ...currentHistory[lastIndex],
          payment_amount: editPaymentAmount !== '' ? Number(editPaymentAmount) : undefined,
          payment_ref_no: editPaymentRefNo.trim() || undefined,
          payment_payer_name: editPaymentPayerName.trim() || undefined,
          payment_bank: selectedBank || undefined,
          payment_datetime: editPaymentDateTime || undefined,
          payment_slip: editPaymentSlipFile || undefined,
          purchased_hours: editPurchasedHours !== '' ? Number(editPurchasedHours) : undefined,
          course_name: editCourseName,
        };
      } else {
        currentHistory.push({
          id: 'pay_' + Date.now(),
          payment_amount: editPaymentAmount !== '' ? Number(editPaymentAmount) : undefined,
          payment_ref_no: editPaymentRefNo.trim() || undefined,
          payment_payer_name: editPaymentPayerName.trim() || undefined,
          payment_bank: selectedBank || undefined,
          payment_datetime: editPaymentDateTime || undefined,
          payment_slip: editPaymentSlipFile || undefined,
          purchased_hours: editPurchasedHours !== '' ? Number(editPurchasedHours) : undefined,
          course_name: editCourseName,
          created_at: new Date().toISOString(),
        });
      }
    } else {
      if (currentHistory.length > 0) {
        currentHistory[currentHistory.length - 1].course_name = editCourseName;
        currentHistory[currentHistory.length - 1].purchased_hours = editPurchasedHours !== '' ? Number(editPurchasedHours) : currentHistory[currentHistory.length - 1].purchased_hours;
      }
    }

    const updatedParent: UserProfile = {
      ...editingParent,
      user_id: editUserId.trim(),
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      password: editPassword.trim(),
      purchased_hours: editPurchasedHours !== '' ? Number(editPurchasedHours) : 6,
      payment_amount: editPaymentAmount !== '' ? Number(editPaymentAmount) : undefined,
      payment_ref_no: editPaymentRefNo.trim() || undefined,
      payment_payer_name: editPaymentPayerName.trim() || undefined,
      payment_bank: selectedBank || undefined,
      payment_datetime: editPaymentDateTime || undefined,
      payment_slip: editPaymentSlipFile || undefined,
      payment_history: currentHistory,
    };

    await store.saveUser(updatedParent);

    // Update course_name for all children of this parent
    const pChildren = children.filter((c) => isChildOfParent(c, updatedParent));
    if (pChildren.length > 0 && editCourseName) {
      for (const child of pChildren) {
        if (child.course_name !== editCourseName) {
          await store.updateChild(child.id, { course_name: editCourseName });
        }
      }
    }

    const adminUser = store.getCurrentUser();
    const oldHours = editingParent.purchased_hours || 0;
    const newHours = editPurchasedHours !== '' ? Number(editPurchasedHours) : 0;
    const quotaChanged = oldHours !== newHours;

    let noteMsg = 'แก้ไขข้อมูลผู้ปกครอง/ตะกร้าครอบครัว';
    let addedHrs = 0;
    let payAmt = undefined;
    let auditActionType: AuditLog['action_type'] = 'edit_parent';

    if (quotaChanged) {
      noteMsg = `แก้ไขจำนวนโควต้า: ${oldHours} ครั้ง → ${newHours} ครั้ง`;
      addedHrs = newHours;
      auditActionType = 'topup_hours';
    }
    if (hasPaymentFieldsFilled && isNewPaymentProof) {
      noteMsg = quotaChanged
        ? `แก้ไขโควต้า (${oldHours}→${newHours} ครั้ง) และข้อมูลการชำระเงิน`
        : 'แก้ไขข้อมูลแพ็กเกจ/ยอดเงิน (อัปเดตประวัติล่าสุด)';
      addedHrs = newHours;
      payAmt = editPaymentAmount !== '' ? Number(editPaymentAmount) : undefined;
      auditActionType = 'topup_hours';
    }

    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: adminUser?.name || 'แอดมิน Orca',
      action_type: auditActionType,
      parent_name: updatedParent.name,
      child_name: `ตะกร้าครอบครัว: ${updatedParent.name}`,
      hours_added: addedHrs,
      total_hours: newHours,
      amount: payAmt,
      slip_ref: editPaymentRefNo.trim() || undefined,
      slip_url: editPaymentSlipFile || undefined,
      bank_name: selectedBank || undefined,
      payer_name: editPaymentPayerName.trim() || undefined,
      note: noteMsg
    };
    await store.saveAuditLog(newLog);

    showToast(`อัปเดตข้อมูลผู้ปกครอง ${updatedParent.name} เรียบร้อยแล้ว`);
    setEditingParent(null);

    const uList = await store.getUsers();
    setParents(uList.filter(u => u.role !== 'admin'));
    const cList = await store.getChildren();
    setChildren(cList);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Must have either a parent (new flow) or a child (legacy flow)
    if (!topUpParent && !topUpChild) return;
    if (!hoursToAdd) {
      showToast('กรุณาเลือกจำนวนโควต้า/คลาสที่ซื้อ');
      return;
    }

    const adminUser = store.getCurrentUser();
    const selectedBank = topUpPaymentBank === 'อื่นๆ (ระบุ)' ? (topUpPaymentBankOther ? `อื่นๆ (${topUpPaymentBankOther})` : 'อื่นๆ') : topUpPaymentBank;

    // Resolve the parent to update
    const parentUser = topUpParent
      ? topUpParent
      : parents.find(p => isChildOfParent(topUpChild!, p) || p.id === topUpChild!.parent_id);

    if (parentUser) {
      const currentHistory: PaymentProofRecord[] = parentUser.payment_history ? [...parentUser.payment_history] : [];
      if (currentHistory.length === 0 && parentUser.purchased_hours > 0) {
        currentHistory.push({
          id: 'pay_init_' + parentUser.id,
          payment_amount: parentUser.payment_amount,
          payment_ref_no: parentUser.payment_ref_no,
          payment_payer_name: parentUser.payment_payer_name,
          payment_bank: parentUser.payment_bank,
          payment_datetime: parentUser.payment_datetime,
          payment_slip: parentUser.payment_slip,
          purchased_hours: parentUser.purchased_hours || 0,
          course_name: (parentUser as any).course_name || courseName,
          created_at: parentUser.payment_datetime || parentUser.created_at || new Date().toISOString(),
        });
      }

      // Always push a new basket to history when topping up
      if (hoursToAdd) {
        currentHistory.push({
          id: 'pay_' + Date.now(),
          payment_amount: topUpPaymentAmount ? Number(topUpPaymentAmount) : undefined,
          payment_ref_no: topUpPaymentRefNo.trim() || undefined,
          payment_payer_name: topUpPaymentPayerName.trim() || undefined,
          payment_bank: selectedBank || undefined,
          payment_datetime: topUpPaymentDateTime || new Date().toISOString(),
          payment_slip: topUpPaymentSlipFile || undefined,
          purchased_hours: Number(hoursToAdd),
          course_name: courseName,
          note: topUpNote || `ซื้อคอร์สเพิ่ม ${courseName} ${hoursToAdd} ครั้ง เข้าตะกร้าครอบครัว`,
          created_at: new Date().toISOString(),
        });
      }

      // Top-up purchased_hours at family basket level
      await store.saveUser({
        ...parentUser,
        purchased_hours: (parentUser.purchased_hours || 0) + Number(hoursToAdd),
        payment_amount: topUpPaymentAmount ? Number(topUpPaymentAmount) : parentUser.payment_amount,
        payment_ref_no: topUpPaymentRefNo.trim() || parentUser.payment_ref_no,
        payment_payer_name: topUpPaymentPayerName.trim() || parentUser.payment_payer_name,
        payment_bank: selectedBank || parentUser.payment_bank,
        payment_datetime: topUpPaymentDateTime || parentUser.payment_datetime,
        payment_slip: topUpPaymentSlipFile || parentUser.payment_slip,
        payment_history: currentHistory,
      });
    }

    // If triggered from child row, also approve that child
    if (topUpChild) {
      const newTotal = topUpChild.total_hours + Number(hoursToAdd);
      await store.updateChild(topUpChild.id, {
        status: 'approved',
        course_name: courseName,
        total_hours: newTotal,
        expiry_date: (() => {
          let months = 2;
          const p = newTotal;
          if (p >= 48) months = 12;
          else if (p >= 24) months = 6;
          else if (p >= 12) months = 4;
          const validD = new Date();
          validD.setMonth(validD.getMonth() + months);
          return `${String(validD.getDate()).padStart(2, '0')}/${String(validD.getMonth() + 1).padStart(2, '0')}/${validD.getFullYear()}`;
        })()
      });
    }

    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: adminUser?.name || 'แอดมิน Orca',
      child_id: topUpChild?.id || parentUser?.id || '',
      child_name: topUpChild
        ? `${topUpChild.full_name} (${topUpChild.nickname})`
        : `ตะกร้าครอบครัว: ${parentUser?.name || ''}`,
      hours_added: Number(hoursToAdd),
      course_name: courseName,
      amount: topUpPaymentAmount ? Number(topUpPaymentAmount) : undefined,
      slip_ref: topUpPaymentRefNo.trim() || undefined,
      slip_url: topUpPaymentSlipFile || undefined,
      bank_name: selectedBank || undefined,
      payer_name: topUpPaymentPayerName.trim() || undefined,
      note: topUpNote || `เติมโควต้าตะกร้าครอบครัว (+${hoursToAdd} ครั้ง)${parentUser ? ` ผู้ปกครอง: ${parentUser.name}` : ''}`,
      created_at: topUpPaymentDateTime || new Date().toISOString()
    };
    await store.saveAuditLog(newLog);

    const targetName = topUpParent ? topUpParent.name : topUpChild?.nickname;
    showToast(`✅ เติม ${hoursToAdd} ครั้ง เข้าตะกร้าครอบครัวของ ${targetName} เรียบร้อยแล้ว`);

    // Reset modal
    setTopUpChild(null);
    setTopUpParent(null);
    setTopUpNote('');
    setTopUpPaymentAmount('');
    setTopUpPaymentRefNo('');
    setTopUpPaymentPayerName('');
    setTopUpPaymentBank('กสิกรไทย (KBank)');
    setTopUpPaymentBankOther('');
    setTopUpPaymentDateTime('');
    setTopUpPaymentSlipFile(null);

    const cList = await store.getChildren();
    setChildren(cList);
    const uList = await store.getUsers();
    setParents(uList.filter(u => u.role !== 'admin'));
    const logs = await store.getAuditLogs();
    setAuditLogs(logs);
  };

  const handleUpdateQuota = async () => {
    await store.saveSlotQuota('Everyday', quotaSlot, quotaNumber, quotaCourse);
    showToast(`✅ บันทึก Quota คลาส [${quotaCourse}] รอบเวลา ${quotaSlot} = ${quotaNumber} คน เรียบร้อยแล้ว`);
    const q = await store.getSlotQuotas();
    setQuotas(q);
  };

  const handleResetAuditLogsInAdmin = async () => {
    if (confirm('คุณต้องการรีเซ็ตและเคลียร์ประวัติ Audit ทั้งหมด ให้เหลือ੾าะข้อมูลผู้ปกครองปัจจุบันใช่หรือไม่?')) {
      const freshLogs = await store.resetAuditLogsToCurrent();
      setAuditLogs(freshLogs);
      showToast('✅ เคลียร์ประวัติ Audit ให้เหลือข้อมูลปัจจุบันเรียบร้อยแล้ว');
    }
  };

  const totalHoursToday = auditLogs.reduce((acc, log) => acc + log.hours_added, 0);

  // --- Admin Home Overview Dashboard Metrics ---
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // 1. สรุปยอดรายได้ (Revenue Summary)
  let calcRevenueToday = 0;
  let calcRevenueMonth = 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  parents.forEach(p => {
    const history: PaymentProofRecord[] = p.payment_history && p.payment_history.length > 0
      ? p.payment_history
      : p.payment_amount
      ? [{
          id: 'pay_init_' + p.id,
          payment_amount: p.payment_amount,
          payment_ref_no: p.payment_ref_no,
          payment_payer_name: p.payment_payer_name,
          payment_bank: p.payment_bank,
          payment_datetime: p.payment_datetime,
          payment_slip: p.payment_slip,
          purchased_hours: p.purchased_hours || 6,
          created_at: p.payment_datetime || p.created_at || new Date().toISOString(),
        }]
      : [];

    history.forEach(item => {
      const amt = Number(item.payment_amount) || 0;
      if (amt > 0) {
        const dStr = item.payment_datetime || item.created_at || '';
        const d = dStr ? new Date(dStr.includes('T') ? dStr : dStr.replace(' ', 'T')) : new Date();
        
        if (!isNaN(d.getTime())) {
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === currentDate) {
            calcRevenueToday += amt;
          }
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
            calcRevenueMonth += amt;
          }
        } else {
          // Fallback to current month if date string is non-standard
          calcRevenueMonth += amt;
        }
      }
    });
  });

  const displayRevenueToday = calcRevenueToday;
  const displayRevenueMonth = calcRevenueMonth;

  // Pending payments
  const pendingChildrenList = children.filter(c => c.status === 'pending');
  const pendingPaymentsCount = pendingChildrenList.length;
  const pendingPaymentsAmount = pendingChildrenList.reduce((acc, c) => acc + (c.payment_amount || 0), 0);

  // 2. สถิติจำนวนสมาชิก (Member Statistics)
  const totalStudentsCount = children.length;
  const totalParentsCount = parents.length;
  const newMembersThisMonth = children.filter(c => !c.created_at || c.created_at.startsWith(currentMonthStr)).length;
  const expiringStudentsList = children.filter(c => {
    const cActive = allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled');
  const remaining = c.total_hours - cActive.length;
    if (remaining <= 0) return false;
    if (!c.expiry_date) return false;
    const parts = c.expiry_date.split('/');
    if (parts.length !== 3) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const expDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });
  const expiringMembersCount = expiringStudentsList.length;

  // 3. อัตราการจอง Class ที่นิยม & ช่วงเวลาที่นิยมมากที่สุด (Class & Slot Popularity)
  const activeBookings = allBookings.filter(b => b.status !== 'Cancelled');
  
  const flipBookingsCount = activeBookings.filter(b => b.course_name?.toLowerCase().includes('flip')).length;
  const megaBookingsCount = activeBookings.filter(b => b.course_name?.toLowerCase().includes('mega')).length;
  // Anything else (or specifically cubs) goes to Cubs
  const cubsBookingsCount = activeBookings.filter(b => !b.course_name?.toLowerCase().includes('mega') && !b.course_name?.toLowerCase().includes('flip')).length;
  
  const totalActiveBookings = activeBookings.length || 1;
  const cubsPercent = Math.round((cubsBookingsCount / totalActiveBookings) * 100);
  const flipPercent = Math.round((flipBookingsCount / totalActiveBookings) * 100);
  const megaPercent = Math.round((megaBookingsCount / totalActiveBookings) * 100);

  // Group by time slot
  const slotCountMap: Record<string, number> = {};
  activeBookings.forEach(b => {
    const slot = b.time_slot || '10:30-12:00';
    slotCountMap[slot] = (slotCountMap[slot] || 0) + 1;
  });
  const sortedPopularSlots = Object.entries(slotCountMap).sort((a, b) => b[1] - a[1]);
  const maxSlotCount = Math.max(...Object.values(slotCountMap), 1);

  const [coursesListGlobal, setCoursesListGlobal] = useState<any[]>([]);
  useEffect(() => {
    store.getCourses().then(c => setCoursesListGlobal(c || []));
  }, []);

  // ⏳ 4. รายชื่อผู้ปกครองที่แพ็กเรียนใกล้ครบกำหนด (ภายใน 5 วัน หรือ หมดอายุแล้ว และยังจองคลาสเรียนไม่ครบ)
  const expiringParentsList = parents.map(p => {
    const pkgStartDateStr = p.payment_datetime || p.created_at || '';
    const pkgStartDate = pkgStartDateStr ? new Date(pkgStartDateStr.includes('T') ? pkgStartDateStr : pkgStartDateStr.replace(' ', 'T')) : new Date();
    const validPkgStartDate = isNaN(pkgStartDate.getTime()) ? new Date() : pkgStartDate;
    
    const hoursNum = p.purchased_hours || 6;
    
    const pChildren = children.filter(c => isChildOfParent(c, p));
    const mainCourseNameForPricing = pChildren[0]?.course_name || 'Orca Cubs';
    const mainCourseConfig = coursesListGlobal.find(c => c.display_title.toLowerCase().includes(mainCourseNameForPricing.toLowerCase()) || c.internal_name.toLowerCase().includes(mainCourseNameForPricing.toLowerCase())) || coursesListGlobal[0];
    const pricingOpt = mainCourseConfig?.pricing_options?.find(po => Number(po.times) === hoursNum)
      || (hoursNum === 2 ? mainCourseConfig?.pricing_options?.find(po => po.tag?.toLowerCase().includes('free trial') || po.tag?.toLowerCase().includes('free')) : undefined)
      || (hoursNum === 2 ? coursesListGlobal.flatMap(c => c.pricing_options || []).find(po => po.tag?.toLowerCase().includes('free trial')) : undefined);

    const expiryDate = new Date(validPkgStartDate);
    let pkgDurationText = '';
    
    if (pricingOpt && pricingOpt.duration && pricingOpt.duration !== '-') {
      const durStr = pricingOpt.duration;
      const lower = durStr.toLowerCase();
      const match = durStr.match(/(\d+)/);
      const val = match ? parseInt(match[1], 10) : 0;
      
      if (lower.includes('day') || lower.includes('วัน')) {
        expiryDate.setDate(expiryDate.getDate() + val);
      } else if (lower.includes('week') || lower.includes('สัปดาห์')) {
        expiryDate.setDate(expiryDate.getDate() + (val * 7));
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + val);
      }
      pkgDurationText = (hoursNum === 2 || pricingOpt?.tag?.toLowerCase().includes('free trial')) ? `ทดลองเรียนฟรี (${durStr})` : durStr;
    } else {
      const isFreeCourse = hoursNum === 2;
      if (isFreeCourse) {
        expiryDate.setDate(expiryDate.getDate() + 14);
        pkgDurationText = 'ทดลองเรียนฟรี (14 วัน)';
      } else {
        let months = 2;
        if (hoursNum >= 48) months = 12;
        else if (hoursNum >= 24) months = 6;
        else if (hoursNum >= 12) months = 4;
        expiryDate.setMonth(expiryDate.getMonth() + months);
        pkgDurationText = `${months} เดือน`;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDay = new Date(expiryDate);
    expDay.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((expDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dayStr = String(expiryDate.getDate()).padStart(2, '0');
    const monthStr = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const yearStr = expiryDate.getFullYear() + 543;
    const formattedExpiryDate = `${dayStr}/${monthStr}/${yearStr}`;

    const pChildIds = pChildren.map(c => c.id);
    const pBookingsCount = allBookings.filter(b => b.status !== 'Cancelled' && (pChildIds.includes(b.child_id) || b.child_id === p.id || b.child_id === p.user_id)).length;
    const unbookedCount = Math.max(0, hoursNum - pBookingsCount);

    return {
      parent: p,
      daysLeft,
      pkgDurationText,
      hoursNum,
      unbookedCount,
      formattedExpiryDate,
      isExpiringSoon: daysLeft <= 5 && unbookedCount > 0,
    };
  }).filter(item => item.isExpiringSoon);
  
  const cubsCourse = coursesListGlobal.find(c => c.display_title.toLowerCase().includes('cubs'));
  const megaCourse = coursesListGlobal.find(c => c.display_title.toLowerCase().includes('mega'));
  const defaultCubsQuota = cubsCourse?.max_capacity || 10;
  const defaultMegaQuota = megaCourse?.max_capacity || 10;

  if (!isAuthorized) {
    return <div className="p-8 text-center text-[#001a3a] font-bold text-lg h-screen flex items-center justify-center">กำลังตรวจสอบสิทธิ์ Admin...</div>;
  }

  const checkParentFilter = (p: UserProfile) => {
    let searchMatch = true;
    if (parentSearchQuery.trim()) {
      const q = parentSearchQuery.toLowerCase().trim();
      searchMatch = !!(
        p.name?.toLowerCase().includes(q) ||
        p.user_id?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.payment_ref_no?.toLowerCase().includes(q) ||
        p.payment_payer_name?.toLowerCase().includes(q)
      );
    }
    
    if (!searchMatch) return false;
    if (parentStatusFilter === 'all') return true;

    const pChildren = children.filter((c) => isChildOfParent(c, p));
    const mainCourseNameForPricing = pChildren[0]?.course_name || 'Orca Cubs';
    const mainCourseConfig = coursesListGlobal.find(c => c.display_title.toLowerCase().includes(mainCourseNameForPricing.toLowerCase()) || c.internal_name.toLowerCase().includes(mainCourseNameForPricing.toLowerCase())) || coursesListGlobal[0];
    
    const purchasedHoursNum = p.purchased_hours || 6;
    const pricingOpt = mainCourseConfig?.pricing_options?.find(po => Number(po.times) === purchasedHoursNum)
      || (purchasedHoursNum === 2 ? mainCourseConfig?.pricing_options?.find(po => po.tag?.toLowerCase().includes('free trial') || po.tag?.toLowerCase().includes('free')) : undefined)
      || (purchasedHoursNum === 2 ? coursesListGlobal.flatMap(c => c.pricing_options || []).find(po => po.tag?.toLowerCase().includes('free trial')) : undefined);
    
    const isFreeCourse = purchasedHoursNum === 2 || pricingOpt?.tag?.toLowerCase().includes('free trial');
    
    if (parentStatusFilter === 'free_trial' && !isFreeCourse) return false;
    if (parentStatusFilter === 'active' && isFreeCourse) return false;

    const pkgStartDateStr = p.payment_datetime || p.created_at || '';
    const pkgStartDate = pkgStartDateStr ? new Date(pkgStartDateStr.includes('T') ? pkgStartDateStr : pkgStartDateStr.replace(' ', 'T')) : new Date();
    const validPkgStartDate = isNaN(pkgStartDate.getTime()) ? new Date() : pkgStartDate;
    const pkgExpiryDate = new Date(validPkgStartDate);
    
    if (pricingOpt && pricingOpt.duration && pricingOpt.duration !== '-') {
      const durStr = pricingOpt.duration;
      const lower = durStr.toLowerCase();
      const match = durStr.match(/(\d+)/);
      const val = match ? parseInt(match[1], 10) : 0;
      if (lower.includes('day') || lower.includes('วัน')) pkgExpiryDate.setDate(pkgExpiryDate.getDate() + val);
      else if (lower.includes('week') || lower.includes('สัปดาห์')) pkgExpiryDate.setDate(pkgExpiryDate.getDate() + (val * 7));
      else pkgExpiryDate.setMonth(pkgExpiryDate.getMonth() + val);
    } else {
      if (isFreeCourse) pkgExpiryDate.setDate(pkgExpiryDate.getDate() + 14);
      else {
        let pkgDurationMonths = 2;
        if (purchasedHoursNum === 12) pkgDurationMonths = 4;
        else if (purchasedHoursNum === 24 || purchasedHoursNum === 26) pkgDurationMonths = 6;
        else if (purchasedHoursNum === 48) pkgDurationMonths = 12;
        pkgExpiryDate.setMonth(pkgExpiryDate.getMonth() + pkgDurationMonths);
      }
    }
    
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const expDay = new Date(pkgExpiryDate);
    expDay.setHours(0, 0, 0, 0);
    
    const isExpired = expDay.getTime() < todayDate.getTime();
    
    if (parentStatusFilter === 'expired' && !isExpired) return false;
    if (parentStatusFilter === 'active' && isExpired) return false;
    
    return true;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full pb-24 font-['Anuphan',sans-serif]">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001a3a] mb-1">
            {activeTab === 'parents' || activeTab === 'members'
              ? 'จัดการสมาชิก (Member Management)'
              : activeTab === 'schedule'
              ? 'ตารางเรียน (Schedule Matrix)'
              : activeTab === 'audit'
              ? 'บันทึกประวัติการทำงาน (Audit Log)'
              : 'ภาพรวมระบบ (Admin Overview)'}
          </h1>
          <p className="text-sm font-normal text-slate-500">
            {activeTab === 'parents' || activeTab === 'members'
              ? 'จัดการข้อมูลบัญชีผู้ปกครองและข้อมูลนักเรียน'
              : activeTab === 'schedule'
              ? 'ตรวจสอบและจัดตารางเรียนรายสัปดาห์'
              : activeTab === 'audit'
              ? 'ประวัติการทำรายการและการแก้ไขข้อมูลในระบบ'
              : 'ยินดีต้อนรับสู่ระบบผู้ดูแลระบบ ORCA GYM'}
          </p>
        </div>

        {/* Display Create Parent button strictly on Member tab */}
        {(activeTab === 'parents' || activeTab === 'members') && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowCreateParentModal(true);
              }}
              className="bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-4 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-white shrink-0 ml-1" viewBox="0 0 24 24">
                {/* Separate Plus Symbol on Left */}
                <path d="M2 11h2.5V7.5h2V11H9v2H6.5v3.5h-2V13H2v-2z" />
                {/* Separate Person Symbol on Right with Gap */}
                <path d="M16.5 11c1.93 0 3.5-1.57 3.5-3.5S18.43 4 16.5 4 13 5.57 13 7.5s1.57 3.5 3.5 3.5zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <span>สร้างบัญชีผู้ปกครองใหม่ (Create Parent Account)</span>
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Sub-navigation */}
      {(activeTab === 'overview' || activeTab === 'quota') && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-3 shadow-xs mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#001a3a] text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>📊</span>
              <span>1. ภาพรวมของระบบ (Overview)</span>
            </button>

            <button
              onClick={() => setActiveTab('quota')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'quota'
                  ? 'bg-[#001a3a] text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>⚙️</span>
              <span>2. ตั้งค่าโควต้า (Quota Config)</span>
            </button>
          </div>
        </div>
      )}

      {(activeTab === 'parents' || activeTab === 'members') && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-3 shadow-xs mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('parents')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'parents'
                  ? 'bg-[#001a3a] text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>👥</span>
              <span>1. ข้อมูลบัญชีผู้ปกครอง (Parents)</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'members'
                  ? 'bg-[#001a3a] text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>🧒</span>
              <span>2. ข้อมูลนักเรียน (Students)</span>
            </button>
          </div>
        </div>
      )}

      {/* OVERVIEW DASHBOARD TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Expiry Alert Card Banner for Admin */}
          {expiringParentsList.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-400 p-5 rounded-3xl space-y-3 font-['Anuphan',sans-serif] shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏰</span>
                  <h3 className="text-base sm:text-lg font-black text-amber-950">
                    แจ้งเตือน: บัญชีผู้ปกครองใกล้ครบกำหนดระยะเวลาแพ็ก (แจ้งเตือนล่วงหน้า 5 วัน)
                  </h3>
                </div>
                <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-2xs">
                  {expiringParentsList.length} บัญชี
                </span>
              </div>
              <p className="text-xs text-amber-900 font-medium">
                พบผู้ปกครองจำนวน {expiringParentsList.length} บัญชี ที่แพ็กจะครบกำหนดระยะเวลาเรียน (แจ้งเตือนล่วงหน้า 5 วันก่อนวันครบกำหนด):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {expiringParentsList.map(({ parent: p, daysLeft, pkgDurationText, hoursNum, formattedExpiryDate }) => (
                  <div key={p.id} className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-[#001a3a] text-xs sm:text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        📞 {p.phone} | โควต้า: <strong>{hoursNum} ครั้ง ({pkgDurationText})</strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-rose-700 font-black text-xs">
                        {daysLeft <= 0 ? 'ครบกำหนดแล้ว' : `เหลืออีก ${daysLeft} วัน`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        วันหมดอายุ: {formattedExpiryDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* SECTION 1: สรุปยอดรายได้ (Revenue Summary) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>💰</span>
                <span>สรุปยอดรายได้ (Revenue Summary)</span>
              </h2>
              <span className="text-xs text-slate-500 font-normal">อัปเดตเรียลไทม์</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Today's Revenue */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายรับรวมในวันนี้</span>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">วันนี้</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 mb-1">
                    ฿{displayRevenueToday.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    ยอดรวมชำระจากผู้ปกครองและรายการเติมชั่วโมงประจำวัน
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-normal">
                  📅 {selectedDate}
                </div>
              </div>

              {/* Month's Revenue */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายรับรวมในเดือนนี้</span>
                    <span className="text-xs font-extrabold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full">เดือนนี้</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#001a3a] mb-1">
                    ฿{displayRevenueMonth.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    ยอดรับชำระทั้งหมดในรอบเดือนปัจจุบัน
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-normal">
                  📆 เดือนปัจจุบัน ({currentMonthStr})
                </div>
              </div>

              {/* Pending / Outstanding Payments */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ยอดค้างชำระ / ต้องติดตาม</span>
                    <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full ">
                      {pendingPaymentsCount} รายการ
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-700 mb-1">
                    ฿{pendingPaymentsAmount.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    ยอดรวมคอร์สที่รอการตรวจสอบสลิปและอนุมัติชำระ
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-amber-800 font-bold">รอการติดต่อกลับ</span>
                  <button
                    onClick={() => setActiveTab('parents')}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    ตรวจสอบผู้ปกครอง →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: สถิติจำนวนนักเรียน (Student Statistics) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>👥</span>
                <span>สถิติจำนวนนักเรียน (Student Statistics)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Members */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">
                  👨‍👩‍👧‍👦
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">จำนวนนักเรียนทั้งหมด</div>
                  <div className="text-2xl font-black text-[#001a3a] mt-0.5">
                    {totalStudentsCount} <span className="text-sm font-bold text-slate-500">คน</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    เด็ก {totalStudentsCount} คน (จากผู้ปกครอง {totalParentsCount} บัญชี)
                  </div>
                </div>
              </div>

              {/* New Registrations This Month */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0">
                  ✨
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">นักเรียนใหม่เดือนนี้</div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    +{newMembersThisMonth} <span className="text-sm font-bold text-slate-500">คน</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    นักเรียนลงทะเบียนใหม่ในเดือนนี้
                  </div>
                </div>
              </div>

              {/* Expiring / Soon-to-expire Members */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl shrink-0">
                  ⚠️
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">นักเรียนที่กำลังจะหมดอายุ</div>
                  <div className="text-2xl font-black text-rose-600 mt-0.5">
                    {expiringMembersCount} <span className="text-sm font-bold text-slate-500">คน</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    จะหมดอายุใน 7 วัน และยังมีโควต้าเหลือ
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: อัตราการจอง Class ที่นิยม & ช่วงเวลาที่นิยมมากที่สุด */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>📈</span>
                <span>อัตราการจอง Class & ช่วงเวลาที่นิยมมากที่สุด</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Popularity Ratio */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#001a3a] mb-1 flex items-center gap-2">
                    <span>🏆</span>
                    <span>ความนิยมตามประเภท Course (Class Popularity)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mb-4">
                    สัดส่วนจำนวนครั้งที่นักเรียนจองเข้าเรียนในแต่ละประเภทคลาส
                  </p>

                  <div className="space-y-4">
                    {/* Orca Cubs */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-[#001a3a] mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
                          <span>Orca Cubs (อายุ 4-10 ปี)</span>
                        </span>
                        <span className="font-extrabold text-sky-700">{cubsBookingsCount} ครั้ง ({cubsPercent}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${cubsPercent}%` }}></div>
                      </div>
                    </div>

                    {/* Orca Flip */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-[#001a3a] mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                          <span>Orca Flip (อายุ 6-15+ ปี)</span>
                        </span>
                        <span className="font-extrabold text-emerald-700">{flipBookingsCount} ครั้ง ({flipPercent}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full transition-all duration-500" style={{ width: `${flipPercent}%` }}></div>
                      </div>
                    </div>

                    {/* Mega Orca */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-[#001a3a] mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                          <span>Mega Orca (อายุ 5-15 ปี)</span>
                        </span>
                        <span className="font-extrabold text-indigo-700">{megaBookingsCount} ครั้ง ({megaPercent}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${megaPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-normal">
                  <span>รวมยอดจองคลาสเรียนทั้งหมด:</span>
                  <strong className="text-[#001a3a] font-black">{activeBookings.length} ครั้ง</strong>
                </div>
              </div>

              {/* Popular Time Slots Ranking */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="text-base font-extrabold text-[#001a3a] flex items-center gap-2">
                  <span>⏰</span>
                  <span>อันดับช่วงเวลาเรียนที่นิยมมากที่สุด (Top Time Slots)</span>
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  รอบเวลาที่มีจำนวนการจองคลาสเรียนสะสมสูงสุด
                </p>

                <div className="space-y-2.5 pt-1">
                  {sortedPopularSlots.slice(0, 4).map(([slot, count], idx) => {
                    const pct = Math.round((count / maxSlotCount) * 100);
                    const rankColors = [
                      'bg-amber-50 border-amber-200 text-amber-900',
                      'bg-sky-50 border-sky-200 text-sky-900',
                      'bg-slate-50 border-slate-200 text-slate-800',
                      'bg-slate-50 border-slate-200 text-slate-700'
                    ];
                    const medalIcons = ['🥇 อันดับ 1', '🥈 อันดับ 2', '🥉 อันดับ 3', '🏅 อันดับ 4'];
                    return (
                      <div key={slot} className={`p-3 rounded-2xl border ${rankColors[idx] || rankColors[2]} transition-all`}>
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold px-2 py-0.5 bg-white/80 rounded-md shadow-2xs">
                              {medalIcons[idx] || `#${idx + 1}`}
                            </span>
                            <span>{slot} น.</span>
                          </div>
                          <span>{count} การจอง</span>
                        </div>
                        <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden">
                          <div className="h-full bg-current rounded-full opacity-80" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: แจ้งเตือน (Alerts) สมาชิกที่คอร์สใกล้หมดอายุ (ภายใน 7 วัน) */}
          <div id="course-alerts-section">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>🔔</span>
                <span>แจ้งเตือน (Alerts) สมาชิกที่คอร์สใกล้หมดอายุ (ภายใน 7 วัน)</span>
              </h2>
              <span className="text-xs font-extrabold bg-rose-100 text-rose-800 px-3 py-1 rounded-full">
                {expiringMembersCount} รายการที่ต้องติดตาม
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              {expiringStudentsList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-normal">
                  ✅ ไม่มีสมาชิกที่ชั่วโมงเรียนใกล้หมดในขณะนี้
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {expiringStudentsList.map((child) => {
                    const remaining = child.total_hours - child.used_hours;
                    const parent = parents.find(p => isChildOfParent(child, p));
                    const isZero = remaining <= 0;

                    return (
                      <div
                        key={child.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-2xs ${
                          isZero
                            ? 'bg-rose-50/80 border-rose-300'
                            : 'bg-amber-50/70 border-amber-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                              {child.gender === 'Girl' ? '👧' : '👦'}
                            </div>
                            <div>
                              <div className="font-extrabold text-[#001a3a] text-sm">
                                {child.full_name} ({child.nickname})
                              </div>
                              <div className="text-xs text-slate-600 font-normal">
                                คลาส: <strong>{child.course_name}</strong> | ผู้ปกครอง: {parent ? parent.name : '-'}
                              </div>
                              <div className="text-xs text-slate-500 font-normal">
                                📞 เบอร์โทร: {parent ? parent.phone : '-'}
                              </div>
                            </div>
                          </div>

                          <span className={`text-xs font-black px-3 py-1 rounded-xl shrink-0 shadow-2xs ${
                            isZero ? 'bg-rose-600 text-white ' : 'bg-amber-500 text-white'
                          }`}>
                            {isZero ? 'หมดแล้ว (0 ชม.)' : `เหลือ ${remaining} ชม.`}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                          {parent && (
                            <button
                              type="button"
                              onClick={() => handleSendEmailToParent(parent)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                            >
                              ✉️ ส่ง Email แจ้งเตือน
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const pName = parent ? parent.name : 'ผู้ปกครอง';
                              const msg = `🐳 แจ้งเตือนสิทธิ์คอร์สเรียนใกล้หมดอายุ - ORCA GYM\n---------------------------------\nผู้ปกครอง: ${pName}\nนักเรียน: ${child.full_name} (${child.nickname})\nคลาส: ${child.course_name}\nจำนวนชั่วโมงคงเหลือ: ${remaining} ชั่วโมง\n---------------------------------\nกรุณาติดต่อแอดมินเพื่อต่ออายุหรือซื้อแพ็กคอร์สเรียนเพิ่มเติม`;
                              setCopyMessage(msg);
                            }}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            📋 คัดลอกส่ง Line
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 1: PARENTS & COURSE CREATION */}
      {activeTab === 'parents' && (
        <div className="space-y-6">
          
          {/* Create Parent Form Box */}
          {showCreateParentModal && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative">
              {/* Optional close button at top right */}
              <button
                type="button"
                onClick={() => setShowCreateParentModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                title="ปิดฟอร์ม"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <div className="flex items-center justify-between mb-4 pr-8">
                <h3 className="text-base sm:text-lg font-bold text-[#001a3a] flex items-center gap-2">
                  <span className="text-xl">🔑</span>
                  <span>สร้างบัญชีผู้ปกครองใหม่ & ออกรายละเอียดคอร์ส (Create Parent & Course)</span>
                </h3>
              </div>

              <p className="text-xs text-slate-500 mb-5 leading-relaxed font-normal">
                กรอกข้อมูลผู้ปกครองและเลือกคอร์สที่ซื้อ ระบบจะออก <strong>Username</strong> และ <strong>Password</strong> ให้อัตโนมัติ พร้อมสร้างข้อความคัดลอกส่ง Line ให้ผู้ปกครอง
              </p>

              <form onSubmit={handleCreateParent} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">ชื่อ-นามสกุล ผู้ปกครอง:</label>
                  <input
                    type="text"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">อีเมลผู้ปกครอง (สำหรับออก Username/Reset):</label>
                  <input
                    type="text"
                    value={newParentEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    placeholder="example@hotmail.com"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เบอร์โทรศัพท์ (ใช้ออก Password 4 ตัวท้าย):</label>
                  <input
                    type="tel"
                    value={newParentPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">คลาส & โควต้าที่ซื้อ:</label>
                  <div className="flex gap-2">
                    <select
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="flex-1 h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none"
                    >
                      <option value="Orca Cubs">Orca Cubs (4-10 ปี)</option>
                      <option value="Orca Flip">Orca Flip (6-15+ ปี)</option>
                      <option value="Mega Orca">Mega Orca (5-15 ปี)</option>
                    </select>
                    <select
                      value={hoursToAdd}
                      onChange={(e) => setHoursToAdd(e.target.value ? Number(e.target.value) : '')}
                      className="w-28 h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none"
                    >
                      <option value="">-</option>
                      {coursesListGlobal
                        .find(c => c.display_title.toLowerCase().includes(courseName.toLowerCase()) || c.internal_name.toLowerCase().includes(courseName.toLowerCase()))
                        ?.pricing_options?.map((opt: any, idx: number) => {
                          const isFree = opt.tag?.toLowerCase().includes('free');
                          const label = isFree ? `${opt.times} ครั้ง (ฟรี)` : `${opt.times} ครั้ง`;
                          return (
                            <option key={idx} value={opt.times}>
                              {label}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2 bg-sky-50 border border-sky-200 p-3.5 rounded-2xl flex flex-wrap justify-between items-center text-xs text-sky-900 gap-2">
                  <div>
                    ⚡ <strong>Username อัตโนมัติ:</strong> <code className="bg-white px-2.5 py-1 rounded-lg font-mono font-bold text-blue-700">{getAutoUsername(newParentEmail) || '...'}</code>
                  </div>
                  <div>
                    🔑 <strong>Password อัตโนมัติ:</strong> <code className="bg-white px-2.5 py-1 rounded-lg font-mono font-bold text-blue-700">{newParentPassword || getAutoPassword(newParentEmail, newParentPhone) || '...'}</code>
                  </div>
                </div>

                {/* 💳 Payment Proof Section */}
                <div className="sm:col-span-2 pt-3 border-t border-slate-200 mt-2">
                  <h4 className="text-xs font-bold text-[#001a3a] mb-3 flex items-center gap-1.5 text-blue-900">
                    <span className="text-base">💳</span>
                    <span>ข้อมูลหลักฐานการชำระเงิน (Payment Proof)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* จำนวนเงินที่โอน */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">จำนวนเงินที่โอน (บาท):</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* เลขที่อ้างอิงสลิป */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เลขที่อ้างอิงสลิป (Slip Ref No.):</label>
                      <input
                        type="text"
                        value={paymentRefNo}
                        onChange={(e) => setPaymentRefNo(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* ชื่อบัญชีผู้โอน */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">ชื่อบัญชีผู้โอน:</label>
                      <input
                        type="text"
                        value={paymentPayerName}
                        onChange={(e) => setPaymentPayerName(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* ธนาคารต้นทาง */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">ธนาคารต้นทางที่โอน:</label>
                      <select
                        value={paymentBank}
                        onChange={(e) => setPaymentBank(e.target.value)}
                        className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500"
                      >
                        <option value="">-- เลือกธนาคาร --</option>
                        <option value="กสิกรไทย (KBank)">กสิกรไทย (KBank)</option>
                        <option value="ไทยพาณิชย์ (SCB)">ไทยพาณิชย์ (SCB)</option>
                        <option value="กรุงเทพ (BBL)">กรุงเทพ (BBL)</option>
                        <option value="กรุงไทย (KTB)">กรุงไทย (KTB)</option>
                        <option value="กรุงศรีอยุธยา (BAY)">กรุงศรีอยุธยา (BAY)</option>
                        <option value="ออมสิน (GSB)">ออมสิน (GSB)</option>
                        <option value="ทหารไทยธนชาต (ttb)">ทหารไทยธนชาต (ttb)</option>
                        <option value="ยูโอบี (UOB)">ยูโอบี (UOB)</option>
                        <option value="เกียรตินาคินภัทร (KKP)">เกียรตินาคินภัทร (KKP)</option>
                        <option value="ไทยเครดิต (Thai Credit)">ไทยเครดิต (Thai Credit)</option>
                        <option value="อื่นๆ (ระบุ)">อื่นๆ (ระบุ)</option>
                      </select>
                      {paymentBank === 'อื่นๆ (ระบุ)' && (
                        <input
                          type="text"
                          value={paymentBankOther}
                          onChange={(e) => setPaymentBankOther(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs mt-2 outline-none focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* วัน-เวลาที่โอน (รูปแบบปฏิทิน) */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">วัน-เวลาที่โอน (รูปแบบปฏิทิน):</label>
                      <input
                        type="datetime-local"
                        value={paymentDateTime}
                        onChange={(e) => setPaymentDateTime(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* อัปโหลดไฟล์สลิปเงิน (ถ้ามี) */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">อัปโหลดไฟล์สลิปเงิน (ถ้ามี):</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 600);
                              setPaymentSlipFile(compressed);
                            } catch (err) {
                              const reader = new FileReader();
                              reader.onloadend = () => setPaymentSlipFile(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {paymentSlipFile && (
                        <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <img src={paymentSlipFile} alt="Slip Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                          <div className="flex-1 text-xs text-emerald-700 font-bold">✅ อัปโหลดไฟล์สลิปแล้ว</div>
                          <button
                            type="button"
                            onClick={() => setPaymentSlipFile(null)}
                            className="text-xs text-rose-600 hover:underline font-bold border-none bg-transparent cursor-pointer"
                          >
                            ลบรูป
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button type="submit" className="w-full h-11 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-full shadow-sm cursor-pointer">
                    + บันทึกสร้างบัญชีผู้ปกครอง & ออกข้อความ Line
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Registered Parents List */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-[#001a3a]">
                รายการบัญชีผู้ปกครองทั้งหมด ({parents.filter(checkParentFilter).length} / {parents.length} บัญชี)
              </h3>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={parentSearchQuery}
                    onChange={(e) => setParentSearchQuery(e.target.value)}
                    placeholder="ค้นหาผู้ปกครอง (ชื่อ, Email, Phone)..."
                    className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal text-[#001a3a] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
                  {parentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setParentSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={parentStatusFilter}
                  onChange={(e) => setParentStatusFilter(e.target.value)}
                  className="w-full sm:w-48 h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-[#001a3a] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs cursor-pointer"
                >
                  <option value="all">ทั้งหมด (All)</option>
                  <option value="active">นักเรียนปัจจุบัน (Active)</option>
                  <option value="free_trial">ทดลองเรียนฟรี (Free Trial)</option>
                  <option value="expired">หมดอายุแล้ว (Expired)</option>
                </select>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                  <thead>
                    <tr className="bg-[#001a3a] text-white font-bold text-xs">
                      <th className="py-3.5 px-4 font-semibold w-[10%]">USERNAME</th>
                      <th className="py-3.5 px-4 font-semibold w-[24%]">ชื่อผู้ปกครอง</th>
                      <th className="py-3.5 px-4 font-semibold w-[12%]">เบอร์โทรศัพท์</th>
                      <th className="py-3.5 px-4 font-semibold w-[18%]">คลาส & โควต้าที่ซื้อ</th>
                      <th className="py-3.5 px-4 font-semibold text-center w-[12%]">ลงทะเบียนบุตร</th>
                      <th className="py-3.5 px-4 font-semibold text-center w-[24%]">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parents
                      .filter(checkParentFilter)
                      .map((p) => {
                        const pChildren = children.filter((c) => isChildOfParent(c, p));
                        const pChildrenCount = pChildren.length;
                        
                        const pBaskets = getFamilyBaskets(p, pChildren, coursesListGlobal);
                        
                        // Calculate if any basket is expiring soon
                        const todayDate = new Date();
                        todayDate.setHours(0, 0, 0, 0);
                        let nearestExpiringBasket = null;
                        let minDaysUntil = 9999;
                        
                        pBaskets.forEach(b => {
                          if (b.remaining_hours > 0) {
                            const bExpiry = new Date(b.created_at);
                            bExpiry.setMonth(bExpiry.getMonth() + b.duration_months);
                            const expDay = new Date(bExpiry);
                            expDay.setHours(0, 0, 0, 0);
                            const daysUntil = Math.ceil((expDay.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
                            if (daysUntil < minDaysUntil) {
                              minDaysUntil = daysUntil;
                              nearestExpiringBasket = { ...b, expiry: bExpiry };
                            }
                          }
                        });
                        
                        const isPkgExpiringSoon = minDaysUntil <= 5;
                        const daysUntilPkgExpiry = minDaysUntil;
                        let formattedExpiryDate = '';
                        let alertStartStr = '';
                        if (nearestExpiringBasket) {
                          formattedExpiryDate = formatThaiShortDate(nearestExpiringBasket.expiry);
                          const alertStart = new Date(nearestExpiringBasket.expiry);
                          alertStart.setDate(alertStart.getDate() - 5);
                          alertStartStr = formatThaiShortDate(alertStart);
                        }

                        const paymentHistoryList: PaymentProofRecord[] =
                          p.payment_history && p.payment_history.length > 0
                            ? p.payment_history
                            : (p.payment_amount || p.payment_bank || p.payment_ref_no || p.payment_datetime || p.payment_slip)
                            ? [
                                {
                                  id: 'pay_init_' + p.id,
                                  payment_amount: p.payment_amount,
                                  payment_ref_no: p.payment_ref_no,
                                  payment_payer_name: p.payment_payer_name,
                                  payment_bank: p.payment_bank,
                                  payment_datetime: p.payment_datetime,
                                  payment_slip: p.payment_slip,
                                  purchased_hours: p.purchased_hours || 6,
                                  created_at: p.payment_datetime || p.created_at,
                                },
                              ]
                            : [];

                        return (
                          <Fragment key={p.id}>
                            <tr className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  <span>🔑</span>
                                  <span>{p.user_id}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#001a3a] text-sm flex flex-wrap items-center gap-2">
                                  <span>{p.name}</span>
                                  {isPkgExpiringSoon && (
                                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] " title={`เริ่มแจ้งเตือนล่วงหน้า 5 วัน ตั้งแต่วันที่ ${alertStartStr}`}>
                                      ⏰ หมดอายุใน {daysUntilPkgExpiry <= 0 ? '0' : daysUntilPkgExpiry} วัน ({formattedExpiryDate} | แจ้งเตือนตั้งแต่ {alertStartStr})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span>✉️ {p.email || `${p.user_id}@orcagym.com`}</span>
                                </div>
                                <div className="text-[10px] flex flex-wrap items-center gap-2 mt-1.5">
                                  {p.pdpa_accepted ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                      <span>✅</span> ยอมรับกฎระเบียบแล้ว
                                    </span>
                                  ) : (
                                    <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                      <span>⏳</span> รอยอมรับกฎระเบียบ
                                    </span>
                                  )}
                                  
                                  {p.pdpa_accepted ? (
                                    p.media_consent ? (
                                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                        <span>📷</span> ยินยอมให้ใช้สื่อ PR
                                      </span>
                                    ) : (
                                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                        <span>🚫</span> ไม่ยินยอมให้ใช้สื่อ PR
                                      </span>
                                    )
                                  ) : (
                                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                      <span>⏳</span> รอยืนยันการยินยอมให้ใช้สื่อ PR
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-normal text-slate-700 whitespace-nowrap">
                                {p.phone || '-'}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex flex-col gap-3">
                                  {pBaskets.length === 0 ? (
                                    <span className="text-xs text-slate-400 font-bold">- ยังไม่มีแพ็กเกจ -</span>
                                  ) : (
                                    pBaskets.map((basket, bIdx) => {
                                      const bExpiry = new Date(basket.created_at);
                                      bExpiry.setMonth(bExpiry.getMonth() + basket.duration_months);
                                      const bFormattedPurchase = formatThaiShortDate(new Date(basket.created_at));
                                      const bFormattedExpiry = formatThaiShortDate(bExpiry);
                                      
                                      return (
                                        <div key={bIdx} className="flex flex-col gap-1 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                                          <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold px-2 py-0.5 rounded-full text-xs w-max">
                                            <span>{basket.course_name.toUpperCase()}</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="font-bold text-blue-700">
                                              {basket.used_hours}/{basket.original_hours} ครั้ง ({basket.duration_text})
                                            </span>
                                          </span>
                                          <div className="text-[10px] text-slate-600 font-semibold pl-1">
                                            <div>📅 วันที่ซื้อ: <span className="text-slate-800 font-bold">{bFormattedPurchase}</span></div>
                                            <div>⏳ หมดอายุ: <span className="text-blue-900 font-bold">{bFormattedExpiry}</span></div>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleExpandParent(p.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                                      pChildrenCount > 0
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        pChildrenCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'
                                      }`}
                                    ></span>
                                    <span>
                                      {pChildrenCount > 0
                                        ? `เพิ่มแล้ว (${pChildrenCount} คน)`
                                        : `ยังไม่เพิ่ม (${pChildrenCount} คน)`}
                                    </span>
                                    <span className="text-[10px] ml-0.5">{expandedParentId === p.id ? '▲' : '▼'}</span>
                                  </button>
                                  {pChildren.map((child) => (
                                    <div key={child.id} className="text-[11px] font-extrabold text-[#001a3a] flex items-center justify-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-lg shadow-2xs mt-0.5">
                                      <span>{child.gender === 'Girl' ? '👧' : '👦'}</span>
                                      <span>{child.full_name} ({child.nickname})</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                 <div className="flex items-center justify-center gap-1.5">
                                   <button
                                     type="button"
                                     title="ประวัติการเงิน"
                                     onClick={() => setViewPaymentHistoryParent(p)}
                                     className="group w-9 h-9 flex items-center justify-center bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">🔍</span>
                                   </button>
                                   <button
                                     type="button"
                                     title="แก้ไข"
                                     onClick={() => handleStartEditParent(p)}
                                     className="group w-9 h-9 flex items-center justify-center bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">✏️</span>
                                   </button>
                                   <button
                                     type="button"
                                     title="ส่ง Email"
                                     onClick={() => handleSendEmailToParent(p)}
                                     className="group w-9 h-9 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">✉️</span>
                                   </button>
                                   <button
                                     type="button"
                                     title="คัดลอกส่ง Line"
                                     onClick={() => {
                                       let payInfo = '';
                                       if (!p.payment_history || p.payment_history.length === 0) {
                                         if (p.payment_amount || p.payment_bank || p.payment_ref_no || p.payment_datetime || p.payment_slip) {
                                           payInfo = `\n💳 หลักฐานการชำระเงิน:\n` +
                                             (p.payment_amount ? `• จำนวนเงิน: ${Number(p.payment_amount).toLocaleString()} บาท\n` : '') +
                                             (p.payment_bank ? `• ธนาคาร: ${p.payment_bank}\n` : '') +
                                             (p.payment_payer_name ? `• ชื่อผู้โอน: ${p.payment_payer_name}\n` : '') +
                                             (p.payment_datetime ? `• วัน-เวลาโอน: ${p.payment_datetime.replace('T', ' ')} น.\n` : '') +
                                             (p.payment_ref_no ? `• เลขอ้างอิงสลิป: ${p.payment_ref_no}\n` : '');
                                         }
                                       } else {
                                          payInfo = `\n💳 สถานะ: ตะกร้าแบบ Multi-basket (หลายแพ็กเกจ)\n`;
                                       }
                                       
                                       const basketInfo = pBaskets.map(b => `• ${b.course_name.toUpperCase()}: ${b.original_hours} ครั้ง`).join('\n');
                                       
                                       const msg = `🐳 บัญชีใช้งานระบบ ORCA GYMNASTICS\n---------------------------------\nUsername: ${p.user_id}\nPassword: ${p.password || '123'}\nผู้ปกครอง: ${p.name}\nคลาส & โควต้าที่ซื้อ:\n${basketInfo}\n${payInfo}---------------------------------\nกรุณานำ Username และ Password\nไปเข้าสู่ระบบเพื่อลงทะเบียนข้อมูลบุตรหลาน (Add Family Member)`;
                                       setCopyMessage(msg);
                                     }}
                                     className="group w-9 h-9 flex items-center justify-center bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">📋</span>
                                   </button>
                                   <button
                                     type="button"
                                     title="ซื้อคอร์สเพิ่ม / เติมตะกร้าครอบครัว"
                                     onClick={() => {
                                       setTopUpParent(p);
                                       setTopUpChild(null);
                                       setHoursToAdd('');
                                       setTopUpNote('');
                                       setTopUpPaymentAmount('');
                                       setTopUpPaymentRefNo('');
                                       setTopUpPaymentPayerName(p.name || '');
                                       setTopUpPaymentBank('กสิกรไทย (KBank)');
                                       setTopUpPaymentBankOther('');
                                       setTopUpPaymentDateTime('');
                                       setTopUpPaymentSlipFile(null);
                                     }}
                                     className="group flex items-center gap-1.5 px-3 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
                                   >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                       <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                     </svg>
                                     <span className="shrink-0">ซื้อคอร์สเพิ่ม</span>
                                   </button>
                                   <button
                                     type="button"
                                     title="ลบ"
                                     onClick={() => handleDeleteParent(p.id, p.name)}
                                     className="group w-9 h-9 flex items-center justify-center bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">🗑️</span>
                                   </button>
                                 </div>
                              </td>
                            </tr>

                            {/* Sub-row for payment slip info or expanded children */}
                            {expandedParentId === p.id && (
                              <tr className="bg-indigo-50/30">
                                <td colSpan={6} className="px-4 py-3 border-b border-slate-200">
                                  <div className="space-y-3">
                                    {/* Payment details summary (History List) */}
                                    {paymentHistoryList.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="text-[11px] font-extrabold text-[#001a3a] flex items-center justify-between">
                                          <span className="flex items-center gap-1.5">
                                            <span>🧾</span>
                                            <span>หลักฐานสลิปการโอนเงิน (สะสม {paymentHistoryList.length} รายการ):</span>
                                          </span>
                                          {paymentHistoryList.length > 1 && (
                                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                              โอนเงินหลายครั้ง / ซื้อคอร์สเพิ่ม
                                            </span>
                                          )}
                                        </div>
                                        <div className="space-y-1.5">
                                          {paymentHistoryList.map((pay, pIdx) => (
                                            <div
                                              key={pay.id || pIdx}
                                              className="text-xs text-slate-700 font-normal flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                                            >
                                              <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                                                # {pIdx + 1} {pIdx === 0 ? '(แรกเริ่ม)' : '(ซื้อคอร์สเพิ่ม)'}
                                              </span>
                                              {pay.payment_amount && (
                                                <span>
                                                  💳 <strong>ยอดโอน:</strong>{' '}
                                                  <strong className="text-emerald-700">
                                                    {pay.payment_amount.toLocaleString()} บาท
                                                  </strong>
                                                </span>
                                              )}
                                              {pay.payment_bank && (
                                                <span>
                                                  🏦 <strong>ธนาคาร:</strong> {pay.payment_bank}
                                                </span>
                                              )}
                                              {pay.payment_payer_name && (
                                                <span>
                                                  👤 <strong>ชื่อผู้โอน:</strong> {pay.payment_payer_name}
                                                </span>
                                              )}
                                              {pay.payment_datetime && (
                                                <span>
                                                  📅 <strong>เวลาโอน:</strong> {formatThaiShortDate(pay.payment_datetime, true)}
                                                </span>
                                              )}
                                              {pay.payment_ref_no && (
                                                <span>
                                                  🔢 <strong>Ref:</strong> {pay.payment_ref_no}
                                                </span>
                                              )}
                                              {pay.purchased_hours && (
                                                <span>
                                                  🛒 <strong>โควต้า:</strong> <strong className="text-blue-700">+{pay.purchased_hours} ครั้ง</strong>
                                                </span>
                                              )}
                                              {pay.payment_slip && (
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedSlipPreview(pay.payment_slip!)}
                                                  className="bg-[#003366] text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer ml-auto shadow-2xs flex items-center gap-1"
                                                >
                                                  <span>📷</span>
                                                  <span>ดูสลิปโอนเงิน (#{pIdx + 1})</span>
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Expanded children */}
                                    {(expandedParentId === p.id || pChildrenCount > 0) && (
                                      <div
                                        id={`parent-children-${p.id}`}
                                        className="bg-white p-3.5 rounded-2xl border-2 border-emerald-300 space-y-2.5 scroll-mt-24 shadow-xs"
                                      >
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-extrabold text-[#001a3a] flex items-center gap-2">
                                            <span>👶 รายชื่อบุตรหลาน (Family Members) ภายใต้ผู้ปกครอง: {p.name}</span>
                                          </h4>
                                          <span className="text-[11px] text-indigo-900 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">
                                            รวม {pChildrenCount} คน
                                          </span>
                                        </div>

                                        {pChildrenCount === 0 ? (
                                          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center font-normal">
                                            ยังไม่ได้ลงทะเบียนบุตรหลาน (ผู้ปกครองยังไม่ได้กด Add Family Member ในระบบ)
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {pChildren.map((child) => {
                                              const remaining = child.total_hours - child.used_hours;
                                              return (
                                                <div
                                                  key={child.id}
                                                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3"
                                                >
                                                  <div>
                                                    <div className="font-bold text-[#001a3a] text-xs sm:text-sm flex items-center gap-2">
                                                      <span>
                                                        {child.gender === 'Girl' ? '👧' : '👦'} {child.full_name} ({child.nickname})
                                                      </span>
                                                      <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                          child.status === 'approved'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                        }`}
                                                      >
                                                        {child.status === 'approved' ? '✅ อนุมัติแล้ว' : '⏳ รออนุมัติ'}
                                                      </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                                                      เกิด: {child.dob} | คลาส: <strong>{child.course_name}</strong> | คงเหลือ:{' '}
                                                      <strong className="text-blue-700">{remaining} ชม.</strong> (รวม {child.total_hours} ชม.)
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    {child.status === 'pending' && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleApproveCourse(child)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                                                      >
                                                        ✅ อนุมัติคอร์ส
                                                      </button>
                                                    )}
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setAdminBookingChild(child);
                                                        setAdminBookingSlot(
                                                          child.course_name?.includes('Mega') ? '10:00-12:00' : '10:30-12:00'
                                                        );
                                                      }}
                                                      className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer"
                                                    >
                                                      📅 จองคลาสแทน
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setTopUpChild(child)}
                                                      className="bg-[#001a3a] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#002244] shadow-2xs cursor-pointer"
                                                    >
                                                      Approve / เติมชั่วโมง
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: STUDENTS / MEMBERS LIST */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#001a3a] flex items-center gap-2">
                <span>👶 ข้อมูลนักเรียนทั้งหมดในระบบ ({children.filter((c) => {
                  if (!studentSearchQuery.trim()) return true;
                  const q = studentSearchQuery.toLowerCase().trim();
                  const p = parents.find((parent) => isChildOfParent(c, parent));
                  const pName = p?.name?.toLowerCase() || '';
                  return (
                    c.full_name?.toLowerCase().includes(q) ||
                    c.nickname?.toLowerCase().includes(q) ||
                    c.course_name?.toLowerCase().includes(q) ||
                    pName.includes(q)
                  );
                }).length} / {children.length} คน)</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                รายชื่อเด็กที่ผู้ปกครองลงทะเบียน Add Family Member ทั้งหมดในระบบ
              </p>
            </div>

            {/* Search Input for Students */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเด็ก, ชื่อเล่น, คลาส หรือผู้ปกครอง..."
                className="w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal text-[#001a3a] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
              <span className="absolute left-3.5 top-3 text-sm text-slate-400">🔍</span>
              {studentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStudentSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Structured Data Table for Student Information */}
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-['Anuphan',sans-serif] whitespace-nowrap overflow-hidden text-ellipsis">
                <thead>
                  <tr className="bg-[#001a3a] text-white text-xs font-bold tracking-wider">
                    <th className="py-4 px-4 whitespace-nowrap w-[25%]">
                      ชื่อนักเรียน (ชื่อจริง & ชื่อเล่น) / อายุ
                    </th>
                    <th className="py-4 px-4 whitespace-nowrap w-[20%]">
                      ชื่อผู้ปกครอง / เบอร์โทร
                    </th>
                    <th className="py-4 px-4 whitespace-nowrap w-[15%]">
                      ชื่อ Course
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap w-[8%]">
                      จำนวนครั้ง
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap w-[6%]">
                      แถม
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap w-[8%]">
                      คงเหลือ
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap w-[18%]">
                      จัดการคลาสเรียน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {children
                    .filter((c) => {
                      if (!studentSearchQuery.trim()) return true;
                      const q = studentSearchQuery.toLowerCase().trim();
                      const p = parents.find((parent) => isChildOfParent(c, parent));
                      const pName = p?.name?.toLowerCase() || '';
                      return (
                        c.full_name?.toLowerCase().includes(q) ||
                        c.nickname?.toLowerCase().includes(q) ||
                        c.course_name?.toLowerCase().includes(q) ||
                        pName.includes(q)
                      );
                    })
                    .map((c) => {
                      const cActive = allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled');
  const remaining = c.total_hours - cActive.length;
                      const parent = parents.find((p) => isChildOfParent(c, p));
                      const ageText = calculateAge(c.dob);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/90 transition-colors border-b border-slate-100/80">
                          {/* 1. ชื่อนักเรียน ทั้งชื่อจริงและชื่อเล่น / อายุ */}
                          <td className="py-4 px-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-2xs overflow-hidden">
                                {c.photo_url ? (
                                  <img src={c.photo_url} alt={c.nickname} className="w-full h-full object-cover" />
                                ) : (
                                  c.gender === 'Girl' ? '👧' : '👦'
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start gap-2">
                                  <div className="font-extrabold text-[#001a3a] text-xs sm:text-sm leading-tight">
                                    <div>{c.full_name}</div>
                                    <div className="text-slate-700 font-bold text-xs mt-0.5">({c.nickname})</div>
                                  </div>
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold border shrink-0 ${
                                    c.status === 'approved' 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                      : 'bg-amber-50 text-amber-900 border-amber-300 '
                                  }`}>
                                    {c.status === 'approved' ? '✅ อนุมัติแล้ว' : '⏳ รออนุมัติ'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 font-normal mt-1 flex items-center gap-1">
                                  <span>🎂 อายุ: <strong className="text-slate-700 font-semibold">{ageText}</strong></span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. ชื่อผู้ปกครอง / เบอร์โทร */}
                          <td className="py-4 px-4 align-middle">
                            <div className="font-bold text-[#001a3a] text-xs sm:text-sm">
                              {parent ? parent.name : '-'}
                            </div>
                            <div className="text-xs text-slate-500 font-normal mt-0.5 flex items-center gap-1">
                              <span>📞</span>
                              <span>{parent ? parent.phone : '-'}</span>
                            </div>
                          </td>

                          {/* 3. ชื่อ Course */}
                          <td className="py-4 px-4 text-center align-middle">
                            <span className="font-bold text-sky-900 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200 inline-block text-xs shadow-2xs whitespace-nowrap">
                              {c.course_name || 'Orca Cubs'}
                            </span>
                          </td>

                          {/* 4. จำนวนครั้ง */}
                          <td className="py-4 px-4 text-center align-middle font-extrabold text-[#001a3a] text-xs sm:text-sm whitespace-nowrap">
                            {c.total_hours} ครั้ง
                          </td>

                          {/* 5. แถม */}
                          <td className="py-4 px-4 text-center align-middle font-extrabold text-emerald-600 text-xs sm:text-sm whitespace-nowrap">
                            {c.bonus_hours ? `+${c.bonus_hours} ครั้ง` : '0 ครั้ง'}
                          </td>

                          {/* 6. คงเหลือ */}
                          <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                            <span className="font-black text-blue-700 text-sm sm:text-base">
                              {remaining} ครั้ง
                            </span>
                          </td>

                          {/* 7. จัดการคลาสเรียน (สบายตา เรียงแนวนอนแถวเดียว) */}
                          <td className="py-4 px-4 align-middle text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                              {/* 1. ดูรายละเอียด */}
                              <button
                                type="button"
                                onClick={() => setViewDetailsChild(c)}
                                title="ดูรายละเอียดนักเรียน"
                                className="h-8 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>🔍</span>
                                <span>ดูรายละเอียด</span>
                              </button>

                              {/* 2. อนุมัติคลาสเรียน */}
                              {c.status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => handleApproveCourse(c)}
                                  title="กดอนุมัติคอร์สเรียนนี้"
                                  className="h-8 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer "
                                >
                                  <span>⚡</span>
                                  <span>อนุมัติคลาส</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApproveCourse(c)}
                                  title="อนุมัติแล้ว (กดซ้ำเพื่อรีเฟรชสถานะ)"
                                  className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-extrabold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <span>✅</span>
                                  <span>อนุมัติแล้ว</span>
                                </button>
                              )}

                              {/* 3. จัดการคลาสเรียน */}
                              <button
                                type="button"
                                onClick={() => setTopUpChild(c)}
                                title="จัดการคลาสเรียน & เติมชั่วโมง"
                                className="h-8 px-2.5 bg-[#001a3a] hover:bg-[#002244] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>⚙️</span>
                                <span>จัดการคลาส</span>
                              </button>

                              {/* 4. ลบรายชื่อ */}
                              <button
                                type="button"
                                onClick={() => handleDeleteChild(c.id, c.nickname || c.full_name)}
                                title="ลบรายชื่อนักเรียน"
                                className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>🗑️</span>
                                <span>ลบ</span>
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

      {/* TAB 3: SCHEDULE MATRIX */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <WeeklyScheduleAdmin allBookings={allBookings} />
            <StudentBookingsRoster allBookings={allBookings} childrenList={children} parentsList={parents} onBookingCancelled={() => window.location.reload()} />
          </div>
        )}
        
        {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-[#001a3a]">
                📊 ประวัติการทำงานของแอดมิน (Audit Trail Log)
              </div>
              <div className="text-xl font-extrabold text-[#059669] mt-1">
                รวมเติมโควต้าวันนี้: {totalHoursToday} ครั้ง
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex justify-between text-xs text-slate-500 mb-1 font-normal">
                  <span>⏱️ {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  <span>Admin: <strong>{log.admin_name}</strong></span>
                </div>
                <div className="font-bold text-[#001a3a] text-sm">
                  เป้าหมาย: {log.child_name || log.parent_name || 'ไม่ระบุ'}
                  {Number(log.hours_added) > 0 && (
                    <span className="text-[#059669] font-extrabold ml-2">
                      (เติมชั่วโมงเรียน +{log.hours_added} ครั้ง)
                    </span>
                  )}
                  {log.course_name && <span className="ml-1 text-slate-500">[{log.course_name}]</span>}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-normal">กิจกรรม/หมายเหตุ: {log.note?.replace('อนุมัติคลาสเรียน', 'เติมชั่วโมงเรียน') || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: QUOTAS CONFIG */}
      {activeTab === 'quota' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>⚙️</span>
                <span>ปรับแต่ง Quota จำนวนนักเรียนต่อรอบ (Quota Config per Course)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ตั้งค่าจำนวนจำกัดรับนักเรียนสูงสุด (คน/ห้อง) แยกตามประเภทคลาสเรียน และรอบเวลา (Default: 10 คน)
              </p>
            </div>
            <div className="text-xs font-bold text-sky-900 bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-200 shrink-0">
              🔒 เมื่อเต็ม Quota ระบบจะระงับการจองโดยอัตโนมัติ
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Form Column */}
            <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/90 space-y-4">
              <h4 className="font-extrabold text-sm text-[#001a3a] flex items-center gap-1.5">
                <span>✏️</span>
                <span>ฟอร์มกำหนด Quota ใหม่</span>
              </h4>

              {/* 1. Select Course */}
              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">
                  1. เลือกประเภทคลาสเรียน (Course):
                </label>
                <select
                  value={quotaCourse}
                  onChange={(e) => {
                    const newCourse = e.target.value;
                    setQuotaCourse(newCourse);
                    if (newCourse === 'Mega Orca') {
                      setQuotaSlot('10:00-12:00');
                    } else {
                      setQuotaSlot('10:30-12:00');
                    }
                  }}
                  className="w-full h-11 px-4 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-[#001a3a] outline-none focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Orca Cubs">🐳 Orca Cubs (สำหรับน้องๆ อายุ 4-10 ปี)</option>
                  <option value="Mega Orca">⚡ Mega Orca (สำหรับเลเวล 1 ขึ้นไป อายุ 5-15 ปี)</option>
                  <option value="All Courses">🌐 ทุกคลาสเรียน (All Courses)</option>
                </select>
              </div>

              {/* 2. Select Time Slot */}
              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">
                  2. เลือกรอบเวลาเรียน (Time Slot):
                </label>
                <select
                  value={quotaSlot}
                  onChange={(e) => setQuotaSlot(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-[#001a3a] outline-none focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
                >
                  {quotaCourse === 'Mega Orca' ? (
                    <>
                      <option value="10:00-12:00">10:00 - 12:00 น. (รอบเช้า Mega)</option>
                      <option value="14:00-16:00">14:00 - 16:00 น. (รอบบ่ายเสาร์-อาทิตย์ Mega)</option>
                      <option value="17:30-19:30">17:30 - 19:30 น. (รอบค่ำ Mega)</option>
                    </>
                  ) : (
                    <>
                      <option value="10:30-12:00">10:30 - 12:00 น. (รอบ 1.5 ชม. Cubs)</option>
                      <option value="14:30-16:00">14:30 - 16:00 น. (รอบ 1.5 ชม. Cubs)</option>
                      <option value="16:00-17:30">16:00 - 17:30 น. (รอบ 1.5 ชม. Cubs)</option>
                      <option value="17:30-19:30">17:30 - 19:30 น. (รอบ 2 ชม. Cubs)</option>
                      <option value="09:00-10:30">09:00 - 10:30 น. (รอบเช้าเสาร์-อาทิตย์)</option>
                      <option value="13:00-14:30">13:00 - 14:30 น. (รอบบ่ายเสาร์-อาทิตย์)</option>
                      <option value="10:00-12:00">10:00 - 12:00 น.</option>
                    </>
                  )}
                </select>
              </div>

              {/* 3. Quota Number */}
              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">
                  3. จำนวน Quota รับได้สูงสุด (คน/คลาส):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={quotaNumber}
                    onChange={(e) => setQuotaNumber(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={50}
                    className="w-full h-11 px-4 bg-white border border-slate-300 rounded-2xl text-sm font-extrabold text-[#001a3a] outline-none focus:border-blue-600 shadow-2xs"
                  />
                  <span className="text-xs font-bold text-slate-600 shrink-0">คน</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdateQuota}
                className="w-full h-12 bg-[#001a3a] hover:bg-[#002244] text-white font-extrabold text-sm rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>บันทึกการตั้งค่า Quota ({quotaCourse})</span>
              </button>
            </div>

            {/* Quota Summary & Quick Overview Cards Column */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-extrabold text-sm text-[#001a3a] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>📊</span>
                    <span>สรุปการตั้งค่า Quota คลาสเรียน</span>
                  </span>
                  <span className="text-xs text-sky-800 font-bold bg-sky-100 px-3 py-1 rounded-full">
                    โควต้าตามคลาสเรียน
                  </span>
                </h4>

                {/* Quota Cards for Orca Cubs & Mega Orca */}
                <div className="space-y-3">
                  {/* Orca Cubs Quota summary */}
                  <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-sky-950">
                      <span className="flex items-center gap-1.5">
                        <span>🐳</span>
                        <span>คลาส Orca Cubs (อายุ 4-10 ปี)</span>
                      </span>
                      <span className="bg-sky-200 text-sky-900 px-2.5 py-0.5 rounded-full text-[11px]">
                        โควต้าตั้งต้น: {coursesListGlobal.find(c => c.display_title.toLowerCase().includes('cubs'))?.max_capacity || 10} คน/รอบ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 font-medium">
                      {['10:30-12:00', '14:30-16:00', '16:00-17:30', '17:30-19:30'].map(slot => {
                        const val = quotas[`Everyday_Orca Cubs_${slot}`]
                          ?? quotas[`Orca Cubs_${slot}`]
                          ?? quotas[`Everyday_${slot}`]
                          ?? defaultCubsQuota;
                        return (
                          <div key={slot} className="flex justify-between">
                            <span>• รอบ {slot} น.</span>
                            <strong className="text-[#001a3a]">{val} คน</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mega Orca Quota summary */}
                  <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950">
                      <span className="flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>คลาส Mega Orca (อายุ 5-15 ปี)</span>
                      </span>
                      <span className="bg-indigo-200 text-indigo-900 px-2.5 py-0.5 rounded-full text-[11px]">
                        โควต้าตั้งต้น: {coursesListGlobal.find(c => c.display_title.toLowerCase().includes('mega'))?.max_capacity || 10} คน/รอบ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 font-medium">
                      {['10:00-12:00', '14:00-16:00', '17:30-19:30'].map(slot => {
                        const val = quotas[`Everyday_Mega Orca_${slot}`]
                          ?? quotas[`Mega Orca_${slot}`]
                          ?? quotas[`Everyday_${slot}`]
                          ?? defaultMegaQuota;
                        return (
                          <div key={slot} className="flex justify-between">
                            <span>• รอบ {slot} น.</span>
                            <strong className="text-[#001a3a]">{val} คน</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Orca Flip Quota summary */}
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950">
                      <span className="flex items-center gap-1.5">
                        <span>🤸</span>
                        <span>คลาส ORCA FLIP</span>
                      </span>
                      <span className="bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full text-[11px]">
                        โควต้าตั้งต้น: {coursesListGlobal.find(c => c.display_title.toLowerCase().includes('flip'))?.max_capacity || 10} คน/รอบ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 font-medium">
                      {['13:00-14:30', '17:30-19:00'].map(slot => {
                        const defaultFlipQuota = coursesListGlobal.find(c => c.display_title.toLowerCase().includes('flip'))?.max_capacity || 10;
                        const val = quotas[`Everyday_ORCA FLIP_${slot}`]
                          ?? quotas[`ORCA FLIP_${slot}`]
                          ?? quotas[`Everyday_${slot}`]
                          ?? defaultFlipQuota;
                        return (
                          <div key={slot} className="flex justify-between">
                            <span>• รอบ {slot} น.</span>
                            <strong className="text-[#001a3a]">{val} คน</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SUPABASE DATABASE */}
      {activeTab === 'supabase' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-6 shadow-xs space-y-3">
          <h3 className="text-lg font-bold text-emerald-900">⚡ สถานะการเชื่อมต่อ Supabase Database</h3>

          <div className="text-xs text-slate-700 space-y-2 font-normal">
            <p>
              สถานะปัจจุบัน:{' '}
              <strong className={isSupabaseConfigured ? 'text-emerald-700' : 'text-amber-700'}>
                {isSupabaseConfigured ? '✅ เชื่อมต่อ Supabase Live Database แล้ว' : '⚡ ทำงานในโหมด Local Fallback (พร้อมเชื่อมต่อ Supabase)'}
              </strong>
            </p>
            <p>📄 สคริปต์ SQL 1-Click Setup: ดูได้ที่ <code>supabase/schema.sql</code></p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 text-xs space-y-1 font-mono text-slate-800">
            <div>NEXT_PUBLIC_SUPABASE_URL</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
          </div>
        </div>
      )}

      {/* Copy Line Template Modal */}
      {copyMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📱</span>
              <h3 className="text-lg font-bold text-[#001a3a]">
                ข้อมูลบัญชีที่ต้องส่งให้ผู้ปกครอง (LINE Template)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-normal">
              คัดลอกข้อความด้านล่างนี้ไปส่งให้ผู้ปกครองทาง Line ส่วนตัวเพื่อเริ่มใช้งาน
            </p>

            <textarea
              readOnly
              rows={8}
              value={copyMessage}
              className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-xs text-slate-800 outline-none leading-relaxed"
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCopyMessage(null)}
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-full font-bold text-xs hover:bg-slate-300 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(copyMessage);
                  showToast('📋 คัดลอกข้อความสำหรับส่ง Line เรียบร้อยแล้ว');
                }}
                className="flex-1 py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-full font-bold text-xs shadow-md cursor-pointer"
              >
                📋 คัดลอกข้อความ Line
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Up / Approve Hours Modal (Class Management) */}
      {(topUpParent || topUpChild) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto font-['Anuphan',sans-serif]">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#001a3a] flex items-center gap-2">
                  <span>🛒</span>
                  <span>ซื้อคอร์สเพิ่ม / เติมตะกร้าครอบครัว</span>
                </h3>
                <div className="text-xs font-bold text-indigo-700 mt-0.5">
                  {topUpParent
                    ? `👨‍👩‍👧 ผู้ปกครอง: ${topUpParent.name} (ตะกร้าปัจจุบัน: ${topUpParent.purchased_hours || 0} ครั้ง)`
                    : `น้อง ${topUpChild!.full_name} (${topUpChild!.nickname})`
                  }
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setTopUpChild(null); setTopUpParent(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">Class (คลาสเรียน):</label>
                  <select
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                  >
                    <option value="Orca Cubs">Orca Cubs (อายุ 4-10 ปี)</option>
                    <option value="Orca Flip">Orca Flip (อายุ 6-15+ ปี)</option>
                    <option value="Mega Orca">Mega Orca (อายุ 5-15 ปี)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">Course / จำนวนครั้งที่ซื้อเพิ่ม:</label>
                  <select
                    value={hoursToAdd}
                    onChange={(e) => setHoursToAdd(e.target.value ? Number(e.target.value) : '')}
                    className="w-full h-11 px-3 border-2 border-blue-400 rounded-xl text-sm font-bold text-[#001a3a] bg-white outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- เลือกจำนวนครั้ง --</option>
                    {coursesListGlobal
                      .find(c => c.display_title.toLowerCase().includes(courseName.toLowerCase()) || c.internal_name.toLowerCase().includes(courseName.toLowerCase()))
                      ?.pricing_options?.map((opt: any, idx: number) => {
                        const isFree = opt.tag?.toLowerCase().includes('free');
                        const label = isFree 
                          ? `${opt.times} ครั้ง (ทดลองเรียนฟรี)` 
                          : `${opt.times} ครั้ง ${opt.duration && opt.duration !== '-' ? `(แพ็ก ${opt.duration})` : ''} ${opt.tag ? ` / ${opt.tag}` : ''}`;
                        return (
                          <option key={idx} value={opt.times}>
                            {label}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* 💳 Payment Proof Section for Class Management */}
              <div className="pt-3 border-t border-slate-200 mt-2">
                <h4 className="text-xs font-bold text-[#001a3a] mb-3 flex items-center gap-1.5 text-blue-900">
                  <span className="text-base">💳</span>
                  <span>กรอกข้อมูลหลักฐานการชำระเงิน & แนบสลิปโอนเงิน (Payment Proof)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* จำนวนเงินที่โอน */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">จำนวนเงินที่โอน (บาท):</label>
                    <input
                      type="number"
                      value={topUpPaymentAmount}
                      onChange={(e) => setTopUpPaymentAmount(e.target.value)}
                      placeholder="เช่น 4100"
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เลขที่อ้างอิงสลิป */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เลขที่อ้างอิงสลิป (Slip Ref No.):</label>
                    <input
                      type="text"
                      value={topUpPaymentRefNo}
                      onChange={(e) => setTopUpPaymentRefNo(e.target.value)}
                      placeholder="เช่น 202609121234"
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* ชื่อบัญชีผู้โอน */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">ชื่อบัญชีผู้โอน:</label>
                    <input
                      type="text"
                      value={topUpPaymentPayerName}
                      onChange={(e) => setTopUpPaymentPayerName(e.target.value)}
                      placeholder="ชื่อผู้โอนในสลิป"
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* ธนาคารต้นทาง */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">ธนาคารต้นทางที่โอน:</label>
                    <select
                      value={topUpPaymentBank}
                      onChange={(e) => setTopUpPaymentBank(e.target.value)}
                      className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500"
                    >
                      <option value="กสิกรไทย (KBank)">กสิกรไทย (KBank)</option>
                      <option value="ไทยพาณิชย์ (SCB)">ไทยพาณิชย์ (SCB)</option>
                      <option value="กรุงเทพ (BBL)">กรุงเทพ (BBL)</option>
                      <option value="กรุงไทย (KTB)">กรุงไทย (KTB)</option>
                      <option value="กรุงศรีอยุธยา (BAY)">กรุงศรีอยุธยา (BAY)</option>
                      <option value="ออมสิน (GSB)">ออมสิน (GSB)</option>
                      <option value="ทหารไทยธนชาต (ttb)">ทหารไทยธนชาต (ttb)</option>
                      <option value="ยูโอบี (UOB)">ยูโอบี (UOB)</option>
                      <option value="เกียรตินาคินภัทร (KKP)">เกียรตินาคินภัทร (KKP)</option>
                      <option value="ไทยเครดิต (Thai Credit)">ไทยเครดิต (Thai Credit)</option>
                      <option value="อื่นๆ (ระบุ)">อื่นๆ (ระบุ)</option>
                    </select>
                    {topUpPaymentBank === 'อื่นๆ (ระบุ)' && (
                      <input
                        type="text"
                        value={topUpPaymentBankOther}
                        onChange={(e) => setTopUpPaymentBankOther(e.target.value)}
                        placeholder="ระบุชื่อธนาคาร"
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs mt-2 outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* วัน-เวลาที่โอน (รูปแบบปฏิทิน) */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">วัน-เวลาที่โอน (รูปแบบปฏิทิน):</label>
                    <input
                      type="datetime-local"
                      value={topUpPaymentDateTime}
                      onChange={(e) => setTopUpPaymentDateTime(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* แนบไฟล์สลิปการโอนเงิน */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">แนบไฟล์สลิปโอนเงิน (ถ้ามี):</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file, 600);
                            setTopUpPaymentSlipFile(compressed);
                          } catch (err) {
                            const reader = new FileReader();
                            reader.onloadend = () => setTopUpPaymentSlipFile(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {topUpPaymentSlipFile && (
                      <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <img src={topUpPaymentSlipFile} alt="Slip Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                        <div className="flex-1 text-xs text-emerald-700 font-bold">✅ แนบสลิปโอนเงินเรียบร้อยแล้ว</div>
                        <button
                          type="button"
                          onClick={() => setTopUpPaymentSlipFile(null)}
                          className="text-xs text-rose-600 hover:underline font-bold border-none bg-transparent cursor-pointer"
                        >
                          ลบรูป
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">บันทึกเพิ่มเติม (สำหรับ Audit Log):</label>
                <input
                  type="text"
                  value={topUpNote}
                  onChange={(e) => setTopUpNote(e.target.value)}
                  placeholder="เช่น ซื้อคอร์สเพิ่มแพ็ก 6 ครั้ง โอนเงินวันที่ 12/09"
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm text-[#001a3a] outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setTopUpChild(null)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-full font-bold text-sm cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 h-11 bg-[#001a3a] hover:bg-[#002244] text-white font-bold text-sm rounded-full shadow-md cursor-pointer">
                  Approve & เติมชั่วโมง (บันทึกสลิปเพิ่ม)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Payment History Modal */}
      {viewPaymentHistoryParent && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 shadow-2xl relative flex flex-col">
            <div className="flex justify-between items-center w-full mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-[#001a3a] flex items-center gap-2">
                <span>💰</span> ประวัติการทำรายการทางการเงิน
              </h3>
              <button
                type="button"
                onClick={() => setViewPaymentHistoryParent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600">ผู้ปกครอง: <strong className="text-slate-800">{viewPaymentHistoryParent.name}</strong></p>
              <p className="text-sm text-slate-600">Username: <strong className="text-slate-800">{viewPaymentHistoryParent.user_id}</strong></p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 shadow-sm">
                  <tr>
                    <th className="py-2.5 px-4 text-xs font-bold text-slate-600 border-b border-slate-200">ครั้งที่</th>
                    <th className="py-2.5 px-4 text-xs font-bold text-slate-600 border-b border-slate-200">วัน/เวลาโอน</th>
                    <th className="py-2.5 px-4 text-xs font-bold text-slate-600 border-b border-slate-200 text-center">โควต้าที่ได้</th>
                    <th className="py-2.5 px-4 text-xs font-bold text-slate-600 border-b border-slate-200 text-right">ยอดเงิน (บาท)</th>
                    <th className="py-2.5 px-4 text-xs font-bold text-slate-600 border-b border-slate-200 text-center">สลิป</th>
                    <th className="py-2.5 px-4 text-xs font-bold text-slate-600 border-b border-slate-200 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    let hList = viewPaymentHistoryParent.payment_history || [];
                    if (hList.length === 0 && (viewPaymentHistoryParent.payment_amount || viewPaymentHistoryParent.payment_slip || viewPaymentHistoryParent.purchased_hours)) {
                      hList = [{
                        id: 'init',
                        payment_amount: viewPaymentHistoryParent.payment_amount,
                        payment_ref_no: viewPaymentHistoryParent.payment_ref_no,
                        payment_payer_name: viewPaymentHistoryParent.payment_payer_name,
                        payment_bank: viewPaymentHistoryParent.payment_bank,
                        payment_datetime: viewPaymentHistoryParent.payment_datetime,
                        payment_slip: viewPaymentHistoryParent.payment_slip,
                        purchased_hours: viewPaymentHistoryParent.purchased_hours || 6,
                        created_at: viewPaymentHistoryParent.payment_datetime || viewPaymentHistoryParent.created_at
                      }];
                    }
                    if (hList.length === 0) return (
                      <tr><td colSpan={6} className="py-4 text-center text-sm text-slate-500">ไม่มีประวัติการทำรายการ</td></tr>
                    );
                    return hList.map((h, i) => (
                      <tr key={h.id || i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 text-xs font-medium text-slate-700">{i + 1}</td>
                        <td className="py-2.5 px-4 text-xs text-slate-600">{h.payment_datetime ? h.payment_datetime.replace('T', ' ') + ' น.' : '-'}</td>
                        <td className="py-2.5 px-4 text-xs font-bold text-emerald-700 text-center">{h.purchased_hours || 0} ครั้ง</td>
                        <td className="py-2.5 px-4 text-xs font-bold text-blue-700 text-right">{h.payment_amount ? Number(h.payment_amount).toLocaleString() : '-'}</td>
                        <td className="py-2.5 px-4 text-xs text-center">
                          {h.payment_slip ? (
                            <button
                              type="button"
                              onClick={() => setSelectedSlipPreview(h.payment_slip)}
                              className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md hover:bg-blue-100 cursor-pointer font-semibold"
                            >
                              ดูสลิป
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-center">
                          <button
                            type="button"
                            onClick={() => handleDeletePaymentHistory(viewPaymentHistoryParent.id, h.id)}
                            className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md hover:bg-red-100 cursor-pointer font-semibold"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setViewPaymentHistoryParent(null)}
                className="px-6 py-2.5 bg-[#001a3a] hover:bg-[#002244] text-white rounded-full text-xs font-bold cursor-pointer shadow-md transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Image View Modal */}
      {selectedSlipPreview && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full rounded-3xl p-5 shadow-2xl relative flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-3">
              <h3 className="text-base font-bold text-[#001a3a]">🧾 หลักฐานสลิปการโอนเงิน</h3>
              <button
                type="button"
                onClick={() => setSelectedSlipPreview(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img src={selectedSlipPreview} alt="Payment Slip" className="max-h-[70vh] object-contain rounded-2xl border border-slate-200" />
            <button
              type="button"
              onClick={() => setSelectedSlipPreview(null)}
              className="mt-4 px-6 py-2.5 bg-[#001a3a] hover:bg-[#002244] text-white rounded-full text-xs font-bold cursor-pointer shadow-md"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {editingParent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto font-['Anuphan',sans-serif]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-[#001a3a] flex items-center gap-2">
                <span>✏️</span>
                <span>แก้ไขข้อมูลบัญชีผู้ปกครอง ({editingParent.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditParent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">Username สำหรับเข้าสู่ระบบ:</label>
                <input
                  type="text"
                  value={editUserId}
                  onChange={(e) => setEditUserId(e.target.value.replace(/\s+/g, ''))}
                  className="w-full h-11 px-4 border border-blue-300 bg-blue-50/30 rounded-xl text-sm font-bold text-blue-900 outline-none focus:border-blue-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  * คุณสามารถแก้ไข Username นี้ได้หากระบบสร้างให้อัตโนมัติผิดพลาด (ห้ามเว้นวรรค)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">ชื่อ-นามสกุล ผู้ปกครอง:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">อีเมลผู้ปกครอง:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เบอร์โทรศัพท์:</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">รหัสผ่าน (Password):</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">คอร์สเรียน (Course):</label>
                <select
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500 bg-white"
                >
                  {coursesListGlobal.map((c) => (
                    <option key={c.id} value={c.display_title}>
                      {c.display_title}
                    </option>
                  ))}
                  {!coursesListGlobal.some(c => c.display_title.toLowerCase().includes(editCourseName.toLowerCase()) || editCourseName.toLowerCase().includes(c.display_title.toLowerCase())) && (
                    <option value={editCourseName}>{editCourseName}</option>
                  )}
                </select>
              </div>

              {/* 🎯 Purchased Hours / Quota */}
              <div className="sm:col-span-2 bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5 flex items-center justify-between">
                  <span>โควต้าจำนวนครั้ง/ชั่วโมงเรียนที่ซื้อ (Purchased Hours):</span>
                  <span className="text-[11px] text-blue-700 font-bold">* โควต้ารวมตะกร้าครอบครัว</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editPurchasedHours}
                  onChange={(e) => setEditPurchasedHours(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-11 px-4 border-2 border-blue-400 rounded-xl text-sm font-bold text-[#001a3a] bg-white outline-none focus:border-blue-600 cursor-pointer"
                  placeholder="เช่น 1, 6, 12, 24, 26, 52..."
                />
              </div>

              {/* 💳 Payment Proof Section */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-200 mt-2">
                <h4 className="text-xs font-bold text-[#001a3a] mb-3 flex items-center gap-1.5 text-blue-900">
                  <span className="text-base">💳</span>
                  <span>แก้ไขข้อมูลหลักฐานการชำระเงิน (Payment Proof)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* จำนวนเงินที่โอน */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">จำนวนเงินที่โอน (บาท):</label>
                    <input
                      type="number"
                      value={editPaymentAmount}
                      onChange={(e) => setEditPaymentAmount(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เลขที่อ้างอิงสลิป */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เลขที่อ้างอิงสลิป (Slip Ref No.):</label>
                    <input
                      type="text"
                      value={editPaymentRefNo}
                      onChange={(e) => setEditPaymentRefNo(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* ชื่อบัญชีผู้โอน */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">ชื่อบัญชีผู้โอน:</label>
                    <input
                      type="text"
                      value={editPaymentPayerName}
                      onChange={(e) => setEditPaymentPayerName(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* ธนาคารต้นทาง */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">ธนาคารต้นทางที่โอน:</label>
                    <select
                      value={editPaymentBank}
                      onChange={(e) => setEditPaymentBank(e.target.value)}
                      className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500"
                    >
                      <option value="">-- เลือกธนาคาร --</option>
                      <option value="กสิกรไทย (KBank)">กสิกรไทย (KBank)</option>
                      <option value="ไทยพาณิชย์ (SCB)">ไทยพาณิชย์ (SCB)</option>
                      <option value="กรุง෾ (BBL)">กรุง෾ (BBL)</option>
                      <option value="กรุงไทย (KTB)">กรุงไทย (KTB)</option>
                      <option value="กรุงศรีอยุธยา (BAY)">กรุงศรีอยุธยา (BAY)</option>
                      <option value="ออมสิน (GSB)">ออมสิน (GSB)</option>
                      <option value="ทหารไทยธนชาต (ttb)">ทหารไทยธนชาต (ttb)</option>
                      <option value="อื่นๆ (ระบุ)">อื่นๆ (ระบุ)</option>
                    </select>
                    {editPaymentBank === 'อื่นๆ (ระบุ)' && (
                      <input
                        type="text"
                        value={editPaymentBankOther}
                        onChange={(e) => setEditPaymentBankOther(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs mt-2 outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* วัน-เวลาที่โอน (รูปแบบปฏิทิน) */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">วัน-เวลาที่โอน (รูปแบบปฏิทิน):</label>
                    <input
                      type="datetime-local"
                      value={editPaymentDateTime}
                      onChange={(e) => setEditPaymentDateTime(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* อัปโหลดไฟล์สลิปเงิน (ถ้ามี) */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">อัปโหลด/เปลี่ยนไฟล์สลิปเงิน (ถ้ามี):</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file, 600);
                            setEditPaymentSlipFile(compressed);
                          } catch (err) {
                            const reader = new FileReader();
                            reader.onloadend = () => setEditPaymentSlipFile(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {editPaymentSlipFile && (
                      <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <img src={editPaymentSlipFile} alt="Slip Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                        <div className="flex-1 text-xs text-emerald-700 font-bold">✅ มีไฟล์สลิปโอนเงิน</div>
                        <button
                          type="button"
                          onClick={() => setEditPaymentSlipFile(null)}
                          className="text-xs text-rose-600 hover:underline font-bold border-none bg-transparent cursor-pointer"
                        >
                          ลบรูป
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 flex gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingParent(null)}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-full cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-full shadow-md cursor-pointer"
                >
                  💾 บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetailsChild && (() => {
        const c = viewDetailsChild;
        const p = parents.find(parent => isChildOfParent(c, parent));
        const cBookings = allBookings.filter(b => b.child_id === c.id && b.status !== 'Cancelled').sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
        
        let purchaseDateStr = '-';
        let expiryDateStr = '-';
        
        if (p) {
          const pkgStartDateStr = p.payment_datetime || p.created_at || '';
          const pkgStartDate = pkgStartDateStr ? new Date(pkgStartDateStr.includes('T') ? pkgStartDateStr : pkgStartDateStr.replace(' ', 'T')) : new Date();
          const validPkgStartDate = isNaN(pkgStartDate.getTime()) ? new Date() : pkgStartDate;
          
          purchaseDateStr = formatThaiShortDate(validPkgStartDate, false);
          
          const hoursNum = p.purchased_hours || 6;
          let months = 2;
          if (hoursNum === 12) months = 4;
          else if (hoursNum === 24 || hoursNum === 26) months = 6;
          else if (hoursNum === 48) months = 12;

          const expiryDate = new Date(validPkgStartDate);
          expiryDate.setMonth(expiryDate.getMonth() + months);
          expiryDateStr = formatThaiShortDate(expiryDate, false);
        }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl font-['Anuphan',sans-serif] max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-lg font-bold text-[#001a3a] flex items-center gap-2">
                  <span>🔍</span>
                  <span>รายละเอียดนักเรียน</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setViewDetailsChild(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="overflow-y-auto pr-2 space-y-4 text-sm" style={{ scrollbarWidth: 'thin' }}>
                {/* ข้อมูลเด็ก */}
                <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 flex gap-4 items-center">
                   {c.photo_url ? (
                     <img src={c.photo_url} alt={c.nickname} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                   ) : (
                     <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-3xl shadow-sm">
                       {c.avatar === 'boy' ? '👦🏻' : '👧🏻'}
                     </div>
                   )}
                   <div>
                     <div className="font-extrabold text-[#001a3a] text-base mb-1">
                       น้อง {c.nickname} ({c.full_name})
                     </div>
                     <div className="text-slate-600">
                       อายุ: <strong>{calculateAge(c.dob)}</strong>
                     </div>
                   </div>
                </div>
                
                {/* ข้อมูลผู้ปกครอง */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                   <div className="font-bold text-[#001a3a] mb-2 flex items-center gap-2">
                     <span>👨‍👩‍👧</span> ข้อมูลครอบครัว
                   </div>
                   {p ? (
                     <div className="space-y-1 text-slate-700">
                       <div>ชื่อผู้ปกครอง: <strong>{p.name}</strong></div>
                       <div>เบอร์โทร: <strong>{p.phone}</strong></div>
                       <div className="pt-2 mt-2 border-t border-slate-200">
                         <div>วันที่ซื้อแพ็กเกจ: <strong className="text-emerald-600">{purchaseDateStr}</strong></div>
                         <div>วันที่หมดอายุ: <strong className="text-rose-600">{expiryDateStr}</strong></div>
                       </div>
                     </div>
                   ) : (
                     <div className="text-slate-500 italic">ไม่พบข้อมูลผู้ปกครอง</div>
                   )}
                </div>
                
                {/* ตารางเรียน */}
                <div>
                  <div className="font-bold text-[#001a3a] mb-2 flex items-center gap-2">
                    <span>📅</span> ตารางเรียนที่จองไว้ ({cBookings.length} ครั้ง)
                  </div>
                  {cBookings.length > 0 ? (
                    <div className="space-y-2">
                      {cBookings.map((b, idx) => (
                        <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-xs">
                          <div>
                            <div className="font-bold text-[#001a3a]">{formatThaiShortDate(b.booking_date, false)}</div>
                            <div className="text-xs text-slate-500">{b.course_name}</div>
                          </div>
                          <div className="bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-lg text-xs whitespace-nowrap">
                            {b.time_slot}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-xs">
                      ยังไม่มีการจองคลาสเรียน
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Admin Booking Override Modal */}
      {adminBookingChild && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl font-['Anuphan',sans-serif]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#001a3a] flex items-center gap-2">
                <span>📅</span>
                <span>Admin จองคลาสเรียนแทนผู้ปกครอง</span>
              </h3>
              <button
                type="button"
                onClick={() => setAdminBookingChild(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 bg-sky-50 border border-sky-200 p-3 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-[#001a3a] text-sm">
                น้อง {adminBookingChild.nickname} ({adminBookingChild.full_name})
              </div>
              <div className="text-slate-600 font-normal">
                คลาส: <strong>{adminBookingChild.course_name}</strong> | ชั่วโมงคงเหลือ: <strong className="text-blue-700">{(adminBookingChild.total_hours - allBookings.filter(b => b.child_id === adminBookingChild.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length)} ชม.</strong>
              </div>
              <div className="text-[11px] text-amber-800 font-bold mt-1">
                ⚡ สิทธิ์ Admin: สามารถจองวันใดก็ได้ (รวมถึงวันนี้/วันพรุ่งนี้) โดยระบบจะตัด 1 ชม. จากตระกร้าครอบครัวอัตโนมัติ
              </div>
            </div>

            <form onSubmit={handleAdminBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">วันที่ต้องการเข้าเรียน (เลือกวันใดก็ได้):</label>
                <input
                  type="date"
                  value={adminBookingDate}
                  onChange={(e) => setAdminBookingDate(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">รอบเวลาเรียน:</label>
                <select
                  value={adminBookingSlot}
                  onChange={(e) => setAdminBookingSlot(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500"
                >
                  {adminBookingChild.course_name?.includes('Mega') ? (
                    <>
                      <option value="10:00-12:00">10:00-12:00 (Mega Orca)</option>
                      <option value="14:00-16:00">14:00-16:00 (เสาร์-อาทิตย์)</option>
                      <option value="17:30-19:30">17:30-19:30 (อังคาร-ศุกร์)</option>
                    </>
                  ) : (
                    <>
                      <option value="09:00-10:30">09:00-10:30 (เสาร์-อาทิตย์)</option>
                      <option value="10:30-12:00">10:30-12:00</option>
                      <option value="13:00-14:30">13:00-14:30 (เสาร์-อาทิตย์)</option>
                      <option value="14:30-16:00">14:30-16:00</option>
                      <option value="16:00-17:30">16:00-17:30</option>
                      <option value="17:30-19:30">17:30-19:30</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAdminBookingChild(null)}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-full cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-full shadow-md cursor-pointer"
                >
                  📅 บันทึกการจองแทน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Alert Toast for Pending Child Approvals (Bottom Right) */}
      {children.filter(c => c.status === 'pending').length > 0 && !dismissPendingToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full sm:w-96 bg-white/95 backdrop-blur-md border-2 border-amber-400 rounded-3xl p-4 shadow-2xl transition-all duration-300 animate-bounce-short font-['Anuphan',sans-serif]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0 ">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-[#001a3a]">มีเด็กรอให้ Admin Approve!</h4>
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {children.filter(c => c.status === 'pending').length} คน
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-normal">
                  มีรายการเด็กใหม่ลงทะเบียน รอให้แอดมินตรวจสอบและอนุมัติคอร์ส
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setDismissPendingToast(true)} 
              className="text-slate-400 hover:text-slate-600 font-bold text-sm w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="ซ่อนการแจ้งเตือน"
            >
              ✕
            </button>
          </div>

          {/* List of Pending Children preview */}
          <div className="mt-3 max-h-32 overflow-y-auto space-y-1.5 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
            {children.filter(c => c.status === 'pending').map((c) => (
              <div key={c.id} className="text-xs text-[#001a3a] flex items-center justify-between font-semibold">
                <div className="flex items-center gap-1.5">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.nickname} className="w-5 h-5 rounded-full object-cover border border-amber-200" />
                    ) : (
                      <span>👶</span>
                    )}
                    <span>{c.full_name} <span className="text-sky-700 font-bold">({c.nickname})</span></span>
                  </div>
                <span className="text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md font-bold">รออนุมัติ</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('members');
                setStudentSearchQuery('');
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#001a3a] text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
            >
              🔍 ดูในหน้าข้อมูลเด็ก
            </button>
            <button
              type="button"
              onClick={handleApproveAllPending}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold py-2 px-3 rounded-xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <span>⚡ อนุมัติทันที</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">กำลังโหลด Admin Dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

