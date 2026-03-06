// Booking Calendar for Contact Page
document.addEventListener('DOMContentLoaded', function() {
  const calendarContainer = document.getElementById('booking-calendar');
  if (!calendarContainer) return;

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

  const SERVICE_DURATIONS = {
    'house-rancher': 2,
    'house-single': 3,
    'house-plus': 4,
    'deck': 2,
    'fence': 2,
    'rv': 1,
    'boat': 1
  };

  const NOT_BOOKABLE = ['heavy-equipment', 'commercial'];

  function getSelectedDuration() {
    if (window.estimateDuration && window.estimateDuration > 0) {
      return window.estimateDuration;
    }
    var serviceSelect = document.getElementById('service');
    if (!serviceSelect) return 1;
    return SERVICE_DURATIONS[serviceSelect.value] || 1;
  }

  let currentYear, currentMonth; // 0-indexed month
  let selectedDate = null;
  let selectedTime = null;
  let monthAvailability = {};

  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();

  const calendarGrid = calendarContainer.querySelector('.calendar-grid');
  const monthLabel = calendarContainer.querySelector('.calendar-month-label');
  const prevBtn = calendarContainer.querySelector('.calendar-prev');
  const nextBtn = calendarContainer.querySelector('.calendar-next');
  const selectionDisplay = calendarContainer.querySelector('.calendar-selection');
  const selectionText = selectionDisplay.querySelector('span');
  const clearBtn = selectionDisplay.querySelector('.clear-btn');
  const dateInput = document.getElementById('appointmentDate');
  const timeInput = document.getElementById('appointmentTime');
  const modal = document.getElementById('timeslot-modal');
  const modalOverlay = modal;
  const modalTitle = modal.querySelector('h3');
  const modalSubtitle = modal.querySelector('.modal-subtitle');
  const modalClose = modal.querySelector('.modal-close');
  const timeSlotsContainer = modal.querySelector('.time-slots');

  prevBtn.addEventListener('click', function() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    loadMonth();
  });

  nextBtn.addEventListener('click', function() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    loadMonth();
  });

  clearBtn.addEventListener('click', function() {
    selectedDate = null;
    selectedTime = null;
    dateInput.value = '';
    timeInput.value = '';
    selectionDisplay.style.display = 'none';
    const notice = document.getElementById('multiday-notice');
    if (notice) notice.style.display = 'none';
    renderCalendar();
  });

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) closeModal();
  });

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  async function loadMonth() {
    try {
      const res = await fetch(`/api/availability/${currentYear}/${currentMonth + 1}`);
      const data = await res.json();
      monthAvailability = {};
      if (data.days) {
        data.days.forEach(function(d) {
          monthAvailability[d.date] = d;
        });
      }
    } catch (e) {
      monthAvailability = {};
    }
    renderCalendar();
  }

  function renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    monthLabel.textContent = monthNames[currentMonth] + ' ' + currentYear;

    // Disable prev button if showing current month
    const nowYear = today.getFullYear();
    const nowMonth = today.getMonth();
    prevBtn.disabled = (currentYear === nowYear && currentMonth === nowMonth);
    prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';

    // Clear grid but keep day labels
    const labels = calendarGrid.querySelectorAll('.calendar-day-label');
    calendarGrid.innerHTML = '';
    labels.forEach(function(l) { calendarGrid.appendChild(l); });

    // Re-add day labels
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(function(d) {
      const el = document.createElement('div');
      el.className = 'calendar-day-label';
      el.textContent = d;
      calendarGrid.appendChild(el);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day empty';
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'calendar-day';
      el.textContent = day;

      const dateStr = currentYear + '-' +
        String(currentMonth + 1).padStart(2, '0') + '-' +
        String(day).padStart(2, '0');
      const dateObj = new Date(currentYear, currentMonth, day);
      const isSunday = dateObj.getDay() === 0;
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dayData = monthAvailability[dateStr];
      const isFullyBooked = dayData && dayData.availableSlots === 0;

      if (isPast || isSunday) {
        el.classList.add('disabled');
      } else if (isFullyBooked) {
        el.classList.add('fully-booked');
        el.title = 'Fully booked';
      } else {
        if (dayData && dayData.availableSlots < 7) {
          el.classList.add('has-availability');
        }
        el.addEventListener('click', function() {
          openTimeSlotModal(dateStr);
        });
      }

      // Highlight today
      if (currentYear === today.getFullYear() &&
          currentMonth === today.getMonth() &&
          day === today.getDate()) {
        el.classList.add('today');
      }

      // Highlight selected
      if (selectedDate === dateStr) {
        el.classList.add('selected');
      }

      calendarGrid.appendChild(el);
    }
  }

  async function openTimeSlotModal(dateStr) {
    const dateObj = new Date(dateStr + 'T12:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    modalTitle.textContent = dateObj.toLocaleDateString('en-US', options);
    modalSubtitle.textContent = 'Select an available time slot';
    timeSlotsContainer.innerHTML = '<p style="text-align:center;color:#666;">Loading...</p>';
    modalOverlay.classList.add('active');

    try {
      const res = await fetch('/api/availability/' + dateStr + '/slots');
      const data = await res.json();
      timeSlotsContainer.innerHTML = '';

      const duration = getSelectedDuration();

      // Multi-day booking handling
      if (duration > SLOTS.length) {
        const d1 = new Date(dateStr + 'T12:00:00');
        const d2 = new Date(d1);
        d2.setDate(d2.getDate() + 1);
        if (d2.getDay() === 0) d2.setDate(d2.getDate() + 1); // Skip Sunday
        const day2DateStr = d2.toISOString().split('T')[0];
        const day1Label = d1.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const day2Label = d2.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const overflow = duration - SLOTS.length;

        timeSlotsContainer.innerHTML =
          '<div style="background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:14px; margin-bottom:14px; text-align:left;">' +
            '<strong>&#9888; This service package requires 2 days to complete.</strong>' +
            '<ul style="margin:8px 0 0; padding-left:20px; line-height:1.8;">' +
              '<li><strong>Day 1:</strong> ' + day1Label + ' &mdash; Full day (9:00 AM &ndash; 3:00 PM)</li>' +
              '<li><strong>Day 2:</strong> ' + day2Label + ' &mdash; Starting at 9:00 AM (' + overflow + ' hour' + (overflow !== 1 ? 's' : '') + ')</li>' +
            '</ul>' +
          '</div>' +
          '<button type="button" id="confirm-2day-btn" class="btn btn-primary" style="width:100%; padding:12px; font-size:1em;">Confirm 2-Day Booking</button>';

        document.getElementById('confirm-2day-btn').addEventListener('click', function() {
          selectSlot(dateStr, '09:00', day2DateStr, overflow);
        });
        return;
      }

      // Build raw availability map from API data
      const rawAvail = {};
      SLOTS.forEach(function(slot) {
        const slotData = data.slots ? data.slots.find(function(s) { return s.time === slot; }) : null;
        rawAvail[slot] = slotData ? slotData.available : true;
      });

      SLOTS.forEach(function(slot, idx) {
        // A start time is only available if it AND the next (duration-1) consecutive slots are all free
        let canStart = true;
        if (idx + duration > SLOTS.length) {
          canStart = false; // Not enough slots remaining in the day
        } else {
          for (let d = 0; d < duration; d++) {
            if (!rawAvail[SLOTS[idx + d]]) {
              canStart = false;
              break;
            }
          }
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot' + (canStart ? '' : ' booked');

        const timeSpan = document.createElement('span');
        timeSpan.className = 'slot-time';
        timeSpan.textContent = SLOT_LABELS[slot];

        const statusSpan = document.createElement('span');
        statusSpan.className = 'slot-status';
        statusSpan.textContent = canStart ? 'Available' : 'Booked';

        btn.appendChild(timeSpan);
        btn.appendChild(statusSpan);

        if (canStart) {
          btn.addEventListener('click', function() {
            selectSlot(dateStr, slot);
          });
        }

        timeSlotsContainer.appendChild(btn);
      });
    } catch (e) {
      timeSlotsContainer.innerHTML = '<p style="text-align:center;color:#dc2626;">Failed to load slots. Please try again.</p>';
    }
  }

  function selectSlot(date, time, day2DateStr, day2Hours) {
    selectedDate = date;
    selectedTime = time;
    dateInput.value = date;
    timeInput.value = time;

    const dateObj = new Date(date + 'T12:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric' };

    if (day2DateStr) {
      const day2Obj = new Date(day2DateStr + 'T12:00:00');
      selectionText.textContent = dateObj.toLocaleDateString('en-US', options) + ' + ' + day2Obj.toLocaleDateString('en-US', options) + ' (2-day service)';

      // Show the notice on the form
      const notice = document.getElementById('multiday-notice');
      const noticeText = document.getElementById('multiday-notice-text');
      if (notice && noticeText) {
        const day1Label = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const day2Label = day2Obj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        noticeText.textContent = 'Day 1: ' + day1Label + ' (Full day, 9:00 AM – 3:00 PM)  •  Day 2: ' + day2Label + ' (9:00 AM, ' + day2Hours + ' hour' + (day2Hours !== 1 ? 's' : '') + ')';
        notice.style.display = 'block';
      }
    } else {
      selectionText.textContent = dateObj.toLocaleDateString('en-US', options) + ' at ' + SLOT_LABELS[time];
      const notice = document.getElementById('multiday-notice');
      if (notice) notice.style.display = 'none';
    }

    selectionDisplay.style.display = 'flex';
    closeModal();
    renderCalendar();
  }

  // Service dropdown: hide calendar for non-bookable services
  var serviceSelect = document.getElementById('service');
  function updateCalendarVisibility() {
    if (!serviceSelect) return;
    var val = serviceSelect.value;
    if (NOT_BOOKABLE.includes(val)) {
      calendarContainer.style.display = 'none';
      // Clear any selection
      selectedDate = null;
      selectedTime = null;
      dateInput.value = '';
      timeInput.value = '';
      selectionDisplay.style.display = 'none';
    } else {
      calendarContainer.style.display = '';
    }
  }

  if (serviceSelect) {
    serviceSelect.addEventListener('change', function() {
      window.estimateDuration = 0; // Clear add-on duration when user manually picks a service
      updateCalendarVisibility();
    });
    updateCalendarVisibility(); // Check initial value on page load
  }

  // Initial load
  loadMonth();
});
