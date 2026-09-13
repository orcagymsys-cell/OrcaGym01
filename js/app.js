/**
 * Orca Gymnastics Main UI Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.orcaStore;
  const auth = window.orcaAuth;
  const booking = window.orcaBooking;
  const admin = window.orcaAdmin;

  // Selected state
  let currentSelectedChildId = null;
  let currentSelectedDate = new Date().toISOString().split('T')[0];
  let currentSelectedSlot = null;
  let calendarMonth = new Date().getMonth();
  let calendarYear = new Date().getFullYear();

  // --- UI Elements ---
  const screens = document.querySelectorAll('.screen');
  const drawerOverlay = document.getElementById('menuDrawerOverlay');
  const menuTriggerBtn = document.getElementById('menuTriggerBtn');
  const viewToggleBtn = document.getElementById('viewToggleBtn');
  const toastElement = document.getElementById('toastMsg');

  // --- Navigation & Routing ---
  let screenHistoryStack = [];
  let currentActiveScreenId = 'screenSignIn';

  function showScreen(screenId, pushHistory = true) {
    if (pushHistory && currentActiveScreenId && currentActiveScreenId !== screenId) {
      screenHistoryStack.push(currentActiveScreenId);
    }
    currentActiveScreenId = screenId;

    screens.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }
    closeMenuDrawer();

    // ซ่อนแฮดเดอร์ MENU เมื่ออยู่ในหน้า Sign In และ Register
    const header = document.querySelector('.app-header');
    if (header) {
      if (screenId === 'screenSignIn' || screenId === 'screenRegister' || screenId === 'screenAdminSignIn') {
        header.style.display = 'none';
      } else {
        header.style.display = 'flex';
      }
    }

    updateNavigationState();
  }

  function goBack() {
    if (screenHistoryStack.length > 0) {
      const prevScreen = screenHistoryStack.pop();
      showScreen(prevScreen, false);
    } else {
      const user = auth.getCurrentUser();
      if (user) {
        showScreen(user.role === 'admin' ? 'screenAdminDashboard' : 'screenHome', false);
      } else {
        showScreen('screenSignIn', false);
      }
    }
  }

  function openMenuDrawer() {
    drawerOverlay.classList.add('active');
  }

  function closeMenuDrawer() {
    drawerOverlay.classList.remove('active');
  }

  function showToast(msg, duration = 3000) {
    toastElement.textContent = msg;
    toastElement.classList.add('show');
    setTimeout(() => {
      toastElement.classList.remove('show');
    }, duration);
  }

  function updateNavigationState() {
    const user = auth.getCurrentUser();
    const navContainer = document.getElementById('drawerNav');
    const headerUserNameEl = document.getElementById('headerUserName');
    
    if (headerUserNameEl) {
      if (user) {
        headerUserNameEl.textContent = (user.role === 'admin' ? '🛡️ ' : '👤 ') + user.name;
        headerUserNameEl.style.display = 'block';
      } else {
        headerUserNameEl.textContent = '';
        headerUserNameEl.style.display = 'none';
      }
    }

    if (!user) {
      navContainer.innerHTML = `
        <a class="drawer-nav-item" onclick="app.showScreen('screenSignIn')">🔑 Sign In</a>
        <a class="drawer-nav-item" onclick="app.showScreen('screenRegister')">📝 Register</a>
        <a class="drawer-nav-item" onclick="app.showScreen('screenPricing')">🏷️ Classes & Pricing</a>
        <a class="drawer-nav-item" onclick="app.showScreen('screenAdminSignIn')">🛡️ Admin Sign In</a>
      `;
    } else if (user.role === 'admin') {
      navContainer.innerHTML = `
        <a class="drawer-nav-item" onclick="app.showScreen('screenAdminDashboard')">🏠 HOME (Admin)</a>
        <a class="drawer-nav-item" onclick="app.showScreen('screenPricing')">🏷️ Classes & Pricing</a>
        <a class="drawer-nav-item" onclick="app.showScreen('screenScheduleInfo')">📅 Schedule</a>
        <a class="drawer-nav-item logout-btn" onclick="app.logout()">🚪 Log Out (${user.name})</a>
      `;
    } else {
      navContainer.innerHTML = `
        <a class="drawer-nav-item" onclick="app.showScreen('screenHome')">🏠 HOME</a>
        <a class="drawer-nav-item" onclick="app.showScreen('screenPricing')">🏷️ Orca Classes & Pricing</a>
        <a class="drawer-nav-item" onclick="app.showScreen('screenScheduleInfo')">📅 Schedule</a>
        <a class="drawer-nav-item" onclick="app.showScreen('screenAbout')">ℹ️ About Us</a>
        <a class="drawer-nav-item logout-btn" onclick="app.logout()">🚪 Log Out (${user.name})</a>
      `;
    }
  }

  // --- Auth Handlers ---
  function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;
    
    const res = auth.login(u, p);
    if (res.success) {
      showToast(`ยินดีต้อนรับคุณ ${res.user.name}`);
      if (res.user.role === 'admin') {
        renderAdminDashboard();
        showScreen('screenAdminDashboard');
      } else {
        renderParentHome();
        showScreen('screenHome');
      }
    } else {
      showToast(res.message);
    }
  }

  function handleAdminLogin(e) {
    e.preventDefault();
    const u = document.getElementById('adminUsername').value;
    const p = document.getElementById('adminPassword').value;
    
    const res = auth.login(u, p);
    if (res.success && res.user.role === 'admin') {
      showToast('เข้าสู่ระบบแอดมินสำเร็จ');
      renderAdminDashboard();
      showScreen('screenAdminDashboard');
    } else {
      showToast('บัญชีผู้ใช้หรือรหัสผ่านแอดมินไม่ถูกต้อง');
    }
  }

  function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('regFullName').value;
    const phone = document.getElementById('regPhone').value;
    const pwd = document.getElementById('regPassword').value;
    const confirmPwd = document.getElementById('regConfirmPassword').value;

    if (pwd !== confirmPwd) {
      showToast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const res = auth.registerParent({ fullName, phone, password: pwd });
    if (res.success) {
      showToast('สมัครสมาชิกสำเร็จ กรุณาเพิ่มข้อมูลผู้เรียน (ลูก)');
      renderParentHome();
      showScreen('screenHome');
    } else {
      showToast(res.message);
    }
  }

  function logout() {
    auth.logout();
    showToast('ลงชื่อออกจากระบบเรียบร้อย');
    showScreen('screenSignIn');
  }

  // --- Parent Flow Renders ---
  let currentChildPhotoDataUrl = null;

  function handlePhotoUpload(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        currentChildPhotoDataUrl = e.target.result;
        const preview = document.getElementById('childPhotoPreview');
        preview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  function renderParentHome() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const children = store.getChildrenByParent(user.id);
    const listContainer = document.getElementById('parentChildrenList');

    if (children.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">ยังไม่มีข้อมูลเด็กในระบบ กรุณากด "Add Family Member" ด้านบนเพื่อเพิ่มข้อมูล</div>`;
      return;
    }

    listContainer.innerHTML = children.map(child => {
      let avatarSrc = child.customPhotoDataUrl || AVATARS[child.avatar || 'girl'];
      if (!child.customPhotoDataUrl && child.avatar === 'boy') avatarSrc = AVATARS.boy;

      let formattedDob = child.dob;
      if (child.dob && child.dob.includes('-')) {
        const parts = child.dob.split('-');
        formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const remaining = child.totalHours - child.usedHours;
      const statusBadge = (child.status === 'approved' && remaining > 0)
        ? `<div style="font-size:13px; color:#15803d; font-weight:700; background:#dcfce7; padding:3px 10px; border-radius:12px; display:inline-block; margin-top:4px;">✅ อนุมัติแล้ว (${remaining} ชม.)</div>`
        : `<div style="font-size:13px; color:#9a3412; font-weight:700; background:#ffedd5; padding:3px 10px; border-radius:12px; display:inline-block; margin-top:4px;">🔒 รอ Admin อนุมัติคอร์ส</div>`;

      return `
        <div class="child-card-image2" onclick="app.openStudentDashboard('${child.id}')">
          <img src="${avatarSrc}" class="child-avatar-lg" alt="${child.nickname}" />
          <div class="child-details-image2">
            <div class="child-detail-fullname">${child.fullName}</div>
            <div class="child-detail-nickname">${child.nickname}</div>
            <div class="child-detail-dob">เกิด ${formattedDob}</div>
            <div class="child-detail-gender">${child.gender}</div>
            ${statusBadge}
          </div>
        </div>
      `;
    }).join('');
  }

  function openAddChildScreen() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const children = store.getChildrenByParent(user.id);
    if (children.length >= 20) {
      showToast('สามารถเพิ่มข้อมูลเด็กได้สูงสุด 20 คนต่อบัญชี');
      return;
    }

    document.getElementById('childForm').reset();
    currentChildPhotoDataUrl = null;
    document.getElementById('childPhotoPreview').innerHTML = '👧🏻';

    const childOrdinal = children.length === 0 ? 'Student Information' : (children.length === 1 ? 'Add 2nd Child' : (children.length === 2 ? 'Add 3rd Child' : `Add ${children.length + 1}th Child`));
    document.getElementById('addChildTitle').textContent = childOrdinal;

    showScreen('screenAddChild');
  }

  function saveCurrentChildFromForm() {
    const user = auth.getCurrentUser();
    if (!user) return false;

    const children = store.getChildrenByParent(user.id);
    if (children.length >= 20) {
      showToast('สามารถเพิ่มข้อมูลเด็กได้สูงสุด 20 คน');
      return false;
    }

    const fullName = document.getElementById('childFullName').value.trim();
    const nickname = document.getElementById('childNickname').value.trim();
    const dob = document.getElementById('childDob').value;
    const gender = document.getElementById('childGender').value;

    if (!fullName || !nickname || !dob) {
      showToast('กรุณากรอกข้อมูลเด็กให้ครบถ้วน');
      return false;
    }

    const avatar = gender.toLowerCase() === 'boy' ? 'boy' : 'girl';

    const newChild = {
      id: 'c_' + Date.now() + Math.floor(Math.random() * 1000),
      parentId: user.id,
      fullName,
      nickname,
      dob,
      gender,
      avatar,
      customPhotoDataUrl: currentChildPhotoDataUrl,
      status: 'pending',
      courseName: 'Orca Cubs',
      totalHours: 0,
      usedHours: 0,
      expiryDate: '-'
    };

    store.saveChild(newChild);

    // Sync to Google Sheets & Drive if Web App URL is configured
    if (window.orcaGas && window.orcaGas.getWebAppUrl()) {
      window.orcaGas.postToGas('addChild', {
        ...newChild,
        photoBase64: currentChildPhotoDataUrl
      }).then(res => {
        if (res && res.photoUrl) {
          newChild.customPhotoDataUrl = res.photoUrl;
          store.saveChild(newChild);
          renderParentHome();
        }
      });
    }

    return newChild;
  }

  function handleAddAnotherChild() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const children = store.getChildrenByParent(user.id);
    if (children.length >= 20) {
      showToast('สามารถเพิ่มข้อมูลเด็กได้สูงสุด 20 คนเท่านั้น');
      return;
    }

    const saved = saveCurrentChildFromForm();
    if (saved) {
      showToast(`เพิ่มข้อมูล ${saved.nickname} เรียบร้อยแล้ว (รอ Admin อนุมัติ)`);
      
      const newCount = store.getChildrenByParent(user.id).length;
      if (newCount >= 20) {
        showToast('เพิ่มครบ 20 คนแล้ว ระบบจะกลับไปที่หน้าหลัก');
        renderParentHome();
        showScreen('screenHome');
        return;
      }

      document.getElementById('childForm').reset();
      currentChildPhotoDataUrl = null;
      document.getElementById('childPhotoPreview').innerHTML = saved.gender === 'Boy' ? '🧒🏼' : '👧🏻';

      const ordinal = newCount === 1 ? 'Add 2nd Child' : (newCount === 2 ? 'Add 3rd Child' : `Add ${newCount + 1}th Child`);
      document.getElementById('addChildTitle').textContent = ordinal;
    }
  }

  function handleAddChildSubmit(e) {
    e.preventDefault();
    const saved = saveCurrentChildFromForm();
    if (saved) {
      showToast(`บันทึกข้อมูล ${saved.nickname} เรียบร้อยแล้ว (รอ Admin อนุมัติ)`);
      document.getElementById('childForm').reset();
      currentChildPhotoDataUrl = null;
      renderParentHome();
      showScreen('screenHome');
    }
  }

  function openStudentDashboard(childId) {
    currentSelectedChildId = childId;
    const child = store.getChildById(childId);
    if (!child) return;

    let avatarSrc = child.customPhotoDataUrl || AVATARS[child.avatar || 'girl'];
    if (!child.customPhotoDataUrl && child.avatar === 'boy') avatarSrc = AVATARS.boy;

    document.getElementById('studentDashAvatar').src = avatarSrc;
    document.getElementById('studentDashName').textContent = child.fullName;
    document.getElementById('studentDashNickname').textContent = child.nickname;
    document.getElementById('studentDashMeta').textContent = `เกิด ${child.dob} | ${child.gender}`;

    const remaining = child.totalHours - child.usedHours;
    document.getElementById('studentDashSummary').textContent = `${child.totalHours} Classes | Used: ${child.usedHours} | Remaining: ${remaining}`;
    document.getElementById('studentDashExpiry').textContent = `(Expires: ${child.expiryDate})`;

    const pendingAlertBox = document.getElementById('studentApprovalPendingAlert');
    const lowAlertBox = document.getElementById('studentLowHoursAlert');
    const bookBtn = document.getElementById('btnOpenBookingCalendar');

    // Check if Admin approved and has hours
    if (child.status !== 'approved' || remaining <= 0) {
      if (pendingAlertBox) {
        pendingAlertBox.style.display = 'flex';
        pendingAlertBox.textContent = child.status !== 'approved' 
          ? '🔒 รอแอดมินอนุมัติคอร์สและเติมชั่วโมงเรียนก่อน จึงจะสามารถจองคลาสได้' 
          : '⚠️ ชั่วโมงเรียนหมดแล้ว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง';
      }
      if (lowAlertBox) lowAlertBox.style.display = 'none';
      if (bookBtn) {
        bookBtn.innerHTML = '🔒 รอ Admin อนุมัติคอร์ส';
        bookBtn.style.opacity = '0.7';
      }
    } else {
      if (pendingAlertBox) pendingAlertBox.style.display = 'none';
      
      const alertInfo = booking.checkChildLowHours(child);
      if (alertInfo.isLow && lowAlertBox) {
        lowAlertBox.style.display = 'flex';
        lowAlertBox.textContent = alertInfo.message;
      } else if (lowAlertBox) {
        lowAlertBox.style.display = 'none';
      }

      if (bookBtn) {
        bookBtn.innerHTML = 'Book Class (จองคลาสเรียน)';
        bookBtn.style.opacity = '1';
      }
    }

    renderStudentBookingHistory(childId);
    showScreen('screenStudentDashboard');
  }

  function renderStudentBookingHistory(childId) {
    const bookings = store.getBookingsByChild(childId);
    const container = document.getElementById('studentHistoryList');

    if (bookings.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:15px; color:#94a3b8;">ยังไม่มีประวัติการจองคลาส</div>`;
      return;
    }

    container.innerHTML = bookings.map(b => {
      return `
        <div class="booking-item-row upcoming">
          <div>
            <span style="font-weight:700;">${b.date}</span> | <span>${b.timeSlot}</span>
            <div style="font-size:12px; color:#64748b;">คลาส: ${b.courseName}</div>
          </div>
          <button class="cancel-booking-btn" onclick="app.cancelBooking('${b.id}')" title="ยกเลิกการจอง">✕</button>
        </div>
      `;
    }).join('');
  }

  function cancelBooking(bookingId) {
    if (confirm('คุณต้องการยกเลิกการจองเรียนในรอบนี้ใช่หรือไม่? (ระบบจะคืน 1 ชั่วโมง)')) {
      const res = booking.cancelBooking(bookingId);
      showToast(res.message);
      if (res.success && currentSelectedChildId) {
        openStudentDashboard(currentSelectedChildId);
      }
    }
  }

  // --- Calendar & Booking Flow Renders ---
  function openBookingCalendar() {
    if (!currentSelectedChildId) return;
    const child = store.getChildById(currentSelectedChildId);
    if (!child || child.status !== 'approved' || (child.totalHours - child.usedHours) <= 0) {
      showToast('🔒 กรุณารอแอดมินอนุมัติแพ็กเกจเรียนและเติมชั่วโมงก่อนทำการจอง');
      return;
    }
    
    document.getElementById('calStudentNickname').textContent = child.nickname;
    renderCalendarWidget();
    renderTimeSlots();
    showScreen('screenBookingCalendar');
  }

  function renderCalendarWidget() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calMonthYearLabel').textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    const grid = document.getElementById('calendarDaysGrid');
    grid.innerHTML = `
      <div class="day-name sunday">Su</div>
      <div class="day-name">Mo</div>
      <div class="day-name">Tu</div>
      <div class="day-name">We</div>
      <div class="day-name">Th</div>
      <div class="day-name">Fr</div>
      <div class="day-name">Sa</div>
    `;

    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    // Empty lead cells
    for (let i = 0; i < firstDay; i++) {
      grid.innerHTML += `<div class="calendar-day-cell empty"></div>`;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = dStr === currentSelectedDate;
      const isPast = dStr < todayStr;
      
      const dayClass = `calendar-day-cell ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`;
      const clickHandler = isPast ? '' : `onclick="app.selectCalendarDate('${dStr}')"`;

      grid.innerHTML += `<div class="${dayClass}" ${clickHandler}>${d}</div>`;
    }
  }

  function changeCalendarMonth(delta) {
    calendarMonth += delta;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    } else if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }
    renderCalendarWidget();
  }

  function selectCalendarDate(dateStr) {
    currentSelectedDate = dateStr;
    renderCalendarWidget();
    renderTimeSlots();
  }

  function renderTimeSlots() {
    const child = store.getChildById(currentSelectedChildId);
    if (!child) return;

    const slots = booking.getTimeSlots(child.courseName);
    const container = document.getElementById('timeSlotsList');
    currentSelectedSlot = null;

    container.innerHTML = slots.map(s => {
      const status = booking.getSlotStatus(currentSelectedDate, s.time);
      const isFull = status.isFull;
      const capText = isFull ? 'FULL (เต็มแล้ว)' : `ว่าง ${status.remaining}/${status.maxCapacity} ที่`;
      const capBadgeClass = isFull ? 'cap-full' : 'cap-available';
      const fullAttr = isFull ? 'disabled' : '';

      return `
        <div class="slot-option-card ${isFull ? 'full' : ''}" id="slotCard_${s.time.replace(/[:]/g, '')}" onclick="${isFull ? '' : `app.selectSlot('${s.time}')`}">
          <div>
            <div class="slot-time">⏰ ${s.time}</div>
            <div style="font-size:12px; color:#64748b;">${child.courseName} (${s.duration} ชม./ครั้ง)</div>
          </div>
          <span class="slot-capacity-badge ${capBadgeClass}">${capText}</span>
        </div>
      `;
    }).join('');
  }

  function selectSlot(timeSlot) {
    currentSelectedSlot = timeSlot;
    document.querySelectorAll('.slot-option-card').forEach(c => c.classList.remove('selected'));
    const el = document.getElementById(`slotCard_${timeSlot.replace(/[:]/g, '')}`);
    if (el) el.classList.add('selected');
  }

  function handleConfirmBooking() {
    if (!currentSelectedChildId || !currentSelectedDate || !currentSelectedSlot) {
      showToast('กรุณาเลือกรอบเวลาที่ต้องการจอง');
      return;
    }

    const res = booking.createBooking(currentSelectedChildId, currentSelectedDate, currentSelectedSlot);
    if (res.success) {
      showToast(`จองคลาสเรียบร้อยแล้ว! คงเหลือ ${res.remainingHours} ชั่วโมง`);
      openStudentDashboard(currentSelectedChildId);
    } else {
      showToast(res.message);
    }
  }

  // --- Admin Flow Renders (UI Page 14-17) ---
  function renderAdminDashboard() {
    const children = store.getChildren();
    const pendingList = children.filter(c => c.status === 'pending');
    const approvedList = children.filter(c => c.status === 'approved');

    // Admin Low Hours Alert Counter (Requirement 7)
    const lowHoursList = admin.getLowHoursAlertList();
    const alertContainer = document.getElementById('adminLowHoursAlertBanner');
    if (lowHoursList.length > 0) {
      alertContainer.style.display = 'flex';
      alertContainer.innerHTML = `⚠️ มีนักเรียน ${lowHoursList.length} คน ที่ชั่วโมงเรียนคงเหลือ $\\le 2$ ชั่วโมง! (${lowHoursList.map(c=>c.nickname).join(', ')})`;
    } else {
      alertContainer.style.display = 'none';
    }

    // Render Members List
    const membersListContainer = document.getElementById('adminMembersList');
    membersListContainer.innerHTML = children.map(child => {
      const parentUser = store.getUsers().find(u => u.id === child.parentId);
      const remaining = child.totalHours - child.usedHours;
      const isPending = child.status === 'pending';

      return `
        <div class="child-card">
          <img src="${AVATARS[child.avatar || 'girl']}" class="child-card-avatar" alt="${child.nickname}" />
          <div class="child-card-info">
            <div class="child-name">${child.fullName} (${child.nickname})</div>
            <div class="child-meta">ผู้ปกครอง: ${parentUser ? parentUser.name : '-'} | Tel: ${parentUser ? parentUser.phone : '-'}</div>
            <div class="child-meta" style="color:var(--primary-navy); font-weight:700; margin-top:2px;">
              คลาส: ${child.courseName} | ชั่วโมงคงเหลือ: ${remaining} / ${child.totalHours} ชม.
            </div>
          </div>
          <button class="menu-trigger-btn" onclick="app.openAdminTopUpModal('${child.id}')" style="background:${isPending ? 'var(--accent-coral)' : 'var(--primary-navy)'};">
            ${isPending ? 'Approve & เติมคลาส' : '✏️ แก้ไข / เติมคลาส'}
          </button>
        </div>
      `;
    }).join('');

    renderDailyAuditLogTab();
    renderAdminScheduleGrid();
  }

  function openAdminTopUpModal(childId) {
    const child = store.getChildById(childId);
    if (!child) return;

    document.getElementById('modalTopUpChildId').value = child.id;
    document.getElementById('modalTopUpChildName').textContent = `${child.fullName} (${child.nickname})`;
    document.getElementById('modalTopUpCourse').value = child.courseName || 'Orca Cubs';
    document.getElementById('modalTopUpHours').value = '12';
    
    document.getElementById('adminTopUpModal').classList.add('active');
  }

  function handleAdminTopUpSubmit(e) {
    e.preventDefault();
    const childId = document.getElementById('modalTopUpChildId').value;
    const courseName = document.getElementById('modalTopUpCourse').value;
    const hours = document.getElementById('modalTopUpHours').value;
    const note = document.getElementById('modalTopUpNote').value;

    const res = admin.approveAndAddHours(childId, courseName, hours, note);
    showToast(res.message);
    document.getElementById('adminTopUpModal').classList.remove('active');
    renderAdminDashboard();
  }

  // Daily Audit Summary Log Tab (Requirement 8 - Anti-fraud)
  function renderDailyAuditLogTab() {
    const summary = admin.getDailyAuditSummary(currentSelectedDate);
    document.getElementById('auditLogDateLabel').textContent = `ประจำวันที่ ${summary.date}`;
    document.getElementById('auditTotalHoursToday').textContent = `${summary.totalHoursToday} ชั่วโมง`;

    const container = document.getElementById('auditLogRecordsList');
    if (summary.logs.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8;">ยังไม่มีรายการเติมชั่วโมงในวันนี้</div>`;
      return;
    }

    container.innerHTML = summary.logs.map(log => {
      return `
        <div class="audit-log-card">
          <div class="audit-log-header">
            <span>⏱️ ${new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <span>Admin: <strong>${log.adminName}</strong></span>
          </div>
          <div class="audit-log-body">
            นักเรียน: ${log.childName}
            <span class="audit-added-hours">+${log.hoursAdded} ชม.</span> (${log.courseName})
          </div>
          <div style="font-size:12px; color:#64748b; margin-top:4px;">หมายเหตุ: ${log.note || '-'}</div>
        </div>
      `;
    }).join('');
  }

  // Admin Schedule Matrix Grid (UI Page 17)
  function renderAdminScheduleGrid() {
    const dateStr = currentSelectedDate;
    document.getElementById('adminScheduleDateLabel').textContent = `ตารางเรียนวันที่ ${dateStr}`;

    const bookings = store.getBookingsByDate(dateStr);
    const container = document.getElementById('adminScheduleAttendeesList');

    if (bookings.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:15px; color:#94a3b8;">ยังไม่มีนักเรียนลงชื่อจองเรียนในวันที่เลือก</div>`;
      return;
    }

    container.innerHTML = bookings.map(b => {
      return `
        <div class="booking-item-row" style="background:#f8fafc; border-radius:12px; margin-bottom:8px;">
          <div>
            <span style="font-weight:700; color:var(--primary-navy);">${b.childNickname}</span> (${b.childFullName})
            <div style="font-size:12px; color:#64748b;">รอบ: ${b.timeSlot} | คลาส: ${b.courseName}</div>
          </div>
          <span style="font-size:12px; padding:4px 8px; background:#dcfce7; color:#15803d; border-radius:10px; font-weight:700;">จองแล้ว</span>
        </div>
      `;
    }).join('');
  }

  function handleUpdateSlotQuota() {
    const timeSlot = document.getElementById('adminQuotaSlotSelect').value;
    const newCap = document.getElementById('adminQuotaNumberInput').value;

    const res = admin.updateSlotQuota(currentSelectedDate, timeSlot, newCap);
    showToast(res.message);
    renderAdminDashboard();
  }

  function handleSaveGasUrl() {
    const url = document.getElementById('gasWebAppUrlInput').value.trim();
    window.orcaGas.setWebAppUrl(url);
    showToast('บันทึก Web App URL เรียบร้อย กำลัง Sync ข้อมูลจาก Google Sheet...');
    window.orcaGas.syncAllDataFromGoogleSheet().then(res => {
      if (res && res.status === 'success') {
        showToast('Sync ข้อมูลกับ Google Sheet สำเร็จ!');
        renderAdminDashboard();
      } else {
        showToast('บันทึก URL เรียบร้อย');
      }
    });
  }

  // --- Global Event Listeners Setup ---
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
  document.getElementById('regForm').addEventListener('submit', handleRegister);
  document.getElementById('childForm').addEventListener('submit', handleAddChildSubmit);
  document.getElementById('adminTopUpForm').addEventListener('submit', handleAdminTopUpSubmit);
  if (menuTriggerBtn) menuTriggerBtn.addEventListener('click', openMenuDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeMenuDrawer);

  // Close Modals
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  // Initial Route Check (หน้าแรกเมื่อเข้าเว็บแสดงหน้า Sign In ตามภาพแนบ 1 เสมอ)
  showScreen('screenSignIn');

  // Load existing GAS URL into input
  const existingGasUrl = window.orcaGas.getWebAppUrl();
  if (existingGasUrl && document.getElementById('gasWebAppUrlInput')) {
    document.getElementById('gasWebAppUrlInput').value = existingGasUrl;
  }

  // Export methods to global scope
  window.app = {
    showScreen,
    goBack,
    logout,
    openStudentDashboard,
    openBookingCalendar,
    selectCalendarDate,
    changeCalendarMonth,
    selectSlot,
    handleConfirmBooking,
    cancelBooking,
    openAdminTopUpModal,
    handleUpdateSlotQuota,
    openAddChildScreen,
    handleAddAnotherChild,
    handlePhotoUpload,
    renderAdminScheduleGrid,
    handleSaveGasUrl
  };
});
