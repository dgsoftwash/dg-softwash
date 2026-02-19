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

  function renderBookingsTable() {
    bookingsBody.innerHTML = '';

    // Filter to upcoming bookings and sort by date
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
      td.colSpan = 7;
      td.className = 'no-bookings';
      td.textContent = 'No upcoming bookings';
      row.appendChild(td);
      bookingsBody.appendChild(row);
      return;
    }

    upcoming.forEach(function(b) {
      var row = document.createElement('tr');
      var dateObj = new Date(b.date + 'T12:00:00');
      var dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      var dur = b.duration || 1;
      row.innerHTML =
        '<td>' + dateLabel + '</td>' +
        '<td>' + (SLOT_LABELS[b.time] || b.time) + '</td>' +
        '<td>' + dur + 'hr' + (dur > 1 ? 's' : '') + '</td>' +
        '<td>' + escapeHtml(b.name) + '</td>' +
        '<td>' + escapeHtml(b.service || '-') + '</td>' +
        '<td>' + escapeHtml(b.phone || '-') + '</td>' +
        '<td>' + escapeHtml(b.address || '-') + '</td>';
      bookingsBody.appendChild(row);
    });
  }

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
    });
  });

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

  function showPricingMsg(msg, success) {
    // Brief toast-style feedback
    var toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed; bottom:24px; right:24px; background:' + (success ? '#2d6a4f' : '#dc2626') + '; color:#fff; padding:12px 24px; border-radius:8px; font-weight:600; z-index:9999; transition:opacity 0.5s;';
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.remove(); }, 600); }, 2000);
  }

  // Check if already logged in
  if (adminToken) {
    showDashboard();
  }
});
