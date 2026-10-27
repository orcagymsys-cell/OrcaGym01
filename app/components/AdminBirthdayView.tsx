'use client';
import { useState, useMemo } from 'react';
import { Child, UserProfile } from '@/lib/types';
import { showToast } from '@/components/Toast';

interface AdminBirthdayViewProps {
  childrenList: Child[];
  parentsList: UserProfile[];
  onViewChildDetails?: (child: Child) => void;
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

export function parseChildDob(dob: string | undefined | null) {
  if (!dob) return null;
  const str = String(dob).trim().split('T')[0];
  let year = 0, month = 0, day = 0;
  if (str.includes('-')) {
    const parts = str.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (str.includes('/')) {
    const parts = str.split('/');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }
  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (year > 2500) year -= 543;
  return { year, month, day };
}

export function isChildOfParent(c: Child, p: any): boolean {
  if (!c || !p) return false;
  const cPId = c.parent_id ? String(c.parent_id).toLowerCase().trim() : '';
  if (!cPId) return false;

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
    const pParts = pName.split(/\s+/);
    const cParts = cFullName.split(/\s+/);
    if (cParts.length > 1 && pParts.length > 1) {
      const cSurname = cParts[cParts.length - 1];
      const pSurname = pParts[pParts.length - 1];
      if (cSurname.length >= 2 && cSurname === pSurname) return true;
    }
  }

  return false;
}

export function calculateAgeDetailed(dob: string | undefined | null): string {
  if (!dob) return '-';
  const parsed = parseChildDob(dob);
  if (!parsed) return '-';
  const birth = new Date(parsed.year, parsed.month - 1, parsed.day);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (today.getDate() < birth.getDate()) {
    months--;
    if (months < 0) months += 12;
  }

  if (years > 0 && months > 0) return `${years} ปี ${months} เดือน`;
  if (years > 0) return `${years} ปี`;
  if (months > 0) return `${months} เดือน`;
  return `น้อยกว่า 1 เดือน`;
}

/**
 * ChildAvatar Component
 * Matches the exact design from the Parent screen (app/home/page.tsx:642 & 665)
 * Shows a circular avatar with soft sky-blue background, slate border,
 * and the 3D-style child emoji (👧🏻 for girls, 🧒🏼 for boys) when no photo is provided.
 */
function ChildAvatar({ child, size = 'md' }: { child: Child; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false);

  // Exact gender-based matching as in Parent screen
  const isGirl =
    child.gender?.toLowerCase() === 'girl' ||
    child.gender?.toLowerCase() === 'female' ||
    child.gender === 'หญิง' ||
    child.avatar === 'girl';
  const avatarEmoji = isGirl ? '👧🏻' : '🧒🏼';

  // Validate that photo_url is a real image URL/data URI, NOT an avatar string like "boy" or "girl"
  const hasValidPhoto =
    !imgError &&
    typeof child.photo_url === 'string' &&
    (child.photo_url.startsWith('http://') ||
      child.photo_url.startsWith('https://') ||
      child.photo_url.startsWith('data:image/') ||
      child.photo_url.startsWith('/'));

  const sizeClasses = {
    sm: 'w-9 h-9 text-lg border-[2px]',
    md: 'w-14 h-14 text-2xl border-[3px]',
    lg: 'w-20 h-20 text-3xl border-[3.5px]',
  }[size];

  return (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden shrink-0 border-slate-300 bg-sky-100 flex items-center justify-center shadow-inner select-none`}
    >
      {hasValidPhoto ? (
        <img
          src={child.photo_url}
          alt={child.nickname || child.full_name || 'รูปน้อง'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="leading-none">{avatarEmoji}</span>
      )}
    </div>
  );
}

export interface ProcessedBirthdayItem {
  child: Child;
  parent: UserProfile | null;
  parsedDob: { year: number; month: number; day: number };
  birthDateFormatted: string; // e.g. "27 ต.ค. 2563"
  birthDateFullFormatted: string; // e.g. "27 ตุลาคม 2563"
  nextBdayDate: Date;
  nextBdayDayOfWeek: string;
  nextBdayFormatted: string;
  daysUntil: number; // 0 = today, 1 = tomorrow, ...
  isToday: boolean;
  isTomorrow: boolean;
  isThisWeek: boolean; // <= 7 days
  isBornInThisMonth: boolean; // birth month === current month
  turningAge: number;
  currentAgeText: string;
}

export default function AdminBirthdayView({
  childrenList,
  parentsList,
  onViewChildDetails,
}: AdminBirthdayViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'today_week' | 'month' | 'next_30'>('today_week');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Process and sort all children from today onwards
  const { allItems, todayItems, next7DaysItems, thisMonthItems, countsByMonth } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentYear = today.getFullYear();
    const currentMonth0 = now.getMonth();

    const monthCounts = Array(12).fill(0);
    const processed: ProcessedBirthdayItem[] = [];

    for (const child of childrenList || []) {
      const parsed = parseChildDob(child.dob);
      if (!parsed) continue;

      monthCounts[parsed.month - 1]++;

      // Calculate next birthday occurrence
      let nextBday = new Date(currentYear, parsed.month - 1, parsed.day);
      if (nextBday < today) {
        nextBday = new Date(currentYear + 1, parsed.month - 1, parsed.day);
      }

      const diffTime = nextBday.getTime() - today.getTime();
      const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const isToday = daysUntil === 0;
      const isTomorrow = daysUntil === 1;
      const isThisWeek = daysUntil >= 0 && daysUntil <= 7;
      const isBornInThisMonth = (parsed.month - 1) === currentMonth0;
      const turningAge = nextBday.getFullYear() - parsed.year;
      const currentAgeText = calculateAgeDetailed(child.dob);

      const parent = (parentsList || []).find((p) => isChildOfParent(child, p)) || null;

      processed.push({
        child,
        parent,
        parsedDob: parsed,
        birthDateFormatted: `${parsed.day} ${THAI_MONTHS_SHORT[parsed.month - 1]} ${parsed.year + 543}`,
        birthDateFullFormatted: `${parsed.day} ${THAI_MONTHS_FULL[parsed.month - 1]} ${parsed.year + 543}`,
        nextBdayDate: nextBday,
        nextBdayDayOfWeek: THAI_DAYS[nextBday.getDay()],
        nextBdayFormatted: `${nextBday.getDate()} ${THAI_MONTHS_SHORT[nextBday.getMonth()]} ${nextBday.getFullYear() + 543}`,
        daysUntil,
        isToday,
        isTomorrow,
        isThisWeek,
        isBornInThisMonth,
        turningAge,
        currentAgeText,
      });
    }

    // Sort strictly from today onwards (daysUntil: 0, 1, 2, ... 365)
    processed.sort((a, b) => a.daysUntil - b.daysUntil);

    const todayList = processed.filter((item) => item.isToday);
    const next7DaysList = processed.filter((item) => item.isThisWeek);
    const thisMonthList = processed.filter((item) => item.isBornInThisMonth);

    return {
      allItems: processed,
      todayItems: todayList,
      next7DaysItems: next7DaysList,
      thisMonthItems: thisMonthList,
      countsByMonth: monthCounts,
    };
  }, [childrenList, parentsList]);

  // Filtered list based on active filters
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nickname = (item.child.nickname || '').toLowerCase();
        const fullName = (item.child.full_name || '').toLowerCase();
        const course = (item.child.course_name || '').toLowerCase();
        const parentName = (item.parent?.name || '').toLowerCase();
        const parentPhone = (item.parent?.phone || '').replace(/[^0-9]/g, '');
        const qClean = q.replace(/[^0-9]/g, '');

        const matchesName = nickname.includes(q) || fullName.includes(q) || course.includes(q) || parentName.includes(q);
        const matchesPhone = qClean.length >= 3 && parentPhone.includes(qClean);

        if (!matchesName && !matchesPhone) return false;
      }

      // 2. Specific Month Filter
      if (selectedMonth !== 'all') {
        if (item.parsedDob.month !== selectedMonth) return false;
      }

      // 3. Filter Type
      if (filterType === 'today_week') {
        return item.isThisWeek;
      }
      if (filterType === 'month') {
        return item.isBornInThisMonth;
      }
      if (filterType === 'next_30') {
        return item.daysUntil <= 30;
      }

      return true; // 'all'
    });
  }, [allItems, filterType, selectedMonth, searchQuery]);

  // Copy Birthday Greeting Message for LINE
  const handleCopyBirthdayWish = (item: ProcessedBirthdayItem) => {
    const nickname = item.child.nickname || item.child.full_name || 'น้อง';
    const text = `🎂 สุขสันต์วันเกิดน้อง${nickname}! 🎉✨\nทีมโค้ชและครอบครัว ORCA GYM ขอให้น้องมีความสุข สุขภาพแข็งแรง ร่าเริงสดใส เป็นเด็กดี และสนุกกับทุกคลาสเรียนนะคะ 🎈💙`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`คัดลอกคำอวยพรวันเกิดของน้อง${nickname} แล้ว! นำไปส่งใน LINE ผู้ปกครองได้เลยค่ะ 🎂`);
      }).catch(() => {
        fallbackCopyText(text, nickname);
      });
    } else {
      fallbackCopyText(text, nickname);
    }
  };

  const fallbackCopyText = (text: string, nickname: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(`คัดลอกคำอวยพรวันเกิดของน้อง${nickname} แล้ว! 🎂`);
    } catch (e) {
      alert(text);
    }
    document.body.removeChild(textarea);
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard?.writeText(phone);
    showToast(`คัดลอกเบอร์โทร ${phone} แล้วค่ะ 📞`);
  };

  const currentMonthIndex = new Date().getMonth();

  return (
    <div className="space-y-6 animate-fade-in font-['Anuphan',sans-serif]">
      {/* 1. Header Banner & Quick Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today */}
        <button
          type="button"
          onClick={() => {
            setFilterType('today_week');
            setSelectedMonth('all');
            setSearchQuery('');
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
            todayItems.length > 0
              ? 'bg-gradient-to-br from-amber-500 via-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200/50 border-transparent hover:scale-[1.02]'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">🎂</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              todayItems.length > 0 ? 'bg-white/25 text-white backdrop-blur-sm' : 'bg-slate-100 text-slate-500'
            }`}>
              วันนี้
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold ${todayItems.length > 0 ? 'text-white' : 'text-[#001a3a]'}`}>
              {todayItems.length} <span className="text-sm font-semibold">คน</span>
            </div>
            <p className={`text-xs mt-0.5 ${todayItems.length > 0 ? 'text-white/90' : 'text-slate-500'}`}>
              {todayItems.length > 0 ? '🎉 มีน้องเกิดวันนี้!' : 'ไม่มีน้องเกิดวันนี้'}
            </p>
          </div>
        </button>

        {/* Card 2: Next 7 Days */}
        <button
          type="button"
          onClick={() => {
            setFilterType('today_week');
            setSelectedMonth('all');
            setSearchQuery('');
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
            filterType === 'today_week' && selectedMonth === 'all'
              ? 'bg-[#001a3a] text-white shadow-md border-transparent'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">🎈</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              filterType === 'today_week' && selectedMonth === 'all' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
            }`}>
              7 วันนี้
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold ${filterType === 'today_week' && selectedMonth === 'all' ? 'text-white' : 'text-[#001a3a]'}`}>
              {next7DaysItems.length} <span className="text-sm font-semibold">คน</span>
            </div>
            <p className={`text-xs mt-0.5 ${filterType === 'today_week' && selectedMonth === 'all' ? 'text-white/80' : 'text-slate-500'}`}>
              กำลังจะถึงใน 7 วันนี้
            </p>
          </div>
        </button>

        {/* Card 3: This Month */}
        <button
          type="button"
          onClick={() => {
            setFilterType('month');
            setSelectedMonth('all');
            setSearchQuery('');
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
            filterType === 'month' && selectedMonth === 'all'
              ? 'bg-[#001a3a] text-white shadow-md border-transparent'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">🗓️</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              filterType === 'month' && selectedMonth === 'all' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'
            }`}>
              {THAI_MONTHS_SHORT[currentMonthIndex]}
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold ${filterType === 'month' && selectedMonth === 'all' ? 'text-white' : 'text-[#001a3a]'}`}>
              {thisMonthItems.length} <span className="text-sm font-semibold">คน</span>
            </div>
            <p className={`text-xs mt-0.5 ${filterType === 'month' && selectedMonth === 'all' ? 'text-white/80' : 'text-slate-500'}`}>
              เกิดในเดือน{THAI_MONTHS_FULL[currentMonthIndex]}
            </p>
          </div>
        </button>

        {/* Card 4: All Kids with Birthday */}
        <button
          type="button"
          onClick={() => {
            setFilterType('all');
            setSelectedMonth('all');
            setSearchQuery('');
          }}
          className={`p-4 sm:p-5 rounded-3xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
            filterType === 'all' && selectedMonth === 'all'
              ? 'bg-[#001a3a] text-white shadow-md border-transparent'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">👥</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              filterType === 'all' && selectedMonth === 'all' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              เรียงรอบปี
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold ${filterType === 'all' && selectedMonth === 'all' ? 'text-white' : 'text-[#001a3a]'}`}>
              {allItems.length} <span className="text-sm font-semibold">คน</span>
            </div>
            <p className={`text-xs mt-0.5 ${filterType === 'all' && selectedMonth === 'all' ? 'text-white/80' : 'text-slate-500'}`}>
              มีข้อมูลวันเกิดในระบบ
            </p>
          </div>
        </button>
      </div>

      {/* 2. Today's Birthday Spotlight (Show celebratory banner if any child has birthday today) */}
      {todayItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 rounded-3xl p-5 sm:p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl animate-bounce">🎂</span>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-wide">
                  🎉 สุขสันต์วันเกิดน้องๆ วันนี้! (Happy Birthday Today)
                </h3>
                <p className="text-xs sm:text-sm text-white/90">
                  มีน้องเกิดในวันนี้ทั้งหมด {todayItems.length} คน อย่าลืมร่วมอวยพรน้องๆ และครอบครัวนะคะ
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayItems.map((item) => (
              <div
                key={item.child.id}
                className="bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl p-4 shadow-sm border border-white/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                      ✨ เกิดวันนี้ ครบ {item.turningAge} ขวบ!
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {item.child.course_name || 'คอร์สเรียน'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-2">
                    <ChildAvatar child={item.child} size="md" />
                    <div>
                      <h4 className="font-extrabold text-[#001a3a] text-base leading-tight">
                        น้อง{item.child.nickname || '-'}
                      </h4>
                      <p className="text-xs text-slate-500 truncate max-w-[170px]">
                        {item.child.full_name || '-'}
                      </p>
                    </div>
                  </div>

                  {item.parent && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2 mt-2 space-y-0.5">
                      <div>👨‍👩‍👦 ชื่อผู้ปกครอง: <strong className="text-slate-800">{item.parent.name || '-'}</strong></div>
                      {item.parent.phone && (
                        <div className="flex items-center justify-between">
                          <span>📞 {item.parent.phone}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyPhone(item.parent?.phone || '', e)}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            คัดลอก
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCopyBirthdayWish(item)}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span>
                    <span>คัดลอกคำอวยพร LINE</span>
                  </button>
                  {onViewChildDetails && (
                    <button
                      type="button"
                      onClick={() => onViewChildDetails(item.child)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer"
                      title="ดูข้อมูลนักเรียน"
                    >
                      👁️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Toolbar: Search, Filters & View Mode */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setFilterType('today_week');
                setSelectedMonth('all');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'today_week' && selectedMonth === 'all'
                  ? 'bg-[#001a3a] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>🎈</span>
              <span>วันนี้ & 7 วันนี้ ({next7DaysItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterType('month');
                setSelectedMonth('all');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'month' && selectedMonth === 'all'
                  ? 'bg-[#001a3a] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>🗓️</span>
              <span>เดือนนี้ ({thisMonthItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterType('next_30');
                setSelectedMonth('all');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'next_30' && selectedMonth === 'all'
                  ? 'bg-[#001a3a] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>⚡</span>
              <span>30 วันข้างหน้า</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterType('all');
                setSelectedMonth('all');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'all' && selectedMonth === 'all'
                  ? 'bg-[#001a3a] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>📋</span>
              <span>ทั้งหมดเรียงจากวันนี้ไป ({allItems.length})</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#001a3a] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>🎴</span>
              <span>การ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#001a3a] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>📊</span>
              <span>ตาราง</span>
            </button>
          </div>
        </div>

        {/* Search & Month Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative w-full sm:flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อน้อง, ชื่อเล่น, ผู้ปกครอง, คอร์ส หรือเบอร์โทร..."
              className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#001a3a] outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">เดือนเกิด:</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                setSelectedMonth(val);
                if (val !== 'all') {
                  setFilterType('all');
                }
              }}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#001a3a] outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">ทุกเดือน (ม.ค. - ธ.ค.)</option>
              {THAI_MONTHS_FULL.map((mName, idx) => (
                <option key={idx} value={idx + 1}>
                  {mName} ({countsByMonth[idx]} คน)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Content Area: Cards or Table View */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center shadow-xs">
          <span className="text-5xl">🎈</span>
          <h4 className="text-base font-extrabold text-[#001a3a] mt-3">
            ไม่พบข้อมูลวันเกิดในช่วงนี้
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `ไม่พบผลการค้นหาสำหรับ "${searchQuery}" ลองเปลี่ยนคำค้นหาดูนะคะ`
              : 'ลองเปลี่ยนตัวกรองเป็น "ทั้งหมดเรียงจากวันนี้ไป" เพื่อดูวันเกิดตลอดทั้งปี'}
          </p>
          {(filterType !== 'all' || selectedMonth !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilterType('all');
                setSelectedMonth('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-full text-xs font-bold bg-[#001a3a] text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isToday = item.isToday;
            const isSoon = item.daysUntil <= 7;

            return (
              <div
                key={item.child.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between hover:shadow-md ${
                  isToday
                    ? 'border-rose-400 ring-2 ring-rose-200 shadow-md'
                    : isSoon
                    ? 'border-amber-300 shadow-xs'
                    : 'border-slate-200/90 shadow-2xs'
                }`}
              >
                <div>
                  {/* Top Badge: Days countdown */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {isToday ? (
                      <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-2xs animate-pulse">
                        🎉 เกิดวันนี้! สุขสันต์วันเกิด
                      </span>
                    ) : item.isTomorrow ? (
                      <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full">
                        ⚡ พรุ่งนี้ (อีก 1 วัน)
                      </span>
                    ) : isSoon ? (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-3 py-1 rounded-full">
                        🎈 อีก {item.daysUntil} วัน ({item.nextBdayDayOfWeek.replace('วัน', '')}ที่ {item.nextBdayDate.getDate()} {THAI_MONTHS_SHORT[item.nextBdayDate.getMonth()]})
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-full">
                        🗓️ อีก {item.daysUntil} วัน ({item.nextBdayFormatted})
                      </span>
                    )}

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 max-w-[120px] truncate">
                      {item.child.course_name || 'ORCA GYM'}
                    </span>
                  </div>

                  {/* Child Avatar & Name */}
                  <div className="flex items-center gap-3.5 my-3">
                    <ChildAvatar child={item.child} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-[#001a3a] text-lg leading-tight truncate">
                          น้อง{item.child.nickname || '-'}
                        </h4>
                        <span className="text-xs">
                          {item.child.gender === 'female' || item.child.gender === 'หญิง' ? '👧' : '👦'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.child.full_name || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Birthday & Age Details */}
                  <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">🎂 วันเกิด:</span>
                      <strong className="text-slate-800">{item.birthDateFullFormatted}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">🎈 อายุที่จะครบ:</span>
                      <strong className="text-rose-600 font-extrabold">จะครบ {item.turningAge} ขวบ</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                      <span>อายุปัจจุบัน:</span>
                      <span>{item.currentAgeText}</span>
                    </div>
                  </div>

                  {/* Parent Information */}
                  {item.parent && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-sky-50/50 border border-sky-100/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">👨‍👩‍👦 ชื่อผู้ปกครอง:</span>
                        <strong className="text-slate-800 truncate max-w-[170px]">
                          {item.parent.name || '-'}
                        </strong>
                      </div>
                      {item.parent.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">📞 เบอร์โทร:</span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${item.parent.phone}`}
                              className="font-bold text-blue-700 hover:underline"
                            >
                              {item.parent.phone}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopyPhone(item.parent?.phone || '', e)}
                              className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="คัดลอกเบอร์โทร"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCopyBirthdayWish(item)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span>
                    <span>คัดลอกคำอวยพร LINE</span>
                  </button>
                  {onViewChildDetails && (
                    <button
                      type="button"
                      onClick={() => onViewChildDetails(item.child)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
                      title="ดูข้อมูลนักเรียนเต็มรูปแบบ"
                    >
                      👁️ ดูข้อมูล
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-[#001a3a] text-white font-bold">
                  <th className="py-3.5 px-4 w-[6%] text-center">ลำดับ</th>
                  <th className="py-3.5 px-4 w-[24%]">ชื่อนักเรียน (ชื่อเล่น & ชื่อจริง)</th>
                  <th className="py-3.5 px-4 w-[16%]">วันเกิด</th>
                  <th className="py-3.5 px-4 w-[12%] text-center">อายุที่จะครบ</th>
                  <th className="py-3.5 px-4 w-[14%]">นับถอยหลัง</th>
                  <th className="py-3.5 px-4 w-[12%]">คอร์ส</th>
                  <th className="py-3.5 px-4 w-[16%]">ชื่อผู้ปกครอง / เบอร์โทร</th>
                  <th className="py-3.5 px-4 w-[10%] text-center">อวยพร LINE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const isToday = item.isToday;
                  const isSoon = item.daysUntil <= 7;

                  return (
                    <tr
                      key={item.child.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isToday ? 'bg-rose-50/60 font-semibold' : isSoon ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <ChildAvatar child={item.child} size="sm" />
                          <div>
                            <div className="font-bold text-[#001a3a] flex items-center gap-1">
                              <span>น้อง{item.child.nickname || '-'}</span>
                              <span className="text-[10px]">
                                {item.child.gender === 'female' || item.child.gender === 'หญิง' ? '👧' : '👦'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {item.child.full_name || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div>{item.birthDateFormatted}</div>
                        <div className="text-[10px] text-slate-400">ปัจจุบัน {item.currentAgeText}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-xs">
                          {item.turningAge} ขวบ
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isToday ? (
                          <span className="bg-rose-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-2xs animate-pulse">
                            🎉 วันนี้!
                          </span>
                        ) : item.isTomorrow ? (
                          <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                            ⚡ พรุ่งนี้
                          </span>
                        ) : isSoon ? (
                          <span className="text-amber-700 font-bold">
                            อีก {item.daysUntil} วัน ({item.nextBdayDate.getDate()} {THAI_MONTHS_SHORT[item.nextBdayDate.getMonth()]})
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            อีก {item.daysUntil} วัน ({item.nextBdayFormatted})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.child.course_name || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.parent?.name || '-'}</div>
                        {item.parent?.phone && (
                          <a
                            href={`tel:${item.parent.phone}`}
                            className="text-[11px] text-blue-600 hover:underline"
                          >
                            📞 {item.parent.phone}
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleCopyBirthdayWish(item)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                          title="คัดลอกคำอวยพร LINE"
                        >
                          <span>💬</span>
                          <span>อวยพร</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
