// Admin Dashboard
document.addEventListener('DOMContentLoaded', function() {
  const SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
  const SLOT_LABELS = {
    '09:00': '9:00 AM',
    '10:00': '10:00 AM',
    '11:00': '11:00 AM',
    '12:00': '12:00 PM',
    '13:00': '1:00 PM',
    '14:00': '2:00 PM',
    '15:00': '3:00 PM'
  };

  let adminToken = sessionStorage.getItem('adminToken');
  let currentYear, currentMonth;
  let selectedDate = null;
  let allBookings = [];
  let allBlocked = [];
  let currentEmailRecipients = [];
  let currentWorkOrderId = null;

  var qtAllServices = null;
  var currentExpenseYear = new Date().getFullYear();
  var currentExpenseMonth = new Date().getMonth() + 1;
  var currentRevenueYear = new Date().getFullYear();
  var currentLocYear     = new Date().getFullYear();
  var currentLocMonth    = new Date().getMonth() + 1;
  var currentPaymentYear  = new Date().getFullYear();
  var currentPaymentMonth = new Date().getMonth() + 1;

  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();

  const loginSection = document.getElementById('admin-login');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('admin-logout');

  const calendarGrid = document.querySelector('.admin-calendar .calendar-grid');
  const monthLabel = document.querySelector('.admin-calendar .calendar-month-label');
  const prevBtn = document.querySelector('.admin-calendar .calendar-prev');
  const nextBtn = document.querySelector('.admin-calendar .calendar-next');

  const dayDetail = document.getElementById('day-detail');
  const dayDetailTitle = document.getElementById('day-detail-title');
  const daySlots = document.getElementById('day-slots');
  const blockDayCheckbox = document.getElementById('block-day-toggle');
  const bookingsBody = document.getElementById('bookings-body');
  const printDayBtn = document.getElementById('print-day-btn');

  // Login
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    loginError.textContent = '';
    const password = document.getElementById('admin-password').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      });
      const data = await res.json();
      if (data.success) {
        adminToken = data.token;
        sessionStorage.setItem('adminToken', adminToken);
        showDashboard();
      } else {
        loginError.textContent = data.message || 'Invalid password';
      }
    } catch (err) {
      loginError.textContent = 'Connection error. Please try again.';
    }
  });

  logoutBtn.addEventListener('click', function() {
    adminToken = null;
    sessionStorage.removeItem('adminToken');
    dashboard.classList.remove('active');
    loginSection.style.display = 'block';
  });

  function showDashboard() {
    loginSection.style.display = 'none';
    dashboard.classList.add('active');
    loadDashboardTab();
    loadAdminData();
  }

  async function loadAdminData() {
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { 'x-admin-token': adminToken }
      });
      if (res.status === 401) {
        adminToken = null;
        sessionStorage.removeItem('adminToken');
        dashboard.classList.remove('active');
        loginSection.style.display = 'block';
        loginError.textContent = 'Session expired. Please log in again.';
        return;
      }
      const data = await res.json();
      allBookings = data.bookings || [];
      allBlocked = data.blocked || [];
      renderAdminCalendar();
      renderBookingsTable();
      if (selectedDate) renderDayDetail(selectedDate);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }

  prevBtn.addEventListener('click', function() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderAdminCalendar();
  });

  nextBtn.addEventListener('click', function() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderAdminCalendar();
  });

  function renderAdminCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    monthLabel.textContent = monthNames[currentMonth] + ' ' + currentYear;

    calendarGrid.innerHTML = '';
    var dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(function(d) {
      var el = document.createElement('div');
      el.className = 'calendar-day-label';
      el.textContent = d;
      calendarGrid.appendChild(el);
    });

    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (var i = 0; i < firstDay; i++) {
      var empty = document.createElement('div');
      empty.className = 'calendar-day empty';
      calendarGrid.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'calendar-day';
      el.textContent = day;

      var dateStr = currentYear + '-' +
        String(currentMonth + 1).padStart(2, '0') + '-' +
        String(day).padStart(2, '0');

      var isSunday = new Date(currentYear, currentMonth, day).getDay() === 0;
      if (isSunday) el.classList.add('disabled');

      // Check if day is blocked
      var dayBlocked = allBlocked.some(function(b) {
        return b.date === dateStr && b.time === 'all';
      });
      if (dayBlocked) el.classList.add('fully-booked');

      // Check if day has bookings
      var dayBookings = allBookings.filter(function(b) { return b.date === dateStr; });
      if (dayBookings.length > 0 && !dayBlocked) el.classList.add('has-availability');

      if (selectedDate === dateStr) el.classList.add('selected');

      if (currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate()) {
        el.classList.add('today');
      }

      (function(ds) {
        el.addEventListener('click', function() {
          selectedDate = ds;
          renderAdminCalendar();
          renderDayDetail(ds);
        });
      })(dateStr);

      calendarGrid.appendChild(el);
    }
  }

  function renderDayDetail(dateStr) {
    dayDetail.style.display = 'block';
    dayDetail.querySelector('.no-selection').style.display = 'none';
    dayDetailTitle.style.display = 'block';
    dayDetail.querySelector('.block-day-toggle').style.display = 'flex';
    printDayBtn.style.display = 'inline-block';
    printDayBtn.onclick = function() { printDayBookings(dateStr); };

    var dateObj = new Date(dateStr + 'T12:00:00');
    var options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dayDetailTitle.textContent = dateObj.toLocaleDateString('en-US', options);

    var isDayBlocked = allBlocked.some(function(b) {
      return b.date === dateStr && b.time === 'all';
    });
    blockDayCheckbox.checked = isDayBlocked;

    daySlots.innerHTML = '';

    // Build map of slot -> booking that occupies it (accounting for duration)
    var slotBookingMap = {};
    allBookings.filter(function(b) { return b.date === dateStr; }).forEach(function(b) {
      var dur = b.duration || 1;
      var startIdx = SLOTS.indexOf(b.time);
      if (startIdx === -1) return;
      for (var i = 0; i < dur && (startIdx + i) < SLOTS.length; i++) {
        slotBookingMap[SLOTS[startIdx + i]] = b;
      }
    });

    SLOTS.forEach(function(slot) {
      var booking = slotBookingMap[slot] || null;
      var blocked = allBlocked.some(function(b) {
        return b.date === dateStr && (b.time === slot || b.time === 'all');
      });

      var row = document.createElement('div');
      row.className = 'admin-slot';

      var info = document.createElement('div');
      info.className = 'slot-info';

      var timeEl = document.createElement('span');
      timeEl.className = 'slot-time';
      timeEl.textContent = SLOT_LABELS[slot];

      var labelEl = document.createElement('span');
      labelEl.className = 'slot-label';

      if (booking) {
        labelEl.className += ' booked';
        var isStart = booking.time === slot;
        labelEl.textContent = isStart
          ? 'Booked - ' + booking.name
          : 'Booked (cont.) - ' + booking.name;
      } else if (blocked) {
        labelEl.className += ' blocked';
        labelEl.textContent = 'Blocked';
      } else {
        labelEl.className += ' available';
        labelEl.textContent = 'Available';
      }

      info.appendChild(timeEl);
      info.appendChild(labelEl);

      var actions = document.createElement('div');
      actions.className = 'slot-actions';

      if (booking && booking.time === slot) {
        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', function() {
          adminAction('cancel', dateStr, slot);
        });
        actions.appendChild(cancelBtn);
      } else if (booking) {
        // Continuation slot — no actions needed
      } else if (blocked && !isDayBlocked) {
        var unblockBtn = document.createElement('button');
        unblockBtn.type = 'button';
        unblockBtn.className = 'btn-unblock';
        unblockBtn.textContent = 'Unblock';
        unblockBtn.addEventListener('click', function() {
          adminAction('unblock', dateStr, slot);
        });
        actions.appendChild(unblockBtn);
      } else if (!blocked) {
        var blockBtn = document.createElement('button');
        blockBtn.type = 'button';
        blockBtn.className = 'btn-block';
        blockBtn.textContent = 'Block';
        blockBtn.addEventListener('click', function() {
          adminAction('block', dateStr, slot);
        });
        actions.appendChild(blockBtn);
      }

      row.appendChild(info);
      row.appendChild(actions);
      daySlots.appendChild(row);
    });
  }

  blockDayCheckbox.addEventListener('change', function() {
    if (!selectedDate) return;
    var action = this.checked ? 'block' : 'unblock';
    adminAction(action, selectedDate, 'all');
  });

  async function adminAction(action, date, time) {
    try {
      var res = await fetch('/api/admin/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify({ action: action, date: date, time: time })
      });
      if (res.status === 401) {
        adminToken = null;
        sessionStorage.removeItem('adminToken');
        dashboard.classList.remove('active');
        loginSection.style.display = 'block';
        return;
      }
      await loadAdminData();
    } catch (err) {
      console.error('Admin action failed:', err);
    }
  }

  function buildBookingRow(b) {
    var row = document.createElement('tr');
    var dateObj = new Date(b.date + 'T12:00:00');
    var dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    var dur = b.duration || 1;
    var woBtn = b.work_order_id
      ? '<button type="button" class="btn-wo" onclick="openWorkOrderModal(' + b.work_order_id + ')" style="padding:3px 10px; font-size:0.8em; background:#1a1a2e; color:#fff; border:none; border-radius:4px; cursor:pointer;">View WO</button>'
      : '<span style="color:#aaa; font-size:0.85em;">—</span>';
    var cancelBtn = '<button type="button" class="btn-cancel" onclick="cancelBookingById(' + b.id + ')">Cancel</button>';
    row.innerHTML =
      '<td>' + dateLabel + '</td>' +
      '<td>' + (SLOT_LABELS[b.time] || b.time) + '</td>' +
      '<td>' + dur + 'hr' + (dur > 1 ? 's' : '') + '</td>' +
      '<td>' + escapeHtml(b.name) + '</td>' +
      '<td>' + escapeHtml(b.service || '-') + '</td>' +
      '<td>' + escapeHtml(b.phone || '-') + '</td>' +
      '<td>' + escapeHtml(b.address || '-') + '</td>' +
      '<td>' + escapeHtml(b.email || '-') + '</td>' +
      '<td style="max-width:160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + escapeHtml(b.notes || '') + '">' + escapeHtml(b.notes || '-') + '</td>' +
      '<td>' + woBtn + '</td>' +
      '<td>' + cancelBtn + '</td>';
    return row;
  }

  function renderBookingsTable() {
    bookingsBody.innerHTML = '';

    var todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    var upcoming = allBookings
      .filter(function(b) { return b.date >= todayStr; })
      .sort(function(a, b) {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return a.time < b.time ? -1 : 1;
      });

    if (upcoming.length === 0) {
      var row = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 11;
      td.className = 'no-bookings';
      td.textContent = 'No upcoming bookings';
      row.appendChild(td);
      bookingsBody.appendChild(row);
    } else {
      upcoming.forEach(function(b) {
        bookingsBody.appendChild(buildBookingRow(b));
      });
    }

    renderPastBookings(todayStr);
  }

  function renderPastBookings(todayStr, searchQuery) {
    var pastBody = document.getElementById('past-bookings-body');
    var pastCount = document.getElementById('past-bookings-count');
    if (!pastBody) return;
    if (!todayStr) {
      todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
    }

    var past = allBookings
      .filter(function(b) { return b.date < todayStr; })
      .sort(function(a, b) {
        if (a.date !== b.date) return a.date > b.date ? -1 : 1;
        return a.time > b.time ? -1 : 1;
      });

    if (searchQuery) {
      past = past.filter(function(b) {
        return (b.name || '').toLowerCase().indexOf(searchQuery) !== -1 ||
          (b.email || '').toLowerCase().indexOf(searchQuery) !== -1 ||
          (b.phone || '').toLowerCase().indexOf(searchQuery) !== -1 ||
          (b.service || '').toLowerCase().indexOf(searchQuery) !== -1 ||
          (b.address || '').toLowerCase().indexOf(searchQuery) !== -1;
      });
    }

    pastCount.textContent = '(' + past.length + ')';
    pastBody.innerHTML = '';

    if (past.length === 0) {
      var row = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 11;
      td.className = 'no-bookings';
      td.textContent = searchQuery ? 'No matching past bookings' : 'No past bookings';
      row.appendChild(td);
      pastBody.appendChild(row);
    } else {
      past.forEach(function(b) {
        pastBody.appendChild(buildBookingRow(b));
      });
    }
  }

  window.cancelBookingById = async function(id) {
    if (!confirm('Cancel this booking?')) return;
    try {
      var res = await fetch('/api/admin/bookings/' + id, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      if (res.status === 401) { handleAuthExpired(); return; }
      await loadAdminData();
    } catch (err) {
      console.error('Cancel booking failed:', err);
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function printDayBookings(dateStr) {
    var bookingsForDay = allBookings
      .filter(function(b) { return b.date === dateStr; })
      .sort(function(a, b) { return a.time < b.time ? -1 : 1; });

    var dateObj = new Date(dateStr + 'T12:00:00');
    var dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    var rows = '';
    if (bookingsForDay.length === 0) {
      rows = '<p style="text-align:center; color:#666; margin-top:30px;">No bookings for this day.</p>';
    } else {
      bookingsForDay.forEach(function(b) {
        var timeLabel = SLOT_LABELS[b.time] || b.time;
        var dur = b.duration || 1;
        rows += '<div style="border:1px solid #ddd; border-radius:8px; padding:16px; margin-bottom:16px; page-break-inside:avoid;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">' +
            '<span style="font-size:1.2em; font-weight:bold; color:#1a1a2e;">' + timeLabel + '</span>' +
            '<span style="font-size:1.1em; font-weight:bold; color:#2d6a4f;">' + (b.price ? b.price : 'Price not on file') + '</span>' +
          '</div>' +
          '<table style="width:100%; border-collapse:collapse; font-size:0.95em;">' +
            '<tr><td style="padding:4px 8px; color:#555; width:120px;">Name</td><td style="padding:4px 8px; font-weight:600;">' + escapeHtml(b.name) + '</td>' +
                '<td style="padding:4px 8px; color:#555; width:120px;">Phone</td><td style="padding:4px 8px; font-weight:600;">' + escapeHtml(b.phone || '-') + '</td></tr>' +
            '<tr><td style="padding:4px 8px; color:#555;">Email</td><td style="padding:4px 8px;" colspan="3">' + escapeHtml(b.email || '-') + '</td></tr>' +
            '<tr><td style="padding:4px 8px; color:#555;">Address</td><td style="padding:4px 8px;" colspan="3">' + escapeHtml(b.address || '-') + '</td></tr>' +
            '<tr><td style="padding:4px 8px; color:#555;">Service</td><td style="padding:4px 8px;">' + escapeHtml(b.service || '-') + '</td>' +
                '<td style="padding:4px 8px; color:#555;">Duration</td><td style="padding:4px 8px;">' + dur + ' hr' + (dur > 1 ? 's' : '') + '</td></tr>' +
          '</table>' +
          (b.notes ? '<div style="margin-top:10px; padding:10px; background:#f9f9f9; border-radius:6px; font-size:0.9em; white-space:pre-line;">' + escapeHtml(b.notes) + '</div>' : '') +
        '</div>';
      });
    }

    var printWindow = window.open('', '_blank');
    printWindow.document.write('<!DOCTYPE html><html><head><title>D&G Soft Wash - ' + dateLabel + '</title>' +
      '<style>body{font-family:Arial,sans-serif;margin:30px;color:#1a1a2e;} h1{margin:0;font-size:1.6em;} .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1a1a2e;padding-bottom:12px;margin-bottom:24px;} .subtitle{color:#555;font-size:1em;margin-top:4px;} @media print{button{display:none;}}</style>' +
      '</head><body>' +
      '<div class="header">' +
        '<div><h1>D&amp;G Soft Wash</h1><div class="subtitle">Integrity You Can See &mdash; Veteran Owned &amp; Operated</div></div>' +
        '<div style="text-align:right;"><strong>Schedule</strong><br>' + dateLabel + '<br><span style="color:#555;">' + bookingsForDay.length + ' booking' + (bookingsForDay.length !== 1 ? 's' : '') + '</span></div>' +
      '</div>' +
      rows +
      '<div style="text-align:center; margin-top:30px; color:#aaa; font-size:0.85em;">Printed from D&amp;G Soft Wash Admin Dashboard &mdash; (757) 525-9508</div>' +
      '<div style="text-align:center; margin-top:16px;"><button onclick="window.print()" style="padding:10px 30px; font-size:1em; cursor:pointer;">Print</button></div>' +
      '</body></html>');
    printWindow.document.close();
  }

  function handleAuthExpired() {
    adminToken = null;
    sessionStorage.removeItem('adminToken');
    dashboard.classList.remove('active');
    loginSection.style.display = 'block';
    loginError.textContent = 'Session expired. Please log in again.';
  }

  // Past bookings toggle
  var pastToggle = document.getElementById('past-bookings-toggle');
  var pastContent = document.getElementById('past-bookings-content');
  var pastArrow = document.getElementById('past-bookings-arrow');
  if (pastToggle) {
    pastToggle.addEventListener('click', function() {
      var visible = pastContent.style.display !== 'none';
      pastContent.style.display = visible ? 'none' : 'block';
      pastArrow.innerHTML = visible ? '&#9654;' : '&#9660;';
    });
  }

  // Past bookings search
  var pastSearchInput = document.getElementById('past-search');
  if (pastSearchInput) {
    pastSearchInput.addEventListener('input', function() {
      renderPastBookings(null, this.value.toLowerCase().trim());
    });
  }

  // --- Manual Booking Modal ---
  var addBookingBtn = document.getElementById('add-booking-btn');
  var manualBookingModal = document.getElementById('manual-booking-modal');
  var closeManualBookingModal = document.getElementById('close-manual-booking-modal');
  var manualBookingForm = document.getElementById('manual-booking-form');

  if (addBookingBtn) {
    addBookingBtn.addEventListener('click', function() {
      manualBookingModal.style.display = 'block';
      document.getElementById('mb-error').textContent = '';
      manualBookingForm.reset();
    });
  }
  if (closeManualBookingModal) {
    closeManualBookingModal.addEventListener('click', function() {
      manualBookingModal.style.display = 'none';
    });
  }
  manualBookingModal && manualBookingModal.addEventListener('click', function(e) {
    if (e.target === manualBookingModal) manualBookingModal.style.display = 'none';
  });

  if (manualBookingForm) {
    manualBookingForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var errEl = document.getElementById('mb-error');
      errEl.textContent = '';
      var body = {
        name: document.getElementById('mb-name').value.trim(),
        email: document.getElementById('mb-email').value.trim(),
        phone: document.getElementById('mb-phone').value.trim(),
        address: document.getElementById('mb-address').value.trim(),
        service: document.getElementById('mb-service').value.trim(),
        date: document.getElementById('mb-date').value,
        time: document.getElementById('mb-time').value,
        duration: document.getElementById('mb-duration').value,
        price: document.getElementById('mb-price').value.trim(),
        notes: document.getElementById('mb-notes').value.trim()
      };
      if (!body.name || !body.date || !body.time) {
        errEl.textContent = 'Name, Date, and Time are required.';
        return;
      }
      try {
        var res = await fetch('/api/admin/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify(body)
        });
        if (res.status === 401) { handleAuthExpired(); return; }
        var data = await res.json();
        if (data.success) {
          manualBookingModal.style.display = 'none';
          await loadAdminData();
          showPricingMsg('Booking added!', true);
        } else {
          errEl.textContent = data.error || 'Failed to add booking.';
        }
      } catch (err) {
        errEl.textContent = 'Error. Please try again.';
      }
    });
  }

  // --- Work Order Modal ---
  var workOrderModal = document.getElementById('work-order-modal');
  var closeWorkOrderModalBtn = document.getElementById('close-work-order-modal');
  var woPrintBtn = document.getElementById('wo-print-btn');

  if (closeWorkOrderModalBtn) {
    closeWorkOrderModalBtn.addEventListener('click', function() {
      workOrderModal.style.display = 'none';
      currentWorkOrderId = null;
    });
  }
  workOrderModal && workOrderModal.addEventListener('click', function(e) {
    if (e.target === workOrderModal) { workOrderModal.style.display = 'none'; currentWorkOrderId = null; }
  });

  window.openWorkOrderModal = async function(woId) {
    currentWorkOrderId = woId;
    workOrderModal.style.display = 'block';
    var content = document.getElementById('wo-modal-content');
    content.innerHTML = '<p style="color:#666;">Loading...</p>';
    document.getElementById('wo-modal-title').textContent = 'Work Order #' + woId;
    try {
      var res = await fetch('/api/admin/work-orders/' + woId, {
        headers: { 'x-admin-token': adminToken }
      });
      if (res.status === 401) { handleAuthExpired(); return; }
      var wo = await res.json();
      renderWorkOrderModal(wo);
    } catch (err) {
      content.innerHTML = '<p style="color:#dc2626;">Failed to load work order.</p>';
    }
  };

  function renderWorkOrderModal(wo) {
    var content = document.getElementById('wo-modal-content');
    var dateLabel = wo.date ? new Date(wo.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—';
    var timeLabel = wo.time ? (SLOT_LABELS[wo.time] || wo.time) : '—';
    var dur = wo.duration || 1;

    var infoHtml =
      '<table style="width:100%; border-collapse:collapse; font-size:0.95em; margin-bottom:18px;">' +
        '<tr><td style="padding:5px 8px; color:#555; width:110px;">Customer</td><td style="padding:5px 8px; font-weight:600;">' + escapeHtml(wo.booking_name || wo.customer_name || '—') + '</td></tr>' +
        '<tr><td style="padding:5px 8px; color:#555;">Date</td><td style="padding:5px 8px;">' + dateLabel + ' &middot; ' + timeLabel + ' &middot; ' + dur + ' hr' + (dur > 1 ? 's' : '') + '</td></tr>' +
        '<tr><td style="padding:5px 8px; color:#555;">Service</td><td style="padding:5px 8px;">' + escapeHtml(wo.service || '—') + '</td></tr>' +
        '<tr><td style="padding:5px 8px; color:#555;">Phone</td><td style="padding:5px 8px;">' + escapeHtml(wo.booking_phone || wo.customer_phone || '—') + '</td></tr>' +
        '<tr><td style="padding:5px 8px; color:#555;">Email</td><td style="padding:5px 8px;">' + escapeHtml(wo.booking_email || wo.customer_email || '—') + '</td></tr>' +
        '<tr><td style="padding:5px 8px; color:#555;">Address</td><td style="padding:5px 8px;">' + escapeHtml(wo.booking_address || wo.customer_address || '—') + '</td></tr>' +
        '<tr><td style="padding:5px 8px; color:#555;">Price</td><td style="padding:5px 8px; font-weight:600; color:#2d6a4f;">' + escapeHtml(wo.price || '—') + '</td></tr>' +
        '<tr><td style="padding:5px 8px; color:#555;">Payment</td><td style="padding:5px 8px;">' +
          '<select id="wo-payment-method" style="padding:4px 8px; border:1px solid #ddd; border-radius:4px; font-size:0.9em;">' +
          '<option value="">-- Not set --</option>' +
          ['Cash','Check','Card (Chase)','Zelle','Other'].map(function(m) {
            return '<option value="' + m + '"' + (wo.payment_method === m ? ' selected' : '') + '>' + m + '</option>';
          }).join('') +
          '</select></td></tr>' +
        '<tr><td style="padding:5px 8px; color:#555;">Mileage</td><td style="padding:5px 8px;">' +
          '<input type="number" id="wo-mileage" value="' + (wo.mileage || 0) + '" min="0" step="0.1" style="width:80px; padding:4px 6px; border:1px solid #ddd; border-radius:4px;"> mi</td></tr>' +
      '</table>';

    var addonsHtml = wo.booking_notes
      ? '<div style="margin-bottom:18px;">' +
          '<div style="font-weight:600; margin-bottom:8px; color:#1a1a2e;">Services &amp; Add-ons</div>' +
          '<div style="background:#f8f9fa; border-radius:8px; padding:14px; white-space:pre-line; font-family:monospace; font-size:0.9em; line-height:1.6;">' +
          escapeHtml(wo.booking_notes) + '</div></div>'
      : '';

    var statusHtml = '<div style="margin-bottom:18px; padding:14px; background:#f8f9fa; border-radius:8px;">' +
      '<div style="font-weight:600; margin-bottom:10px; color:#1a1a2e;">Status</div>' +
      '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
        renderStatusToggle(wo.id, 'status_job_complete', wo.status_job_complete, 'Job Complete') +
        renderStatusToggle(wo.id, 'status_invoiced', wo.status_invoiced, 'Invoiced') +
        renderStatusToggle(wo.id, 'status_invoice_paid', wo.status_invoice_paid, 'Invoice Paid') +
        renderStatusToggle(wo.id, 'status_paid', wo.status_paid, 'Paid') +
      '</div></div>';

    var notesHtml = '<div>' +
      '<div style="font-weight:600; margin-bottom:8px; color:#1a1a2e;">D&amp;G Soft Wash Comments</div>' +
      '<textarea id="wo-admin-notes" rows="4" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; resize:vertical; font-family:inherit;" placeholder="Internal notes...">' + escapeHtml(wo.admin_notes || '') + '</textarea>' +
      '<p id="wo-notes-status" style="margin-top:4px; font-size:0.85em; color:#888;"></p>' +
      '</div>';

    var completionNotesHtml = '<div style="margin-top:16px;">' +
      '<div style="font-weight:600; margin-bottom:8px; color:#1a1a2e;">Completion Notes</div>' +
      '<textarea id="wo-completion-notes" rows="3" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; resize:vertical; font-family:inherit;" placeholder="Notes about the completed job, products used, access codes, etc...">' + escapeHtml(wo.completion_notes || '') + '</textarea>' +
      '<p id="wo-completion-notes-status" style="margin-top:4px; font-size:0.85em; color:#888;"></p>' +
      '</div>';

    var actionsHtml = '';
    var recipientEmail = wo.booking_email || wo.customer_email;
    var hasPhone = !!(wo.booking_phone || wo.customer_phone);
    if (wo.status_paid && recipientEmail) {
      actionsHtml += '<button type="button" id="wo-review-btn" class="btn btn-secondary" style="padding:7px 16px; font-size:0.88em; margin-right:8px; margin-top:8px;">&#11088; Send Review Request</button>';
    }
    if (wo.date && hasPhone) {
      actionsHtml += '<button type="button" id="wo-sms-btn" class="btn btn-secondary" style="padding:7px 16px; font-size:0.88em; margin-top:8px;">&#128240; Send SMS Reminder</button>';
    }
    if (actionsHtml) {
      actionsHtml = '<div style="margin-top:16px; padding-top:16px; border-top:1px solid #e5e7eb;">' +
        '<div style="font-weight:600; margin-bottom:8px; color:#1a1a2e;">Actions</div>' +
        '<div>' + actionsHtml + '</div>' +
        '<p id="wo-action-status" style="margin-top:6px; font-size:0.85em; color:#888;"></p>' +
        '</div>';
    }

    content.innerHTML = infoHtml + addonsHtml + statusHtml + notesHtml + completionNotesHtml + actionsHtml;

    document.getElementById('wo-admin-notes').addEventListener('blur', async function() {
      var notesStatus = document.getElementById('wo-notes-status');
      notesStatus.textContent = 'Saving...';
      try {
        var res = await fetch('/api/admin/work-orders/' + wo.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify({ admin_notes: this.value })
        });
        notesStatus.textContent = res.ok ? 'Saved.' : 'Save failed.';
        notesStatus.style.color = res.ok ? '#2d6a4f' : '#dc2626';
        setTimeout(function() { notesStatus.textContent = ''; }, 2500);
      } catch (e) {
        notesStatus.textContent = 'Error saving.';
        notesStatus.style.color = '#dc2626';
      }
    });

    var paymentSel = document.getElementById('wo-payment-method');
    if (paymentSel) {
      paymentSel.addEventListener('change', async function() {
        try {
          await fetch('/api/admin/work-orders/' + wo.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify({ payment_method: this.value })
          });
        } catch(e) {}
      });
    }

    var mileageInput = document.getElementById('wo-mileage');
    if (mileageInput) {
      mileageInput.addEventListener('blur', async function() {
        try {
          await fetch('/api/admin/work-orders/' + wo.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify({ mileage: parseFloat(this.value) || 0 })
          });
        } catch(e) {}
      });
    }

    var completionNotesEl = document.getElementById('wo-completion-notes');
    if (completionNotesEl) {
      completionNotesEl.addEventListener('blur', async function() {
        var statusEl = document.getElementById('wo-completion-notes-status');
        statusEl.textContent = 'Saving...';
        try {
          var res = await fetch('/api/admin/work-orders/' + wo.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify({ completion_notes: this.value })
          });
          statusEl.textContent = res.ok ? 'Saved.' : 'Save failed.';
          statusEl.style.color = res.ok ? '#2d6a4f' : '#dc2626';
          setTimeout(function() { statusEl.textContent = ''; }, 2500);
        } catch(e) {
          statusEl.textContent = 'Error saving.';
          statusEl.style.color = '#dc2626';
        }
      });
    }

    var reviewBtn = document.getElementById('wo-review-btn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', async function() {
        var statusEl = document.getElementById('wo-action-status');
        reviewBtn.disabled = true;
        statusEl.textContent = 'Sending...';
        statusEl.style.color = '#666';
        try {
          var res = await fetch('/api/admin/work-orders/' + wo.id + '/review-request', {
            method: 'POST',
            headers: { 'x-admin-token': adminToken }
          });
          var data = await res.json();
          if (data.success) {
            statusEl.textContent = 'Review request sent!';
            statusEl.style.color = '#2d6a4f';
          } else {
            statusEl.textContent = data.error || 'Failed to send.';
            statusEl.style.color = '#dc2626';
          }
        } catch(e) {
          statusEl.textContent = 'Error. Please try again.';
          statusEl.style.color = '#dc2626';
        }
        reviewBtn.disabled = false;
      });
    }

    var smsBtn = document.getElementById('wo-sms-btn');
    if (smsBtn) {
      smsBtn.addEventListener('click', async function() {
        var statusEl = document.getElementById('wo-action-status');
        smsBtn.disabled = true;
        statusEl.textContent = 'Sending SMS...';
        statusEl.style.color = '#666';
        try {
          var res = await fetch('/api/admin/work-orders/' + wo.id + '/sms-reminder', {
            method: 'POST',
            headers: { 'x-admin-token': adminToken }
          });
          var data = await res.json();
          if (data.success) {
            statusEl.textContent = 'SMS reminder sent!';
            statusEl.style.color = '#2d6a4f';
          } else {
            statusEl.textContent = data.error || 'Failed to send SMS.';
            statusEl.style.color = '#dc2626';
          }
        } catch(e) {
          statusEl.textContent = 'Error. Please try again.';
          statusEl.style.color = '#dc2626';
        }
        smsBtn.disabled = false;
      });
    }

    if (woPrintBtn) {
      woPrintBtn.onclick = function() { printWorkOrder(wo); };
    }
  }

  function renderStatusToggle(woId, field, active, label) {
    var style = active
      ? 'padding:7px 14px; border:none; border-radius:20px; cursor:pointer; font-size:0.88em; font-weight:600; background:#2d6a4f; color:#fff;'
      : 'padding:7px 14px; border:2px solid #ddd; border-radius:20px; cursor:pointer; font-size:0.88em; font-weight:600; background:#fff; color:#555;';
    return '<button type="button" style="' + style + '" onclick="toggleWorkOrderStatus(' + woId + ', \'' + field + '\', ' + !active + ')">' +
      (active ? '&#10003; ' : '') + label + '</button>';
  }

  window.toggleWorkOrderStatus = async function(woId, field, newVal) {
    try {
      var body = {};
      body[field] = newVal;
      var res = await fetch('/api/admin/work-orders/' + woId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(body)
      });
      if (res.status === 401) { handleAuthExpired(); return; }
      var data = await res.json();
      // Re-open modal to refresh
      await openWorkOrderModal(woId);
      if (data.email_sent === 'invoice') showPricingMsg('Invoice emailed to customer!', true);
      if (data.email_sent === 'paid') showPricingMsg('Payment receipt emailed to customer!', true);
    } catch (err) {
      console.error('Toggle WO status failed:', err);
    }
  };

  function printWorkOrder(wo) {
    var dateLabel = wo.date ? new Date(wo.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—';
    var timeLabel = wo.time ? (SLOT_LABELS[wo.time] || wo.time) : '—';
    var dur = wo.duration || 1;
    var statusList = [];
    if (wo.status_job_complete) statusList.push('Job Complete');
    if (wo.status_invoiced) statusList.push('Invoiced');
    if (wo.status_invoice_paid) statusList.push('Invoice Paid');
    if (wo.status_paid) statusList.push('Paid');

    var printWindow = window.open('', '_blank');
    printWindow.document.write('<!DOCTYPE html><html><head><title>Work Order #' + wo.id + ' - D&amp;G Soft Wash</title>' +
      '<style>body{font-family:Arial,sans-serif;margin:30px;color:#1a1a2e;} h1{margin:0;font-size:1.6em;} .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1a1a2e;padding-bottom:12px;margin-bottom:24px;} table{width:100%;border-collapse:collapse;} td{padding:6px 8px;} .label{color:#555;width:130px;} .section{background:#f8f9fa;border-radius:8px;padding:14px;margin:16px 0;} @media print{button{display:none;}}</style>' +
      '</head><body>' +
      '<div class="header"><div><h1>D&amp;G Soft Wash</h1><div style="color:#555;">Integrity You Can See &mdash; Veteran Owned &amp; Operated</div></div>' +
      '<div style="text-align:right;"><strong>Work Order #' + wo.id + '</strong><br>' + dateLabel + '</div></div>' +
      '<table><tr><td class="label">Customer</td><td><strong>' + escapeHtml(wo.booking_name || wo.customer_name || '—') + '</strong></td><td class="label">Phone</td><td>' + escapeHtml(wo.booking_phone || '—') + '</td></tr>' +
      '<tr><td class="label">Email</td><td colspan="3">' + escapeHtml(wo.booking_email || '—') + '</td></tr>' +
      '<tr><td class="label">Address</td><td colspan="3">' + escapeHtml(wo.booking_address || '—') + '</td></tr>' +
      '<tr><td class="label">Service</td><td>' + escapeHtml(wo.service || '—') + '</td><td class="label">Duration</td><td>' + dur + ' hr' + (dur !== 1 ? 's' : '') + '</td></tr>' +
      '<tr><td class="label">Time</td><td>' + timeLabel + '</td><td class="label">Price</td><td><strong style="color:#2d6a4f;">' + escapeHtml(wo.price || '—') + '</strong></td></tr>' +
      '</table>' +
      (wo.booking_notes ? '<div class="section"><strong>Services &amp; Add-ons</strong><div style="margin-top:8px; white-space:pre-line; font-family:monospace; font-size:0.9em; line-height:1.6;">' + escapeHtml(wo.booking_notes) + '</div></div>' : '') +
      (statusList.length ? '<div class="section"><strong>Status:</strong> ' + statusList.join(' &bull; ') + '</div>' : '') +
      (wo.admin_notes ? '<div class="section"><strong>D&amp;G Comments:</strong><br><span style="white-space:pre-line;">' + escapeHtml(wo.admin_notes) + '</span></div>' : '') +
      (wo.completion_notes ? '<div class="section"><strong>Completion Notes:</strong><br><span style="white-space:pre-line;">' + escapeHtml(wo.completion_notes) + '</span></div>' : '') +
      (wo.mileage ? '<div class="section"><strong>Mileage:</strong> ' + wo.mileage + ' mi</div>' : '') +
      '<div style="text-align:center; margin-top:40px; color:#aaa; font-size:0.85em;">D&amp;G Soft Wash &mdash; (757) 525-9508 &mdash; dgsoftwash@yahoo.com</div>' +
      '<div style="text-align:center; margin-top:16px;"><button onclick="window.print()" style="padding:10px 30px; font-size:1em; cursor:pointer;">Print</button></div>' +
      '</body></html>');
    printWindow.document.close();
  }

  // --- Dashboard Tab ---
  async function loadDashboardTab() {
    var container = document.getElementById('dashboard-admin-container');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var res = await fetch('/api/admin/dashboard', { headers: { 'x-admin-token': adminToken } });
      if (res.status === 401) { handleAuthExpired(); return; }
      var data = await res.json();
      renderDashboard(data);
    } catch (e) {
      container.innerHTML = '<p style="color:#dc2626;">Failed to load dashboard.</p>';
    }
  }

  function renderDashboard(data) {
    var container = document.getElementById('dashboard-admin-container');
    var monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    var SLOT_LABELS_D = { '09:00':'9:00 AM','10:00':'10:00 AM','11:00':'11:00 AM','12:00':'12:00 PM','13:00':'1:00 PM','14:00':'2:00 PM','15:00':'3:00 PM' };

    var html = '<h2 style="margin-bottom:20px;">Dashboard</h2>';

    // Summary cards
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:28px;">';
    html += '<div style="background:#dbeafe; border-radius:10px; padding:20px; text-align:center;">' +
      '<div style="font-size:2em; font-weight:700; color:#1e40af;">' + (data.week_jobs || []).length + '</div>' +
      '<div style="color:#1e40af; font-size:0.9em; margin-top:4px;">This Week\'s Jobs</div></div>';
    html += '<div style="background:#fee2e2; border-radius:10px; padding:20px; text-align:center;">' +
      '<div style="font-size:2em; font-weight:700; color:#991b1b;">$' + ((data.outstanding_total||0).toFixed(2)) + '</div>' +
      '<div style="color:#991b1b; font-size:0.9em; margin-top:4px;">Outstanding (' + (data.outstanding_invoices||[]).length + ' WOs)</div></div>';
    html += '<div style="background:#d1fae5; border-radius:10px; padding:20px; text-align:center;">' +
      '<div style="font-size:2em; font-weight:700; color:#065f46;">$' + ((data.monthly_revenue||0).toFixed(2)) + '</div>' +
      '<div style="color:#065f46; font-size:0.9em; margin-top:4px;">' + monthName + ' Revenue</div></div>';
    html += '<div style="background:#fef3c7; border-radius:10px; padding:20px; text-align:center;">' +
      '<div style="font-size:2em; font-weight:700; color:#92400e;">$' + ((data.monthly_expenses||0).toFixed(2)) + '</div>' +
      '<div style="color:#92400e; font-size:0.9em; margin-top:4px;">' + monthName + ' Expenses</div></div>';
    html += '</div>';

    // Net profit line
    var net = (data.monthly_revenue||0) - (data.monthly_expenses||0);
    html += '<div style="background:#f8f9fa; border-radius:8px; padding:12px 18px; margin-bottom:24px; display:flex; align-items:center; gap:12px;">' +
      '<span style="color:#555;">Net Profit (' + monthName + '):</span>' +
      '<span style="font-weight:700; font-size:1.1em; color:' + (net >= 0 ? '#065f46' : '#991b1b') + ';">$' + net.toFixed(2) + '</span>' +
      '</div>';

    // This week's jobs
    var weekJobs = data.week_jobs || [];
    html += '<div class="bookings-table-container" style="margin-bottom:24px;"><h3>This Week\'s Jobs (' + weekJobs.length + ')</h3>';
    if (weekJobs.length === 0) {
      html += '<p style="color:#666; padding:10px 0;">No jobs scheduled this week.</p>';
    } else {
      html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr><th>Date</th><th>Customer</th><th>Service</th><th>Price</th><th>Status</th><th>WO</th></tr></thead><tbody>';
      weekJobs.forEach(function(j) {
        var dateLabel = new Date(j.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        var timeLabel = SLOT_LABELS_D[j.time] || j.time || '';
        var statusBadge = j.status_paid
          ? '<span style="background:#d1fae5; color:#065f46; padding:2px 7px; border-radius:10px; font-size:0.78em;">Paid</span>'
          : j.status_job_complete
            ? '<span style="background:#fef3c7; color:#92400e; padding:2px 7px; border-radius:10px; font-size:0.78em;">Done, Unpaid</span>'
            : '<span style="background:#dbeafe; color:#1e40af; padding:2px 7px; border-radius:10px; font-size:0.78em;">Upcoming</span>';
        html += '<tr><td>' + dateLabel + (timeLabel ? '<br><span style="color:#888;font-size:0.85em;">' + timeLabel + '</span>' : '') + '</td>' +
          '<td>' + escapeHtml(j.booking_name || j.customer_name || '—') + '</td>' +
          '<td>' + escapeHtml(j.service || '—') + '</td>' +
          '<td>' + escapeHtml(j.price || '—') + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td><button type="button" onclick="openWorkOrderModal(' + j.work_order_id + ')" style="padding:3px 10px; font-size:0.8em; background:#1a1a2e; color:#fff; border:none; border-radius:4px; cursor:pointer;">View</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';

    // Outstanding invoices
    var outstanding = data.outstanding_invoices || [];
    if (outstanding.length > 0) {
      html += '<div class="bookings-table-container" style="margin-bottom:24px;"><h3>Outstanding Invoices</h3>';
      html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr><th>WO#</th><th>Customer</th><th>Service</th><th>Amount</th><th>View</th></tr></thead><tbody>';
      outstanding.forEach(function(inv) {
        html += '<tr><td style="font-weight:600;">#' + inv.id + '</td>' +
          '<td>' + escapeHtml(inv.customer_name || '—') + '</td>' +
          '<td>' + escapeHtml(inv.service || '—') + '</td>' +
          '<td style="font-weight:600; color:#dc2626;">' + escapeHtml(inv.price || '—') + '</td>' +
          '<td><button type="button" onclick="openWorkOrderModal(' + inv.id + ')" style="padding:3px 10px; font-size:0.8em; background:#1a1a2e; color:#fff; border:none; border-radius:4px; cursor:pointer;">View</button></td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    // Re-service due
    var due = data.reservice_due || [];
    if (due.length > 0) {
      html += '<div class="bookings-table-container"><h3>Due for Re-service (' + due.length + ' customers)</h3>';
      html += '<p style="color:#888; font-size:0.9em; margin-bottom:12px;">Last service was more than 6 months ago.</p>';
      html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr><th>Customer</th><th>Phone</th><th>Last Service</th><th>Action</th></tr></thead><tbody>';
      due.forEach(function(c) {
        var lastSvc = c.last_service_date ? new Date(c.last_service_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';
        html += '<tr><td><strong>' + escapeHtml(c.name||'—') + '</strong>' +
          (c.email ? '<br><span style="color:#888;font-size:0.85em;">' + escapeHtml(c.email) + '</span>' : '') + '</td>' +
          '<td>' + escapeHtml(c.phone||'—') + '</td>' +
          '<td>' + lastSvc + '</td>' +
          '<td><button type="button" class="btn btn-primary" style="padding:4px 12px; font-size:0.82em;" onclick="emailOneCustomer(\'' + escapeHtml(c.name||'') + '\', \'' + escapeHtml(c.email||'') + '\')">Email</button></td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    container.innerHTML = html;
  }

  // --- Customers Tab ---
  async function loadCustomersTab() {
    var container = document.getElementById('customers-admin-container');
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var res = await fetch('/api/admin/customers', { headers: { 'x-admin-token': adminToken } });
      if (res.status === 401) { handleAuthExpired(); return; }
      var data = await res.json();
      renderCustomersList(data.customers || []);
    } catch (e) {
      container.innerHTML = '<p style="color:#dc2626;">Failed to load customers.</p>';
    }
  }

  function renderCustomersList(customers) {
    var container = document.getElementById('customers-admin-container');
    var html = '<h2 style="margin-bottom:16px;">Customers</h2>';

    html += '<div style="display:flex; gap:10px; margin-bottom:16px; align-items:center; flex-wrap:wrap;">' +
      '<button type="button" class="btn btn-primary" style="padding:7px 16px; font-size:0.9em;" onclick="emailSelectedCustomers()">Email Selected</button>' +
      '<button type="button" class="btn btn-secondary" style="padding:7px 16px; font-size:0.9em;" onclick="emailAllCustomers()">Email All</button>' +
      '<button type="button" class="btn btn-secondary" style="padding:7px 16px; font-size:0.9em;" onclick="openAddCustomerModal()">+ Add Customer</button>' +
      '<span id="customers-selected-count" style="color:#666; font-size:0.9em;"></span>' +
      '</div>';

    if (customers.length === 0) {
      html += '<p style="color:#666; padding:20px 0;">No customers yet.</p>';
      container.innerHTML = html;
      return;
    }

    html += '<div style="overflow-x:auto;">' +
      '<table class="bookings-table">' +
      '<thead><tr>' +
        '<th style="width:36px;"><input type="checkbox" id="select-all-customers" onchange="toggleAllCustomers(this.checked)"></th>' +
        '<th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Total Jobs</th><th>Last Service</th><th>Actions</th>' +
      '</tr></thead><tbody>';

    customers.forEach(function(c) {
      var lastSvc = c.last_service_date
        ? new Date(c.last_service_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';
      var sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      var isDue = c.last_service_date && new Date(c.last_service_date + 'T12:00:00') < sixMonthsAgo;
      html += '<tr>' +
        '<td><input type="checkbox" class="customer-checkbox" data-id="' + c.id + '" data-name="' + escapeHtml(c.name) + '" data-email="' + escapeHtml(c.email) + '" onchange="updateCustomerSelectedCount()"></td>' +
        '<td><a href="#" onclick="openCustomerDetail(' + c.id + '); return false;" style="color:#1a1a2e; font-weight:600;">' + escapeHtml(c.name || '—') + '</a>' +
        (isDue ? '<span style="background:#fed7aa; color:#9a3412; padding:2px 8px; border-radius:10px; font-size:0.75em; margin-left:8px; white-space:nowrap;">Due for Re-service</span>' : '') +
        '</td>' +
        '<td>' + escapeHtml(c.email || '—') + '</td>' +
        '<td>' + escapeHtml(c.phone || '—') + '</td>' +
        '<td>' + escapeHtml(c.address || '—') + '</td>' +
        '<td style="text-align:center;">' + (c.booking_count || 0) + '</td>' +
        '<td>' + lastSvc + '</td>' +
        '<td style="white-space:nowrap;">' +
          '<button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.82em; margin-right:4px;" onclick="openCustomerDetail(' + c.id + ')">View</button>' +
          '<button type="button" class="btn btn-primary" style="padding:4px 10px; font-size:0.82em;" onclick="emailOneCustomer(\'' + escapeHtml(c.name) + '\', \'' + escapeHtml(c.email) + '\')">Email</button>' +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  window.toggleAllCustomers = function(checked) {
    document.querySelectorAll('.customer-checkbox').forEach(function(cb) { cb.checked = checked; });
    updateCustomerSelectedCount();
  };

  window.updateCustomerSelectedCount = function() {
    var count = document.querySelectorAll('.customer-checkbox:checked').length;
    var el = document.getElementById('customers-selected-count');
    if (el) el.textContent = count > 0 ? count + ' selected' : '';
    var selectAll = document.getElementById('select-all-customers');
    var total = document.querySelectorAll('.customer-checkbox').length;
    if (selectAll) selectAll.checked = count > 0 && count === total;
  };

  window.emailSelectedCustomers = function() {
    var selected = [];
    document.querySelectorAll('.customer-checkbox:checked').forEach(function(cb) {
      selected.push({ name: cb.dataset.name, email: cb.dataset.email });
    });
    if (selected.length === 0) { alert('Please select at least one customer.'); return; }
    openEmailModal(selected);
  };

  window.emailAllCustomers = function() {
    var all = [];
    document.querySelectorAll('.customer-checkbox').forEach(function(cb) {
      all.push({ name: cb.dataset.name, email: cb.dataset.email });
    });
    if (all.length === 0) { alert('No customers to email.'); return; }
    openEmailModal(all);
  };

  window.emailOneCustomer = function(name, email) {
    openEmailModal([{ name: name, email: email }]);
  };

  window.openCustomerDetail = async function(customerId) {
    var modal = document.getElementById('customer-detail-modal');
    var content = document.getElementById('customer-detail-content');
    modal.style.display = 'block';
    content.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var res = await fetch('/api/admin/customers/' + customerId, { headers: { 'x-admin-token': adminToken } });
      if (res.status === 401) { handleAuthExpired(); return; }
      var data = await res.json();
      renderCustomerDetail(data);
    } catch (e) {
      content.innerHTML = '<p style="color:#dc2626;">Failed to load customer.</p>';
    }
  };

  function renderCustomerDetail(data) {
    var c = data.customer;
    var bookings = data.bookings || [];
    var content = document.getElementById('customer-detail-content');

    var html = '<h2 style="margin-top:0; margin-bottom:6px;">' + escapeHtml(c.name || '—') + '</h2>' +
      '<p style="color:#555; margin:0 0 16px;">' +
        (c.email ? '<a href="mailto:' + escapeHtml(c.email) + '" style="color:#1a1a2e;">' + escapeHtml(c.email) + '</a>' : '—') + ' &nbsp;&bull;&nbsp; ' +
        escapeHtml(c.phone || '—') +
      '</p>' +
      (c.address ? '<p style="margin:0 0 16px; color:#444;">' + escapeHtml(c.address) + '</p>' : '') +

      '<div style="margin-bottom:20px;">' +
        '<label style="font-weight:600; display:block; margin-bottom:6px;">Admin Notes</label>' +
        '<textarea id="cust-notes-' + c.id + '" rows="3" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; resize:vertical;">' + escapeHtml(c.notes || '') + '</textarea>' +
        '<div style="display:flex; gap:8px; margin-top:8px;">' +
          '<button type="button" class="btn btn-primary" style="padding:5px 16px; font-size:0.88em;" onclick="saveCustomerNotes(' + c.id + ')">Save Notes</button>' +
          '<button type="button" class="btn btn-secondary" style="padding:5px 16px; font-size:0.88em;" onclick="emailOneCustomer(\'' + escapeHtml(c.name) + '\', \'' + escapeHtml(c.email) + '\')">Email Customer</button>' +
        '</div>' +
        '<p id="cust-notes-status-' + c.id + '" style="font-size:0.85em; color:#888; margin-top:4px;"></p>' +
      '</div>';

    html += '<h3 style="margin-bottom:10px;">Booking History (' + bookings.length + ')</h3>';
    if (bookings.length === 0) {
      html += '<p style="color:#666;">No bookings on file.</p>';
    } else {
      html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr>' +
        '<th>Date</th><th>Service</th><th>Price</th><th>Status</th><th>Work Order</th>' +
        '</tr></thead><tbody>';
      bookings.forEach(function(b) {
        var dateLabel = new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        var statusBadge = b.date >= todayStr
          ? '<span style="background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:10px; font-size:0.82em;">Upcoming</span>'
          : '<span style="background:#d1fae5; color:#065f46; padding:2px 8px; border-radius:10px; font-size:0.82em;">Past</span>';
        var woBtn = b.work_order_id
          ? '<button type="button" style="padding:3px 10px; font-size:0.8em; background:#1a1a2e; color:#fff; border:none; border-radius:4px; cursor:pointer;" onclick="openWorkOrderModal(' + b.work_order_id + ')">View WO</button>'
          : '—';
        html += '<tr>' +
          '<td>' + dateLabel + '</td>' +
          '<td>' + escapeHtml(b.service || '—') + '</td>' +
          '<td>' + escapeHtml(b.price || '—') + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td>' + woBtn + '</td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    }

    content.innerHTML = html;
  }

  window.saveCustomerNotes = async function(customerId) {
    var notes = document.getElementById('cust-notes-' + customerId).value;
    var statusEl = document.getElementById('cust-notes-status-' + customerId);
    statusEl.textContent = 'Saving...';
    try {
      var res = await fetch('/api/admin/customers/' + customerId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ notes: notes })
      });
      statusEl.textContent = res.ok ? 'Saved.' : 'Save failed.';
      statusEl.style.color = res.ok ? '#2d6a4f' : '#dc2626';
      setTimeout(function() { statusEl.textContent = ''; }, 2500);
    } catch (e) {
      statusEl.textContent = 'Error saving.';
      statusEl.style.color = '#dc2626';
    }
  };

  var customerDetailModal = document.getElementById('customer-detail-modal');
  var closeCustomerDetailBtn = document.getElementById('close-customer-detail-modal');
  if (closeCustomerDetailBtn) {
    closeCustomerDetailBtn.addEventListener('click', function() { customerDetailModal.style.display = 'none'; });
  }
  customerDetailModal && customerDetailModal.addEventListener('click', function(e) {
    if (e.target === customerDetailModal) customerDetailModal.style.display = 'none';
  });

  // --- Email Modal ---
  var emailModal = document.getElementById('email-modal');
  var closeEmailModalBtn = document.getElementById('close-email-modal');
  var sendEmailBtn = document.getElementById('send-email-btn');

  function openEmailModal(recipients) {
    currentEmailRecipients = recipients;
    document.getElementById('email-recipients-label').textContent =
      'Sending to ' + recipients.length + ' recipient' + (recipients.length !== 1 ? 's' : '') + ': ' +
      recipients.map(function(r) { return r.name || r.email; }).join(', ');
    document.getElementById('email-subject').value = '';
    document.getElementById('email-message').value = '';
    document.getElementById('email-modal-msg').textContent = '';
    emailModal.style.display = 'block';
  }

  if (closeEmailModalBtn) {
    closeEmailModalBtn.addEventListener('click', function() { emailModal.style.display = 'none'; });
  }
  emailModal && emailModal.addEventListener('click', function(e) {
    if (e.target === emailModal) emailModal.style.display = 'none';
  });

  if (sendEmailBtn) {
    sendEmailBtn.addEventListener('click', async function() {
      var subject = document.getElementById('email-subject').value.trim();
      var message = document.getElementById('email-message').value.trim();
      var msgEl = document.getElementById('email-modal-msg');
      if (!subject || !message) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = 'Subject and message are required.';
        return;
      }
      msgEl.style.color = '#666';
      msgEl.textContent = 'Sending...';
      sendEmailBtn.disabled = true;
      try {
        var res = await fetch('/api/admin/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify({ to: currentEmailRecipients, subject: subject, message: message })
        });
        var data = await res.json();
        if (data.success) {
          msgEl.style.color = '#2d6a4f';
          msgEl.textContent = 'Email sent successfully!';
          setTimeout(function() { emailModal.style.display = 'none'; }, 1800);
        } else {
          msgEl.style.color = '#dc2626';
          msgEl.textContent = data.error || 'Failed to send email.';
        }
      } catch (e) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = 'Error. Please try again.';
      }
      sendEmailBtn.disabled = false;
    });
  }

  // Print Today's Bookings
  document.getElementById('print-today-btn').addEventListener('click', function() {
    var todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    printDayBookings(todayStr);
  });

  // --- Tab switching ---
  document.querySelectorAll('.admin-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = this.dataset.tab;
      document.querySelectorAll('.admin-tab').forEach(function(b) {
        b.style.borderBottomColor = 'transparent';
        b.style.color = '#666';
        b.classList.remove('active');
      });
      this.style.borderBottomColor = '#1a1a2e';
      this.style.color = '#1a1a2e';
      this.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach(function(p) { p.style.display = 'none'; });
      document.getElementById('tab-' + tab).style.display = 'block';

      if (tab === 'pricing') loadPricingAdmin();
      if (tab === 'customers') loadCustomersTab();
      if (tab === 'work-orders') loadWorkOrdersTab();
      if (tab === 'dashboard') loadDashboardTab();
      if (tab === 'expenses') loadExpensesTab();
      if (tab === 'revenue') loadRevenueTab();
      if (tab === 'payments') loadPaymentsTab();
      if (tab === 'gallery-admin') loadGalleryAdmin();
      if (tab === 'loc') loadLocTab();
    });
  });

  // --- Revenue Report Tab ---
  async function loadRevenueTab() {
    var container = document.getElementById('revenue-admin-container');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      const [revRes, settingsRes] = await Promise.all([
        fetch('/api/admin/revenue-report?year=' + currentRevenueYear, { headers: { 'x-admin-token': adminToken } }),
        fetch('/api/admin/settings', { headers: { 'x-admin-token': adminToken } })
      ]);
      if (revRes.status === 401) { handleAuthExpired(); return; }
      const data     = await revRes.json();
      const settings = settingsRes.ok ? await settingsRes.json() : {};
      renderRevenueReport(data, settings);
    } catch (e) {
      container.innerHTML = '<p style="color:#dc2626;">Failed to load revenue report.</p>';
    }
  }

  function renderRevenueReport(data, settings) {
    var container = document.getElementById('revenue-admin-container');
    var thisYear = new Date().getFullYear();

    var html = '<h2 style="margin-bottom:20px;">Revenue Report</h2>';

    // Year selector
    var yearOpts = '';
    for (var y = thisYear; y >= thisYear - 4; y--) {
      yearOpts += '<option value="' + y + '"' + (y === data.year ? ' selected' : '') + '>' + y + '</option>';
    }
    html += '<div style="display:flex; align-items:center; gap:10px; margin-bottom:24px;">' +
      '<label style="font-weight:600;">Year:</label>' +
      '<select id="revenue-year-sel" style="padding:7px 12px; border:1px solid #ddd; border-radius:6px;" onchange="changeRevenueYear(this.value)">' + yearOpts + '</select>' +
      '</div>';

    // Totals summary
    var totalGross = data.monthly.reduce(function(s,m) { return s + m.gross_revenue; }, 0);
    var totalExp = data.monthly.reduce(function(s,m) { return s + m.expenses; }, 0);
    var totalNet = totalGross - totalExp;
    var taxReserve = totalGross * 0.33;
    var expReserve = Math.max(0, totalGross * 0.15 - totalExp);
    var netAfterReserves = totalNet - taxReserve - expReserve;
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:16px; margin-bottom:28px;">';
    html += '<div style="background:#d1fae5; border-radius:10px; padding:16px; text-align:center;"><div style="font-size:1.6em; font-weight:700; color:#065f46;">$' + totalGross.toFixed(2) + '</div><div style="color:#065f46; font-size:0.85em; margin-top:4px;">' + data.year + ' Gross Revenue</div></div>';
    html += '<div style="background:#fee2e2; border-radius:10px; padding:16px; text-align:center;"><div style="font-size:1.6em; font-weight:700; color:#991b1b;">$' + totalExp.toFixed(2) + '</div><div style="color:#991b1b; font-size:0.85em; margin-top:4px;">' + data.year + ' Expenses</div></div>';
    html += '<div style="background:' + (netAfterReserves >= 0 ? '#d1fae5' : '#fee2e2') + '; border-radius:10px; padding:16px; text-align:center;"><div style="font-size:1.6em; font-weight:700; color:' + (netAfterReserves >= 0 ? '#065f46' : '#991b1b') + ';">$' + netAfterReserves.toFixed(2) + '</div><div style="font-size:0.85em; margin-top:4px; color:' + (netAfterReserves >= 0 ? '#065f46' : '#991b1b') + ';">' + data.year + ' Net After Reserves</div></div>';
    html += '<div style="background:#dbeafe; border-radius:10px; padding:16px; text-align:center;"><div style="font-size:1.6em; font-weight:700; color:#1e40af;">' + (data.total_miles||0).toFixed(1) + ' mi</div><div style="color:#1e40af; font-size:0.85em; margin-top:4px;">Miles &bull; ~$' + (data.mileage_deduction||0).toFixed(0) + ' deduction</div></div>';
    html += '</div>';

    // Financial Cushion Cards
    var availBal = parseFloat((settings && settings.available_balance) || '0');
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:16px; margin-bottom:28px;">';
    html += '<div style="background:#dbeafe; border-radius:10px; padding:16px; text-align:center;">' +
      '<div style="display:flex; align-items:center; justify-content:center; gap:2px;">' +
      '<span style="font-size:1.6em; font-weight:700; color:#1e40af;">$</span>' +
      '<input type="number" id="avail-balance-input" value="' + availBal.toFixed(2) + '" step="0.01" ' +
      'style="width:120px; font-size:1.6em; font-weight:700; color:#1e40af; border:none; background:transparent; text-align:center; border-bottom:2px solid #93c5fd; outline:none;">' +
      '</div>' +
      '<div style="color:#1e40af; font-size:0.85em; margin-top:4px;">Available Balance</div>' +
      '<p id="avail-balance-status" style="font-size:0.75em; margin:2px 0 0; min-height:1em; color:#1e40af;"></p>' +
      '</div>';
    html += '<div style="background:#ede9fe; border-radius:10px; padding:16px; text-align:center;">' +
      '<div style="font-size:1.6em; font-weight:700; color:#5b21b6;">$' + taxReserve.toFixed(2) + '</div>' +
      '<div style="color:#5b21b6; font-size:0.85em; margin-top:4px;">Tax Reserve (33% of ' + data.year + ' Gross)</div>' +
      '</div>';
    html += '<div style="background:#fef3c7; border-radius:10px; padding:16px; text-align:center;">' +
      '<div style="font-size:1.6em; font-weight:700; color:#92400e;">$' + expReserve.toFixed(2) + '</div>' +
      '<div style="color:#92400e; font-size:0.85em; margin-top:4px;">Expense Reserve (15% Gross &minus; ' + data.year + ' Expenses)</div>' +
      '</div>';
    html += '</div>';

    // Monthly breakdown table
    html += '<div class="bookings-table-container" style="margin-bottom:28px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
    html += '<h3 style="margin:0;">Monthly Breakdown</h3>';
    html += '<button type="button" class="btn btn-secondary" style="padding:5px 14px; font-size:0.85em;" onclick="exportMonthlyCsv()">Export CSV</button></div>';
    html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr><th>Month</th><th>Jobs</th><th>Gross Revenue</th><th>Expenses</th><th>Net</th></tr></thead><tbody>';
    data.monthly.forEach(function(m) {
      if (m.job_count === 0 && m.expenses === 0) return;
      var net = m.gross_revenue - m.expenses;
      html += '<tr>' +
        '<td>' + m.label + '</td>' +
        '<td style="text-align:center;">' + m.job_count + '</td>' +
        '<td style="color:#065f46; font-weight:600;">$' + m.gross_revenue.toFixed(2) + '</td>' +
        '<td style="color:#dc2626;">$' + m.expenses.toFixed(2) + '</td>' +
        '<td style="font-weight:700; color:' + (net >= 0 ? '#065f46' : '#dc2626') + ';">$' + net.toFixed(2) + '</td>' +
        '</tr>';
    });
    var allJobs = data.monthly.reduce(function(s,m){return s+m.job_count;},0);
    html += '<tr style="font-weight:700; background:#f8f9fa;"><td>Total</td><td style="text-align:center;">' + allJobs + '</td><td style="color:#065f46;">$' + totalGross.toFixed(2) + '</td><td style="color:#dc2626;">$' + totalExp.toFixed(2) + '</td><td style="color:' + (totalNet>=0?'#065f46':'#dc2626') + ';">$' + totalNet.toFixed(2) + '</td></tr>';
    html += '</tbody></table></div></div>';

    // Service breakdown
    if (data.by_service && data.by_service.length) {
      html += '<div class="bookings-table-container" style="margin-bottom:28px;">';
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
      html += '<h3 style="margin:0;">By Service</h3>';
      html += '<button type="button" class="btn btn-secondary" style="padding:5px 14px; font-size:0.85em;" onclick="exportServiceCsv()">Export CSV</button></div>';
      html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr><th>Service</th><th>Jobs</th><th>Revenue</th></tr></thead><tbody>';
      data.by_service.forEach(function(s) {
        html += '<tr><td>' + escapeHtml(s.service) + '</td><td style="text-align:center;">' + s.count + '</td><td style="font-weight:600; color:#2d6a4f;">$' + s.revenue.toFixed(2) + '</td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    // Top customers
    if (data.top_customers && data.top_customers.length) {
      html += '<div class="bookings-table-container" style="margin-bottom:28px;">';
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
      html += '<h3 style="margin:0;">Top Customers</h3>';
      html += '<button type="button" class="btn btn-secondary" style="padding:5px 14px; font-size:0.85em;" onclick="exportTopCustomersCsv()">Export CSV</button></div>';
      html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr><th>Customer</th><th>Jobs</th><th>Total Spent</th></tr></thead><tbody>';
      data.top_customers.forEach(function(c, i) {
        html += '<tr><td>' + (i===0?'&#127942; ':'') + escapeHtml(c.customer_name) + '</td><td style="text-align:center;">' + c.job_count + '</td><td style="font-weight:600; color:#2d6a4f;">$' + c.total_revenue.toFixed(2) + '</td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    // Mileage summary
    if (data.total_miles > 0) {
      html += '<div class="bookings-table-container"><h3>Mileage &amp; Tax Deduction</h3>' +
        '<table class="bookings-table"><tbody>' +
        '<tr><td style="color:#555;">Total Miles (' + data.year + ')</td><td style="font-weight:600;">' + data.total_miles.toFixed(1) + ' mi</td></tr>' +
        '<tr><td style="color:#555;">IRS Rate</td><td>$0.70/mile (2025)</td></tr>' +
        '<tr><td style="color:#555;">Estimated Deduction</td><td style="font-weight:700; color:#2d6a4f;">$' + (data.mileage_deduction||0).toFixed(2) + '</td></tr>' +
        '</tbody></table>' +
        '<p style="color:#888; font-size:0.85em; margin-top:8px;">Consult your tax professional for actual deduction eligibility.</p>' +
        '</div>';
    }

    container.innerHTML = html;
    window._revenueData = data;

    var balInput = document.getElementById('avail-balance-input');
    if (balInput) {
      balInput.addEventListener('change', async function() {
        var statusEl = document.getElementById('avail-balance-status');
        statusEl.textContent = 'Saving...';
        try {
          var saveRes = await fetch('/api/admin/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify({ key: 'available_balance', value: this.value })
          });
          statusEl.textContent = saveRes.ok ? 'Saved.' : 'Save failed.';
          setTimeout(function() { statusEl.textContent = ''; }, 2000);
        } catch(e) {
          statusEl.textContent = 'Error saving.';
        }
      });
    }
  }

  window.changeRevenueYear = function(year) {
    currentRevenueYear = parseInt(year);
    loadRevenueTab();
  };

  window.exportMonthlyCsv = function() {
    if (!window._revenueData) return;
    var csv = 'Month,Jobs,Gross Revenue,Expenses,Net\n';
    window._revenueData.monthly.forEach(function(m) {
      csv += [m.label, m.job_count, m.gross_revenue.toFixed(2), m.expenses.toFixed(2), (m.gross_revenue - m.expenses).toFixed(2)].join(',') + '\n';
    });
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'revenue-monthly-' + window._revenueData.year + '.csv'; a.click();
  };
  window.exportServiceCsv = function() {
    if (!window._revenueData) return;
    var csv = 'Service,Jobs,Revenue\n';
    window._revenueData.by_service.forEach(function(s) { csv += ['"'+s.service+'"',s.count,s.revenue.toFixed(2)].join(',') + '\n'; });
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'revenue-by-service-' + window._revenueData.year + '.csv'; a.click();
  };
  window.exportTopCustomersCsv = function() {
    if (!window._revenueData) return;
    var csv = 'Customer,Jobs,Total Revenue\n';
    window._revenueData.top_customers.forEach(function(c) { csv += ['"'+c.customer_name+'"',c.job_count,c.total_revenue.toFixed(2)].join(',') + '\n'; });
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'revenue-top-customers-' + window._revenueData.year + '.csv'; a.click();
  };

  // --- Payments Tab ---
  async function loadPaymentsTab() {
    var container = document.getElementById('payments-admin-container');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var url = '/api/admin/payments?year=' + currentPaymentYear + '&month=' + currentPaymentMonth;
      var res = await fetch(url, { headers: { 'x-admin-token': adminToken } });
      if (res.status === 401) { handleAuthExpired(); return; }
      var data = await res.json();
      renderPaymentsTab(data);
    } catch (e) {
      container.innerHTML = '<p style="color:#dc2626;">Failed to load payments.</p>';
    }
  }

  function renderPaymentsTab(data) {
    var container = document.getElementById('payments-admin-container');
    var payments = data.payments || [];
    var total = data.total || 0;
    var byMethod = data.byMethod || {};
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var thisYear = new Date().getFullYear();

    var html = '<h2 style="margin-bottom:20px;">Payments Received</h2>';

    // Filter row
    var yearOptions = '';
    for (var y = thisYear; y >= thisYear - 4; y--) {
      yearOptions += '<option value="' + y + '"' + (y === currentPaymentYear ? ' selected' : '') + '>' + y + '</option>';
    }
    var monthOptions = '<option value="0"' + (currentPaymentMonth === 0 ? ' selected' : '') + '>All Year</option>';
    monthOptions += monthNames.map(function(m, i) {
      return '<option value="' + (i+1) + '"' + ((i+1) === currentPaymentMonth ? ' selected' : '') + '>' + m + '</option>';
    }).join('');
    html += '<div style="display:flex; gap:10px; align-items:center; margin-bottom:24px; flex-wrap:wrap;">' +
      '<select id="pay-filter-year" style="padding:7px 12px; border:1px solid #ddd; border-radius:6px;">' + yearOptions + '</select>' +
      '<select id="pay-filter-month" style="padding:7px 12px; border:1px solid #ddd; border-radius:6px;">' + monthOptions + '</select>' +
      '<button type="button" class="btn btn-secondary" style="padding:7px 16px; font-size:0.9em;" onclick="applyPaymentFilter()">Filter</button>' +
      '</div>';

    // Summary cards
    var methodKeys = Object.keys(byMethod);
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:16px; margin-bottom:28px;">';
    html += '<div style="background:#d1fae5; border-radius:10px; padding:16px; text-align:center;">' +
      '<div style="font-size:1.6em; font-weight:700; color:#065f46;">$' + parseFloat(total).toFixed(2) + '</div>' +
      '<div style="color:#065f46; font-size:0.85em; margin-top:4px;">Total Received</div></div>';
    methodKeys.forEach(function(m) {
      html += '<div style="background:#dbeafe; border-radius:10px; padding:16px; text-align:center;">' +
        '<div style="font-size:1.6em; font-weight:700; color:#1e40af;">$' + byMethod[m].toFixed(2) + '</div>' +
        '<div style="color:#1e40af; font-size:0.85em; margin-top:4px;">' + escapeHtml(m) + '</div></div>';
    });
    html += '</div>';

    // Transactions table
    html += '<div class="bookings-table-container" style="margin-bottom:28px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
    html += '<h3 style="margin:0;">Transactions</h3>';
    html += '<button type="button" class="btn btn-secondary" style="padding:5px 14px; font-size:0.85em;" onclick="exportPaymentsCsv()">Export CSV</button></div>';
    if (payments.length === 0) {
      html += '<p style="color:#666; padding:10px 0;">No payments recorded for this period.</p>';
    } else {
      html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr>' +
        '<th>Date Paid</th><th>Customer</th><th>Service</th><th>Amount</th><th>Method</th><th>View</th>' +
        '</tr></thead><tbody>';
      payments.forEach(function(p) {
        var dateLabel = new Date(p.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        var amt = parseFloat(String(p.price || '').replace(/[$,]/g, '')) || 0;
        html += '<tr>' +
          '<td>' + dateLabel + '</td>' +
          '<td>' + escapeHtml(p.customer_name || '—') + '</td>' +
          '<td>' + escapeHtml(p.service || '—') + '</td>' +
          '<td style="font-weight:600; color:#2d6a4f;">$' + amt.toFixed(2) + '</td>' +
          '<td>' + escapeHtml(p.payment_method || '—') + '</td>' +
          '<td><button type="button" onclick="openWorkOrderModal(' + p.id + ')" style="padding:3px 10px; font-size:0.8em; background:#1a1a2e; color:#fff; border:none; border-radius:4px; cursor:pointer;">View</button></td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';

    container.innerHTML = html;
    window._paymentsData = data;
  }

  window.applyLocFilter = function() {
    currentLocYear  = parseInt(document.getElementById('loc-filter-year').value);
    currentLocMonth = parseInt(document.getElementById('loc-filter-month').value);
    loadLocTab();
  };

  window.applyPaymentFilter = function() {
    var y = parseInt(document.getElementById('pay-filter-year').value);
    var m = parseInt(document.getElementById('pay-filter-month').value);
    currentPaymentYear  = y;
    currentPaymentMonth = m;
    loadPaymentsTab();
  };

  window.exportPaymentsCsv = function() {
    if (!window._paymentsData || !window._paymentsData.payments.length) {
      alert('No payments to export.');
      return;
    }
    var csv = 'Date Paid,Customer,Service,Amount,Method\n';
    window._paymentsData.payments.forEach(function(p) {
      var dateLabel = new Date(p.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      var amt = parseFloat(String(p.price || '').replace(/[$,]/g, '')) || 0;
      csv += [
        '"' + dateLabel + '"',
        '"' + (p.customer_name || '').replace(/"/g, '""') + '"',
        '"' + (p.service || '').replace(/"/g, '""') + '"',
        amt.toFixed(2),
        '"' + (p.payment_method || '').replace(/"/g, '""') + '"'
      ].join(',') + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    var monthSuffix = currentPaymentMonth ? String(currentPaymentMonth).padStart(2, '0') : 'all';
    a.download = 'payments-' + currentPaymentYear + '-' + monthSuffix + '.csv';
    a.click();
  };

  // --- Pricing Admin ---
  var pricingAdminData = null;
  var scheduleTarget = null; // { type: 'service'|'discount', id, field, label }

  var CATEGORY_LABELS = {
    'house': 'House Washing',
    'house-addon': 'House Wash Add-ons',
    'deck': 'Deck Cleaning',
    'fence': 'Fence Cleaning',
    'rv': 'RV Washing',
    'rv-addon': 'RV Add-ons',
    'boat': 'Boat Cleaning'
  };

  var PARENT_LABELS = {
    'house-rancher': 'Rancher', 'house-single': 'Single Family', 'house-plus': 'Plus+',
    'rv-short': 'Short Bus', 'rv-medium': 'Medium Bumper Pull', 'rv-large': 'Big Boy 5th Wheel'
  };

  async function loadPricingAdmin() {
    var container = document.getElementById('pricing-admin-container');
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var res = await fetch('/api/admin/pricing', { headers: { 'x-admin-token': adminToken } });
      if (res.status === 401) { return; }
      pricingAdminData = await res.json();
      renderPricingAdmin();
    } catch (e) {
      container.innerHTML = '<p style="color:#dc2626;">Failed to load pricing data.</p>';
    }
  }

  function renderPricingAdmin() {
    var container = document.getElementById('pricing-admin-container');
    var html = '<h2 style="margin-bottom:20px;">Pricing Management</h2>';

    // Group services by category, then by parent_key for add-ons
    var byCategory = {};
    pricingAdminData.services.forEach(function(svc) {
      if (!byCategory[svc.category]) byCategory[svc.category] = [];
      byCategory[svc.category].push(svc);
    });

    var categoryOrder = ['house', 'house-addon', 'deck', 'fence', 'rv', 'rv-addon', 'boat'];

    categoryOrder.forEach(function(cat) {
      if (!byCategory[cat]) return;
      var services = byCategory[cat];

      // For add-ons, group by parent_key
      if (cat === 'house-addon' || cat === 'rv-addon') {
        var byParent = {};
        services.forEach(function(svc) {
          var pk = svc.parent_key || 'other';
          if (!byParent[pk]) byParent[pk] = [];
          byParent[pk].push(svc);
        });
        Object.keys(byParent).forEach(function(pk) {
          var parentLabel = PARENT_LABELS[pk] || pk;
          html += renderServiceSection(CATEGORY_LABELS[cat] + ' (' + parentLabel + ')', byParent[pk]);
        });
      } else {
        html += renderServiceSection(CATEGORY_LABELS[cat] || cat, services);
      }
    });

    // Discounts
    html += '<div class="bookings-table-container" style="margin-top:30px;">';
    html += '<h3>Discounts</h3>';
    html += '<table class="bookings-table"><thead><tr><th>Discount</th><th>Percent</th><th>Actions</th></tr></thead><tbody>';
    pricingAdminData.discounts.filter(function(d) { return !d.auto_apply; }).forEach(function(d) {
      html += '<tr id="discount-row-' + d.id + '">' +
        '<td>' + escapeHtml(d.label) + '</td>' +
        '<td><input type="number" id="disc-pct-' + d.id + '" value="' + d.percent + '" min="0" max="100" step="1" style="width:70px; padding:4px 6px; border:1px solid #ddd; border-radius:4px;"> %</td>' +
        '<td style="white-space:nowrap;">' +
          '<button type="button" class="btn btn-primary" style="padding:4px 12px; font-size:0.85em; margin-right:6px;" onclick="saveDiscountNow(' + d.id + ')">Save Now</button>' +
          '<button type="button" class="btn btn-secondary" style="padding:4px 12px; font-size:0.85em;" onclick="openScheduleDiscount(' + d.id + ', \'' + escapeHtml(d.label) + '\')">Schedule</button>' +
        '</td></tr>';
    });
    html += '</tbody></table></div>';

    // Scheduled Changes
    html += '<div class="bookings-table-container" style="margin-top:30px;">';
    html += '<h3>Scheduled Changes</h3>';
    if (pricingAdminData.schedule.length === 0) {
      html += '<p style="color:#666; padding:10px 0;">No pending scheduled changes.</p>';
    } else {
      html += '<table class="bookings-table"><thead><tr><th>Service/Discount</th><th>Field</th><th>New Value</th><th>Effective Date</th><th></th></tr></thead><tbody>';
      pricingAdminData.schedule.forEach(function(row) {
        var targetLabel = row.service_label || row.discount_label || 'Unknown';
        var fieldLabel = row.field === 'price' ? 'Price' : row.field === 'duration' ? 'Duration (hrs)' : 'Percent';
        var valDisplay = row.field === 'price' ? '$' + row.new_value : row.new_value + (row.field === 'percent' ? '%' : ' hrs');
        html += '<tr>' +
          '<td>' + escapeHtml(targetLabel) + '</td>' +
          '<td>' + fieldLabel + '</td>' +
          '<td>' + valDisplay + '</td>' +
          '<td>' + row.effective_date + '</td>' +
          '<td><button type="button" class="btn-cancel" onclick="deleteScheduledChange(' + row.id + ')">Delete</button></td>' +
        '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    // Schedule a new change form
    html += '<div class="bookings-table-container" style="margin-top:30px;">' +
      '<h3>Schedule a Future Change</h3>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; max-width:600px;">' +
        '<div class="form-group"><label>Service or Discount</label>' +
          '<select id="schedule-target" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;">' +
          '<option value="">-- Select --</option>' +
          renderScheduleOptions() +
          '</select></div>' +
        '<div class="form-group"><label>Field</label>' +
          '<select id="schedule-field" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;">' +
          '<option value="price">Price ($)</option>' +
          '<option value="duration">Duration (hrs)</option>' +
          '</select></div>' +
        '<div class="form-group"><label>New Value</label>' +
          '<input type="number" id="schedule-value" step="0.25" min="0" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;" placeholder="e.g. 399"></div>' +
        '<div class="form-group"><label>Effective Date</label>' +
          '<input type="date" id="schedule-date" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;"></div>' +
      '</div>' +
      '<button type="button" class="btn btn-primary" style="margin-top:12px;" onclick="submitScheduledChange()">Schedule Change</button>' +
      '<p id="schedule-msg" style="margin-top:8px; color:#2d6a4f;"></p>' +
    '</div>';

    container.innerHTML = html;

    // Set min date to tomorrow for schedule date
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowStr = tomorrow.toISOString().split('T')[0];
    var sdInput = document.getElementById('schedule-date');
    if (sdInput) sdInput.min = tomorrowStr;

    // Update schedule-field options when target changes
    document.getElementById('schedule-target').addEventListener('change', function() {
      var val = this.value;
      var fieldSel = document.getElementById('schedule-field');
      if (val.startsWith('discount-')) {
        fieldSel.innerHTML = '<option value="percent">Percent (%)</option>';
      } else {
        fieldSel.innerHTML = '<option value="price">Price ($)</option><option value="duration">Duration (hrs)</option>';
      }
    });
  }

  function renderScheduleOptions() {
    if (!pricingAdminData) return '';
    var opts = '';
    var byCategory = {};
    pricingAdminData.services.forEach(function(svc) {
      if (!byCategory[svc.category]) byCategory[svc.category] = [];
      byCategory[svc.category].push(svc);
    });
    var catOrder = ['house', 'house-addon', 'deck', 'fence', 'rv', 'rv-addon', 'boat'];
    catOrder.forEach(function(cat) {
      if (!byCategory[cat]) return;
      var catLabel = CATEGORY_LABELS[cat] || cat;
      opts += '<optgroup label="' + catLabel + '">';
      byCategory[cat].forEach(function(svc) {
        var lbl = svc.label;
        if (svc.parent_key && PARENT_LABELS[svc.parent_key]) lbl += ' (' + PARENT_LABELS[svc.parent_key] + ')';
        opts += '<option value="service-' + svc.id + '">' + escapeHtml(lbl) + '</option>';
      });
      opts += '</optgroup>';
    });
    opts += '<optgroup label="Discounts">';
    pricingAdminData.discounts.forEach(function(d) {
      opts += '<option value="discount-' + d.id + '">' + escapeHtml(d.label) + '</option>';
    });
    opts += '</optgroup>';
    return opts;
  }

  function renderServiceSection(title, services) {
    var html = '<div class="bookings-table-container" style="margin-bottom:20px;">';
    html += '<h3>' + title + '</h3>';
    html += '<table class="bookings-table"><thead><tr><th>Service</th><th>Price</th><th>Duration (hrs)</th><th>Actions</th></tr></thead><tbody>';
    services.forEach(function(svc) {
      html += '<tr id="svc-row-' + svc.id + '">' +
        '<td>' + escapeHtml(svc.label) + '</td>' +
        '<td><input type="number" id="svc-price-' + svc.id + '" value="' + svc.price + '" min="1" step="1" style="width:80px; padding:4px 6px; border:1px solid #ddd; border-radius:4px;"></td>' +
        '<td><input type="number" id="svc-dur-' + svc.id + '" value="' + svc.duration + '" min="0.25" step="0.25" style="width:80px; padding:4px 6px; border:1px solid #ddd; border-radius:4px;"></td>' +
        '<td style="white-space:nowrap;">' +
          '<button type="button" class="btn btn-primary" style="padding:4px 12px; font-size:0.85em; margin-right:6px;" onclick="saveServiceNow(' + svc.id + ')">Save Now</button>' +
          '<button type="button" class="btn btn-secondary" style="padding:4px 12px; font-size:0.85em;" onclick="openScheduleService(' + svc.id + ', \'' + escapeHtml(svc.label) + '\')">Schedule</button>' +
        '</td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  // Expose functions to global scope for inline onclick handlers
  // Pre-fill the schedule form for a specific service and scroll to it
  window.openScheduleService = function(id, label) {
    var sel = document.getElementById('schedule-target');
    if (!sel) return;
    sel.value = 'service-' + id;
    sel.dispatchEvent(new Event('change'));
    document.getElementById('schedule-msg').textContent = 'Scheduling change for: ' + label;
    document.getElementById('schedule-msg').style.color = '#1a1a2e';
    sel.closest('.bookings-table-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('schedule-value').focus();
  };

  // Pre-fill the schedule form for a specific discount and scroll to it
  window.openScheduleDiscount = function(id, label) {
    var sel = document.getElementById('schedule-target');
    if (!sel) return;
    sel.value = 'discount-' + id;
    sel.dispatchEvent(new Event('change'));
    document.getElementById('schedule-msg').textContent = 'Scheduling change for: ' + label;
    document.getElementById('schedule-msg').style.color = '#1a1a2e';
    sel.closest('.bookings-table-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('schedule-value').focus();
  };

  window.saveServiceNow = async function(id) {
    var priceVal = document.getElementById('svc-price-' + id).value;
    var durVal = document.getElementById('svc-dur-' + id).value;
    var ok = true;
    try {
      var r1 = await fetch('/api/admin/pricing/service/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ field: 'price', value: priceVal })
      });
      var r2 = await fetch('/api/admin/pricing/service/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ field: 'duration', value: durVal })
      });
      if (!r1.ok || !r2.ok) ok = false;
    } catch (e) { ok = false; }
    showPricingMsg(ok ? 'Saved!' : 'Save failed.', ok);
  };

  window.saveDiscountNow = async function(id) {
    var pct = document.getElementById('disc-pct-' + id).value;
    var ok = true;
    try {
      var r = await fetch('/api/admin/pricing/discount/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ percent: pct })
      });
      if (!r.ok) ok = false;
    } catch (e) { ok = false; }
    showPricingMsg(ok ? 'Saved!' : 'Save failed.', ok);
  };

  window.deleteScheduledChange = async function(id) {
    if (!confirm('Delete this scheduled change?')) return;
    try {
      await fetch('/api/admin/pricing/schedule/' + id, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      loadPricingAdmin();
    } catch (e) {}
  };

  window.submitScheduledChange = async function() {
    var targetVal = document.getElementById('schedule-target').value;
    var field = document.getElementById('schedule-field').value;
    var value = document.getElementById('schedule-value').value;
    var date = document.getElementById('schedule-date').value;
    var msgEl = document.getElementById('schedule-msg');

    if (!targetVal || !value || !date) {
      msgEl.style.color = '#dc2626';
      msgEl.textContent = 'Please fill in all fields.';
      return;
    }

    var body = { field: field, new_value: value, effective_date: date };
    if (targetVal.startsWith('service-')) {
      body.service_id = parseInt(targetVal.replace('service-', ''));
    } else {
      body.discount_id = parseInt(targetVal.replace('discount-', ''));
    }

    try {
      var r = await fetch('/api/admin/pricing/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(body)
      });
      var data = await r.json();
      if (data.success) {
        msgEl.style.color = '#2d6a4f';
        msgEl.textContent = 'Change scheduled for ' + date + '!';
        loadPricingAdmin();
      } else {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = data.error || 'Failed to schedule.';
      }
    } catch (e) {
      msgEl.style.color = '#dc2626';
      msgEl.textContent = 'Error. Please try again.';
    }
  };

  // --- Gallery Admin Tab ---
  async function loadGalleryAdmin() {
    var container = document.getElementById('gallery-admin-container');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var res = await fetch('/api/admin/gallery', { headers: { 'x-admin-token': adminToken } });
      if (res.status === 401) { handleAuthExpired(); return; }
      var items = await res.json();
      renderGalleryAdmin(items);
    } catch(e) {
      container.innerHTML = '<p style="color:#dc2626;">Failed to load gallery.</p>';
    }
  }

  function renderGalleryAdmin(items) {
    var container = document.getElementById('gallery-admin-container');
    var catOptions = [
      { value: 'house',    label: 'House Washing' },
      { value: 'roof',     label: 'Roof Cleaning' },
      { value: 'concrete', label: 'Concrete' },
      { value: 'deck',     label: 'Deck & Fence' }
    ];
    var catOptHtml = catOptions.map(function(o) {
      return '<option value="' + o.value + '">' + o.label + '</option>';
    }).join('');
    var catLabels = {};
    catOptions.forEach(function(o) { catLabels[o.value] = o.label; });

    var html = '<h2 style="margin-bottom:20px;">Gallery</h2>';

    // Upload form
    html += '<div class="bookings-table-container" style="margin-bottom:28px;">';
    html += '<h3 style="margin:0 0 16px;">Add Before & After Photo</h3>';
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">';
    html += '<div class="form-group"><label>Title</label><input type="text" id="gal-title" placeholder="e.g. Vinyl Siding Restoration" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;"></div>';
    html += '<div class="form-group"><label>Category</label><select id="gal-category" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;">' + catOptHtml + '</select></div>';
    html += '<div class="form-group" style="grid-column:1/-1;"><label>Description</label><input type="text" id="gal-desc" placeholder="e.g. Complete house wash removing years of buildup" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;"></div>';
    html += '</div>';
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">';
    html += '<div class="form-group">';
    html += '<label>Before Photo</label>';
    html += '<input type="file" id="gal-before-file" accept="image/*" style="width:100%; padding:6px 0;">';
    html += '<div id="gal-before-preview" style="margin-top:8px; display:none;"><img id="gal-before-img" style="width:100%; max-height:160px; object-fit:cover; border-radius:6px; border:2px solid #dc2626;"><span style="font-size:0.75em; color:#dc2626; font-weight:600;">BEFORE</span></div>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label>After Photo</label>';
    html += '<input type="file" id="gal-after-file" accept="image/*" style="width:100%; padding:6px 0;">';
    html += '<div id="gal-after-preview" style="margin-top:8px; display:none;"><img id="gal-after-img" style="width:100%; max-height:160px; object-fit:cover; border-radius:6px; border:2px solid #16a34a;"><span style="font-size:0.75em; color:#16a34a; font-weight:600;">AFTER</span></div>';
    html += '</div>';
    html += '</div>';
    html += '<p id="gal-upload-msg" style="min-height:1.2em; color:#dc2626; margin-bottom:8px;"></p>';
    html += '<button type="button" id="gal-upload-btn" class="btn btn-primary" style="padding:9px 28px;">Upload Photo</button>';
    html += '</div>';

    // Existing items
    html += '<div class="bookings-table-container">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">';
    html += '<h3 style="margin:0;">Uploaded Photos (' + items.length + ')</h3></div>';
    if (items.length === 0) {
      html += '<p style="color:#666; padding:10px 0;">No photos uploaded yet. Add your first before & after photo above.</p>';
    } else {
      html += '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">';
      items.forEach(function(item) {
        html += '<div style="border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; background:#fff;">';
        html += '<div style="display:grid; grid-template-columns:1fr 1fr;">';
        html += '<div style="position:relative;"><img src="/api/gallery/' + item.id + '/before" style="width:100%; height:120px; object-fit:cover; display:block;" onerror="this.style.background=\'#f3f4f6\';this.style.height=\'120px\';"><span style="position:absolute; bottom:4px; left:4px; background:#dc2626; color:#fff; font-size:0.7em; font-weight:700; padding:1px 6px; border-radius:8px;">BEFORE</span></div>';
        html += '<div style="position:relative;"><img src="/api/gallery/' + item.id + '/after" style="width:100%; height:120px; object-fit:cover; display:block;" onerror="this.style.background=\'#f3f4f6\';this.style.height=\'120px\';"><span style="position:absolute; bottom:4px; left:4px; background:#16a34a; color:#fff; font-size:0.7em; font-weight:700; padding:1px 6px; border-radius:8px;">AFTER</span></div>';
        html += '</div>';
        html += '<div style="padding:10px 12px;">';
        html += '<div style="font-weight:600; font-size:0.95em; margin-bottom:2px;">' + escapeHtml(item.title || 'Untitled') + '</div>';
        html += '<div style="font-size:0.8em; color:#666; margin-bottom:8px;">' + escapeHtml(catLabels[item.category] || item.category) + (item.description ? ' — ' + escapeHtml(item.description) : '') + '</div>';
        html += '<button type="button" class="btn-cancel" onclick="deleteGalleryItem(' + item.id + ')">Delete</button>';
        html += '</div></div>';
      });
      html += '</div>';
    }
    html += '</div>';

    container.innerHTML = html;

    // Wire file preview + compression
    function wirePreview(inputId, previewId, imgId) {
      var input = document.getElementById(inputId);
      if (!input) return;
      input.addEventListener('change', function() {
        var file = this.files[0];
        if (!file) return;
        compressGalleryImage(file, function(dataUrl) {
          document.getElementById(imgId).src = dataUrl;
          document.getElementById(previewId).style.display = 'block';
          input._compressed = dataUrl;
        });
      });
    }
    wirePreview('gal-before-file', 'gal-before-preview', 'gal-before-img');
    wirePreview('gal-after-file',  'gal-after-preview',  'gal-after-img');

    // Wire upload button
    document.getElementById('gal-upload-btn').addEventListener('click', async function() {
      var msgEl = document.getElementById('gal-upload-msg');
      var beforeInput = document.getElementById('gal-before-file');
      var afterInput  = document.getElementById('gal-after-file');
      if (!beforeInput._compressed) { msgEl.textContent = 'Please select a Before photo.'; return; }
      if (!afterInput._compressed)  { msgEl.textContent = 'Please select an After photo.'; return; }
      msgEl.style.color = '#555';
      msgEl.textContent = 'Uploading...';
      this.disabled = true;
      try {
        var res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify({
            title:        document.getElementById('gal-title').value.trim(),
            description:  document.getElementById('gal-desc').value.trim(),
            category:     document.getElementById('gal-category').value,
            before_image: beforeInput._compressed,
            after_image:  afterInput._compressed
          })
        });
        if (res.ok) {
          loadGalleryAdmin();
        } else {
          msgEl.style.color = '#dc2626';
          msgEl.textContent = 'Upload failed. Try again.';
          this.disabled = false;
        }
      } catch(e) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = 'Error uploading.';
        this.disabled = false;
      }
    });
  }

  function compressGalleryImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var maxW = 1200;
        var scale = Math.min(1, maxW / img.width);
        var canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  window.deleteGalleryItem = async function(id) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
      await fetch('/api/admin/gallery/' + id, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      loadGalleryAdmin();
    } catch(e) { alert('Delete failed.'); }
  };

  // --- Lines of Credit Tab ---
  var LOC_CARDS = [
    { key: 'amex_prime',  label: 'AMEX Prime',         limit: 25000, category: 'AMEX Prime',        bg: '#dbeafe', fg: '#1e40af' },
    { key: 'amex_blue',   label: 'AMEX Blue',          limit: 25000, category: 'AMEX Blue',         bg: '#ede9fe', fg: '#5b21b6' },
    { key: 'chase_ink',   label: 'Chase Ink',          limit: 12000, category: 'Chase Ink',         bg: '#d1fae5', fg: '#065f46' },
    { key: 'cap_one',     label: 'Capital One Spark',  limit: 30000, category: 'Capital One Spark', bg: '#fee2e2', fg: '#991b1b' }
  ];

  async function loadLocTab() {
    var container = document.getElementById('loc-admin-container');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var [settingsRes, expRes] = await Promise.all([
        fetch('/api/admin/settings', { headers: { 'x-admin-token': adminToken } }),
        fetch('/api/admin/expenses?year=' + currentLocYear + '&month=' + currentLocMonth, { headers: { 'x-admin-token': adminToken } })
      ]);
      if (settingsRes.status === 401) { handleAuthExpired(); return; }
      var settings = settingsRes.ok ? await settingsRes.json() : {};
      var expData  = expRes.ok ? await expRes.json() : {};
      renderLocTab(settings, expData.expenses || []);
    } catch(e) {
      container.innerHTML = '<p style="color:#dc2626;">Failed to load Lines of Credit.</p>';
    }
  }

  function renderLocTab(settings, expenses) {
    var container = document.getElementById('loc-admin-container');
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var monthName = monthNames[currentLocMonth - 1] + ' ' + currentLocYear;
    var thisYear = new Date().getFullYear();

    // Sum expenses this month by category
    var paidByCategory = {};
    expenses.forEach(function(e) {
      paidByCategory[e.category] = (paidByCategory[e.category] || 0) + (parseFloat(e.amount) || 0);
    });

    // Pre-compute card values for EOM totals
    var eomTotalOwed = 0;
    var eomTotalAvailable = 0;
    var cardValues = LOC_CARDS.map(function(card) {
      var owed         = parseFloat(settings['loc_' + card.key + '_owed'] || '0');
      var paid         = paidByCategory[card.category] || 0;
      var remaining    = Math.max(0, owed - paid);
      var available    = Math.max(0, card.limit - remaining);
      eomTotalOwed     += remaining;
      eomTotalAvailable += available;
      return { owed: owed, paid: paid, remaining: remaining, available: available };
    });
    var sofiOwed      = parseFloat(settings['loc_sofi_owed'] || '0');
    eomTotalOwed     += sofiOwed;
    var checkingBal   = parseFloat(settings['loc_checking_balance'] || '0');
    var netPosition   = checkingBal - eomTotalOwed;

    var html = '<h2 style="margin-bottom:20px;">Lines of Credit</h2>';

    // Month / Year filter
    var yearOpts = '';
    for (var y = thisYear; y >= thisYear - 4; y--) {
      yearOpts += '<option value="' + y + '"' + (y === currentLocYear ? ' selected' : '') + '>' + y + '</option>';
    }
    var monthOpts = monthNames.map(function(m, i) {
      return '<option value="' + (i + 1) + '"' + ((i + 1) === currentLocMonth ? ' selected' : '') + '>' + m + '</option>';
    }).join('');
    html += '<div style="display:flex; gap:10px; align-items:center; margin-bottom:24px; flex-wrap:wrap;">' +
      '<label style="font-weight:600; color:#444;">Period:</label>' +
      '<select id="loc-filter-month" style="padding:7px 12px; border:1px solid #ddd; border-radius:6px;">' + monthOpts + '</select>' +
      '<select id="loc-filter-year" style="padding:7px 12px; border:1px solid #ddd; border-radius:6px;">' + yearOpts + '</select>' +
      '<button type="button" class="btn btn-secondary" style="padding:7px 16px; font-size:0.9em;" onclick="applyLocFilter()">Apply</button>' +
      '</div>';

    // ── Credit card windows ──
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:28px;">';
    LOC_CARDS.forEach(function(card, i) {
      var v = cardValues[i];
      var bg = card.bg; var fg = card.fg;
      html += '<div style="background:' + bg + '; border-radius:10px; padding:20px;">';
      html += '<div style="font-size:1em; font-weight:700; color:' + fg + '; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid ' + fg + '44;">' + card.label + '</div>';

      html += row(fg, 'Credit Limit', '$' + card.limit.toLocaleString('en-US', { minimumFractionDigits: 2 }));

      // Balance Owed — editable
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:9px;">';
      html += '<span style="color:' + fg + '; font-size:0.88em;">Balance Owed</span>';
      html += '<span style="display:flex; align-items:center; gap:1px; font-weight:600; color:' + fg + ';">$<input type="number" id="loc-' + card.key + '-owed" value="' + v.owed.toFixed(2) + '" step="0.01" min="0" style="width:90px; text-align:right; font-weight:600; color:' + fg + '; border:none; background:transparent; border-bottom:1px solid ' + fg + '88; outline:none; font-size:1em;"></span>';
      html += '</div>';

      html += row(fg, 'Paid This Month (' + monthName + ')', '$' + v.paid.toFixed(2));
      html += row(fg, 'Remaining Balance', '$' + v.remaining.toFixed(2));

      // Credit Available — highlighted
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid ' + fg + '44;">';
      html += '<span style="color:' + fg + '; font-size:0.88em; font-weight:700;">Credit Available</span>';
      html += '<span style="font-size:1.15em; font-weight:700; color:' + fg + ';">$' + v.available.toFixed(2) + '</span>';
      html += '</div>';

      html += '<p id="loc-' + card.key + '-status" style="font-size:0.75em; min-height:1em; color:' + fg + '; margin:5px 0 0; text-align:right;"></p>';
      html += '</div>';
    });
    html += '</div>';

    // ── SoFi Loan window ──
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:28px;">';
    html += '<div style="background:#fef3c7; border-radius:10px; padding:20px;">';
    html += '<div style="font-size:1em; font-weight:700; color:#92400e; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid #92400e44;">SoFi Loan</div>';
    html += row('#92400e', 'Loan Amount', '$70,000.00');
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:9px;">';
    html += '<span style="color:#92400e; font-size:0.88em;">Amount Owed</span>';
    html += '<span style="display:flex; align-items:center; gap:1px; font-weight:600; color:#92400e;">$<input type="number" id="loc-sofi-owed" value="' + sofiOwed.toFixed(2) + '" step="0.01" min="0" style="width:90px; text-align:right; font-weight:600; color:#92400e; border:none; background:transparent; border-bottom:1px solid #92400e88; outline:none; font-size:1em;"></span>';
    html += '</div>';
    html += '<p id="loc-sofi-status" style="font-size:0.75em; min-height:1em; color:#92400e; margin:5px 0 0; text-align:right;"></p>';
    html += '</div>';
    html += '</div>';

    // ── EOM Finances window ──
    html += '<div style="background:#f8fafc; border:2px solid #1a1a2e; border-radius:10px; padding:24px; margin-bottom:28px; max-width:480px;">';
    html += '<div style="font-size:1em; font-weight:700; color:#1a1a2e; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid #1a1a2e33;">EOM Finances</div>';

    // Checking Balance — editable
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
    html += '<span style="color:#444; font-size:0.9em;">Checking Balance</span>';
    html += '<span style="display:flex; align-items:center; gap:1px; font-weight:600; color:#1a1a2e;">$<input type="number" id="loc-checking-balance" value="' + checkingBal.toFixed(2) + '" step="0.01" style="width:110px; text-align:right; font-weight:600; color:#1a1a2e; border:none; background:transparent; border-bottom:1px solid #1a1a2e88; outline:none; font-size:1em;"></span>';
    html += '</div>';

    html += eomRow('#dc2626', 'Total Credit Owed', '$' + eomTotalOwed.toFixed(2));
    html += eomRow('#065f46', 'Total Credit Available', '$' + eomTotalAvailable.toFixed(2));

    html += '<div style="border-top:1px solid #1a1a2e33; margin:14px 0;"></div>';

    var netColor = netPosition >= 0 ? '#065f46' : '#dc2626';
    html += '<div style="display:flex; justify-content:space-between; align-items:center;">';
    html += '<span style="color:#1a1a2e; font-size:0.95em; font-weight:700;">Total Business Debt</span>';
    html += '<span style="font-size:1.2em; font-weight:700; color:' + netColor + ';">$' + netPosition.toFixed(2) + '</span>';
    html += '</div>';
    html += '<p id="loc-checking-status" style="font-size:0.75em; min-height:1em; color:#666; margin:5px 0 0; text-align:right;"></p>';
    html += '</div>';

    container.innerHTML = html;

    // Wire save + reload for every editable input
    function wireSave(settingsKey, inputId, statusId) {
      var el = document.getElementById(inputId);
      if (!el) return;
      el.addEventListener('change', async function() {
        var st = document.getElementById(statusId);
        st.textContent = 'Saving...';
        try {
          var r = await fetch('/api/admin/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify({ key: settingsKey, value: this.value })
          });
          if (r.ok) {
            st.textContent = 'Saved.';
            setTimeout(loadLocTab, 600);
          } else {
            st.textContent = 'Save failed.';
          }
        } catch(e) { st.textContent = 'Error saving.'; }
      });
    }

    LOC_CARDS.forEach(function(card) {
      wireSave('loc_' + card.key + '_owed', 'loc-' + card.key + '-owed', 'loc-' + card.key + '-status');
    });
    wireSave('loc_sofi_owed',        'loc-sofi-owed',        'loc-sofi-status');
    wireSave('loc_checking_balance', 'loc-checking-balance', 'loc-checking-status');
  }

  function row(fg, label, value) {
    return '<div style="display:flex; justify-content:space-between; margin-bottom:9px;">' +
      '<span style="color:' + fg + '; font-size:0.88em;">' + label + '</span>' +
      '<span style="font-weight:600; color:' + fg + ';">' + value + '</span>' +
      '</div>';
  }

  function eomRow(fg, label, value) {
    return '<div style="display:flex; justify-content:space-between; margin-bottom:12px;">' +
      '<span style="color:#444; font-size:0.9em;">' + label + '</span>' +
      '<span style="font-weight:700; font-size:1.05em; color:' + fg + ';">' + value + '</span>' +
      '</div>';
  }

  // --- Expenses Tab ---
  async function loadExpensesTab() {
    var container = document.getElementById('expenses-admin-container');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var res = await fetch('/api/admin/expenses?year=' + currentExpenseYear + '&month=' + currentExpenseMonth, {
        headers: { 'x-admin-token': adminToken }
      });
      if (res.status === 401) { handleAuthExpired(); return; }
      var data = await res.json();
      renderExpensesTab(data);
    } catch (e) {
      container.innerHTML = '<p style="color:#dc2626;">Failed to load expenses.</p>';
    }
  }

  function renderExpensesTab(data) {
    var container = document.getElementById('expenses-admin-container');
    var expenses = data.expenses || [];
    var total = data.total || 0;
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var categories = ['Fuel','Supplies','Equipment','Insurance','Marketing','Vehicle','AMEX Prime','AMEX Blue','Chase Ink','Capital One Spark','SoFi','Other'];

    var html = '<h2 style="margin-bottom:20px;">Expenses</h2>';

    // Add expense form
    html += '<div class="bookings-table-container" style="margin-bottom:24px;"><h3>Add Expense</h3>' +
      '<form id="add-expense-form"><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; align-items:end; flex-wrap:wrap;">' +
      '<div class="form-group"><label>Date *</label><input type="date" id="exp-date" required style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
      '<div class="form-group"><label>Category</label><select id="exp-category" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;">' +
      categories.map(function(c) { return '<option>' + c + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>Amount ($) *</label><input type="number" id="exp-amount" required min="0.01" step="0.01" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;" placeholder="0.00"></div>' +
      '</div>' +
      '<div class="form-group" style="margin-top:10px;"><label>Notes</label><input type="text" id="exp-notes" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;" placeholder="Optional description"></div>' +
      '<p id="exp-error" style="color:#dc2626; min-height:1.2em; margin:6px 0;"></p>' +
      '<button type="submit" class="btn btn-primary" style="padding:8px 24px;">Add Expense</button>' +
      '</form></div>';

    // Filter row
    var yearOptions = '';
    var thisYear = new Date().getFullYear();
    for (var y = thisYear; y >= thisYear - 4; y--) {
      yearOptions += '<option value="' + y + '"' + (y === currentExpenseYear ? ' selected' : '') + '>' + y + '</option>';
    }
    var monthOptions = monthNames.map(function(m, i) {
      return '<option value="' + (i+1) + '"' + ((i+1) === currentExpenseMonth ? ' selected' : '') + '>' + m + '</option>';
    }).join('');
    html += '<div style="display:flex; gap:10px; align-items:center; margin-bottom:16px; flex-wrap:wrap;">' +
      '<select id="exp-filter-year" style="padding:7px 12px; border:1px solid #ddd; border-radius:6px;">' + yearOptions + '</select>' +
      '<select id="exp-filter-month" style="padding:7px 12px; border:1px solid #ddd; border-radius:6px;">' + monthOptions + '</select>' +
      '<button type="button" class="btn btn-secondary" style="padding:7px 16px; font-size:0.9em;" onclick="applyExpenseFilter()">Filter</button>' +
      '<span style="color:#555; font-weight:600;">Total: <span style="color:#1a1a2e;">$' + parseFloat(total).toFixed(2) + '</span></span>' +
      '<button type="button" class="btn btn-secondary" style="padding:7px 16px; font-size:0.9em;" onclick="exportExpensesCsv()">Export CSV</button>' +
      '</div>';

    // Table
    if (expenses.length === 0) {
      html += '<p style="color:#666; padding:20px 0;">No expenses for this period.</p>';
    } else {
      html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Notes</th><th></th></tr></thead><tbody>';
      expenses.forEach(function(e) {
        var dateLabel = new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        html += '<tr>' +
          '<td>' + dateLabel + '</td>' +
          '<td>' + escapeHtml(e.category) + '</td>' +
          '<td style="font-weight:600; color:#dc2626;">$' + parseFloat(e.amount).toFixed(2) + '</td>' +
          '<td>' + escapeHtml(e.notes || '—') + '</td>' +
          '<td><button type="button" class="btn-cancel" onclick="deleteExpense(' + e.id + ')">Delete</button></td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    }

    container.innerHTML = html;

    // Wire add expense form
    var expForm = document.getElementById('add-expense-form');
    if (expForm) {
      expForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var errEl = document.getElementById('exp-error');
        errEl.textContent = '';
        var body = {
          date: document.getElementById('exp-date').value,
          category: document.getElementById('exp-category').value,
          amount: document.getElementById('exp-amount').value,
          notes: document.getElementById('exp-notes').value.trim()
        };
        try {
          var res = await fetch('/api/admin/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify(body)
          });
          if (res.status === 401) { handleAuthExpired(); return; }
          var data = await res.json();
          if (data.success) {
            loadExpensesTab();
            showPricingMsg('Expense added!', true);
          } else {
            errEl.textContent = data.error || 'Failed to add expense.';
          }
        } catch(err) {
          errEl.textContent = 'Error. Please try again.';
        }
      });
    }
  }

  window.applyExpenseFilter = function() {
    var y = parseInt(document.getElementById('exp-filter-year').value);
    var m = parseInt(document.getElementById('exp-filter-month').value);
    currentExpenseYear = y;
    currentExpenseMonth = m;
    loadExpensesTab();
  };

  window.deleteExpense = async function(id) {
    if (!confirm('Delete this expense?')) return;
    try {
      var res = await fetch('/api/admin/expenses/' + id, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      if (res.status === 401) { handleAuthExpired(); return; }
      loadExpensesTab();
      showPricingMsg('Expense deleted.', true);
    } catch(e) {}
  };

  window.exportExpensesCsv = function() {
    var rows = document.querySelectorAll('#expenses-admin-container table tbody tr');
    if (!rows.length) { alert('No expenses to export.'); return; }
    var csv = 'Date,Category,Amount,Notes\n';
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        csv += [cells[0].textContent, cells[1].textContent, cells[2].textContent, '"' + cells[3].textContent.replace(/"/g,'""') + '"'].join(',') + '\n';
      }
    });
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'expenses-' + currentExpenseYear + '-' + String(currentExpenseMonth).padStart(2,'0') + '.csv';
    a.click();
  };

  // --- Work Orders Tab ---
  var currentWoFilter = 'all';
  var allWorkOrders = [];

  async function loadWorkOrdersTab() {
    var container = document.getElementById('work-orders-admin-container');
    container.innerHTML = '<p style="color:#666;">Loading...</p>';
    try {
      var res = await fetch('/api/admin/work-orders', { headers: { 'x-admin-token': adminToken } });
      if (res.status === 401) { handleAuthExpired(); return; }
      if (!res.ok) {
        container.innerHTML = '<p style="color:#dc2626;">Server error (' + res.status + ') — the server may need to be restarted to pick up recent changes.</p>';
        return;
      }
      var data = await res.json();
      allWorkOrders = data.work_orders || [];
      currentWoFilter = 'all';
      renderWorkOrdersList();
    } catch (e) {
      console.error('loadWorkOrdersTab error:', e);
      container.innerHTML = '<p style="color:#dc2626;">Failed to load work orders: ' + e.message + '</p>';
    }
  }

  function renderWorkOrdersList() {
    var container = document.getElementById('work-orders-admin-container');
    var html = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">' +
      '<h2 style="margin:0;">Work Orders</h2>' +
      '<div style="display:flex; gap:8px;">' +
      '<button type="button" class="btn btn-secondary" style="padding:7px 16px; font-size:0.9em;" onclick="openQuoteModal()">Send Quote</button>' +
      '<button type="button" class="btn btn-primary" style="padding:7px 16px; font-size:0.9em;" onclick="openGenerateWoModal()">+ Generate Work Order</button>' +
      '</div></div>';

    // Filter buttons
    var filters = [
      { key: 'all', label: 'All' },
      { key: 'job_complete', label: 'Job Complete' },
      { key: 'invoiced', label: 'Invoiced' },
      { key: 'invoice_paid', label: 'Invoice Paid' },
      { key: 'paid', label: 'Paid' },
      { key: 'outstanding', label: 'Outstanding' }
    ];
    html += '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px;">';
    filters.forEach(function(f) {
      var active = currentWoFilter === f.key;
      html += '<button type="button" onclick="setWoFilter(\'' + f.key + '\')" style="padding:6px 16px; border-radius:20px; border:' +
        (active ? 'none' : '2px solid #ddd') + '; background:' + (active ? '#1a1a2e' : '#fff') + '; color:' +
        (active ? '#fff' : '#555') + '; font-weight:600; font-size:0.88em; cursor:pointer;">' + f.label + '</button>';
    });
    html += '</div>';

    // Apply filter
    var filtered = allWorkOrders.filter(function(wo) {
      if (currentWoFilter === 'all') return true;
      if (currentWoFilter === 'outstanding') return !wo.status_paid;
      if (currentWoFilter === 'job_complete') return wo.status_job_complete;
      if (currentWoFilter === 'invoiced') return wo.status_invoiced;
      if (currentWoFilter === 'invoice_paid') return wo.status_invoice_paid;
      if (currentWoFilter === 'paid') return wo.status_paid;
      return true;
    });

    if (filtered.length === 0) {
      html += '<p style="color:#666; padding:20px 0;">No work orders match this filter.</p>';
      container.innerHTML = html;
      return;
    }

    html += '<div style="overflow-x:auto;"><table class="bookings-table"><thead><tr>' +
      '<th>WO#</th><th>Customer</th><th>Date</th><th>Service</th><th>Price</th><th>Status</th><th>View</th>' +
      '</tr></thead><tbody>';

    filtered.forEach(function(wo) {
      var dateLabel = wo.date
        ? new Date(wo.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

      // Status badge pills
      var badges = '';
      if (wo.status_job_complete) badges += '<span style="background:#dbeafe; color:#1e40af; padding:2px 7px; border-radius:10px; font-size:0.78em; margin-right:3px; white-space:nowrap;">Job Done</span>';
      if (wo.status_invoiced) badges += '<span style="background:#fef3c7; color:#92400e; padding:2px 7px; border-radius:10px; font-size:0.78em; margin-right:3px; white-space:nowrap;">Invoiced</span>';
      if (wo.status_invoice_paid) badges += '<span style="background:#d1fae5; color:#065f46; padding:2px 7px; border-radius:10px; font-size:0.78em; margin-right:3px; white-space:nowrap;">Inv. Paid</span>';
      if (wo.status_paid) badges += '<span style="background:#d1fae5; color:#065f46; padding:2px 7px; border-radius:10px; font-size:0.78em; margin-right:3px; white-space:nowrap;">Paid</span>';
      if (!wo.status_job_complete && !wo.status_invoiced && !wo.status_invoice_paid && !wo.status_paid) {
        badges = '<span style="background:#fee2e2; color:#991b1b; padding:2px 7px; border-radius:10px; font-size:0.78em;">Outstanding</span>';
      }

      html += '<tr>' +
        '<td style="font-weight:600;">#' + wo.id + '</td>' +
        '<td>' + escapeHtml(wo.booking_name || wo.customer_name || '—') + '</td>' +
        '<td>' + dateLabel + '</td>' +
        '<td>' + escapeHtml(wo.service || '—') + '</td>' +
        '<td>' + escapeHtml(wo.price || '—') + '</td>' +
        '<td>' + badges + '</td>' +
        '<td><button type="button" onclick="openWorkOrderModal(' + wo.id + ')" style="padding:4px 12px; font-size:0.82em; background:#1a1a2e; color:#fff; border:none; border-radius:4px; cursor:pointer;">View</button></td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  window.setWoFilter = function(filterKey) {
    currentWoFilter = filterKey;
    renderWorkOrdersList();
  };

  function showPricingMsg(msg, success) {
    // Brief toast-style feedback
    var toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed; bottom:24px; right:24px; background:' + (success ? '#2d6a4f' : '#dc2626') + '; color:#fff; padding:12px 24px; border-radius:8px; font-weight:600; z-index:9999; transition:opacity 0.5s;';
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.remove(); }, 600); }, 2000);
  }

  // --- Quote Modal ---
  var quoteModal = document.getElementById('quote-modal');
  var closeQuoteModalBtn = document.getElementById('close-quote-modal');
  var quoteForm = document.getElementById('quote-form');

  if (closeQuoteModalBtn) {
    closeQuoteModalBtn.addEventListener('click', function() { quoteModal.style.display = 'none'; });
  }
  quoteModal && quoteModal.addEventListener('click', function(e) {
    if (e.target === quoteModal) quoteModal.style.display = 'none';
  });

  window.openQuoteModal = async function() {
    quoteModal.style.display = 'block';
    document.getElementById('qt-error').textContent = '';
    quoteForm.reset();
    document.getElementById('qt-addons-container').style.display = 'none';
    document.getElementById('qt-addons-list').innerHTML = '';
    document.getElementById('qt-price-display').innerHTML = '<span style="color:#888;">Select a service to calculate price</span>';
    document.getElementById('qt-notes-preview').textContent = '';

    if (!qtAllServices) {
      try {
        var res = await fetch('/api/pricing');
        var data = await res.json();
        qtAllServices = data.services || [];
      } catch (e) {
        document.getElementById('qt-error').textContent = 'Failed to load pricing data.';
        return;
      }
    }

    var sel = document.getElementById('qt-base-service');
    sel.innerHTML = '<option value="">-- Select a service --</option>';
    var QT_CAT_LABELS = { 'house':'House Washing','deck':'Deck Cleaning','fence':'Fence Cleaning','rv':'RV Washing','boat':'Boat Cleaning' };
    var baseServices = qtAllServices.filter(function(s) { return !s.parent_key; });
    var byCat = {};
    baseServices.forEach(function(s) { if (!byCat[s.category]) byCat[s.category] = []; byCat[s.category].push(s); });
    ['house','deck','fence','rv','boat'].forEach(function(cat) {
      if (!byCat[cat]) return;
      var grp = document.createElement('optgroup');
      grp.label = QT_CAT_LABELS[cat] || cat;
      byCat[cat].forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.key;
        opt.textContent = s.label + ' \u2014 $' + s.price;
        grp.appendChild(opt);
      });
      sel.appendChild(grp);
    });
    sel.onchange = function() { renderQtAddons(this.value); recalcQt(); };
  };

  function renderQtAddons(baseKey) {
    var container = document.getElementById('qt-addons-container');
    var list = document.getElementById('qt-addons-list');
    if (!baseKey || !qtAllServices) { container.style.display = 'none'; list.innerHTML = ''; return; }
    var addons = qtAllServices.filter(function(s) { return s.parent_key === baseKey; });
    if (!addons.length) { container.style.display = 'none'; list.innerHTML = ''; return; }
    list.innerHTML = '';
    addons.forEach(function(addon) {
      var label = document.createElement('label');
      label.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer; font-weight:400;';
      var cb = document.createElement('input');
      cb.type = 'checkbox'; cb.className = 'qt-addon-checkbox'; cb.value = addon.key; cb.onchange = recalcQt;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(addon.label + ' \u2014 $' + addon.price));
      list.appendChild(label);
    });
    container.style.display = 'block';
  }

  window.recalcQt = function() {
    var baseKey = document.getElementById('qt-base-service').value;
    if (!baseKey || !qtAllServices) {
      document.getElementById('qt-price-display').innerHTML = '<span style="color:#888;">Select a service to calculate price</span>';
      document.getElementById('qt-notes-preview').textContent = '';
      return;
    }
    var baseService = qtAllServices.find(function(s) { return s.key === baseKey; });
    if (!baseService) return;
    var subtotal = baseService.price;
    var lines = [baseService.label + ': $' + baseService.price];
    document.querySelectorAll('.qt-addon-checkbox:checked').forEach(function(cb) {
      var addon = qtAllServices.find(function(s) { return s.key === cb.value; });
      if (addon) { subtotal += addon.price; lines.push('  + ' + addon.label + ': $' + addon.price); }
    });
    var manualPct = 0;
    if (document.getElementById('qt-disc-cash').checked) manualPct += 10;
    if (document.getElementById('qt-disc-return').checked) manualPct += 10;
    var savings = Math.round(subtotal * manualPct / 100);
    var total = subtotal - savings;
    var notesLines = lines.slice();
    if (savings > 0) notesLines.push('Savings: -$' + savings);
    notesLines.push('Total: $' + total);
    document.getElementById('qt-notes-preview').textContent = notesLines.join('\n');
    var priceHtml = '<div style="font-size:1.3em; font-weight:700; color:#2d6a4f;">Estimate: $' + total + '</div>';
    if (savings > 0) priceHtml += '<div style="color:#888; font-size:0.9em; margin-top:4px;">Subtotal: $' + subtotal + ' &mdash; Savings: -$' + savings + '</div>';
    document.getElementById('qt-price-display').innerHTML = priceHtml;
  };

  if (quoteForm) {
    quoteForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var errEl = document.getElementById('qt-error');
      errEl.textContent = '';
      var email = document.getElementById('qt-email').value.trim();
      if (!email) { errEl.textContent = 'Customer email is required to send a quote.'; return; }
      var baseKey = document.getElementById('qt-base-service').value;
      if (!baseKey) { errEl.textContent = 'Please select a service.'; return; }
      var baseService = qtAllServices && qtAllServices.find(function(s) { return s.key === baseKey; });
      var subtotal = baseService ? baseService.price : 0;
      var serviceLabel = baseService ? baseService.label : '';
      var lines = baseService ? [baseService.label + ': $' + baseService.price] : [];
      document.querySelectorAll('.qt-addon-checkbox:checked').forEach(function(cb) {
        var addon = qtAllServices && qtAllServices.find(function(s) { return s.key === cb.value; });
        if (addon) { subtotal += addon.price; lines.push('  + ' + addon.label + ': $' + addon.price); serviceLabel += ' + ' + addon.label; }
      });
      var manualPct = 0;
      if (document.getElementById('qt-disc-cash').checked) manualPct += 10;
      if (document.getElementById('qt-disc-return').checked) manualPct += 10;
      var savings = Math.round(subtotal * manualPct / 100);
      var total = subtotal - savings;
      var notesLines = lines.slice();
      if (savings > 0) notesLines.push('Savings: -$' + savings);
      notesLines.push('Total: $' + total);
      var body = {
        name: document.getElementById('qt-name').value.trim(),
        email: email,
        phone: document.getElementById('qt-phone').value.trim(),
        address: document.getElementById('qt-address').value.trim(),
        service: serviceLabel,
        price: '$' + total,
        notes: notesLines.join('\n')
      };
      try {
        var res = await fetch('/api/admin/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify(body)
        });
        if (res.status === 401) { handleAuthExpired(); return; }
        var data = await res.json();
        if (data.success) {
          quoteModal.style.display = 'none';
          showPricingMsg('Quote sent to ' + email + '!', true);
        } else {
          errEl.textContent = data.error || 'Failed to send quote.';
        }
      } catch (err) {
        errEl.textContent = 'Error. Please try again.';
      }
    });
  }

  // --- Add Customer Modal ---
  var addCustomerModal = document.getElementById('add-customer-modal');
  var closeAddCustomerModalBtn = document.getElementById('close-add-customer-modal');
  var addCustomerForm = document.getElementById('add-customer-form');

  window.openAddCustomerModal = function() {
    addCustomerModal.style.display = 'block';
    document.getElementById('ac-error').textContent = '';
    addCustomerForm.reset();
  };

  if (closeAddCustomerModalBtn) {
    closeAddCustomerModalBtn.addEventListener('click', function() {
      addCustomerModal.style.display = 'none';
    });
  }
  addCustomerModal && addCustomerModal.addEventListener('click', function(e) {
    if (e.target === addCustomerModal) addCustomerModal.style.display = 'none';
  });

  if (addCustomerForm) {
    addCustomerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var errEl = document.getElementById('ac-error');
      errEl.textContent = '';
      var body = {
        name: document.getElementById('ac-name').value.trim(),
        email: document.getElementById('ac-email').value.trim(),
        phone: document.getElementById('ac-phone').value.trim(),
        address: document.getElementById('ac-address').value.trim(),
        notes: document.getElementById('ac-notes').value.trim()
      };
      if (!body.name) { errEl.textContent = 'Name is required.'; return; }
      try {
        var res = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify(body)
        });
        if (res.status === 401) { handleAuthExpired(); return; }
        var data = await res.json();
        if (data.success) {
          addCustomerModal.style.display = 'none';
          await loadCustomersTab();
          showPricingMsg('Customer saved!', true);
        } else {
          errEl.textContent = data.error || 'Failed to save customer.';
        }
      } catch (err) {
        errEl.textContent = 'Error. Please try again.';
      }
    });
  }

  // --- Generate Work Order Modal ---
  var generateWoModal = document.getElementById('generate-wo-modal');
  var closeGenerateWoModalBtn = document.getElementById('close-generate-wo-modal');
  var generateWoForm = document.getElementById('generate-wo-form');
  var gwoAllServices = null;

  if (closeGenerateWoModalBtn) {
    closeGenerateWoModalBtn.addEventListener('click', function() {
      generateWoModal.style.display = 'none';
    });
  }
  generateWoModal && generateWoModal.addEventListener('click', function(e) {
    if (e.target === generateWoModal) generateWoModal.style.display = 'none';
  });

  var GWO_CATEGORY_LABELS = {
    'house': 'House Washing',
    'deck': 'Deck Cleaning',
    'fence': 'Fence Cleaning',
    'rv': 'RV Washing',
    'boat': 'Boat Cleaning'
  };

  window.openGenerateWoModal = async function() {
    generateWoModal.style.display = 'block';
    document.getElementById('gwo-error').textContent = '';
    generateWoForm.reset();
    document.getElementById('gwo-addons-container').style.display = 'none';
    document.getElementById('gwo-addons-list').innerHTML = '';
    document.getElementById('gwo-price-display').innerHTML = '<span style="color:#888;">Select a service to calculate price</span>';
    document.getElementById('gwo-notes-preview').textContent = '';

    if (!gwoAllServices) {
      try {
        var res = await fetch('/api/pricing');
        var data = await res.json();
        gwoAllServices = data.services || [];
      } catch (e) {
        document.getElementById('gwo-error').textContent = 'Failed to load pricing data.';
        return;
      }
    }

    var sel = document.getElementById('gwo-base-service');
    sel.innerHTML = '<option value="">-- Select a service --</option>';
    var baseServices = gwoAllServices.filter(function(s) { return !s.parent_key; });
    var byCat = {};
    baseServices.forEach(function(s) {
      if (!byCat[s.category]) byCat[s.category] = [];
      byCat[s.category].push(s);
    });
    var catOrder = ['house', 'deck', 'fence', 'rv', 'boat'];
    catOrder.forEach(function(cat) {
      if (!byCat[cat]) return;
      var grp = document.createElement('optgroup');
      grp.label = GWO_CATEGORY_LABELS[cat] || cat;
      byCat[cat].forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.key;
        opt.textContent = s.label + ' \u2014 $' + s.price;
        grp.appendChild(opt);
      });
      sel.appendChild(grp);
    });

    sel.onchange = function() {
      renderGwoAddons(this.value);
      recalcGwo();
    };
  };

  function renderGwoAddons(baseKey) {
    var container = document.getElementById('gwo-addons-container');
    var list = document.getElementById('gwo-addons-list');
    if (!baseKey || !gwoAllServices) {
      container.style.display = 'none';
      list.innerHTML = '';
      return;
    }
    var addons = gwoAllServices.filter(function(s) { return s.parent_key === baseKey; });
    if (addons.length === 0) {
      container.style.display = 'none';
      list.innerHTML = '';
      return;
    }
    list.innerHTML = '';
    addons.forEach(function(addon) {
      var label = document.createElement('label');
      label.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer; font-weight:400;';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'gwo-addon-checkbox';
      cb.value = addon.key;
      cb.onchange = recalcGwo;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(addon.label + ' \u2014 $' + addon.price));
      list.appendChild(label);
    });
    container.style.display = 'block';
  }

  window.recalcGwo = function() {
    var baseKey = document.getElementById('gwo-base-service').value;
    if (!baseKey || !gwoAllServices) {
      document.getElementById('gwo-price-display').innerHTML = '<span style="color:#888;">Select a service to calculate price</span>';
      document.getElementById('gwo-notes-preview').textContent = '';
      return;
    }
    var baseService = gwoAllServices.find(function(s) { return s.key === baseKey; });
    if (!baseService) return;

    var subtotal = baseService.price;
    var lines = [baseService.label + ': $' + baseService.price];

    document.querySelectorAll('.gwo-addon-checkbox:checked').forEach(function(cb) {
      var addon = gwoAllServices.find(function(s) { return s.key === cb.value; });
      if (addon) {
        subtotal += addon.price;
        lines.push('  + ' + addon.label + ': $' + addon.price);
      }
    });

    var manualPct = 0;
    if (document.getElementById('gwo-disc-cash').checked) manualPct += 10;
    if (document.getElementById('gwo-disc-return').checked) manualPct += 10;
    var savings = Math.round(subtotal * manualPct / 100);
    var total = subtotal - savings;

    var notesLines = lines.slice();
    if (savings > 0) notesLines.push('Savings: -$' + savings);
    notesLines.push('Total: $' + total);

    document.getElementById('gwo-notes-preview').textContent = notesLines.join('\n');

    var priceHtml = '<div style="font-size:1.3em; font-weight:700; color:#2d6a4f;">Total: $' + total + '</div>';
    if (savings > 0) {
      priceHtml += '<div style="color:#888; font-size:0.9em; margin-top:4px;">Subtotal: $' + subtotal + ' &mdash; Savings: -$' + savings + ' (' + manualPct + '% off)</div>';
    }
    document.getElementById('gwo-price-display').innerHTML = priceHtml;
  };

  if (generateWoForm) {
    generateWoForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var errEl = document.getElementById('gwo-error');
      errEl.textContent = '';

      var baseKey = document.getElementById('gwo-base-service').value;
      if (!baseKey) { errEl.textContent = 'Please select a service.'; return; }

      var baseService = gwoAllServices && gwoAllServices.find(function(s) { return s.key === baseKey; });
      var subtotal = baseService ? baseService.price : 0;
      var serviceLabel = baseService ? baseService.label : '';
      var lines = baseService ? [baseService.label + ': $' + baseService.price] : [];

      document.querySelectorAll('.gwo-addon-checkbox:checked').forEach(function(cb) {
        var addon = gwoAllServices && gwoAllServices.find(function(s) { return s.key === cb.value; });
        if (addon) {
          subtotal += addon.price;
          lines.push('  + ' + addon.label + ': $' + addon.price);
          serviceLabel += ' + ' + addon.label;
        }
      });

      var manualPct = 0;
      if (document.getElementById('gwo-disc-cash').checked) manualPct += 10;
      if (document.getElementById('gwo-disc-return').checked) manualPct += 10;
      var savings = Math.round(subtotal * manualPct / 100);
      var total = subtotal - savings;

      var notesLines = lines.slice();
      if (savings > 0) notesLines.push('Savings: -$' + savings);
      notesLines.push('Total: $' + total);

      var body = {
        name: document.getElementById('gwo-name').value.trim(),
        email: document.getElementById('gwo-email').value.trim(),
        phone: document.getElementById('gwo-phone').value.trim(),
        address: document.getElementById('gwo-address').value.trim(),
        service: serviceLabel,
        price: '$' + total,
        notes: notesLines.join('\n')
      };
      if (!body.name) { errEl.textContent = 'Customer name is required.'; return; }

      try {
        var res = await fetch('/api/admin/work-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify(body)
        });
        if (res.status === 401) { handleAuthExpired(); return; }
        var data = await res.json();
        if (data.success) {
          generateWoModal.style.display = 'none';
          await loadWorkOrdersTab();
          showPricingMsg('Work Order #' + data.work_order_id + ' created!', true);
          openWorkOrderModal(data.work_order_id);
        } else {
          errEl.textContent = data.error || 'Failed to create work order.';
        }
      } catch (err) {
        errEl.textContent = 'Error. Please try again.';
      }
    });
  }

  // Check if already logged in
  if (adminToken) {
    showDashboard();
  }
});
