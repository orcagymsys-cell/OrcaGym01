'use client';
import { useState, useEffect } from 'react';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { CourseConfig, PricingOption, ScheduleDayGroup, Booking, Child, UserProfile } from '@/lib/types';

interface ThemeStyleResult {
  cardBorderColor: string;
  cardBgColor: string;
  titleColor: string;
  subtitleColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  priceColor: string;
  tableHeaderBgColor: string;
  tableHeaderBorderColor: string;
}

function getThemeStyles(themeColor?: string, displayTitle?: string): ThemeStyleResult {
  let colorStr = (themeColor || '').toLowerCase().trim();

  if (!colorStr && displayTitle) {
    if (displayTitle.toLowerCase().includes('mega')) colorStr = 'indigo';
    else if (displayTitle.toLowerCase().includes('cubs')) colorStr = 'blue';
  }

  if (colorStr.includes('indigo') || colorStr.includes('mega') || colorStr.includes('purple')) {
    return {
      cardBorderColor: '#6366f1',
      cardBgColor: '#f5f3ff',
      titleColor: '#1e1b4b',
      subtitleColor: '#4338ca',
      badgeBgColor: '#e0e7ff',
      badgeTextColor: '#3730a3',
      badgeBorderColor: '#a5b4fc',
      priceColor: '#4338ca',
      tableHeaderBgColor: '#4338ca',
      tableHeaderBorderColor: '#3730a3'
    };
  }

  if (colorStr.includes('emerald') || colorStr.includes('green')) {
    return {
      cardBorderColor: '#10b981',
      cardBgColor: '#f0fdf4',
      titleColor: '#064e3b',
      subtitleColor: '#047857',
      badgeBgColor: '#d1fae5',
      badgeTextColor: '#065f46',
      badgeBorderColor: '#6ee7b7',
      priceColor: '#059669',
      tableHeaderBgColor: '#059669',
      tableHeaderBorderColor: '#047857'
    };
  }

  if (colorStr.includes('rose') || colorStr.includes('pink') || colorStr.includes('red')) {
    return {
      cardBorderColor: '#f43f5e',
      cardBgColor: '#fff1f2',
      titleColor: '#881337',
      subtitleColor: '#be123c',
      badgeBgColor: '#ffe4e6',
      badgeTextColor: '#9f1239',
      badgeBorderColor: '#fca5a5',
      priceColor: '#e11d48',
      tableHeaderBgColor: '#e11d48',
      tableHeaderBorderColor: '#be123c'
    };
  }

  if (colorStr.includes('amber') || colorStr.includes('yellow') || colorStr.includes('gold')) {
    return {
      cardBorderColor: '#f59e0b',
      cardBgColor: '#fffbeb',
      titleColor: '#78350f',
      subtitleColor: '#b45309',
      badgeBgColor: '#fef3c7',
      badgeTextColor: '#92400e',
      badgeBorderColor: '#fcd34d',
      priceColor: '#d97706',
      tableHeaderBgColor: '#d97706',
      tableHeaderBorderColor: '#b45309'
    };
  }

  if (colorStr.includes('sky') || colorStr.includes('cyan')) {
    return {
      cardBorderColor: '#0ea5e9',
      cardBgColor: '#f0f9ff',
      titleColor: '#0c4a6e',
      subtitleColor: '#0369a1',
      badgeBgColor: '#e0f2fe',
      badgeTextColor: '#075985',
      badgeBorderColor: '#7dd3fc',
      priceColor: '#0284c7',
      tableHeaderBgColor: '#0284c7',
      tableHeaderBorderColor: '#0369a1'
    };
  }

  // Default: Blue (Cubs) / Classic Navy
  return {
    cardBorderColor: '#38bdf8',
    cardBgColor: '#ffffff',
    titleColor: '#001a3a',
    subtitleColor: '#0369a1',
    badgeBgColor: '#e0f2fe',
    badgeTextColor: '#075985',
    badgeBorderColor: '#7dd3fc',
    priceColor: '#059669',
    tableHeaderBgColor: '#001a3a',
    tableHeaderBorderColor: '#001026'
  };
}

export default function PricingPage() {
  const [courses, setCourses] = useState<CourseConfig[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit / Create Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseConfig | null>(null);

  // Form State
  const [internalName, setInternalName] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [durationText, setDurationText] = useState('');
  const [themeColor, setThemeColor] = useState('Blue (Cubs)');
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [description, setDescription] = useState('');
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([]);
  const [scheduleGroups, setScheduleGroups] = useState<ScheduleDayGroup[]>([]);

  // Roster / Bookings State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All Courses');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const user = store.getCurrentUser();
      setIsAdmin(user?.role === 'admin');

      // Load courses first (instant from local) to show the UI immediately
      const data = await store.getCourses();
      setCourses(data || []);
      setLoading(false); // UI is now visible!

      // Then load network-heavy admin data in the background
      const [bData, cData, uData] = await Promise.all([
        store.getBookings(),
        store.getChildren(),
        store.getUsers()
      ]);
      setBookings(bData || []);
      setAllChildren(cData || []);
      setAllUsers(uData || []);
    }
    loadData();

    // Auto-listen for store changes
    const handleStoreChange = async () => {
      const data = await store.getCourses();
      setCourses(data || []);

      const bData = await store.getBookings();
      setBookings(bData || []);

      const cData = await store.getChildren();
      setAllChildren(cData || []);

      const uData = await store.getUsers();
      setAllUsers(uData || []);
    };
    window.addEventListener('storage', handleStoreChange);
    window.addEventListener('orca_store_updated', handleStoreChange);

    return () => {
      window.removeEventListener('storage', handleStoreChange);
      window.removeEventListener('orca_store_updated', handleStoreChange);
    };
  }, []);

  const handleCancelBooking = async (b: Booking) => {
    if (confirm(`คุณต้องการยกเลิกการจองเรียนของ "${b.child_nickname}" (วันที่ ${b.booking_date} เวลา ${b.time_slot}) ใช่หรือไม่?`)) {
      await store.cancelBooking(b.id);
      showToast(`✅ ยกเลิกรายการจองของ ${b.child_nickname} เรียบร้อยแล้ว`);
      const bData = await store.getBookings();
      setBookings(bData || []);
      window.dispatchEvent(new Event('orca_store_updated'));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setInternalName('');
    setDisplayTitle('');
    setSubtitle('Class');
    setAgeRange('Age 4-10');
    setDurationText('1.5 hrs/time');
    setThemeColor('Blue (Cubs)');
    setMaxCapacity(10);
    setDescription('');
    setPricingOptions([
      { id: 'p_1', times: 1, fee: '700 THB', duration: '-', tag: '' },
      { id: 'p_2', times: 6, fee: '4,100 THB (683)', duration: '2 Months', tag: '' },
      { id: 'p_3', times: 12, fee: '7,800 THB (650)', duration: '4 Months', tag: '' },
      { id: 'p_4', times: 24, fee: '14,400 THB (600)', duration: '6 Months', tag: 'free 2' }
    ]);
    setScheduleGroups([
      {
        id: 'sg_1',
        day_label: 'Tuesday - Friday',
        time_slots: ['10:30-12:00', '14:30-16:00', '16:00-17:30', '17:30-19:30'],
        highlight_tag: 'Tue-Wed',
        highlight_slot_no: 4
      },
      {
        id: 'sg_2',
        day_label: 'Saturday - Sunday',
        time_slots: ['9:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00'],
        highlight_tag: '',
        highlight_slot_no: ''
      }
    ]);
    setShowEditModal(true);
  };

  const handleOpenEditModal = (c: CourseConfig) => {
    setEditingCourse(c);
    setInternalName(c.internal_name || '');
    setDisplayTitle(c.display_title || '');
    setSubtitle(c.subtitle || 'Class');
    setAgeRange(c.age_range || '');
    setDurationText(c.duration_text || '');

    const inferredTheme = c.display_title?.toLowerCase().includes('mega') ? 'Indigo (Mega)' : 'Blue (Cubs)';
    setThemeColor(c.theme_color || inferredTheme);
    setMaxCapacity(c.max_capacity || 10);
    setDescription(c.description || '');
    setPricingOptions(
      c.pricing_options && c.pricing_options.length > 0
        ? c.pricing_options.map(po => ({ ...po, id: po.id || 'p_' + Math.random() }))
        : [{ id: 'p_1', times: 1, fee: '700 THB', duration: '-', tag: '' }]
    );
    setScheduleGroups(
      c.schedule_groups && c.schedule_groups.length > 0
        ? c.schedule_groups.map(sg => ({
            ...sg,
            id: sg.id || 'sg_' + Math.random(),
            time_slots: sg.time_slots ? [...sg.time_slots] : ['10:00-12:00']
          }))
        : [
            {
              id: 'sg_1',
              day_label: 'Tuesday - Friday',
              time_slots: ['10:30-12:00', '14:30-16:00', '16:00-17:30', '17:30-19:30'],
              highlight_tag: 'Tue-Wed',
              highlight_slot_no: 4
            },
            {
              id: 'sg_2',
              day_label: 'Saturday - Sunday',
              time_slots: ['9:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00'],
              highlight_tag: '',
              highlight_slot_no: ''
            }
          ]
    );
    setShowEditModal(true);
  };

  const handleAddPricingRow = () => {
    setPricingOptions(prev => [
      ...prev,
      { id: 'p_' + Date.now() + Math.random(), times: '', fee: '', duration: '', tag: '' }
    ]);
  };

  const handleRemovePricingRow = (id: string) => {
    if (pricingOptions.length <= 1) {
      showToast('ต้องมีอย่างน้อย 1 รายการตัวเลือกราคา');
      return;
    }
    setPricingOptions(prev => prev.filter(item => item.id !== id));
  };

  const handlePricingChange = (id: string, field: keyof PricingOption, value: any) => {
    setPricingOptions(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Schedule Grid Handlers
  const handleAddDayGroup = () => {
    setScheduleGroups(prev => [
      ...prev,
      {
        id: 'sg_' + Date.now() + Math.random(),
        day_label: 'Tuesday - Friday',
        time_slots: ['10:30-12:00'],
        highlight_tag: '',
        highlight_slot_no: ''
      }
    ]);
  };

  const handleRemoveDayGroup = (id: string) => {
    if (scheduleGroups.length <= 1) {
      showToast('ต้องมีอย่างน้อย 1 กลุ่มตารางเรียน');
      return;
    }
    setScheduleGroups(prev => prev.filter(g => g.id !== id));
  };

  const handleGroupDayLabelChange = (id: string, value: string) => {
    setScheduleGroups(prev =>
      prev.map(g => (g.id === id ? { ...g, day_label: value } : g))
    );
  };

  const handleGroupHighlightTagChange = (id: string, value: string) => {
    setScheduleGroups(prev =>
      prev.map(g => (g.id === id ? { ...g, highlight_tag: value } : g))
    );
  };

  const handleGroupHighlightSlotNoChange = (id: string, value: string) => {
    setScheduleGroups(prev =>
      prev.map(g => (g.id === id ? { ...g, highlight_slot_no: value } : g))
    );
  };

  const handleAddTimeSlot = (groupId: string) => {
    setScheduleGroups(prev =>
      prev.map(g => {
        if (g.id === groupId) {
          return { ...g, time_slots: [...g.time_slots, '10:00-12:00'] };
        }
        return g;
      })
    );
  };

  const handleRemoveTimeSlot = (groupId: string, slotIdx: number) => {
    setScheduleGroups(prev =>
      prev.map(g => {
        if (g.id === groupId) {
          if (g.time_slots.length <= 1) {
            showToast('ต้องมีอย่างน้อย 1 ช่วงเวลาในกลุ่ม');
            return g;
          }
          const updated = [...g.time_slots];
          updated.splice(slotIdx, 1);
          return { ...g, time_slots: updated };
        }
        return g;
      })
    );
  };

  const handleTimeSlotValueChange = (groupId: string, slotIdx: number, value: string) => {
    setScheduleGroups(prev =>
      prev.map(g => {
        if (g.id === groupId) {
          const updated = [...g.time_slots];
          updated[slotIdx] = value;
          return { ...g, time_slots: updated };
        }
        return g;
      })
    );
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayTitle.trim()) {
      showToast('กรุณากรอก Display Title คลาสเรียน');
      return;
    }

    const courseData: CourseConfig = {
      id: editingCourse ? editingCourse.id : 'course_' + Date.now(),
      internal_name: internalName.trim() || displayTitle.trim(),
      display_title: displayTitle.trim(),
      subtitle: subtitle.trim() || 'Class',
      age_range: ageRange.trim() || 'Age 4-10',
      duration_text: durationText.trim() || '1.5 hrs/time',
      theme_color: themeColor,
      max_capacity: Number(maxCapacity) || 10,
      description: description.trim(),
      pricing_options: pricingOptions.map(po => ({
        times: po.times,
        fee: po.fee,
        duration: po.duration,
        tag: po.tag
      })),
      schedule_groups: scheduleGroups.map(sg => ({
        id: sg.id || 'sg_' + Math.random(),
        day_label: sg.day_label,
        time_slots: sg.time_slots,
        highlight_tag: sg.highlight_tag || '',
        highlight_slot_no: sg.highlight_slot_no || ''
      }))
    };

    await store.saveCourse(courseData);
    showToast(`✅ บันทึกข้อมูลคลาส ${courseData.display_title} เรียบร้อยแล้ว`);
    setShowEditModal(false);

    const updated = await store.getCourses();
    setCourses(updated || []);
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (confirm(`คุณต้องการลบคลาส "${title}" ออกจากระบบใช่หรือไม่?`)) {
      await store.deleteCourse(id);
      showToast(`🗑️ ลบคลาส ${title} เรียบร้อยแล้ว`);
      const updated = await store.getCourses();
      setCourses(updated || []);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (selectedCourseFilter !== 'All Courses') {
      if (b.course_name?.toLowerCase().trim() !== selectedCourseFilter.toLowerCase().trim()) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const child = allChildren.find(c => c.id === b.child_id);
      const parent = child ? allUsers.find(u => u.id === child.parent_id || u.user_id === child.parent_id) : null;
      const matchNickname = b.child_nickname?.toLowerCase().includes(q);
      const matchFullName = b.child_full_name?.toLowerCase().includes(q);
      const matchCourse = b.course_name?.toLowerCase().includes(q);
      const matchDate = b.booking_date?.toLowerCase().includes(q);
      const matchTime = b.time_slot?.toLowerCase().includes(q);
      const matchParent = parent ? (parent.name.toLowerCase().includes(q) || parent.phone.includes(q)) : false;

      return Boolean(matchNickname || matchFullName || matchCourse || matchDate || matchTime || matchParent);
    }
    return true;
  });

  

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-12 h-12 border-4 border-[#001a3a] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#001a3a] font-bold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="font-['Anuphan',sans-serif]">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4">
                {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-[#001a3a] hover:bg-[#002244] text-white px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>+ Add New Class (สร้างคลาสใหม่)</span>
          </button>
        )}
      </div>

      {/* Page Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-[#001a3a] tracking-tight">
          ORCA CLASSES & PRICING
        </h2>
        {isAdmin && (
          <p className="text-xs text-slate-500 font-medium mt-1">
            (ระบบจัดการข้อมูลคลาสเรียนและราคา สำหรับผู้ดูแลระบบ)
          </p>
        )}
      </div>

      {/* Class Cards Grid View (Matching Image 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {courses.map((course) => {
          const firstOption = course.pricing_options?.[0];
          const startingPriceText = firstOption
            ? `เริ่มต้น ${firstOption.fee} / ${firstOption.times} คลาส`
            : 'เริ่มต้น 700 THB / 1 คลาส';

          const theme = getThemeStyles(course.theme_color, course.display_title);

          return (
            <div
              key={course.id}
              className="rounded-3xl p-5 shadow-xs flex flex-col justify-between relative transition-all border-2"
              style={{
                borderColor: theme.cardBorderColor,
                backgroundColor: theme.cardBgColor
              }}
            >
              <div>
                {/* Header Row: Title & Age Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3
                      className="text-xl sm:text-2xl font-black"
                      style={{ color: theme.titleColor }}
                    >
                      {course.display_title}
                    </h3>
                    <div
                      className="text-xs font-bold"
                      style={{ color: theme.subtitleColor }}
                    >
                      {course.subtitle || 'Class'} • {course.duration_text || '1.5 hrs/time'}
                    </div>
                  </div>

                  <span
                    className="px-3.5 py-1 rounded-full text-xs shrink-0 font-extrabold border"
                    style={{
                      backgroundColor: theme.badgeBgColor,
                      color: theme.badgeTextColor,
                      borderColor: theme.badgeBorderColor
                    }}
                  >
                    {course.age_range || 'Age 4-10'}
                  </span>
                </div>

                {/* Description Text */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-4 whitespace-pre-line">
                  {course.description}
                </p>

                {/* Starting Price Tag */}
                <div
                  className="text-sm sm:text-base mb-4 font-black"
                  style={{ color: theme.priceColor }}
                >
                  {startingPriceText}
                </div>

                {/* Pricing Table Options Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4 text-xs font-bold shadow-2xs">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr
                        className="text-white border-b"
                        style={{
                          backgroundColor: theme.tableHeaderBgColor,
                          borderColor: theme.tableHeaderBorderColor
                        }}
                      >
                        <th className="p-2.5 font-black">Times</th>
                        <th className="p-2.5 font-black">Course Fees</th>
                        <th className="p-2.5 font-black">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.pricing_options?.map((opt, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-2 font-extrabold text-slate-800">{opt.times}</td>
                          <td className="p-2 font-extrabold text-[#001a3a]">
                            {opt.fee}{' '}
                            {opt.tag && (
                              <span className="inline-flex items-center justify-center relative ml-3 w-12 h-12 align-middle transform -translate-y-0.5" title={opt.tag}>
                                <svg className="absolute w-full h-full text-amber-400 drop-shadow-md" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} viewBox="0 0 100 100" fill="currentColor">
                                  <polygon points="50,5 61,23 80,18 82,38 100,47 85,61 90,80 71,80 61,96 50,82 39,96 29,80 10,80 15,61 0,47 18,38 20,18 39,23" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-black text-rose-900 uppercase tracking-tighter text-center leading-[1] mt-0.5" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                                  {opt.tag.split(' ').map((w,i) => <span key={i} className="block">{w}</span>)}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-slate-600 font-medium">{opt.duration || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Class Schedule Section (Exact Match to media_1788945034280.png) */}
                {(() => {
                  const defaultCubsGroups: ScheduleDayGroup[] = [
                    {
                      id: 'sg_cubs_1',
                      day_label: 'Tuesday - Friday',
                      time_slots: ['10:30-12:00', '14:30-16:00', '16:00-17:30', '17:30-19:30'],
                      highlight_tag: 'Tue-Wed',
                      highlight_slot_no: 4
                    },
                    {
                      id: 'sg_cubs_2',
                      day_label: 'Saturday - Sunday',
                      time_slots: ['9:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00']
                    }
                  ];

                  const defaultMegaGroups: ScheduleDayGroup[] = [
                    {
                      id: 'sg_mega_1',
                      day_label: 'Tuesday - Friday',
                      time_slots: ['10:30-12:30', '17:30-19:30', '', '']
                    },
                    {
                      id: 'sg_mega_2',
                      day_label: 'Saturday - Sunday',
                      time_slots: ['10:30-12:30', '16:00-18:00', '', '']
                    }
                  ];

                  const displayScheduleGroups = (course.schedule_groups && course.schedule_groups.length > 0)
                    ? course.schedule_groups
                    : (course.display_title?.toLowerCase().includes('mega') ? defaultMegaGroups : defaultCubsGroups);

                  return (
                    <div className="mt-2 pt-3 border-t border-slate-200/80">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="text-rose-500 font-black text-sm sm:text-base underline decoration-2 underline-offset-4 tracking-wide">
                          Class Schedule
                        </span>
                      </div>

                      <div className="space-y-3">
                        {displayScheduleGroups.map((group, gIdx) => {
                          const slots = [...(group.time_slots || [])];
                          while (slots.length < 4) {
                            slots.push('');
                          }
                          const displaySlots = slots.slice(0, 4);

                          return (
                            <div key={gIdx} className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-2xs">
                              {/* Header Row: Day Label */}
                              <div
                                className="text-white text-center py-2 px-3 font-extrabold text-xs sm:text-sm tracking-wide border-b"
                                style={{
                                  backgroundColor: theme.tableHeaderBgColor,
                                  borderColor: theme.tableHeaderBorderColor
                                }}
                              >
                                {group.day_label}
                              </div>

                              {/* Time Slots Grid Row (4 Equal Columns) */}
                              <div className="grid grid-cols-4 divide-x divide-slate-300 bg-white">
                                {displaySlots.map((slot, sIdx) => {
                                  const isHighlightSlot =
                                    group.highlight_slot_no && Number(group.highlight_slot_no) === sIdx + 1;

                                  return (
                                    <div
                                      key={sIdx}
                                      className={`p-2 sm:p-2.5 text-center text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center min-h-[42px] ${
                                        isHighlightSlot ? 'bg-amber-50/80 text-amber-900' : 'text-slate-800'
                                      }`}
                                    >
                                      {slot ? (
                                        <span className="font-extrabold whitespace-nowrap">{slot}</span>
                                      ) : (
                                        <span className="text-slate-300">-</span>
                                      )}
                                      {group.highlight_tag && isHighlightSlot && (
                                        <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-full mt-0.5 shadow-2xs">
                                          {group.highlight_tag}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Actions Row for Admin */}
              {isAdmin && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.id, course.display_title)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    🗑️ ลบ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(course)}
                    className="bg-slate-100 hover:bg-slate-200 text-[#001a3a] border border-slate-300 px-4 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>✏️</span>
                    <span>แก้ไข</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* Edit / Create Modal Form (Exact Match to Images 2, 3, 4) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white max-w-4xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto font-['Anuphan',sans-serif]">
            
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
              <h3 className="text-xl font-black text-[#001a3a] flex items-center gap-2">
                <span>✏️</span>
                <span>{editingCourse ? `แก้ไขข้อมูลคลาส: ${editingCourse.display_title}` : 'สร้างคลาสเรียนใหม่ (Add New Class)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              
              {/* Form Grid Rows (Exact match to Image 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Internal Name:
                  </label>
                  <input
                    type="text"
                    value={internalName}
                    onChange={(e) => setInternalName(e.target.value)}
                    placeholder="Orca Cubs01"
                    className="w-full h-10 px-3.5 border border-slate-300 rounded-xl text-sm font-medium text-[#001a3a] outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Display Title (e.g. Orca Cubs):
                  </label>
                  <input
                    type="text"
                    value={displayTitle}
                    onChange={(e) => setDisplayTitle(e.target.value)}
                    placeholder="Orca Cubs"
                    className="w-full h-10 px-3.5 border border-slate-300 rounded-xl text-sm font-medium text-[#001a3a] outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Subtitle (e.g. Class):
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Class"
                    className="w-full h-10 px-3.5 border border-slate-300 rounded-xl text-sm font-medium text-[#001a3a] outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Age Range (e.g. Age 4-10):
                  </label>
                  <input
                    type="text"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    placeholder="Age 4-10"
                    className="w-full h-10 px-3.5 border border-slate-300 rounded-xl text-sm font-medium text-[#001a3a] outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Duration Text (e.g. 1.5 hrs/time):
                  </label>
                  <input
                    type="text"
                    value={durationText}
                    onChange={(e) => setDurationText(e.target.value)}
                    placeholder="1.5 hrs/time"
                    className="w-full h-10 px-3.5 border border-slate-300 rounded-xl text-sm font-medium text-[#001a3a] outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Theme Color:
                  </label>
                  <select
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-full h-10 px-3.5 border border-slate-300 rounded-xl text-sm font-bold text-[#001a3a] outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Blue (Cubs)">Blue (Cubs)</option>
                    <option value="Indigo (Mega)">Indigo (Mega)</option>
                    <option value="Emerald">Emerald</option>
                    <option value="Sky">Sky</option>
                    <option value="Rose">Rose</option>
                  </select>
                </div>
              </div>

              {/* Max Capacity Input Block */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Max Capacity / Slot (จำนวนเด็กสูงสุดต่อรอบเวลา):
                </label>
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full h-11 px-4 border-2 border-sky-300 rounded-2xl text-sm font-black text-[#001a3a] outline-none focus:border-blue-600 bg-sky-50/40"
                  required
                />
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  * เช่น กำหนด 5 คน/รอบ เมื่อจองครบ 5 คน ระบบจะปิดจองรอบนั้นอัตโนมัติ
                </p>
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Description (Supports line breaks):
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-[#001a3a] outline-none focus:border-blue-600 leading-relaxed"
                />
              </div>

              {/* Schedule Grid Display Builder Section (Matching Image media_1788943532708.png) */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-[#001a3a]">
                    Schedule Grid Display
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddDayGroup}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Add Day Group</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {scheduleGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3 relative"
                    >
                      {/* Day Group Title Input & Remove Button */}
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={group.day_label}
                          onChange={(e) => handleGroupDayLabelChange(group.id!, e.target.value)}
                          placeholder="Tuesday - Friday"
                          className="w-full max-w-lg h-9 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none bg-white focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDayGroup(group.id!)}
                          className="text-rose-600 hover:text-rose-800 font-extrabold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <span>🗑️</span>
                          <span>Remove Group</span>
                        </button>
                      </div>

                      {/* Time Slots Chips Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {group.time_slots.map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1 text-xs font-bold text-[#001a3a] shadow-2xs"
                          >
                            <input
                              type="text"
                              value={slot}
                              onChange={(e) => handleTimeSlotValueChange(group.id!, sIdx, e.target.value)}
                              className="w-24 sm:w-28 text-xs font-bold text-[#001a3a] outline-none bg-transparent"
                              placeholder="10:30-12:00"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveTimeSlot(group.id!, sIdx)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer border-none bg-transparent text-xs"
                              title="ลบเวลา"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddTimeSlot(group.id!)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <span>+ Add Time</span>
                        </button>
                      </div>

                      {/* Highlight Tag & Slot No Row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 pt-1">
                        <div className="flex items-center gap-2">
                          <span>Highlight Tag:</span>
                          <input
                            type="text"
                            value={group.highlight_tag || ''}
                            onChange={(e) => handleGroupHighlightTagChange(group.id!, e.target.value)}
                            placeholder="e.g. Tue-Wed"
                            className="w-28 sm:w-36 h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-medium text-[#001a3a] outline-none bg-white"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span>On Slot No. (ลำดับช่องที่ 1, 2, 3, 4):</span>
                          <input
                            type="text"
                            value={group.highlight_slot_no ?? ''}
                            onChange={(e) => handleGroupHighlightSlotNoChange(group.id!, e.target.value)}
                            className="w-14 h-8 px-2 border border-slate-300 rounded-lg text-xs font-bold text-center text-[#001a3a] outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Options Section (Exact match to Images 3 & 4) */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-black text-[#001a3a]">
                    Pricing Options
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddPricingRow}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Add Row</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {pricingOptions.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200"
                    >
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={item.times}
                          onChange={(e) => handlePricingChange(item.id!, 'times', e.target.value)}
                          placeholder="Times (e.g. 1)"
                          className="w-full h-9 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none bg-white"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={item.fee}
                          onChange={(e) => handlePricingChange(item.id!, 'fee', e.target.value)}
                          placeholder="Fee (e.g. 700 THB)"
                          className="w-full h-9 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none bg-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => handlePricingChange(item.id!, 'duration', e.target.value)}
                          placeholder="Duration (e.g. 2 Months)"
                          className="w-full h-9 px-3 border border-slate-300 rounded-xl text-xs font-bold text-[#001a3a] outline-none bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={item.tag || ''}
                          onChange={(e) => handlePricingChange(item.id!, 'tag', e.target.value)}
                          placeholder="Tag (e.g. free 2)"
                          className="w-full h-9 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none bg-white"
                        />
                      </div>

                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePricingRow(item.id!)}
                          className="text-rose-600 hover:text-rose-800 font-bold text-base cursor-pointer border-none bg-transparent p-1"
                          title="ลบแถวนี้"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Buttons Row */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer border border-slate-300 transition-colors"
                >
                  Cancel (ยกเลิก)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#001a3a] hover:bg-[#002244] text-white font-extrabold rounded-2xl text-xs sm:text-sm cursor-pointer shadow-md transition-all border border-blue-950"
                >
                  Save Class Data (บันทึกข้อมูลคลาส)
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
