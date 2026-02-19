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

    var dateObj = new Date(dateStr + 'T12:00:00');
    var options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dayDetailTitle.textContent = dateObj.toLocaleDateString('en-US', options);

    var isDayBlocked = allBlocked.some(function(b) {
      return b.date === dateStr && b.time === 'all';
    });
    blockDayCheckbox.checked = isDayBlocked;

    daySlots.innerHTML = '';
    SLOTS.forEach(function(slot) {
      var booking = allBookings.find(function(b) {
        return b.date === dateStr && b.time === slot;
      });
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
        labelEl.textContent = 'Booked - ' + booking.name;
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

      if (booking) {
        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', function() {
          adminAction('cancel', dateStr, slot);
        });
        actions.appendChild(cancelBtn);
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
      td.colSpan = 5;
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

      row.innerHTML =
        '<td>' + dateLabel + '</td>' +
        '<td>' + (SLOT_LABELS[b.time] || b.time) + '</td>' +
        '<td>' + escapeHtml(b.name) + '</td>' +
        '<td>' + escapeHtml(b.service || '-') + '</td>' +
        '<td>' + escapeHtml(b.phone || '-') + '</td>';
      bookingsBody.appendChild(row);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Check if already logged in
  if (adminToken) {
    showDashboard();
  }
});
