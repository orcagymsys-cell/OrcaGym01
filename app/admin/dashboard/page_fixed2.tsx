'use client';
import { useState, useEffect, Suspense, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { store, isSupabaseConfigured } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
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
    return `${years} เธเธต ${months} เน€เธ”เธทเธญเธ`;
  } else if (years > 0) {
    return `${years} เธเธต`;
  } else if (months > 0) {
    return `${months} เน€เธ”เธทเธญเธ`;
  } else {
    return `เธเนเธญเธขเธเธงเนเธฒ 1 เน€เธ”เธทเธญเธ`;
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
    'เธก.เธ.', 'เธ.เธ.', 'เธกเธต.เธ.', 'เน€เธก.เธข.', 'เธ.เธ.', 'เธกเธด.เธข.',
    'เธ.เธ.', 'เธช.เธ.', 'เธ.เธข.', 'เธ•.เธ.', 'เธ.เธข.', 'เธ.เธ.'
  ];

  const day = d.getDate();
  const monthStr = monthShortNames[d.getMonth()];
  const year = d.getFullYear() + (d.getFullYear() < 2500 ? 543 : 0);

  let dateStr = `${day} ${monthStr} ${year}`;
  if (includeTime) {
    const timeMatch = str.match(/(\d{2}:\d{2})/);
    if (timeMatch) {
      dateStr += ` ${timeMatch[1]} เธ.`;
    }
  }
  return dateStr;
}

const DAY_NAMES_THAI: Record<string, string> = {
  Monday: 'เธงเธฑเธเธเธฑเธเธ—เธฃเน (Monday)',
  Tuesday: 'เธงเธฑเธเธญเธฑเธเธเธฒเธฃ (Tuesday)',
  Wednesday: 'เธงเธฑเธเธเธธเธ (Wednesday)',
  Thursday: 'เธงเธฑเธเธเธคเธซเธฑเธชเธเธ”เธต (Thursday)',
  Friday: 'เธงเธฑเธเธจเธธเธเธฃเน (Friday)',
  Saturday: 'เธงเธฑเธเน€เธชเธฒเธฃเน (Saturday)',
  Sunday: 'เธงเธฑเธเธญเธฒเธ—เธดเธ•เธขเน (Sunday)',
  Everyday: 'เธ—เธธเธเธงเธฑเธ (Everyday)',
};

function AdminDashboardContent() {
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
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [showCreateParentModal, setShowCreateParentModal] = useState(false);
  const [dismissPendingToast, setDismissPendingToast] = useState(false);

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
  const [editingParent, setEditingParent] = useState<UserProfile | null>(null);
  const [editUserId, setEditUserId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPurchasedHours, setEditPurchasedHours] = useState<number | string>(6);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentRefNo, setEditPaymentRefNo] = useState('');
  const [editPaymentPayerName, setEditPaymentPayerName] = useState('');
  const [editPaymentBank, setEditPaymentBank] = useState('');
  const [editPaymentBankOther, setEditPaymentBankOther] = useState('');
  const [editPaymentDateTime, setEditPaymentDateTime] = useState('');
  const [editPaymentSlipFile, setEditPaymentSlipFile] = useState<string | null>(null);

  // Search State
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  // Top Up / Approve Modal State
  const [topUpChild, setTopUpChild] = useState<Child | null>(null);
  const [courseName, setCourseName] = useState('Orca Cubs');
  const [hoursToAdd, setHoursToAdd] = useState<number | string>('');
  const [topUpNote, setTopUpNote] = useState('');
  const [topUpPaymentAmount, setTopUpPaymentAmount] = useState('');
  const [topUpPaymentRefNo, setTopUpPaymentRefNo] = useState('');
  const [topUpPaymentPayerName, setTopUpPaymentPayerName] = useState('');
  const [topUpPaymentBank, setTopUpPaymentBank] = useState('เธเธชเธดเธเธฃเนเธ—เธข (KBank)');
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

    const remaining = adminBookingChild.total_hours - adminBookingChild.used_hours;
    if (remaining <= 0) {
      showToast('โ ๏ธ เน€เธ”เนเธเธเธเธเธตเนเธเธณเธเธงเธเธเธฑเนเธงเนเธกเธเน€เธฃเธตเธขเธเธซเธกเธ”เนเธฅเนเธง เธเธฃเธธเธ“เธฒเน€เธ•เธดเธกเธเธฑเนเธงเนเธกเธเธเนเธญเธเธ—เธณเธฃเธฒเธขเธเธฒเธฃ');
      return;
    }

    const allBookings = await store.getBookings(undefined, adminBookingDate);
    
    // Check double booking for the specific child
    const childAlreadyBooked = allBookings.some(b => b.child_id === adminBookingChild.id && b.time_slot === adminBookingSlot && b.status !== 'Cancelled');
    if (childAlreadyBooked) {
      showToast('⚠️ เด็กคนนี้ถูกจองในรอบเวลานี้ไปแล้ว ไม่สามารถจองซ้ำได้');
      return;
    }
    const quotas = await store.getSlotQuotas();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const adminDayName = dayNames[new Date(adminBookingDate).getDay()];
    const courseKeyName = adminBookingChild.course_name || 'Orca Cubs';

    const maxQuota =
      quotas[`${adminBookingDate}_${courseKeyName}_${adminBookingSlot}`] ??
      quotas[`${adminDayName}_${courseKeyName}_${adminBookingSlot}`] ??
      quotas[`${adminDayName}_${adminBookingSlot}`] ??
      quotas[`Everyday_${courseKeyName}_${adminBookingSlot}`] ??
      quotas[`Everyday_${adminBookingSlot}`] ??
      quotas[`${courseKeyName}_${adminBookingSlot}`] ??
      quotas[`${adminBookingDate}_${adminBookingSlot}`] ??
      10;
    const currentBooked = allBookings.filter(b => b.time_slot === adminBookingSlot && b.status !== 'Cancelled').length;

    if (currentBooked >= maxQuota) {
      showToast(`๐”’ เธฃเธญเธเน€เธงเธฅเธฒ ${adminBookingSlot} เนเธเธงเธฑเธเธ—เธตเน ${adminBookingDate} เธ—เธตเนเธเธฑเนเธเน€เธ•เนเธกเนเธฅเนเธง (${currentBooked}/${maxQuota})`);
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
      admin_name: user?.name || 'เนเธญเธ”เธกเธดเธ Orca',
      child_id: adminBookingChild.id,
      child_name: `${adminBookingChild.full_name} (${adminBookingChild.nickname})`,
      hours_added: 0,
      course_name: adminBookingChild.course_name,
      note: `Admin เธเธญเธเน€เธฃเธตเธขเธเธฃเธญเธ ${adminBookingDate} (${adminBookingSlot}) เนเธ—เธเธเธนเนเธเธเธเธฃเธญเธ`
    };
    await store.saveAuditLog(newLog);

    showToast(`โ… Admin เธเธญเธเธเธฅเธฒเธชเนเธซเน ${adminBookingChild.nickname} เธงเธฑเธเธ—เธตเน ${adminBookingDate} (${adminBookingSlot}) เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
    setAdminBookingChild(null);

    const cList = await store.getChildren();
    setChildren(cList);
    const logs = await store.getAuditLogs();
    setAuditLogs(logs);
  };



  const isChildOfParent = (c: Child, p: any) => {
    if (!c || !p) return false;

    const cPId = c.parent_id ? String(c.parent_id).toLowerCase().trim() : '';
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
      const user = store.getCurrentUser();
      if (!user || user.role !== 'admin') {
        showToast('เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเนเธญเธ”เธกเธดเธเธเนเธญเธเนเธเนเธเธฒเธ');
        router.push('/admin/login');
        return;
      }

      const [uList, cList, logs, b, bAll, q] = await Promise.all([
        store.getUsers(),
        store.getChildren(),
        store.getAuditLogs(),
        store.getBookings(undefined, selectedDate),
        store.getBookings(),
        store.getSlotQuotas()
      ]);

      const parentUsers = uList.filter(u => u.role !== 'admin');
      setParents(parentUsers);
      setChildren(cList);
      setAuditLogs(logs);
      setDayBookings(b);
      setAllBookings(bAll);
      setQuotas(q);
    }
    loadData();

    // Auto refresh data in real time via storage events, custom event, broadcast channel
    const handleStoreUpdate = () => loadData();
    window.addEventListener('storage', handleStoreUpdate);
    window.addEventListener('orca_store_updated', handleStoreUpdate);

    let syncChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      syncChannel = new BroadcastChannel('orca_store_channel');
      syncChannel.onmessage = () => loadData();
    }

    // Increased polling interval to 30s to prevent render thrashing
    const interval = setInterval(loadData, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStoreUpdate);
      window.removeEventListener('orca_store_updated', handleStoreUpdate);
      if (syncChannel) syncChannel.close();
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

  const handleSendEmailToParent = (p: any) => {
    const parentEmail = p.email || `${p.user_id}@orcagym.com`;
    const parentName = p.name;
    const parentChildren = children.filter(c => isChildOfParent(c, p));
    const lowHoursInfo = parentChildren
      .filter(c => c.status === 'approved' && (c.total_hours - c.used_hours) <= 2)
      .map(c => `${c.nickname} (เน€เธซเธฅเธทเธญ ${c.total_hours - c.used_hours} เธเธก.)`)
      .join(', ');

    if (lowHoursInfo) {
      showToast(`๐“ง เธชเนเธเธญเธตเน€เธกเธฅเนเธเนเธเน€เธ•เธทเธญเธเธเธญเธฃเนเธชเนเธเธฅเนเธซเธกเธ”เนเธเธขเธฑเธเธเธธเธ“ ${parentName} (${parentEmail}) [${lowHoursInfo}] เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง!`);
    } else {
      showToast(`๐“ง เธชเนเธเธญเธตเน€เธกเธฅเนเธเนเธเน€เธ•เธทเธญเธ/เธ•เธดเธ”เธ•เนเธญเธเธนเนเธเธเธเธฃเธญเธเธเธธเธ“ ${parentName} (${parentEmail}) เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง!`);
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
      admin_name: user?.name || 'เนเธญเธ”เธกเธดเธ Orca',
      child_id: child.id,
      child_name: `${child.full_name} (${child.nickname})`,
      hours_added: 0,
      course_name: child.course_name,
      note: 'เธญเธเธธเธกเธฑเธ•เธดเธเธญเธฃเนเธชเน€เธฃเธตเธขเธเน€เธฃเธตเธขเธเธฃเนเธญเธข'
    };
    await store.saveAuditLog(newLog);

    showToast(`โ… เธญเธเธธเธกเธฑเธ•เธดเธเธญเธฃเนเธชเน€เธฃเธตเธขเธ ${child.course_name} เนเธซเน ${child.nickname} เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
    const cList = await store.getChildren();
    setChildren(cList);
  };

  const handleApproveAllPending = async () => {
    const pendingList = children.filter(c => c.status === 'pending');
    if (pendingList.length === 0) return;
    for (const c of pendingList) {
      await store.updateChild(c.id, { status: 'approved' });
    }
    showToast(`โ… เธญเธเธธเธกเธฑเธ•เธดเธเธญเธฃเนเธชเน€เธฃเธตเธขเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธ—เธฑเนเธเธซเธกเธ” ${pendingList.length} เธฃเธฒเธขเธเธฒเธฃ`);
    const cList = await store.getChildren();
    setChildren(cList);
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (confirm(`เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธฃเธฒเธขเธเธทเนเธญเธเธฑเธเน€เธฃเธตเธขเธ "${childName}" เธญเธญเธเธเธฒเธเธฃเธฐเธเธเนเธเนเธซเธฃเธทเธญเนเธกเน?`)) {
      await store.deleteChild(childId);
      showToast(`๐—‘๏ธ เธฅเธเธฃเธฒเธขเธเธทเนเธญเธเธฑเธเน€เธฃเธตเธขเธ ${childName} เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
      const cList = await store.getChildren();
      setChildren(cList);
    }
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName || !newParentEmail) {
      showToast('เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเนเธฅเธฐเธญเธตเน€เธกเธฅเธเธนเนเธเธเธเธฃเธญเธ');
      return;
    }
    if (!hoursToAdd) {
      showToast('เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธเธณเธเธงเธเนเธเธงเธ•เนเธฒ/เธเธฅเธฒเธชเธ—เธตเนเธเธทเนเธญ');
      return;
    }

    const autoUsername = getAutoUsername(newParentEmail);
    const autoPassword = newParentPassword.trim() || getAutoPassword(newParentEmail, newParentPhone);

    const selectedBank = paymentBank === 'เธญเธทเนเธเน (เธฃเธฐเธเธธ)' ? (paymentBankOther ? `เธญเธทเนเธเน (${paymentBankOther})` : 'เธญเธทเนเธเน') : paymentBank;

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

    // Format Line Message Template with Payment Proof
    let paymentInfoText = '';
    if (paymentAmount || selectedBank || paymentRefNo || paymentDateTime || paymentPayerName) {
      paymentInfoText = `\n๐’ณ เธซเธฅเธฑเธเธเธฒเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ:\n` +
        (paymentAmount ? `โ€ข เธเธณเธเธงเธเน€เธเธดเธ: ${Number(paymentAmount).toLocaleString()} เธเธฒเธ—\n` : '') +
        (selectedBank ? `โ€ข เธเธเธฒเธเธฒเธฃ: ${selectedBank}\n` : '') +
        (paymentPayerName ? `โ€ข เธเธทเนเธญเธเธนเนเนเธญเธ: ${paymentPayerName}\n` : '') +
        (paymentDateTime ? `โ€ข เธงเธฑเธ-เน€เธงเธฅเธฒเนเธญเธ: ${paymentDateTime.replace('T', ' ')} เธ.\n` : '') +
        (paymentRefNo ? `โ€ข เน€เธฅเธเธญเนเธฒเธเธญเธดเธเธชเธฅเธดเธ: ${paymentRefNo}\n` : '');
    }

    const msg = `๐ณ เธเธฑเธเธเธตเนเธเนเธเธฒเธเธฃเธฐเธเธ ORCA GYMNASTICS\n---------------------------------\nUsername: ${autoUsername}\nPassword: ${autoPassword}\nเธเธนเนเธเธเธเธฃเธญเธ: ${newParent.name}\nเธเธฅเธฒเธช & เนเธเธงเธ•เนเธฒเธ—เธตเนเธเธทเนเธญ:\nโ€ข ${courseName}: ${hoursToAdd} เธเธฃเธฑเนเธ${paymentInfoText}---------------------------------\nเธเธฃเธธเธ“เธฒเธเธณ Username เนเธฅเธฐ Password\nเนเธเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเน€เธเธทเนเธญเธฅเธเธ—เธฐเน€เธเธตเธขเธเธเนเธญเธกเธนเธฅเธเธธเธ•เธฃเธซเธฅเธฒเธ (Add Family Member)`;

    setCopyMessage(msg);
    showToast(`เธชเธฃเนเธฒเธเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธ ${newParent.name} เธชเธณเน€เธฃเนเธ (Username: ${autoUsername})`);
    
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
    if (confirm(`เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธ ${name} เนเธเนเธซเธฃเธทเธญเนเธกเน?`)) {
      await store.deleteUser(id);
      showToast(`เธฅเธเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธ ${name} เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
      const uList = await store.getUsers();
      setParents(uList.filter(u => u.role !== 'admin'));
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
    setEditPaymentAmount(p.payment_amount ? String(p.payment_amount) : '');
    setEditPaymentRefNo(p.payment_ref_no || '');
    setEditPaymentPayerName(p.payment_payer_name || '');
    const bank = p.payment_bank || 'เธเธชเธดเธเธฃเนเธ—เธข (KBank)';
    if (['เธเธชเธดเธเธฃเนเธ—เธข (KBank)', 'เนเธ—เธขเธเธฒเธ“เธดเธเธขเน (SCB)', 'เธเธฃเธธเธเน€เธ—เธ (BBL)', 'เธเธฃเธธเธเนเธ—เธข (KTB)', 'เธเธฃเธธเธเธจเธฃเธตเธญเธขเธธเธเธขเธฒ (BAY)', 'เธญเธญเธกเธชเธดเธ (GSB)', 'เธ—เธซเธฒเธฃเนเธ—เธขเธเธเธเธฒเธ• (ttb)'].includes(bank)) {
      setEditPaymentBank(bank);
      setEditPaymentBankOther('');
    } else {
      setEditPaymentBank('เธญเธทเนเธเน (เธฃเธฐเธเธธ)');
      setEditPaymentBankOther(bank.replace(/^เธญเธทเนเธเน\s*\(/, '').replace(/\)$/, ''));
    }
    setEditPaymentDateTime(p.payment_datetime || '');
    setEditPaymentSlipFile(p.payment_slip || null);
  };

  const handleSaveEditParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    if (!editName || !editEmail || !editUserId) {
      showToast('เธเธฃเธธเธ“เธฒเธเธฃเธญเธ Username, เธเธทเนเธญ เนเธฅเธฐเธญเธตเน€เธกเธฅเธเธนเนเธเธเธเธฃเธญเธ');
      return;
    }

    const selectedBank = editPaymentBank === 'เธญเธทเนเธเน (เธฃเธฐเธเธธ)' ? (editPaymentBankOther ? `เธญเธทเนเธเน (${editPaymentBankOther})` : 'เธญเธทเนเธเน') : editPaymentBank;

    const currentHistory: PaymentProofRecord[] = editingParent.payment_history ? [...editingParent.payment_history] : [];
    
    // Seed initial payment proof into history if missing
    if (currentHistory.length === 0 && (editingParent.payment_amount || editingParent.payment_slip || editingParent.payment_ref_no)) {
      currentHistory.push({
        id: 'pay_init_' + editingParent.id,
        payment_amount: editingParent.payment_amount,
        payment_ref_no: editingParent.payment_ref_no,
        payment_payer_name: editingParent.payment_payer_name,
        payment_bank: editingParent.payment_bank,
        payment_datetime: editingParent.payment_datetime,
        payment_slip: editingParent.payment_slip,
        purchased_hours: editingParent.purchased_hours || 6,
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
          created_at: new Date().toISOString(),
        });
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
    showToast(`เธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅเธเธนเนเธเธเธเธฃเธญเธ ${updatedParent.name} เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
    setEditingParent(null);

    const uList = await store.getUsers();
    setParents(uList.filter(u => u.role !== 'admin'));
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpChild) return;
    if (!hoursToAdd) {
      showToast('เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธเธณเธเธงเธเนเธเธงเธ•เนเธฒ/เธเธฅเธฒเธชเธ—เธตเนเธเธทเนเธญ');
      return;
    }

    const user = store.getCurrentUser();
    const newTotal = topUpChild.total_hours + Number(hoursToAdd);
    const expiryDate = (() => {
      let months = 2;
      if (newTotal === 12) months = 4;
      else if (newTotal === 24) months = 6;
      else if (newTotal >= 48) months = 12;
      const validD = new Date();
      validD.setMonth(validD.getMonth() + months);
      return `${String(validD.getDate()).padStart(2, '0')}/${String(validD.getMonth() + 1).padStart(2, '0')}/${validD.getFullYear()}`;
    })();

    await store.updateChild(topUpChild.id, {
      status: 'approved',
      course_name: courseName,
      total_hours: newTotal,
      expiry_date: expiryDate
    });

    const selectedBank = topUpPaymentBank === 'เธญเธทเนเธเน (เธฃเธฐเธเธธ)' ? (topUpPaymentBankOther ? `เธญเธทเนเธเน (${topUpPaymentBankOther})` : 'เธญเธทเนเธเน') : topUpPaymentBank;
    
    // Find parent user and append payment proof record
    const parentUser = parents.find(p => isChildOfParent(topUpChild, p) || p.id === topUpChild.parent_id);
    if (parentUser) {
      const currentHistory: PaymentProofRecord[] = parentUser.payment_history ? [...parentUser.payment_history] : [];
      if (currentHistory.length === 0 && (parentUser.payment_amount || parentUser.payment_slip || parentUser.payment_ref_no)) {
        currentHistory.push({
          id: 'pay_init_' + parentUser.id,
          payment_amount: parentUser.payment_amount,
          payment_ref_no: parentUser.payment_ref_no,
          payment_payer_name: parentUser.payment_payer_name,
          payment_bank: parentUser.payment_bank,
          payment_datetime: parentUser.payment_datetime,
          payment_slip: parentUser.payment_slip,
          purchased_hours: parentUser.purchased_hours || 6,
          created_at: parentUser.payment_datetime || parentUser.created_at || new Date().toISOString(),
        });
      }

      const hasTopUpPayment = Boolean(topUpPaymentAmount || topUpPaymentSlipFile || topUpPaymentRefNo || topUpPaymentPayerName || topUpPaymentDateTime);
      if (hasTopUpPayment) {
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
          note: topUpNote || `เธเธทเนเธญเธเธญเธฃเนเธชเน€เธเธดเนเธก ${courseName} ${hoursToAdd} เธเธฃเธฑเนเธ`,
          created_at: new Date().toISOString(),
        });
      }

      await store.saveUser({
        ...parentUser,
        purchased_hours: (parentUser.purchased_hours || 6) + Number(hoursToAdd),
        payment_amount: topUpPaymentAmount ? Number(topUpPaymentAmount) : parentUser.payment_amount,
        payment_ref_no: topUpPaymentRefNo.trim() || parentUser.payment_ref_no,
        payment_payer_name: topUpPaymentPayerName.trim() || parentUser.payment_payer_name,
        payment_bank: selectedBank || parentUser.payment_bank,
        payment_datetime: topUpPaymentDateTime || parentUser.payment_datetime,
        payment_slip: topUpPaymentSlipFile || parentUser.payment_slip,
        payment_history: currentHistory,
      });
    }

    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: user?.name || 'เนเธญเธ”เธกเธดเธ Orca',
      child_id: topUpChild.id,
      child_name: `${topUpChild.full_name} (${topUpChild.nickname})`,
      hours_added: Number(hoursToAdd),
      course_name: courseName,
      amount: topUpPaymentAmount ? Number(topUpPaymentAmount) : undefined,
      slip_ref: topUpPaymentRefNo.trim() || undefined,
      slip_url: topUpPaymentSlipFile || undefined,
      bank_name: selectedBank || undefined,
      payer_name: topUpPaymentPayerName.trim() || undefined,
      note: topUpNote || `เธเธณเธฃเธฐเธเนเธฒเธเธญเธฃเนเธชเน€เธฃเธตเธขเธเน€เธฃเธตเธขเธเธฃเนเธญเธข (+${hoursToAdd} เธเธฃเธฑเนเธ)`
    };
    await store.saveAuditLog(newLog);

    showToast(`เธญเธเธธเธกเธฑเธ•เธดเนเธฅเธฐเน€เธ•เธดเธก ${hoursToAdd} เธเธก. เนเธซเน ${topUpChild.nickname} เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
    setTopUpChild(null);
    setTopUpNote('');
    setTopUpPaymentAmount('');
    setTopUpPaymentRefNo('');
    setTopUpPaymentPayerName('');
    setTopUpPaymentBank('เธเธชเธดเธเธฃเนเธ—เธข (KBank)');
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
    showToast(`โ… เธเธฑเธเธ—เธถเธ Quota เธเธฅเธฒเธช [${quotaCourse}] เธฃเธญเธเน€เธงเธฅเธฒ ${quotaSlot} = ${quotaNumber} เธเธ เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
    const q = await store.getSlotQuotas();
    setQuotas(q);
  };

  const handleResetAuditLogsInAdmin = async () => {
    if (confirm('เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฃเธตเน€เธเนเธ•เนเธฅเธฐเน€เธเธฅเธตเธขเธฃเนเธเธฃเธฐเธงเธฑเธ•เธด Audit เธ—เธฑเนเธเธซเธกเธ” เนเธซเนเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเนเธญเธกเธนเธฅเธเธนเนเธเธเธเธฃเธญเธเธเธฑเธเธเธธเธเธฑเธเนเธเนเธซเธฃเธทเธญเนเธกเน?')) {
      const freshLogs = await store.resetAuditLogsToCurrent();
      setAuditLogs(freshLogs);
      showToast('โ… เน€เธเธฅเธตเธขเธฃเนเธเธฃเธฐเธงเธฑเธ•เธด Audit เนเธซเนเน€เธซเธฅเธทเธญเธเนเธญเธกเธนเธฅเธเธฑเธเธเธธเธเธฑเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง');
    }
  };

  const totalHoursToday = auditLogs.reduce((acc, log) => acc + log.hours_added, 0);

  // --- Admin Home Overview Dashboard Metrics ---
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // 1. เธชเธฃเธธเธเธขเธญเธ”เธฃเธฒเธขเนเธ”เน (Revenue Summary)
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

  // 2. เธชเธ–เธดเธ•เธดเธเธณเธเธงเธเธชเธกเธฒเธเธดเธ (Member Statistics)
  const totalStudentsCount = children.length;
  const totalParentsCount = parents.length;
  const newMembersThisMonth = children.filter(c => !c.created_at || c.created_at.startsWith(currentMonthStr)).length;
  const expiringStudentsList = children.filter(c => {
    const remaining = c.total_hours - c.used_hours;
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

  // 3. เธญเธฑเธ•เธฃเธฒเธเธฒเธฃเธเธญเธ Class เธ—เธตเนเธเธดเธขเธก & เธเนเธงเธเน€เธงเธฅเธฒเธ—เธตเนเธเธดเธขเธกเธกเธฒเธเธ—เธตเนเธชเธธเธ” (Class & Slot Popularity)
  const activeBookings = allBookings.filter(b => b.status !== 'Cancelled');
  const cubsBookingsCount = activeBookings.filter(b => b.course_name?.toLowerCase().includes('cubs') || !b.course_name?.toLowerCase().includes('mega')).length;
  const megaBookingsCount = activeBookings.filter(b => b.course_name?.toLowerCase().includes('mega')).length;
  const totalActiveBookings = activeBookings.length || 1;
  const cubsPercent = Math.round((cubsBookingsCount / totalActiveBookings) * 100);
  const megaPercent = Math.round((megaBookingsCount / totalActiveBookings) * 100);

  // Group by time slot
  const slotCountMap: Record<string, number> = {};
  activeBookings.forEach(b => {
    const slot = b.time_slot || '10:30-12:00';
    slotCountMap[slot] = (slotCountMap[slot] || 0) + 1;
  });
  const sortedPopularSlots = Object.entries(slotCountMap).sort((a, b) => b[1] - a[1]);
  const maxSlotCount = Math.max(...Object.values(slotCountMap), 1);

  // โณ 4. เธฃเธฒเธขเธเธทเนเธญเธเธนเนเธเธเธเธฃเธญเธเธ—เธตเนเนเธเนเธเน€เธเธเน€เธฃเธตเธขเธเนเธเธฅเนเธเธฃเธเธเธณเธซเธเธ” (เธ เธฒเธขเนเธ 5 เธงเธฑเธ เธซเธฃเธทเธญ เธซเธกเธ”เธญเธฒเธขเธธเนเธฅเนเธง เนเธฅเธฐเธขเธฑเธเธเธญเธเธเธฅเธฒเธชเน€เธฃเธตเธขเธเนเธกเนเธเธฃเธ)
  const expiringParentsList = parents.map(p => {
    const pkgStartDateStr = p.payment_datetime || p.created_at || '';
    const pkgStartDate = pkgStartDateStr ? new Date(pkgStartDateStr.includes('T') ? pkgStartDateStr : pkgStartDateStr.replace(' ', 'T')) : new Date();
    const validPkgStartDate = isNaN(pkgStartDate.getTime()) ? new Date() : pkgStartDate;
    
    const hoursNum = p.purchased_hours || 6;
    let months = 2;
    if (hoursNum === 12) months = 4;
    else if (hoursNum === 24) months = 6;
    else if (hoursNum === 48) months = 12;

    const expiryDate = new Date(validPkgStartDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDay = new Date(expiryDate);
    expDay.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((expDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dayStr = String(expiryDate.getDate()).padStart(2, '0');
    const monthStr = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const yearStr = expiryDate.getFullYear() + 543;
    const formattedExpiryDate = `${dayStr}/${monthStr}/${yearStr}`;

    const pChildren = children.filter(c => isChildOfParent(c, p));
    const pChildIds = pChildren.map(c => c.id);
    const pBookingsCount = allBookings.filter(b => b.status !== 'Cancelled' && (pChildIds.includes(b.child_id) || b.child_id === p.id || b.child_id === p.user_id)).length;
    const unbookedCount = Math.max(0, hoursNum - pBookingsCount);

    return {
      parent: p,
      daysLeft,
      months,
      hoursNum,
      unbookedCount,
      formattedExpiryDate,
      isExpiringSoon: daysLeft <= 5 && unbookedCount > 0,
    };
  }).filter(item => item.isExpiringSoon);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full pb-24 font-['Anuphan',sans-serif]">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001a3a] mb-1">
            {activeTab === 'parents' || activeTab === 'members'
              ? 'เธเธฑเธ”เธเธฒเธฃเธชเธกเธฒเธเธดเธ (Member Management)'
              : activeTab === 'schedule'
              ? 'เธ•เธฒเธฃเธฒเธเน€เธฃเธตเธขเธ (Schedule Matrix)'
              : activeTab === 'audit'
              ? 'เธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธ—เธณเธเธฒเธ (Audit Log)'
              : 'เธ เธฒเธเธฃเธงเธกเธฃเธฐเธเธ (Admin Overview)'}
          </h1>
          <p className="text-sm font-normal text-slate-500">
            {activeTab === 'parents' || activeTab === 'members'
              ? 'เธเธฑเธ”เธเธฒเธฃเธเนเธญเธกเธนเธฅเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธเนเธฅเธฐเธเนเธญเธกเธนเธฅเธเธฑเธเน€เธฃเธตเธขเธ'
              : activeTab === 'schedule'
              ? 'เธ•เธฃเธงเธเธชเธญเธเนเธฅเธฐเธเธฑเธ”เธ•เธฒเธฃเธฒเธเน€เธฃเธตเธขเธเธฃเธฒเธขเธชเธฑเธเธ”เธฒเธซเน'
              : activeTab === 'audit'
              ? 'เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธ—เธณเธฃเธฒเธขเธเธฒเธฃเนเธฅเธฐเธเธฒเธฃเนเธเนเนเธเธเนเธญเธกเธนเธฅเนเธเธฃเธฐเธเธ'
              : 'เธขเธดเธเธ”เธตเธ•เนเธญเธเธฃเธฑเธเธชเธนเนเธฃเธฐเธเธเธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ ORCA GYM'}
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
              <span>เธชเธฃเนเธฒเธเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธเนเธซเธกเน (Create Parent Account)</span>
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
              <span>๐“</span>
              <span>1. เธ เธฒเธเธฃเธงเธกเธเธญเธเธฃเธฐเธเธ (Overview)</span>
            </button>

            <button
              onClick={() => setActiveTab('quota')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'quota'
                  ? 'bg-[#001a3a] text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>โ๏ธ</span>
              <span>2. เธ•เธฑเนเธเธเนเธฒเนเธเธงเธ•เนเธฒ (Quota Config)</span>
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
              <span>๐‘ฅ</span>
              <span>1. เธเนเธญเธกเธนเธฅเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธ (Parents)</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'members'
                  ? 'bg-[#001a3a] text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>๐ง’</span>
              <span>2. เธเนเธญเธกเธนเธฅเธเธฑเธเน€เธฃเธตเธขเธ (Students)</span>
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
                  <span className="text-2xl">โฐ</span>
                  <h3 className="text-base sm:text-lg font-black text-amber-950">
                    เนเธเนเธเน€เธ•เธทเธญเธ: เธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธเนเธเธฅเนเธเธฃเธเธเธณเธซเธเธ”เธฃเธฐเธขเธฐเน€เธงเธฅเธฒเนเธเนเธเน€เธเธ (เนเธเนเธเน€เธ•เธทเธญเธเธฅเนเธงเธเธซเธเนเธฒ 5 เธงเธฑเธ)
                  </h3>
                </div>
                <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-2xs">
                  {expiringParentsList.length} เธเธฑเธเธเธต
                </span>
              </div>
              <p className="text-xs text-amber-900 font-medium">
                เธเธเธเธนเนเธเธเธเธฃเธญเธเธเธณเธเธงเธ {expiringParentsList.length} เธเธฑเธเธเธต เธ—เธตเนเนเธเนเธเน€เธเธเธเธฐเธเธฃเธเธเธณเธซเธเธ”เธฃเธฐเธขเธฐเน€เธงเธฅเธฒเน€เธฃเธตเธขเธ (เนเธเนเธเน€เธ•เธทเธญเธเธฅเนเธงเธเธซเธเนเธฒ 5 เธงเธฑเธเธเนเธญเธเธงเธฑเธเธเธฃเธเธเธณเธซเธเธ”):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {expiringParentsList.map(({ parent: p, daysLeft, months, hoursNum, formattedExpiryDate }) => (
                  <div key={p.id} className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-[#001a3a] text-xs sm:text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        ๐“ {p.phone} | เนเธเธงเธ•เนเธฒ: <strong>{hoursNum} เธเธฃเธฑเนเธ ({months} เน€เธ”เธทเธญเธ)</strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-rose-700 font-black text-xs">
                        {daysLeft <= 0 ? 'เธเธฃเธเธเธณเธซเธเธ”เนเธฅเนเธง' : `เน€เธซเธฅเธทเธญเธญเธตเธ ${daysLeft} เธงเธฑเธ`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        เธงเธฑเธเธซเธกเธ”เธญเธฒเธขเธธ: {formattedExpiryDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* SECTION 1: เธชเธฃเธธเธเธขเธญเธ”เธฃเธฒเธขเนเธ”เน (Revenue Summary) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>๐’ฐ</span>
                <span>เธชเธฃเธธเธเธขเธญเธ”เธฃเธฒเธขเนเธ”เน (Revenue Summary)</span>
              </h2>
              <span className="text-xs text-slate-500 font-normal">เธญเธฑเธเน€เธ”เธ•เน€เธฃเธตเธขเธฅเนเธ—เธกเน</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Today's Revenue */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">เธฃเธฒเธขเธฃเธฑเธเธฃเธงเธกเนเธเธงเธฑเธเธเธตเน</span>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">เธงเธฑเธเธเธตเน</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 mb-1">
                    เธฟ{displayRevenueToday.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    เธขเธญเธ”เธฃเธงเธกเธเธณเธฃเธฐเธเธฒเธเธเธนเนเธเธเธเธฃเธญเธเนเธฅเธฐเธฃเธฒเธขเธเธฒเธฃเน€เธ•เธดเธกเธเธฑเนเธงเนเธกเธเธเธฃเธฐเธเธณเธงเธฑเธ
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-normal">
                  ๐“… {selectedDate}
                </div>
              </div>

              {/* Month's Revenue */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">เธฃเธฒเธขเธฃเธฑเธเธฃเธงเธกเนเธเน€เธ”เธทเธญเธเธเธตเน</span>
                    <span className="text-xs font-extrabold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full">เน€เธ”เธทเธญเธเธเธตเน</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#001a3a] mb-1">
                    เธฟ{displayRevenueMonth.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    เธขเธญเธ”เธฃเธฑเธเธเธณเธฃเธฐเธ—เธฑเนเธเธซเธกเธ”เนเธเธฃเธญเธเน€เธ”เธทเธญเธเธเธฑเธเธเธธเธเธฑเธ
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-normal">
                  ๐“ เน€เธ”เธทเธญเธเธเธฑเธเธเธธเธเธฑเธ ({currentMonthStr})
                </div>
              </div>

              {/* Pending / Outstanding Payments */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">เธขเธญเธ”เธเนเธฒเธเธเธณเธฃเธฐ / เธ•เนเธญเธเธ•เธดเธ”เธ•เธฒเธก</span>
                    <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full animate-pulse">
                      {pendingPaymentsCount} เธฃเธฒเธขเธเธฒเธฃ
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-700 mb-1">
                    เธฟ{pendingPaymentsAmount.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    เธขเธญเธ”เธฃเธงเธกเธเธญเธฃเนเธชเธ—เธตเนเธฃเธญเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเธชเธฅเธดเธเนเธฅเธฐเธญเธเธธเธกเธฑเธ•เธดเธเธณเธฃเธฐ
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-amber-800 font-bold">เธฃเธญเธเธฒเธฃเธ•เธดเธ”เธ•เนเธญเธเธฅเธฑเธ</span>
                  <button
                    onClick={() => setActiveTab('parents')}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    เธ•เธฃเธงเธเธชเธญเธเธเธนเนเธเธเธเธฃเธญเธ โ’
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: เธชเธ–เธดเธ•เธดเธเธณเธเธงเธเธเธฑเธเน€เธฃเธตเธขเธ (Student Statistics) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>๐‘ฅ</span>
                <span>เธชเธ–เธดเธ•เธดเธเธณเธเธงเธเธเธฑเธเน€เธฃเธตเธขเธ (Student Statistics)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Members */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">
                  ๐‘จโ€๐‘ฉโ€๐‘งโ€๐‘ฆ
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">เธเธณเธเธงเธเธเธฑเธเน€เธฃเธตเธขเธเธ—เธฑเนเธเธซเธกเธ”</div>
                  <div className="text-2xl font-black text-[#001a3a] mt-0.5">
                    {totalStudentsCount} <span className="text-sm font-bold text-slate-500">เธเธ</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    เน€เธ”เนเธ {totalStudentsCount} เธเธ (เธเธฒเธเธเธนเนเธเธเธเธฃเธญเธ {totalParentsCount} เธเธฑเธเธเธต)
                  </div>
                </div>
              </div>

              {/* New Registrations This Month */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0">
                  โจ
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">เธเธฑเธเน€เธฃเธตเธขเธเนเธซเธกเนเน€เธ”เธทเธญเธเธเธตเน</div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    +{newMembersThisMonth} <span className="text-sm font-bold text-slate-500">เธเธ</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    เธเธฑเธเน€เธฃเธตเธขเธเธฅเธเธ—เธฐเน€เธเธตเธขเธเนเธซเธกเนเนเธเน€เธ”เธทเธญเธเธเธตเน
                  </div>
                </div>
              </div>

              {/* Expiring / Soon-to-expire Members */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl shrink-0">
                  โ ๏ธ
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">เธเธฑเธเน€เธฃเธตเธขเธเธ—เธตเนเธเธณเธฅเธฑเธเธเธฐเธซเธกเธ”เธญเธฒเธขเธธ</div>
                  <div className="text-2xl font-black text-rose-600 mt-0.5">
                    {expiringMembersCount} <span className="text-sm font-bold text-slate-500">เธเธ</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    เธเธญเธฃเนเธชเธเธเน€เธซเธฅเธทเธญ ≤ 2 เธเธก. (เธ•เนเธญเธเธเธฒเธฃเธเธฒเธฃเนเธเนเธเน€เธ•เธทเธญเธ)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: เธญเธฑเธ•เธฃเธฒเธเธฒเธฃเธเธญเธ Class เธ—เธตเนเธเธดเธขเธก & เธเนเธงเธเน€เธงเธฅเธฒเธ—เธตเนเธเธดเธขเธกเธกเธฒเธเธ—เธตเนเธชเธธเธ” */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>๐“</span>
                <span>เธญเธฑเธ•เธฃเธฒเธเธฒเธฃเธเธญเธ Class & เธเนเธงเธเน€เธงเธฅเธฒเธ—เธตเนเธเธดเธขเธกเธกเธฒเธเธ—เธตเนเธชเธธเธ”</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Popularity Ratio */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#001a3a] mb-1 flex items-center gap-2">
                    <span>๐</span>
                    <span>เธเธงเธฒเธกเธเธดเธขเธกเธ•เธฒเธกเธเธฃเธฐเน€เธ เธ— Course (Class Popularity)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mb-4">
                    เธชเธฑเธ”เธชเนเธงเธเธเธณเธเธงเธเธเธฃเธฑเนเธเธ—เธตเนเธเธฑเธเน€เธฃเธตเธขเธเธเธญเธเน€เธเนเธฒเน€เธฃเธตเธขเธเนเธเนเธ•เนเธฅเธฐเธเธฃเธฐเน€เธ เธ—เธเธฅเธฒเธช
                  </p>

                  <div className="space-y-4">
                    {/* Orca Cubs */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-[#001a3a] mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
                          <span>Orca Cubs (เธญเธฒเธขเธธ 4-10 เธเธต)</span>
                        </span>
                        <span className="font-extrabold text-sky-700">{cubsBookingsCount} เธเธฃเธฑเนเธ ({cubsPercent}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${cubsPercent}%` }}></div>
                      </div>
                    </div>

                    {/* Mega Orca */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-[#001a3a] mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                          <span>Mega Orca (เธญเธฒเธขเธธ 5-15 เธเธต)</span>
                        </span>
                        <span className="font-extrabold text-indigo-700">{megaBookingsCount} เธเธฃเธฑเนเธ ({megaPercent}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${megaPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-normal">
                  <span>เธฃเธงเธกเธขเธญเธ”เธเธญเธเธเธฅเธฒเธชเน€เธฃเธตเธขเธเธ—เธฑเนเธเธซเธกเธ”:</span>
                  <strong className="text-[#001a3a] font-black">{activeBookings.length} เธเธฃเธฑเนเธ</strong>
                </div>
              </div>

              {/* Popular Time Slots Ranking */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="text-base font-extrabold text-[#001a3a] flex items-center gap-2">
                  <span>โฐ</span>
                  <span>เธญเธฑเธเธ”เธฑเธเธเนเธงเธเน€เธงเธฅเธฒเน€เธฃเธตเธขเธเธ—เธตเนเธเธดเธขเธกเธกเธฒเธเธ—เธตเนเธชเธธเธ” (Top Time Slots)</span>
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  เธฃเธญเธเน€เธงเธฅเธฒเธ—เธตเนเธกเธตเธเธณเธเธงเธเธเธฒเธฃเธเธญเธเธเธฅเธฒเธชเน€เธฃเธตเธขเธเธชเธฐเธชเธกเธชเธนเธเธชเธธเธ”
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
                    const medalIcons = ['๐ฅ เธญเธฑเธเธ”เธฑเธ 1', '๐ฅ เธญเธฑเธเธ”เธฑเธ 2', '๐ฅ เธญเธฑเธเธ”เธฑเธ 3', '๐… เธญเธฑเธเธ”เธฑเธ 4'];
                    return (
                      <div key={slot} className={`p-3 rounded-2xl border ${rankColors[idx] || rankColors[2]} transition-all`}>
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold px-2 py-0.5 bg-white/80 rounded-md shadow-2xs">
                              {medalIcons[idx] || `#${idx + 1}`}
                            </span>
                            <span>{slot} เธ.</span>
                          </div>
                          <span>{count} เธเธฒเธฃเธเธญเธ</span>
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

          {/* SECTION 4: เนเธเนเธเน€เธ•เธทเธญเธ (Alerts) เธชเธกเธฒเธเธดเธเธ—เธตเนเธเธทเนเธญ Course เนเธเธฅเนเธซเธกเธ” */}
          <div id="course-alerts-section">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001a3a] flex items-center gap-2">
                <span>๐””</span>
                <span>เนเธเนเธเน€เธ•เธทเธญเธ (Alerts) เธชเธกเธฒเธเธดเธเธ—เธตเนเธเธทเนเธญ Course เนเธเธฅเนเธซเธกเธ”</span>
              </h2>
              <span className="text-xs font-extrabold bg-rose-100 text-rose-800 px-3 py-1 rounded-full">
                {expiringMembersCount} เธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธ•เนเธญเธเธ•เธดเธ”เธ•เธฒเธก
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              {expiringStudentsList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-normal">
                  โ… เนเธกเนเธกเธตเธชเธกเธฒเธเธดเธเธ—เธตเนเธเธฑเนเธงเนเธกเธเน€เธฃเธตเธขเธเนเธเธฅเนเธซเธกเธ”เนเธเธเธ“เธฐเธเธตเน
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
                              {child.gender === 'Girl' ? '๐‘ง' : '๐‘ฆ'}
                            </div>
                            <div>
                              <div className="font-extrabold text-[#001a3a] text-sm">
                                {child.full_name} ({child.nickname})
                              </div>
                              <div className="text-xs text-slate-600 font-normal">
                                เธเธฅเธฒเธช: <strong>{child.course_name}</strong> | เธเธนเนเธเธเธเธฃเธญเธ: {parent ? parent.name : '-'}
                              </div>
                              <div className="text-xs text-slate-500 font-normal">
                                ๐“ เน€เธเธญเธฃเนเนเธ—เธฃ: {parent ? parent.phone : '-'}
                              </div>
                            </div>
                          </div>

                          <span className={`text-xs font-black px-3 py-1 rounded-xl shrink-0 shadow-2xs ${
                            isZero ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-white'
                          }`}>
                            {isZero ? 'เธซเธกเธ”เนเธฅเนเธง (0 เธเธก.)' : `เน€เธซเธฅเธทเธญ ${remaining} เธเธก.`}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                          {parent && (
                            <button
                              type="button"
                              onClick={() => handleSendEmailToParent(parent)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                            >
                              โ๏ธ เธชเนเธ Email เนเธเนเธเน€เธ•เธทเธญเธ
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const pName = parent ? parent.name : 'เธเธนเนเธเธเธเธฃเธญเธ';
                              const msg = `๐ณ เนเธเนเธเน€เธ•เธทเธญเธเธชเธดเธ—เธเธดเนเธเธญเธฃเนเธชเน€เธฃเธตเธขเธเนเธเธฅเนเธซเธกเธ”เธญเธฒเธขเธธ - ORCA GYM\n---------------------------------\nเธเธนเนเธเธเธเธฃเธญเธ: ${pName}\nเธเธฑเธเน€เธฃเธตเธขเธ: ${child.full_name} (${child.nickname})\nเธเธฅเธฒเธช: ${child.course_name}\nเธเธณเธเธงเธเธเธฑเนเธงเนเธกเธเธเธเน€เธซเธฅเธทเธญ: ${remaining} เธเธฑเนเธงเนเธกเธ\n---------------------------------\nเธเธฃเธธเธ“เธฒเธ•เธดเธ”เธ•เนเธญเนเธญเธ”เธกเธดเธเน€เธเธทเนเธญเธ•เนเธญเธญเธฒเธขเธธเธซเธฃเธทเธญเธเธทเนเธญเนเธเนเธเน€เธเธเธเธญเธฃเนเธชเน€เธฃเธตเธขเธเน€เธเธดเนเธกเน€เธ•เธดเธก`;
                              setCopyMessage(msg);
                            }}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            ๐“ เธเธฑเธ”เธฅเธญเธเธชเนเธ Line
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[#001a3a] flex items-center gap-2">
                <span className="text-xl">๐”‘</span>
                <span>เธชเธฃเนเธฒเธเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธเนเธซเธกเน & เธญเธญเธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธญเธฃเนเธช (Create Parent & Course)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateParentModal(!showCreateParentModal)}
                className="text-xs font-bold text-[#059669] hover:underline border-none bg-transparent cursor-pointer"
              >
                {showCreateParentModal ? 'โ–ฒ เธเนเธญเธเธเธญเธฃเนเธก' : '+ เนเธชเธ”เธเธเธญเธฃเนเธก'}
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-normal">
              เธเธฃเธญเธเธเนเธญเธกเธนเธฅเธเธนเนเธเธเธเธฃเธญเธเนเธฅเธฐเน€เธฅเธทเธญเธเธเธญเธฃเนเธชเธ—เธตเนเธเธทเนเธญ เธฃเธฐเธเธเธเธฐเธญเธญเธ <strong>Username</strong> เนเธฅเธฐ <strong>Password</strong> เนเธซเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด เธเธฃเนเธญเธกเธชเธฃเนเธฒเธเธเนเธญเธเธงเธฒเธกเธเธฑเธ”เธฅเธญเธเธชเนเธ Line เนเธซเนเธเธนเนเธเธเธเธฃเธญเธ
            </p>

            {(showCreateParentModal || parents.length === 0) && (
              <form onSubmit={handleCreateParent} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ เธเธนเนเธเธเธเธฃเธญเธ:</label>
                  <input
                    type="text"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธญเธตเน€เธกเธฅเธเธนเนเธเธเธเธฃเธญเธ (เธชเธณเธซเธฃเธฑเธเธญเธญเธ Username/Reset):</label>
                  <input
                    type="email"
                    value={newParentEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน (เนเธเนเธญเธญเธ Password 4 เธ•เธฑเธงเธ—เนเธฒเธข):</label>
                  <input
                    type="tel"
                    value={newParentPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธฅเธฒเธช & เนเธเธงเธ•เนเธฒเธ—เธตเนเธเธทเนเธญ:</label>
                  <div className="flex gap-2">
                    <select
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="flex-1 h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none"
                    >
                      <option value="Orca Cubs">Orca Cubs (4-10 เธเธต)</option>
                      <option value="Mega Orca">Mega Orca (5-15 เธเธต)</option>
                    </select>
                    <select
                      value={hoursToAdd}
                      onChange={(e) => setHoursToAdd(e.target.value ? Number(e.target.value) : '')}
                      className="w-28 h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none"
                    >
                      <option value="">-</option>
                      <option value={1}>1 เธเธฃเธฑเนเธ</option>
                      <option value={6}>6 เธเธฃเธฑเนเธ</option>
                      <option value={12}>12 เธเธฃเธฑเนเธ</option>
                      <option value={24}>24 เธเธฃเธฑเนเธ</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2 bg-sky-50 border border-sky-200 p-3.5 rounded-2xl flex flex-wrap justify-between items-center text-xs text-sky-900 gap-2">
                  <div>
                    โก <strong>Username เธญเธฑเธ•เนเธเธกเธฑเธ•เธด:</strong> <code className="bg-white px-2.5 py-1 rounded-lg font-mono font-bold text-blue-700">{getAutoUsername(newParentEmail) || '...'}</code>
                  </div>
                  <div>
                    ๐”‘ <strong>Password เธญเธฑเธ•เนเธเธกเธฑเธ•เธด:</strong> <code className="bg-white px-2.5 py-1 rounded-lg font-mono font-bold text-blue-700">{newParentPassword || getAutoPassword(newParentEmail, newParentPhone) || '...'}</code>
                  </div>
                </div>

                {/* ๐’ณ Payment Proof Section */}
                <div className="sm:col-span-2 pt-3 border-t border-slate-200 mt-2">
                  <h4 className="text-xs font-bold text-[#001a3a] mb-3 flex items-center gap-1.5 text-blue-900">
                    <span className="text-base">๐’ณ</span>
                    <span>เธเนเธญเธกเธนเธฅเธซเธฅเธฑเธเธเธฒเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ (Payment Proof)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* เธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเนเธญเธ */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเนเธญเธ (เธเธฒเธ—):</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* เน€เธฅเธเธ—เธตเนเธญเนเธฒเธเธญเธดเธเธชเธฅเธดเธ */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เน€เธฅเธเธ—เธตเนเธญเนเธฒเธเธญเธดเธเธชเธฅเธดเธ (Slip Ref No.):</label>
                      <input
                        type="text"
                        value={paymentRefNo}
                        onChange={(e) => setPaymentRefNo(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* เธเธทเนเธญเธเธฑเธเธเธตเธเธนเนเนเธญเธ */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธทเนเธญเธเธฑเธเธเธตเธเธนเนเนเธญเธ:</label>
                      <input
                        type="text"
                        value={paymentPayerName}
                        onChange={(e) => setPaymentPayerName(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* เธเธเธฒเธเธฒเธฃเธ•เนเธเธ—เธฒเธ */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธเธฒเธเธฒเธฃเธ•เนเธเธ—เธฒเธเธ—เธตเนเนเธญเธ:</label>
                      <select
                        value={paymentBank}
                        onChange={(e) => setPaymentBank(e.target.value)}
                        className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500"
                      >
                        <option value="">-- เน€เธฅเธทเธญเธเธเธเธฒเธเธฒเธฃ --</option>
                        <option value="เธเธชเธดเธเธฃเนเธ—เธข (KBank)">เธเธชเธดเธเธฃเนเธ—เธข (KBank)</option>
                        <option value="เนเธ—เธขเธเธฒเธ“เธดเธเธขเน (SCB)">เนเธ—เธขเธเธฒเธ“เธดเธเธขเน (SCB)</option>
                        <option value="เธเธฃเธธเธเน€เธ—เธ (BBL)">เธเธฃเธธเธเน€เธ—เธ (BBL)</option>
                        <option value="เธเธฃเธธเธเนเธ—เธข (KTB)">เธเธฃเธธเธเนเธ—เธข (KTB)</option>
                        <option value="เธเธฃเธธเธเธจเธฃเธตเธญเธขเธธเธเธขเธฒ (BAY)">เธเธฃเธธเธเธจเธฃเธตเธญเธขเธธเธเธขเธฒ (BAY)</option>
                        <option value="เธญเธญเธกเธชเธดเธ (GSB)">เธญเธญเธกเธชเธดเธ (GSB)</option>
                        <option value="เธ—เธซเธฒเธฃเนเธ—เธขเธเธเธเธฒเธ• (ttb)">เธ—เธซเธฒเธฃเนเธ—เธขเธเธเธเธฒเธ• (ttb)</option>
                        <option value="เธญเธทเนเธเน (เธฃเธฐเธเธธ)">เธญเธทเนเธเน (เธฃเธฐเธเธธ)</option>
                      </select>
                      {paymentBank === 'เธญเธทเนเธเน (เธฃเธฐเธเธธ)' && (
                        <input
                          type="text"
                          value={paymentBankOther}
                          onChange={(e) => setPaymentBankOther(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs mt-2 outline-none focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* เธงเธฑเธ-เน€เธงเธฅเธฒเธ—เธตเนเนเธญเธ (เธฃเธนเธเนเธเธเธเธเธดเธ—เธดเธ) */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธงเธฑเธ-เน€เธงเธฅเธฒเธ—เธตเนเนเธญเธ (เธฃเธนเธเนเธเธเธเธเธดเธ—เธดเธ):</label>
                      <input
                        type="datetime-local"
                        value={paymentDateTime}
                        onChange={(e) => setPaymentDateTime(e.target.value)}
                        className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเธชเธฅเธดเธเน€เธเธดเธ (เธ–เนเธฒเธกเธต) */}
                    <div>
                      <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเธชเธฅเธดเธเน€เธเธดเธ (เธ–เนเธฒเธกเธต):</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPaymentSlipFile(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {paymentSlipFile && (
                        <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <img src={paymentSlipFile} alt="Slip Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                          <div className="flex-1 text-xs text-emerald-700 font-bold">โ… เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเธชเธฅเธดเธเนเธฅเนเธง</div>
                          <button
                            type="button"
                            onClick={() => setPaymentSlipFile(null)}
                            className="text-xs text-rose-600 hover:underline font-bold border-none bg-transparent cursor-pointer"
                          >
                            เธฅเธเธฃเธนเธ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button type="submit" className="w-full h-11 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-full shadow-sm cursor-pointer">
                    + เธเธฑเธเธ—เธถเธเธชเธฃเนเธฒเธเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธ & เธญเธญเธเธเนเธญเธเธงเธฒเธก Line
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Registered Parents List */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-[#001a3a]">
                เธฃเธฒเธขเธเธฒเธฃเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธเธ—เธฑเนเธเธซเธกเธ” ({parents.filter((p) => {
                  if (!parentSearchQuery.trim()) return true;
                  const q = parentSearchQuery.toLowerCase().trim();
                  return (
                    p.name?.toLowerCase().includes(q) ||
                    p.user_id?.toLowerCase().includes(q) ||
                    p.email?.toLowerCase().includes(q) ||
                    p.phone?.toLowerCase().includes(q) ||
                    p.payment_ref_no?.toLowerCase().includes(q) ||
                    p.payment_payer_name?.toLowerCase().includes(q)
                  );
                }).length} / {parents.length} เธเธฑเธเธเธต)
              </h3>

              {/* Search Bar for Parents */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={parentSearchQuery}
                  onChange={(e) => setParentSearchQuery(e.target.value)}
                  placeholder="เธเนเธเธซเธฒเธเธนเนเธเธเธเธฃเธญเธ (เธเธทเนเธญ, Email, Phone)..."
                  className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal text-[#001a3a] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">๐”</span>
                {parentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setParentSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-bold"
                  >
                    โ•
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#001a3a] text-white font-bold text-xs">
                      <th className="py-3.5 px-4 font-semibold">USERNAME</th>
                      <th className="py-3.5 px-4 font-semibold">เธเธทเนเธญเธเธนเนเธเธเธเธฃเธญเธ</th>
                      <th className="py-3.5 px-4 font-semibold">เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน</th>
                      <th className="py-3.5 px-4 font-semibold">เธเธฅเธฒเธช & เนเธเธงเธ•เนเธฒเธ—เธตเนเธเธทเนเธญ</th>
                      <th className="py-3.5 px-4 font-semibold text-center">เธเธฒเธฃเธฅเธเธ—เธฐเน€เธเธตเธขเธเธเธธเธ•เธฃเธซเธฅเธฒเธ</th>
                      <th className="py-3.5 px-4 font-semibold text-center">เธเธฑเธ”เธเธฒเธฃ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parents
                      .filter((p) => {
                        if (!parentSearchQuery.trim()) return true;
                        const q = parentSearchQuery.toLowerCase().trim();
                        return (
                          p.name?.toLowerCase().includes(q) ||
                          p.user_id?.toLowerCase().includes(q) ||
                          p.email?.toLowerCase().includes(q) ||
                          p.phone?.toLowerCase().includes(q) ||
                          p.payment_ref_no?.toLowerCase().includes(q) ||
                          p.payment_payer_name?.toLowerCase().includes(q)
                        );
                      })
                      .map((p) => {
                        const pChildren = children.filter((c) => isChildOfParent(c, p));
                        const pChildrenCount = pChildren.length;
                        const pBookingsCount = allBookings.filter(
                          (b) =>
                            b.status === 'confirmed' &&
                            (pChildren.some((c) => c.id === b.child_id) || b.child_id === p.id || b.child_id === p.user_id)
                        ).length;

                        const pkgStartDateStr = p.payment_datetime || p.created_at || '';
                        const pkgStartDate = pkgStartDateStr
                          ? new Date(pkgStartDateStr.includes('T') ? pkgStartDateStr : pkgStartDateStr.replace(' ', 'T'))
                          : new Date();
                        const validPkgStartDate = isNaN(pkgStartDate.getTime()) ? new Date() : pkgStartDate;
                        const purchasedHoursNum = p.purchased_hours || 6;
                        let pkgDurationMonths = 2;
                        if (purchasedHoursNum === 12) pkgDurationMonths = 4;
                        else if (purchasedHoursNum === 24) pkgDurationMonths = 6;
                        else if (purchasedHoursNum === 48) pkgDurationMonths = 12;

                        const pkgExpiryDate = new Date(validPkgStartDate);
                        pkgExpiryDate.setMonth(pkgExpiryDate.getMonth() + pkgDurationMonths);

                        const todayDate = new Date();
                        todayDate.setHours(0, 0, 0, 0);
                        const expDay = new Date(pkgExpiryDate);
                        expDay.setHours(0, 0, 0, 0);

                        const daysUntilPkgExpiry = Math.ceil(
                          (expDay.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const isPkgExpiringSoon = daysUntilPkgExpiry <= 5;

                        const monthShortNames = ['เธก.เธ.', 'เธ.เธ.', 'เธกเธต.เธ.', 'เน€เธก.เธข.', 'เธ.เธ.', 'เธกเธด.เธข.', 'เธ.เธ.', 'เธช.เธ.', 'เธ.เธข.', 'เธ•.เธ.', 'เธ.เธข.', 'เธ.เธ.'];
                        const formattedPurchaseDate = formatThaiShortDate(validPkgStartDate);
                        const formattedExpiryDate = formatThaiShortDate(pkgExpiryDate);
                        const fullExpiryDateStr = `${pkgExpiryDate.getDate()} ${monthShortNames[pkgExpiryDate.getMonth()]} ${pkgExpiryDate.getFullYear() + 543}`;

                        // Calculate 5 days prior alert date (e.g. 26 เธ.เธข. 2569 for 1 เธ.เธ. 2569 expiry)
                        const alertStartDate = new Date(pkgExpiryDate);
                        alertStartDate.setDate(alertStartDate.getDate() - 5);
                        const alertStartStr = formatThaiShortDate(alertStartDate);

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
                                  <span>๐”‘</span>
                                  <span>{p.user_id}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#001a3a] text-sm flex flex-wrap items-center gap-2">
                                  <span>{p.name}</span>
                                  {isPkgExpiringSoon && (
                                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] animate-pulse" title={`เน€เธฃเธดเนเธกเนเธเนเธเน€เธ•เธทเธญเธเธฅเนเธงเธเธซเธเนเธฒ 5 เธงเธฑเธ เธ•เธฑเนเธเนเธ•เนเธงเธฑเธเธ—เธตเน ${alertStartStr}`}>
                                      โฐ เธซเธกเธ”เธญเธฒเธขเธธเนเธ {daysUntilPkgExpiry <= 0 ? '0' : daysUntilPkgExpiry} เธงเธฑเธ ({formattedExpiryDate} | เนเธเนเธเน€เธ•เธทเธญเธเธ•เธฑเนเธเนเธ•เน {alertStartStr})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span>โ๏ธ {p.email || `${p.user_id}@orcagym.com`}</span>
                                  <span className="text-slate-300">|</span>
                                  <span>๐“… เธงเธฑเธเธ—เธตเนเธเธทเนเธญ: <strong className="text-slate-700 font-bold">{formattedPurchaseDate}</strong></span>
                                  <span className="text-slate-300">|</span>
                                  <span>โณ เธซเธกเธ”เธญเธฒเธขเธธ ({pkgDurationMonths} เน€เธ”เธทเธญเธ): <strong className="text-blue-900 font-bold">{formattedExpiryDate}</strong></span>
                                </div>
                                <div className="text-[10px] flex flex-wrap items-center gap-2 mt-1.5">
                                  {p.pdpa_accepted ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                      <span>โ…</span> เธขเธญเธกเธฃเธฑเธเธเธเธฃเธฐเน€เธเธตเธขเธเนเธฅเนเธง
                                    </span>
                                  ) : (
                                    <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                      <span>โณ</span> เธฃเธญเธขเธญเธกเธฃเธฑเธเธเธเธฃเธฐเน€เธเธตเธขเธ
                                    </span>
                                  )}
                                  
                                  {p.media_consent !== undefined && (
                                    p.media_consent ? (
                                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                        <span>๐“ท</span> เธขเธดเธเธขเธญเธกเนเธซเนเนเธเนเธชเธทเนเธญ PR
                                      </span>
                                    ) : (
                                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                        <span>๐ซ</span> เนเธกเนเธขเธดเธเธขเธญเธกเนเธซเนเนเธเนเธชเธทเนเธญ PR
                                      </span>
                                    )
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-normal text-slate-700 whitespace-nowrap">
                                {p.phone || '-'}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold px-2 py-0.5 rounded-full text-xs">
                                    <span>Orca Cubs</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="font-bold text-blue-700">
                                      {pBookingsCount}/{purchasedHoursNum} เธเธฃเธฑเนเธ ({pkgDurationMonths} เน€เธ”เธทเธญเธ)
                                    </span>
                                  </span>
                                  <div className="text-[10px] text-slate-600 font-semibold pl-1">
                                    <div>๐“… เธงเธฑเธเธ—เธตเนเธเธทเนเธญ: <span className="text-slate-800 font-bold">{formattedPurchaseDate}</span></div>
                                    <div>โณ เธซเธกเธ”เธญเธฒเธขเธธ: <span className="text-blue-900 font-bold">{formattedExpiryDate}</span></div>
                                  </div>
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
                                        ? `เน€เธเธดเนเธกเนเธฅเนเธง (${pChildrenCount} เธเธ)`
                                        : `เธขเธฑเธเนเธกเนเน€เธเธดเนเธก (${pChildrenCount} เธเธ)`}
                                    </span>
                                    <span className="text-[10px] ml-0.5">{expandedParentId === p.id ? 'โ–ฒ' : 'โ–ผ'}</span>
                                  </button>
                                  {pChildren.map((child) => (
                                    <div key={child.id} className="text-[11px] font-extrabold text-[#001a3a] flex items-center justify-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-lg shadow-2xs mt-0.5">
                                      <span>{child.gender === 'Girl' ? '๐‘ง' : '๐‘ฆ'}</span>
                                      <span>{child.full_name} ({child.nickname})</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                 <div className="flex items-center justify-center gap-1.5">
                                   <button
                                     type="button"
                                     title="เนเธเนเนเธ"
                                     onClick={() => handleStartEditParent(p)}
                                     className="group w-9 h-9 flex items-center justify-center bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">โ๏ธ</span>
                                   </button>
                                   <button
                                     type="button"
                                     title="เธชเนเธ Email"
                                     onClick={() => handleSendEmailToParent(p)}
                                     className="group w-9 h-9 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">โ๏ธ</span>
                                   </button>
                                   <button
                                     type="button"
                                     title="เธเธฑเธ”เธฅเธญเธเธชเนเธ Line"
                                     onClick={() => {
                                       let payInfo = '';
                                       if (p.payment_amount || p.payment_bank || p.payment_ref_no || p.payment_datetime) {
                                         payInfo =
                                           `\n๐’ณ เธซเธฅเธฑเธเธเธฒเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ:\n` +
                                           (p.payment_amount ? `โ€ข เธเธณเธเธงเธเน€เธเธดเธ: ${Number(p.payment_amount).toLocaleString()} เธเธฒเธ—\n` : '') +
                                           (p.payment_bank ? `โ€ข เธเธเธฒเธเธฒเธฃ: ${p.payment_bank}\n` : '') +
                                           (p.payment_payer_name ? `โ€ข เธเธทเนเธญเธเธนเนเนเธญเธ: ${p.payment_payer_name}\n` : '') +
                                           (p.payment_datetime ? `โ€ข เธงเธฑเธ-เน€เธงเธฅเธฒเนเธญเธ: ${p.payment_datetime.replace('T', ' ')} เธ.\n` : '') +
                                           (p.payment_ref_no ? `โ€ข เน€เธฅเธเธญเนเธฒเธเธญเธดเธเธชเธฅเธดเธ: ${p.payment_ref_no}\n` : '');
                                       }
                                       const msg = `๐ณ เธเธฑเธเธเธตเนเธเนเธเธฒเธเธฃเธฐเธเธ ORCA GYMNASTICS\n---------------------------------\nUsername: ${p.user_id}\nPassword: ${p.password || '123'}\nเธเธนเนเธเธเธเธฃเธญเธ: ${p.name}\nเธเธฅเธฒเธช & เนเธเธงเธ•เนเธฒเธ—เธตเนเธเธทเนเธญ:\nโ€ข Orca Cubs: ${purchasedHoursNum} เธเธฃเธฑเนเธ\n${payInfo}---------------------------------\nเธเธฃเธธเธ“เธฒเธเธณ Username เนเธฅเธฐ Password\nเนเธเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเน€เธเธทเนเธญเธฅเธเธ—เธฐเน€เธเธตเธขเธเธเนเธญเธกเธนเธฅเธเธธเธ•เธฃเธซเธฅเธฒเธ (Add Family Member)`;
                                       setCopyMessage(msg);
                                     }}
                                     className="group w-9 h-9 flex items-center justify-center bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">๐“</span>
                                   </button>
                                   <button
                                     type="button"
                                     title="เธฅเธ"
                                     onClick={() => handleDeleteParent(p.id, p.name)}
                                     className="group w-9 h-9 flex items-center justify-center bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-2xl transition-all shadow-2xs cursor-pointer"
                                   >
                                     <span className="inline-block transition-transform duration-200 group-hover:scale-130 text-base">๐—‘๏ธ</span>
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
                                            <span>๐งพ</span>
                                            <span>เธซเธฅเธฑเธเธเธฒเธเธชเธฅเธดเธเธเธฒเธฃเนเธญเธเน€เธเธดเธ (เธชเธฐเธชเธก {paymentHistoryList.length} เธฃเธฒเธขเธเธฒเธฃ):</span>
                                          </span>
                                          {paymentHistoryList.length > 1 && (
                                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                              เนเธญเธเน€เธเธดเธเธซเธฅเธฒเธขเธเธฃเธฑเนเธ / เธเธทเนเธญเธเธญเธฃเนเธชเน€เธเธดเนเธก
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
                                                # {pIdx + 1} {pIdx === 0 ? '(เนเธฃเธเน€เธฃเธดเนเธก)' : '(เธเธทเนเธญเธเธญเธฃเนเธชเน€เธเธดเนเธก)'}
                                              </span>
                                              {pay.payment_amount && (
                                                <span>
                                                  ๐’ณ <strong>เธขเธญเธ”เนเธญเธ:</strong>{' '}
                                                  <strong className="text-emerald-700">
                                                    {pay.payment_amount.toLocaleString()} เธเธฒเธ—
                                                  </strong>
                                                </span>
                                              )}
                                              {pay.payment_bank && (
                                                <span>
                                                  ๐ฆ <strong>เธเธเธฒเธเธฒเธฃ:</strong> {pay.payment_bank}
                                                </span>
                                              )}
                                              {pay.payment_payer_name && (
                                                <span>
                                                  ๐‘ค <strong>เธเธทเนเธญเธเธนเนเนเธญเธ:</strong> {pay.payment_payer_name}
                                                </span>
                                              )}
                                              {pay.payment_datetime && (
                                                <span>
                                                  ๐“… <strong>เน€เธงเธฅเธฒเนเธญเธ:</strong> {formatThaiShortDate(pay.payment_datetime, true)}
                                                </span>
                                              )}
                                              {pay.payment_ref_no && (
                                                <span>
                                                  ๐”ข <strong>Ref:</strong> {pay.payment_ref_no}
                                                </span>
                                              )}
                                              {pay.purchased_hours && (
                                                <span>
                                                  ๐’ <strong>เนเธเธงเธ•เนเธฒ:</strong> <strong className="text-blue-700">+{pay.purchased_hours} เธเธฃเธฑเนเธ</strong>
                                                </span>
                                              )}
                                              {pay.payment_slip && (
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedSlipPreview(pay.payment_slip!)}
                                                  className="bg-[#003366] text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer ml-auto shadow-2xs flex items-center gap-1"
                                                >
                                                  <span>๐“ท</span>
                                                  <span>เธ”เธนเธชเธฅเธดเธเนเธญเธเน€เธเธดเธ (#{pIdx + 1})</span>
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
                                            <span>๐‘ถ เธฃเธฒเธขเธเธทเนเธญเธเธธเธ•เธฃเธซเธฅเธฒเธ (Family Members) เธ เธฒเธขเนเธ•เนเธเธนเนเธเธเธเธฃเธญเธ: {p.name}</span>
                                          </h4>
                                          <span className="text-[11px] text-indigo-900 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">
                                            เธฃเธงเธก {pChildrenCount} เธเธ
                                          </span>
                                        </div>

                                        {pChildrenCount === 0 ? (
                                          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center font-normal">
                                            เธขเธฑเธเนเธกเนเนเธ”เนเธฅเธเธ—เธฐเน€เธเธตเธขเธเธเธธเธ•เธฃเธซเธฅเธฒเธ (เธเธนเนเธเธเธเธฃเธญเธเธขเธฑเธเนเธกเนเนเธ”เนเธเธ” Add Family Member เนเธเธฃเธฐเธเธ)
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
                                                        {child.gender === 'Girl' ? '๐‘ง' : '๐‘ฆ'} {child.full_name} ({child.nickname})
                                                      </span>
                                                      <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                          child.status === 'approved'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                        }`}
                                                      >
                                                        {child.status === 'approved' ? 'โ… เธญเธเธธเธกเธฑเธ•เธดเนเธฅเนเธง' : 'โณ เธฃเธญเธญเธเธธเธกเธฑเธ•เธด'}
                                                      </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                                                      เน€เธเธดเธ”: {child.dob} | เธเธฅเธฒเธช: <strong>{child.course_name}</strong> | เธเธเน€เธซเธฅเธทเธญ:{' '}
                                                      <strong className="text-blue-700">{remaining} เธเธก.</strong> (เธฃเธงเธก {child.total_hours} เธเธก.)
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    {child.status === 'pending' && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleApproveCourse(child)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                                                      >
                                                        โ… เธญเธเธธเธกเธฑเธ•เธดเธเธญเธฃเนเธช
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
                                                      ๐“… เธเธญเธเธเธฅเธฒเธชเนเธ—เธ
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setTopUpChild(child)}
                                                      className="bg-[#001a3a] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#002244] shadow-2xs cursor-pointer"
                                                    >
                                                      Approve / เน€เธ•เธดเธกเธเธฑเนเธงเนเธกเธ
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
                <span>๐‘ถ เธเนเธญเธกเธนเธฅเธเธฑเธเน€เธฃเธตเธขเธเธ—เธฑเนเธเธซเธกเธ”เนเธเธฃเธฐเธเธ ({children.filter((c) => {
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
                }).length} / {children.length} เธเธ)</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                เธฃเธฒเธขเธเธทเนเธญเน€เธ”เนเธเธ—เธตเนเธเธนเนเธเธเธเธฃเธญเธเธฅเธเธ—เธฐเน€เธเธตเธขเธ Add Family Member เธ—เธฑเนเธเธซเธกเธ”เนเธเธฃเธฐเธเธ
              </p>
            </div>

            {/* Search Input for Students */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="เธเนเธเธซเธฒเธเธทเนเธญเน€เธ”เนเธ, เธเธทเนเธญเน€เธฅเนเธ, เธเธฅเธฒเธช เธซเธฃเธทเธญเธเธนเนเธเธเธเธฃเธญเธ..."
                className="w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal text-[#001a3a] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
              <span className="absolute left-3.5 top-3 text-sm text-slate-400">๐”</span>
              {studentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStudentSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-bold"
                >
                  โ•
                </button>
              )}
            </div>
          </div>

          {/* Structured Data Table for Student Information */}
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-['Anuphan',sans-serif]">
                <thead>
                  <tr className="bg-[#001a3a] text-white text-xs font-bold tracking-wider">
                    <th className="py-4 px-4 whitespace-nowrap">
                      เธเธทเนเธญเธเธฑเธเน€เธฃเธตเธขเธ (เธเธทเนเธญเธเธฃเธดเธ & เธเธทเนเธญเน€เธฅเนเธ) / เธญเธฒเธขเธธ
                    </th>
                    <th className="py-4 px-4 whitespace-nowrap">
                      เธเธทเนเธญเธเธนเนเธเธเธเธฃเธญเธ / เน€เธเธญเธฃเนเนเธ—เธฃ
                    </th>
                    <th className="py-4 px-4 whitespace-nowrap">
                      เธเธทเนเธญ Course
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">
                      เธเธณเธเธงเธเธเธฃเธฑเนเธ
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">
                      เนเธ–เธก
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">
                      เธเธเน€เธซเธฅเธทเธญ
                    </th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">
                      เธเธฑเธ”เธเธฒเธฃเธเธฅเธฒเธชเน€เธฃเธตเธขเธ
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
                      const remaining = c.total_hours - c.used_hours;
                      const parent = parents.find((p) => isChildOfParent(c, p));
                      const ageText = calculateAge(c.dob);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/90 transition-colors border-b border-slate-100/80">
                          {/* 1. เธเธทเนเธญเธเธฑเธเน€เธฃเธตเธขเธ เธ—เธฑเนเธเธเธทเนเธญเธเธฃเธดเธเนเธฅเธฐเธเธทเนเธญเน€เธฅเนเธ / เธญเธฒเธขเธธ */}
                          <td className="py-4 px-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                                {c.gender === 'Girl' ? '๐‘ง' : '๐‘ฆ'}
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
                                      : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                                  }`}>
                                    {c.status === 'approved' ? 'โ… เธญเธเธธเธกเธฑเธ•เธดเนเธฅเนเธง' : 'โณ เธฃเธญเธญเธเธธเธกเธฑเธ•เธด'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 font-normal mt-1 flex items-center gap-1">
                                  <span>๐ เธญเธฒเธขเธธ: <strong className="text-slate-700 font-semibold">{ageText}</strong></span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. เธเธทเนเธญเธเธนเนเธเธเธเธฃเธญเธ / เน€เธเธญเธฃเนเนเธ—เธฃ */}
                          <td className="py-4 px-4 align-middle">
                            <div className="font-bold text-[#001a3a] text-xs sm:text-sm">
                              {parent ? parent.name : '-'}
                            </div>
                            <div className="text-xs text-slate-500 font-normal mt-0.5 flex items-center gap-1">
                              <span>๐“</span>
                              <span>{parent ? parent.phone : '-'}</span>
                            </div>
                          </td>

                          {/* 3. เธเธทเนเธญ Course */}
                          <td className="py-4 px-4 text-center align-middle">
                            <span className="font-bold text-sky-900 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200 inline-block text-xs shadow-2xs whitespace-nowrap">
                              {c.course_name || 'Orca Cubs'}
                            </span>
                          </td>

                          {/* 4. เธเธณเธเธงเธเธเธฃเธฑเนเธ */}
                          <td className="py-4 px-4 text-center align-middle font-extrabold text-[#001a3a] text-xs sm:text-sm whitespace-nowrap">
                            {c.total_hours} เธเธฃเธฑเนเธ
                          </td>

                          {/* 5. เนเธ–เธก */}
                          <td className="py-4 px-4 text-center align-middle font-extrabold text-emerald-600 text-xs sm:text-sm whitespace-nowrap">
                            {c.bonus_hours ? `+${c.bonus_hours} เธเธฃเธฑเนเธ` : '0 เธเธฃเธฑเนเธ'}
                          </td>

                          {/* 6. เธเธเน€เธซเธฅเธทเธญ */}
                          <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                            <span className="font-black text-blue-700 text-sm sm:text-base">
                              {remaining} เธเธฃเธฑเนเธ
                            </span>
                          </td>

                          {/* 7. เธเธฑเธ”เธเธฒเธฃเธเธฅเธฒเธชเน€เธฃเธตเธขเธ (เธชเธเธฒเธขเธ•เธฒ เน€เธฃเธตเธขเธเนเธเธงเธเธญเธเนเธ–เธงเน€เธ”เธตเธขเธง) */}
                          <td className="py-4 px-4 align-middle text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                              {/* 1. เธ”เธนเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ” */}
                              <Link
                                href={`/student/${c.id}`}
                                target="_blank"
                                title="เธ”เธนเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธฑเธเน€เธฃเธตเธขเธ"
                                className="h-8 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>๐”</span>
                                <span>เธ”เธนเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”</span>
                              </Link>

                              {/* 2. เธญเธเธธเธกเธฑเธ•เธดเธเธฅเธฒเธชเน€เธฃเธตเธขเธ */}
                              {c.status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => handleApproveCourse(c)}
                                  title="เธเธ”เธญเธเธธเธกเธฑเธ•เธดเธเธญเธฃเนเธชเน€เธฃเธตเธขเธเธเธตเน"
                                  className="h-8 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer animate-pulse"
                                >
                                  <span>โก</span>
                                  <span>เธญเธเธธเธกเธฑเธ•เธดเธเธฅเธฒเธช</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApproveCourse(c)}
                                  title="เธญเธเธธเธกเธฑเธ•เธดเนเธฅเนเธง (เธเธ”เธเนเธณเน€เธเธทเนเธญเธฃเธตเน€เธเธฃเธเธชเธ–เธฒเธเธฐ)"
                                  className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-extrabold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <span>โ…</span>
                                  <span>เธญเธเธธเธกเธฑเธ•เธดเนเธฅเนเธง</span>
                                </button>
                              )}

                              {/* 3. เธเธฑเธ”เธเธฒเธฃเธเธฅเธฒเธชเน€เธฃเธตเธขเธ */}
                              <button
                                type="button"
                                onClick={() => setTopUpChild(c)}
                                title="เธเธฑเธ”เธเธฒเธฃเธเธฅเธฒเธชเน€เธฃเธตเธขเธ & เน€เธ•เธดเธกเธเธฑเนเธงเนเธกเธ"
                                className="h-8 px-2.5 bg-[#001a3a] hover:bg-[#002244] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>โ๏ธ</span>
                                <span>เธเธฑเธ”เธเธฒเธฃเธเธฅเธฒเธช</span>
                              </button>

                              {/* 4. เธฅเธเธฃเธฒเธขเธเธทเนเธญ */}
                              <button
                                type="button"
                                onClick={() => handleDeleteChild(c.id, c.nickname || c.full_name)}
                                title="เธฅเธเธฃเธฒเธขเธเธทเนเธญเธเธฑเธเน€เธฃเธตเธขเธ"
                                className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>๐—‘๏ธ</span>
                                <span>เธฅเธ</span>
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
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-[#001a3a]">
                ๐“… Schedule Matrix (เธ•เธฒเธฃเธฒเธเน€เธฃเธตเธขเธเนเธฅเธฐเธฃเธฒเธขเธเธทเนเธญเน€เธ”เนเธ)
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                เธ”เธนเธฃเธฒเธขเธเธทเนเธญเน€เธ”เนเธเธ—เธตเนเธฅเธเธเธทเนเธญเธเธญเธเน€เธฃเธตเธขเธเนเธเนเธ•เนเธฅเธฐเธฃเธญเธเน€เธงเธฅเธฒ
              </p>
            </div>
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {dayBookings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm font-normal">
                เธขเธฑเธเนเธกเนเธกเธตเธเธฑเธเน€เธฃเธตเธขเธเธฅเธเธเธทเนเธญเธเธญเธเน€เธฃเธตเธขเธเนเธเธงเธฑเธเธ—เธตเน {selectedDate}
              </div>
            ) : (
              dayBookings.map((b) => (
                <div key={b.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-sm border border-slate-200">
                  <div>
                    <span className="font-bold text-[#001a3a]">{b.child_nickname}</span> ({b.child_full_name})
                    <div className="text-xs text-slate-500 font-normal mt-0.5">เธฃเธญเธเน€เธงเธฅเธฒ: <strong>{b.time_slot}</strong> | เธเธฅเธฒเธช: {b.course_name}</div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-300">
                    โ… เธเธญเธเธชเธดเธ—เธเธดเนเนเธฅเนเธง
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-[#001a3a]">
                ๐“ เธชเธฃเธธเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเน€เธ•เธดเธกเธเธฑเนเธงเนเธกเธเธเธญเธเนเธญเธ”เธกเธดเธ (Audit Trail Log)
              </div>
              <div className="text-2xl font-extrabold text-[#059669] mt-1">
                เธฃเธงเธกเน€เธ•เธดเธกเธงเธฑเธเธเธตเน: {totalHoursToday} เธเธฑเนเธงเนเธกเธ
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetAuditLogsInAdmin}
              className="px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 shadow-2xs flex items-center justify-center gap-1 shrink-0"
              title="เน€เธเธฅเธตเธขเธฃเนเธเธฃเธฐเธงเธฑเธ•เธดเน€เธเนเธฒเนเธฅเธฐเธฃเธตเน€เธเนเธ•เนเธซเนเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเนเธญเธกเธนเธฅเธเธฑเธเธเธธเธเธฑเธ"
            >
              <span>๐—‘๏ธ</span>
              <span>เน€เธเธฅเธตเธขเธฃเนเธเธฃเธฐเธงเธฑเธ•เธด Audit</span>
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex justify-between text-xs text-slate-500 mb-1 font-normal">
                  <span>โฑ๏ธ {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  <span>Admin: <strong>{log.admin_name}</strong></span>
                </div>
                <div className="font-bold text-[#001a3a] text-sm">
                  เธเธฑเธเน€เธฃเธตเธขเธ: {log.child_name}{' '}
                  <span className="text-[#059669] font-extrabold">+{log.hours_added} เธเธก.</span> ({log.course_name})
                </div>
                <div className="text-xs text-slate-500 mt-1 font-normal">เธซเธกเธฒเธขเน€เธซเธ•เธธ: {log.note || '-'}</div>
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
                <span>โ๏ธ</span>
                <span>เธเธฃเธฑเธเนเธ•เนเธ Quota เธเธณเธเธงเธเธเธฑเธเน€เธฃเธตเธขเธเธ•เนเธญเธฃเธญเธ (Quota Config per Course)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                เธ•เธฑเนเธเธเนเธฒเธเธณเธเธงเธเธเธณเธเธฑเธ”เธฃเธฑเธเธเธฑเธเน€เธฃเธตเธขเธเธชเธนเธเธชเธธเธ” (เธเธ/เธซเนเธญเธ) เนเธขเธเธ•เธฒเธกเธเธฃเธฐเน€เธ เธ—เธเธฅเธฒเธชเน€เธฃเธตเธขเธ เนเธฅเธฐเธฃเธญเธเน€เธงเธฅเธฒ (Default: 10 เธเธ)
              </p>
            </div>
            <div className="text-xs font-bold text-sky-900 bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-200 shrink-0">
              ๐”’ เน€เธกเธทเนเธญเน€เธ•เนเธก Quota เธฃเธฐเธเธเธเธฐเธฃเธฐเธเธฑเธเธเธฒเธฃเธเธญเธเนเธ”เธขเธญเธฑเธ•เนเธเธกเธฑเธ•เธด
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Form Column */}
            <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/90 space-y-4">
              <h4 className="font-extrabold text-sm text-[#001a3a] flex items-center gap-1.5">
                <span>โ๏ธ</span>
                <span>เธเธญเธฃเนเธกเธเธณเธซเธเธ” Quota เนเธซเธกเน</span>
              </h4>

              {/* 1. Select Course */}
              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">
                  1. เน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ—เธเธฅเธฒเธชเน€เธฃเธตเธขเธ (Course):
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
                  <option value="Orca Cubs">๐ณ Orca Cubs (เธชเธณเธซเธฃเธฑเธเธเนเธญเธเน เธญเธฒเธขเธธ 4-10 เธเธต)</option>
                  <option value="Mega Orca">โก Mega Orca (เธชเธณเธซเธฃเธฑเธเน€เธฅเน€เธงเธฅ 1 เธเธถเนเธเนเธ เธญเธฒเธขเธธ 5-15 เธเธต)</option>
                  <option value="All Courses">๐ เธ—เธธเธเธเธฅเธฒเธชเน€เธฃเธตเธขเธ (All Courses)</option>
                </select>
              </div>

              {/* 2. Select Time Slot */}
              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">
                  2. เน€เธฅเธทเธญเธเธฃเธญเธเน€เธงเธฅเธฒเน€เธฃเธตเธขเธ (Time Slot):
                </label>
                <select
                  value={quotaSlot}
                  onChange={(e) => setQuotaSlot(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-[#001a3a] outline-none focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
                >
                  {quotaCourse === 'Mega Orca' ? (
                    <>
                      <option value="10:00-12:00">10:00 - 12:00 เธ. (เธฃเธญเธเน€เธเนเธฒ Mega)</option>
                      <option value="14:00-16:00">14:00 - 16:00 เธ. (เธฃเธญเธเธเนเธฒเธขเน€เธชเธฒเธฃเน-เธญเธฒเธ—เธดเธ•เธขเน Mega)</option>
                      <option value="17:30-19:30">17:30 - 19:30 เธ. (เธฃเธญเธเธเนเธณ Mega)</option>
                    </>
                  ) : (
                    <>
                      <option value="10:30-12:00">10:30 - 12:00 เธ. (เธฃเธญเธ 1.5 เธเธก. Cubs)</option>
                      <option value="14:30-16:00">14:30 - 16:00 เธ. (เธฃเธญเธ 1.5 เธเธก. Cubs)</option>
                      <option value="16:00-17:30">16:00 - 17:30 เธ. (เธฃเธญเธ 1.5 เธเธก. Cubs)</option>
                      <option value="17:30-19:30">17:30 - 19:30 เธ. (เธฃเธญเธ 2 เธเธก. Cubs)</option>
                      <option value="09:00-10:30">09:00 - 10:30 เธ. (เธฃเธญเธเน€เธเนเธฒเน€เธชเธฒเธฃเน-เธญเธฒเธ—เธดเธ•เธขเน)</option>
                      <option value="13:00-14:30">13:00 - 14:30 เธ. (เธฃเธญเธเธเนเธฒเธขเน€เธชเธฒเธฃเน-เธญเธฒเธ—เธดเธ•เธขเน)</option>
                      <option value="10:00-12:00">10:00 - 12:00 เธ.</option>
                    </>
                  )}
                </select>
              </div>

              {/* 3. Quota Number */}
              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">
                  3. เธเธณเธเธงเธ Quota เธฃเธฑเธเนเธ”เนเธชเธนเธเธชเธธเธ” (เธเธ/เธเธฅเธฒเธช):
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
                  <span className="text-xs font-bold text-slate-600 shrink-0">เธเธ</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdateQuota}
                className="w-full h-12 bg-[#001a3a] hover:bg-[#002244] text-white font-extrabold text-sm rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>๐’พ</span>
                <span>เธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ Quota ({quotaCourse})</span>
              </button>
            </div>

            {/* Quota Summary & Quick Overview Cards Column */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-extrabold text-sm text-[#001a3a] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>๐“</span>
                    <span>เธชเธฃเธธเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ Quota เธเธฅเธฒเธชเน€เธฃเธตเธขเธ</span>
                  </span>
                  <span className="text-xs text-sky-800 font-bold bg-sky-100 px-3 py-1 rounded-full">
                    เนเธเธงเธ•เนเธฒเธ•เธฒเธกเธเธฅเธฒเธชเน€เธฃเธตเธขเธ
                  </span>
                </h4>

                {/* Quota Cards for Orca Cubs & Mega Orca */}
                <div className="space-y-3">
                  {/* Orca Cubs Quota summary */}
                  <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-sky-950">
                      <span className="flex items-center gap-1.5">
                        <span>๐ณ</span>
                        <span>เธเธฅเธฒเธช Orca Cubs (เธญเธฒเธขเธธ 4-10 เธเธต)</span>
                      </span>
                      <span className="bg-sky-200 text-sky-900 px-2.5 py-0.5 rounded-full text-[11px]">
                        เนเธเธงเธ•เนเธฒเธ•เธฑเนเธเธ•เนเธ: 10 เธเธ/เธฃเธญเธ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 font-medium">
                      {['10:30-12:00', '14:30-16:00', '16:00-17:30', '17:30-19:30'].map(slot => {
                        const val = quotas[`Everyday_Orca Cubs_${slot}`]
                          ?? quotas[`Orca Cubs_${slot}`]
                          ?? quotas[`Everyday_${slot}`]
                          ?? 10;
                        return (
                          <div key={slot} className="flex justify-between">
                            <span>โ€ข เธฃเธญเธ {slot} เธ.</span>
                            <strong className="text-[#001a3a]">{val} เธเธ</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mega Orca Quota summary */}
                  <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950">
                      <span className="flex items-center gap-1.5">
                        <span>โก</span>
                        <span>เธเธฅเธฒเธช Mega Orca (เธญเธฒเธขเธธ 5-15 เธเธต)</span>
                      </span>
                      <span className="bg-indigo-200 text-indigo-900 px-2.5 py-0.5 rounded-full text-[11px]">
                        เนเธเธงเธ•เนเธฒเธ•เธฑเนเธเธ•เนเธ: 10 เธเธ/เธฃเธญเธ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 font-medium">
                      {['10:00-12:00', '14:00-16:00', '17:30-19:30'].map(slot => {
                        const val = quotas[`Everyday_Mega Orca_${slot}`]
                          ?? quotas[`Mega Orca_${slot}`]
                          ?? quotas[`Everyday_${slot}`]
                          ?? 10;
                        return (
                          <div key={slot} className="flex justify-between">
                            <span>โ€ข เธฃเธญเธ {slot} เธ.</span>
                            <strong className="text-[#001a3a]">{val} เธเธ</strong>
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
          <h3 className="text-lg font-bold text-emerald-900">โก เธชเธ–เธฒเธเธฐเธเธฒเธฃเน€เธเธทเนเธญเธกเธ•เนเธญ Supabase Database</h3>

          <div className="text-xs text-slate-700 space-y-2 font-normal">
            <p>
              เธชเธ–เธฒเธเธฐเธเธฑเธเธเธธเธเธฑเธ:{' '}
              <strong className={isSupabaseConfigured ? 'text-emerald-700' : 'text-amber-700'}>
                {isSupabaseConfigured ? 'โ… เน€เธเธทเนเธญเธกเธ•เนเธญ Supabase Live Database เนเธฅเนเธง' : 'โก เธ—เธณเธเธฒเธเนเธเนเธซเธกเธ” Local Fallback (เธเธฃเนเธญเธกเน€เธเธทเนเธญเธกเธ•เนเธญ Supabase)'}
              </strong>
            </p>
            <p>๐“ เธชเธเธฃเธดเธเธ•เน SQL 1-Click Setup: เธ”เธนเนเธ”เนเธ—เธตเน <code>supabase/schema.sql</code></p>
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
              <span className="text-2xl">๐“ฑ</span>
              <h3 className="text-lg font-bold text-[#001a3a]">
                เธเนเธญเธกเธนเธฅเธเธฑเธเธเธตเธ—เธตเนเธ•เนเธญเธเธชเนเธเนเธซเนเธเธนเนเธเธเธเธฃเธญเธ (LINE Template)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-normal">
              เธเธฑเธ”เธฅเธญเธเธเนเธญเธเธงเธฒเธกเธ”เนเธฒเธเธฅเนเธฒเธเธเธตเนเนเธเธชเนเธเนเธซเนเธเธนเนเธเธเธเธฃเธญเธเธ—เธฒเธ Line เธชเนเธงเธเธ•เธฑเธงเน€เธเธทเนเธญเน€เธฃเธดเนเธกเนเธเนเธเธฒเธ
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
                เธเธดเธ”เธซเธเนเธฒเธ•เนเธฒเธ
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(copyMessage);
                  showToast('๐“ เธเธฑเธ”เธฅเธญเธเธเนเธญเธเธงเธฒเธกเธชเธณเธซเธฃเธฑเธเธชเนเธ Line เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง');
                }}
                className="flex-1 py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-full font-bold text-xs shadow-md cursor-pointer"
              >
                ๐“ เธเธฑเธ”เธฅเธญเธเธเนเธญเธเธงเธฒเธก Line
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Up / Approve Hours Modal (Class Management) */}
      {topUpChild && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto font-['Anuphan',sans-serif]">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#001a3a] flex items-center gap-2">
                  <span>๐“</span>
                  <span>เธเธฑเธ”เธเธฒเธฃเธเธฅเธฒเธช & เน€เธ•เธดเธกเธเธฑเนเธงเนเธกเธเน€เธฃเธตเธขเธ (เธเธทเนเธญเธเธญเธฃเนเธชเน€เธเธดเนเธก)</span>
                </h3>
                <div className="text-xs font-bold text-sky-700 mt-0.5">
                  เธเนเธญเธ {topUpChild.full_name} ({topUpChild.nickname})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTopUpChild(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                โ•
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">Class (เธเธฅเธฒเธชเน€เธฃเธตเธขเธ):</label>
                  <select
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                  >
                    <option value="Orca Cubs">Orca Cubs (เธญเธฒเธขเธธ 4-10 เธเธต)</option>
                    <option value="Mega Orca">Mega Orca (เธญเธฒเธขเธธ 5-15 เธเธต)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001a3a] mb-1.5">Course / เธเธณเธเธงเธเธเธฃเธฑเนเธเธ—เธตเนเธเธทเนเธญเน€เธเธดเนเธก:</label>
                  <select
                    value={hoursToAdd}
                    onChange={(e) => setHoursToAdd(e.target.value ? Number(e.target.value) : '')}
                    className="w-full h-11 px-3 border-2 border-blue-400 rounded-xl text-sm font-bold text-[#001a3a] bg-white outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- เน€เธฅเธทเธญเธเธเธณเธเธงเธเธเธฃเธฑเนเธ --</option>
                    <option value={1}>1 เธเธฃเธฑเนเธ</option>
                    <option value={6}>6 เธเธฃเธฑเนเธ (เนเธเนเธเน€เธเธ 2 เน€เธ”เธทเธญเธ)</option>
                    <option value={12}>12 เธเธฃเธฑเนเธ (เนเธเนเธเน€เธเธ 4 เน€เธ”เธทเธญเธ)</option>
                    <option value={24}>24 เธเธฃเธฑเนเธ (เนเธเนเธเน€เธเธ 6 เน€เธ”เธทเธญเธ / เนเธ–เธก 2 เธเธฃเธฑเนเธ)</option>
                  </select>
                </div>
              </div>

              {/* ๐’ณ Payment Proof Section for Class Management */}
              <div className="pt-3 border-t border-slate-200 mt-2">
                <h4 className="text-xs font-bold text-[#001a3a] mb-3 flex items-center gap-1.5 text-blue-900">
                  <span className="text-base">๐’ณ</span>
                  <span>เธเธฃเธญเธเธเนเธญเธกเธนเธฅเธซเธฅเธฑเธเธเธฒเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ & เนเธเธเธชเธฅเธดเธเนเธญเธเน€เธเธดเธ (Payment Proof)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* เธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเนเธญเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเนเธญเธ (เธเธฒเธ—):</label>
                    <input
                      type="number"
                      value={topUpPaymentAmount}
                      onChange={(e) => setTopUpPaymentAmount(e.target.value)}
                      placeholder="เน€เธเนเธ 4100"
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เน€เธฅเธเธ—เธตเนเธญเนเธฒเธเธญเธดเธเธชเธฅเธดเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เน€เธฅเธเธ—เธตเนเธญเนเธฒเธเธญเธดเธเธชเธฅเธดเธ (Slip Ref No.):</label>
                    <input
                      type="text"
                      value={topUpPaymentRefNo}
                      onChange={(e) => setTopUpPaymentRefNo(e.target.value)}
                      placeholder="เน€เธเนเธ 202609121234"
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เธเธทเนเธญเธเธฑเธเธเธตเธเธนเนเนเธญเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธทเนเธญเธเธฑเธเธเธตเธเธนเนเนเธญเธ:</label>
                    <input
                      type="text"
                      value={topUpPaymentPayerName}
                      onChange={(e) => setTopUpPaymentPayerName(e.target.value)}
                      placeholder="เธเธทเนเธญเธเธนเนเนเธญเธเนเธเธชเธฅเธดเธ"
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เธเธเธฒเธเธฒเธฃเธ•เนเธเธ—เธฒเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธเธฒเธเธฒเธฃเธ•เนเธเธ—เธฒเธเธ—เธตเนเนเธญเธ:</label>
                    <select
                      value={topUpPaymentBank}
                      onChange={(e) => setTopUpPaymentBank(e.target.value)}
                      className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500"
                    >
                      <option value="เธเธชเธดเธเธฃเนเธ—เธข (KBank)">เธเธชเธดเธเธฃเนเธ—เธข (KBank)</option>
                      <option value="เนเธ—เธขเธเธฒเธ“เธดเธเธขเน (SCB)">เนเธ—เธขเธเธฒเธ“เธดเธเธขเน (SCB)</option>
                      <option value="เธเธฃเธธเธเน€เธ—เธ (BBL)">เธเธฃเธธเธเน€เธ—เธ (BBL)</option>
                      <option value="เธเธฃเธธเธเนเธ—เธข (KTB)">เธเธฃเธธเธเนเธ—เธข (KTB)</option>
                      <option value="เธเธฃเธธเธเธจเธฃเธตเธญเธขเธธเธเธขเธฒ (BAY)">เธเธฃเธธเธเธจเธฃเธตเธญเธขเธธเธเธขเธฒ (BAY)</option>
                      <option value="เธญเธญเธกเธชเธดเธ (GSB)">เธญเธญเธกเธชเธดเธ (GSB)</option>
                      <option value="เธ—เธซเธฒเธฃเนเธ—เธขเธเธเธเธฒเธ• (ttb)">เธ—เธซเธฒเธฃเนเธ—เธขเธเธเธเธฒเธ• (ttb)</option>
                      <option value="เธญเธทเนเธเน (เธฃเธฐเธเธธ)">เธญเธทเนเธเน (เธฃเธฐเธเธธ)</option>
                    </select>
                    {topUpPaymentBank === 'เธญเธทเนเธเน (เธฃเธฐเธเธธ)' && (
                      <input
                        type="text"
                        value={topUpPaymentBankOther}
                        onChange={(e) => setTopUpPaymentBankOther(e.target.value)}
                        placeholder="เธฃเธฐเธเธธเธเธทเนเธญเธเธเธฒเธเธฒเธฃ"
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs mt-2 outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* เธงเธฑเธ-เน€เธงเธฅเธฒเธ—เธตเนเนเธญเธ (เธฃเธนเธเนเธเธเธเธเธดเธ—เธดเธ) */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธงเธฑเธ-เน€เธงเธฅเธฒเธ—เธตเนเนเธญเธ (เธฃเธนเธเนเธเธเธเธเธดเธ—เธดเธ):</label>
                    <input
                      type="datetime-local"
                      value={topUpPaymentDateTime}
                      onChange={(e) => setTopUpPaymentDateTime(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เนเธเธเนเธเธฅเนเธชเธฅเธดเธเธเธฒเธฃเนเธญเธเน€เธเธดเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เนเธเธเนเธเธฅเนเธชเธฅเธดเธเนเธญเธเน€เธเธดเธ (เธ–เนเธฒเธกเธต):</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTopUpPaymentSlipFile(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {topUpPaymentSlipFile && (
                      <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <img src={topUpPaymentSlipFile} alt="Slip Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                        <div className="flex-1 text-xs text-emerald-700 font-bold">โ… เนเธเธเธชเธฅเธดเธเนเธญเธเน€เธเธดเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง</div>
                        <button
                          type="button"
                          onClick={() => setTopUpPaymentSlipFile(null)}
                          className="text-xs text-rose-600 hover:underline font-bold border-none bg-transparent cursor-pointer"
                        >
                          เธฅเธเธฃเธนเธ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธฑเธเธ—เธถเธเน€เธเธดเนเธกเน€เธ•เธดเธก (เธชเธณเธซเธฃเธฑเธ Audit Log):</label>
                <input
                  type="text"
                  value={topUpNote}
                  onChange={(e) => setTopUpNote(e.target.value)}
                  placeholder="เน€เธเนเธ เธเธทเนเธญเธเธญเธฃเนเธชเน€เธเธดเนเธกเนเธเนเธเน€เธเธ 6 เธเธฃเธฑเนเธ เนเธญเธเน€เธเธดเธเธงเธฑเธเธ—เธตเน 12/09"
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm text-[#001a3a] outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setTopUpChild(null)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-full font-bold text-sm cursor-pointer"
                >
                  เธขเธเน€เธฅเธดเธ
                </button>
                <button type="submit" className="flex-1 h-11 bg-[#001a3a] hover:bg-[#002244] text-white font-bold text-sm rounded-full shadow-md cursor-pointer">
                  Approve & เน€เธ•เธดเธกเธเธฑเนเธงเนเธกเธ (เธเธฑเธเธ—เธถเธเธชเธฅเธดเธเน€เธเธดเนเธก)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Image View Modal */}
      {selectedSlipPreview && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full rounded-3xl p-5 shadow-2xl relative flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-3">
              <h3 className="text-base font-bold text-[#001a3a]">๐งพ เธซเธฅเธฑเธเธเธฒเธเธชเธฅเธดเธเธเธฒเธฃเนเธญเธเน€เธเธดเธ</h3>
              <button
                type="button"
                onClick={() => setSelectedSlipPreview(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                โ•
              </button>
            </div>
            <img src={selectedSlipPreview} alt="Payment Slip" className="max-h-[70vh] object-contain rounded-2xl border border-slate-200" />
            <button
              type="button"
              onClick={() => setSelectedSlipPreview(null)}
              className="mt-4 px-6 py-2.5 bg-[#001a3a] hover:bg-[#002244] text-white rounded-full text-xs font-bold cursor-pointer shadow-md"
            >
              เธเธดเธ”เธซเธเนเธฒเธ•เนเธฒเธ
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
                <span>โ๏ธ</span>
                <span>เนเธเนเนเธเธเนเธญเธกเธนเธฅเธเธฑเธเธเธตเธเธนเนเธเธเธเธฃเธญเธ ({editingParent.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                โœ•
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
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธญเธตเน€เธกเธฅเธเธนเนเธเธเธเธฃเธญเธ:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน:</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธฃเธซเธฑเธชเธเนเธฒเธ (Password):</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                />
              </div>

              {/* ๐ฏ Purchased Hours / Quota */}
              <div className="sm:col-span-2 bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5 flex items-center justify-between">
                  <span>เนเธเธงเธ•เนเธฒเธเธณเธเธงเธเธเธฃเธฑเนเธ/เธเธฑเนเธงเนเธกเธเน€เธฃเธตเธขเธเธ—เธตเนเธเธทเนเธญ (Purchased Hours):</span>
                  <span className="text-[11px] text-blue-700 font-bold">* เนเธเธงเธ•เนเธฒเธฃเธงเธกเธ•เธฐเธเธฃเนเธฒเธเธฃเธญเธเธเธฃเธฑเธง</span>
                </label>
                <select
                  value={editPurchasedHours}
                  onChange={(e) => setEditPurchasedHours(Number(e.target.value))}
                  className="w-full h-11 px-4 border-2 border-blue-400 rounded-xl text-sm font-bold text-[#001a3a] bg-white outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value={1}>1 เธเธฃเธฑเนเธ</option>
                  <option value={6}>6 เธเธฃเธฑเนเธ (เนเธเนเธเน€เธเธ 2 เน€เธ”เธทเธญเธ)</option>
                  <option value={12}>12 เธเธฃเธฑเนเธ (เนเธเนเธเน€เธเธ 4 เน€เธ”เธทเธญเธ)</option>
                  <option value={24}>24 เธเธฃเธฑเนเธ (เนเธเนเธเน€เธเธ 6 เน€เธ”เธทเธญเธ)</option>
                </select>
              </div>

              {/* ๐’ณ Payment Proof Section */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-200 mt-2">
                <h4 className="text-xs font-bold text-[#001a3a] mb-3 flex items-center gap-1.5 text-blue-900">
                  <span className="text-base">๐’ณ</span>
                  <span>เนเธเนเนเธเธเนเธญเธกเธนเธฅเธซเธฅเธฑเธเธเธฒเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ (Payment Proof)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* เธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเนเธญเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเนเธญเธ (เธเธฒเธ—):</label>
                    <input
                      type="number"
                      value={editPaymentAmount}
                      onChange={(e) => setEditPaymentAmount(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เน€เธฅเธเธ—เธตเนเธญเนเธฒเธเธญเธดเธเธชเธฅเธดเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เน€เธฅเธเธ—เธตเนเธญเนเธฒเธเธญเธดเธเธชเธฅเธดเธ (Slip Ref No.):</label>
                    <input
                      type="text"
                      value={editPaymentRefNo}
                      onChange={(e) => setEditPaymentRefNo(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เธเธทเนเธญเธเธฑเธเธเธตเธเธนเนเนเธญเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธทเนเธญเธเธฑเธเธเธตเธเธนเนเนเธญเธ:</label>
                    <input
                      type="text"
                      value={editPaymentPayerName}
                      onChange={(e) => setEditPaymentPayerName(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-normal text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เธเธเธฒเธเธฒเธฃเธ•เนเธเธ—เธฒเธ */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธเธเธฒเธเธฒเธฃเธ•เนเธเธ—เธฒเธเธ—เธตเนเนเธญเธ:</label>
                    <select
                      value={editPaymentBank}
                      onChange={(e) => setEditPaymentBank(e.target.value)}
                      className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500"
                    >
                      <option value="">-- เน€เธฅเธทเธญเธเธเธเธฒเธเธฒเธฃ --</option>
                      <option value="เธเธชเธดเธเธฃเนเธ—เธข (KBank)">เธเธชเธดเธเธฃเนเธ—เธข (KBank)</option>
                      <option value="เนเธ—เธขเธเธฒเธ“เธดเธเธขเน (SCB)">เนเธ—เธขเธเธฒเธ“เธดเธเธขเน (SCB)</option>
                      <option value="เธเธฃเธธเธเน€เธ—เธ (BBL)">เธเธฃเธธเธเน€เธ—เธ (BBL)</option>
                      <option value="เธเธฃเธธเธเนเธ—เธข (KTB)">เธเธฃเธธเธเนเธ—เธข (KTB)</option>
                      <option value="เธเธฃเธธเธเธจเธฃเธตเธญเธขเธธเธเธขเธฒ (BAY)">เธเธฃเธธเธเธจเธฃเธตเธญเธขเธธเธเธขเธฒ (BAY)</option>
                      <option value="เธญเธญเธกเธชเธดเธ (GSB)">เธญเธญเธกเธชเธดเธ (GSB)</option>
                      <option value="เธ—เธซเธฒเธฃเนเธ—เธขเธเธเธเธฒเธ• (ttb)">เธ—เธซเธฒเธฃเนเธ—เธขเธเธเธเธฒเธ• (ttb)</option>
                      <option value="เธญเธทเนเธเน (เธฃเธฐเธเธธ)">เธญเธทเนเธเน (เธฃเธฐเธเธธ)</option>
                    </select>
                    {editPaymentBank === 'เธญเธทเนเธเน (เธฃเธฐเธเธธ)' && (
                      <input
                        type="text"
                        value={editPaymentBankOther}
                        onChange={(e) => setEditPaymentBankOther(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs mt-2 outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* เธงเธฑเธ-เน€เธงเธฅเธฒเธ—เธตเนเนเธญเธ (เธฃเธนเธเนเธเธเธเธเธดเธ—เธดเธ) */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธงเธฑเธ-เน€เธงเธฅเธฒเธ—เธตเนเนเธญเธ (เธฃเธนเธเนเธเธเธเธเธดเธ—เธดเธ):</label>
                    <input
                      type="datetime-local"
                      value={editPaymentDateTime}
                      onChange={(e) => setEditPaymentDateTime(e.target.value)}
                      className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเธชเธฅเธดเธเน€เธเธดเธ (เธ–เนเธฒเธกเธต) */}
                  <div>
                    <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธญเธฑเธเนเธซเธฅเธ”/เน€เธเธฅเธตเนเธขเธเนเธเธฅเนเธชเธฅเธดเธเน€เธเธดเธ (เธ–เนเธฒเธกเธต):</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditPaymentSlipFile(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {editPaymentSlipFile && (
                      <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <img src={editPaymentSlipFile} alt="Slip Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                        <div className="flex-1 text-xs text-emerald-700 font-bold">โ… เธกเธตเนเธเธฅเนเธชเธฅเธดเธเนเธญเธเน€เธเธดเธ</div>
                        <button
                          type="button"
                          onClick={() => setEditPaymentSlipFile(null)}
                          className="text-xs text-rose-600 hover:underline font-bold border-none bg-transparent cursor-pointer"
                        >
                          เธฅเธเธฃเธนเธ
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
                  เธขเธเน€เธฅเธดเธ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-full shadow-md cursor-pointer"
                >
                  ๐’พ เธเธฑเธเธ—เธถเธเธเธฒเธฃเนเธเนเนเธ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Booking Override Modal */}
      {adminBookingChild && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl font-['Anuphan',sans-serif]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#001a3a] flex items-center gap-2">
                <span>๐“…</span>
                <span>Admin เธเธญเธเธเธฅเธฒเธชเน€เธฃเธตเธขเธเนเธ—เธเธเธนเนเธเธเธเธฃเธญเธ</span>
              </h3>
              <button
                type="button"
                onClick={() => setAdminBookingChild(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                โ•
              </button>
            </div>

            <div className="mb-4 bg-sky-50 border border-sky-200 p-3 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-[#001a3a] text-sm">
                เธเนเธญเธ {adminBookingChild.nickname} ({adminBookingChild.full_name})
              </div>
              <div className="text-slate-600 font-normal">
                เธเธฅเธฒเธช: <strong>{adminBookingChild.course_name}</strong> | เธเธฑเนเธงเนเธกเธเธเธเน€เธซเธฅเธทเธญ: <strong className="text-blue-700">{adminBookingChild.total_hours - adminBookingChild.used_hours} เธเธก.</strong>
              </div>
              <div className="text-[11px] text-amber-800 font-bold mt-1">
                โก เธชเธดเธ—เธเธดเน Admin: เธชเธฒเธกเธฒเธฃเธ–เธเธญเธเธงเธฑเธเนเธ”เธเนเนเธ”เน (เธฃเธงเธกเธ–เธถเธเธงเธฑเธเธเธตเน/เธงเธฑเธเธเธฃเธธเนเธเธเธตเน) เนเธ”เธขเธฃเธฐเธเธเธเธฐเธ•เธฑเธ” 1 เธเธก. เธเธฒเธเธ•เธฃเธฐเธเธฃเนเธฒเธเธฃเธญเธเธเธฃเธฑเธงเธญเธฑเธ•เนเธเธกเธฑเธ•เธด
              </div>
            </div>

            <form onSubmit={handleAdminBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธงเธฑเธเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเน€เธเนเธฒเน€เธฃเธตเธขเธ (เน€เธฅเธทเธญเธเธงเธฑเธเนเธ”เธเนเนเธ”เน):</label>
                <input
                  type="date"
                  value={adminBookingDate}
                  onChange={(e) => setAdminBookingDate(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001a3a] mb-1.5">เธฃเธญเธเน€เธงเธฅเธฒเน€เธฃเธตเธขเธ:</label>
                <select
                  value={adminBookingSlot}
                  onChange={(e) => setAdminBookingSlot(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500"
                >
                  {adminBookingChild.course_name?.includes('Mega') ? (
                    <>
                      <option value="10:00-12:00">10:00-12:00 (Mega Orca)</option>
                      <option value="14:00-16:00">14:00-16:00 (เน€เธชเธฒเธฃเน-เธญเธฒเธ—เธดเธ•เธขเน)</option>
                      <option value="17:30-19:30">17:30-19:30 (เธญเธฑเธเธเธฒเธฃ-เธจเธธเธเธฃเน)</option>
                    </>
                  ) : (
                    <>
                      <option value="09:00-10:30">09:00-10:30 (เน€เธชเธฒเธฃเน-เธญเธฒเธ—เธดเธ•เธขเน)</option>
                      <option value="10:30-12:00">10:30-12:00</option>
                      <option value="13:00-14:30">13:00-14:30 (เน€เธชเธฒเธฃเน-เธญเธฒเธ—เธดเธ•เธขเน)</option>
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
                  เธขเธเน€เธฅเธดเธ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-full shadow-md cursor-pointer"
                >
                  ๐“… เธเธฑเธเธ—เธถเธเธเธฒเธฃเธเธญเธเนเธ—เธ
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
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0 animate-pulse">
                ๐””
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-[#001a3a]">เธกเธตเน€เธ”เนเธเธฃเธญเนเธซเน Admin Approve!</h4>
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {children.filter(c => c.status === 'pending').length} เธเธ
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-normal">
                  เธกเธตเธฃเธฒเธขเธเธฒเธฃเน€เธ”เนเธเนเธซเธกเนเธฅเธเธ—เธฐเน€เธเธตเธขเธ เธฃเธญเนเธซเนเนเธญเธ”เธกเธดเธเธ•เธฃเธงเธเธชเธญเธเนเธฅเธฐเธญเธเธธเธกเธฑเธ•เธดเธเธญเธฃเนเธช
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setDismissPendingToast(true)} 
              className="text-slate-400 hover:text-slate-600 font-bold text-sm w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="เธเนเธญเธเธเธฒเธฃเนเธเนเธเน€เธ•เธทเธญเธ"
            >
              โ•
            </button>
          </div>

          {/* List of Pending Children preview */}
          <div className="mt-3 max-h-32 overflow-y-auto space-y-1.5 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
            {children.filter(c => c.status === 'pending').map((c) => (
              <div key={c.id} className="text-xs text-[#001a3a] flex items-center justify-between font-semibold">
                <span>๐‘ถ {c.full_name} <span className="text-sky-700 font-bold">({c.nickname})</span></span>
                <span className="text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md font-bold">เธฃเธญเธญเธเธธเธกเธฑเธ•เธด</span>
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
              ๐” เธ”เธนเนเธเธซเธเนเธฒเธเนเธญเธกเธนเธฅเน€เธ”เนเธ
            </button>
            <button
              type="button"
              onClick={handleApproveAllPending}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold py-2 px-3 rounded-xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <span>โก เธญเธเธธเธกเธฑเธ•เธดเธ—เธฑเธเธ—เธต</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">เธเธณเธฅเธฑเธเนเธซเธฅเธ” Admin Dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

