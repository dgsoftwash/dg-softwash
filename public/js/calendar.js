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

      SLOTS.forEach(function(slot) {
        const slotData = data.slots ? data.slots.find(function(s) { return s.time === slot; }) : null;
        const isAvailable = slotData ? slotData.available : true;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot' + (isAvailable ? '' : ' booked');

        const timeSpan = document.createElement('span');
        timeSpan.className = 'slot-time';
        timeSpan.textContent = SLOT_LABELS[slot];

        const statusSpan = document.createElement('span');
        statusSpan.className = 'slot-status';
        statusSpan.textContent = isAvailable ? 'Available' : 'Booked';

        btn.appendChild(timeSpan);
        btn.appendChild(statusSpan);

        if (isAvailable) {
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

  function selectSlot(date, time) {
    selectedDate = date;
    selectedTime = time;
    dateInput.value = date;
    timeInput.value = time;

    const dateObj = new Date(date + 'T12:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateLabel = dateObj.toLocaleDateString('en-US', options);
    selectionText.textContent = dateLabel + ' at ' + SLOT_LABELS[time];
    selectionDisplay.style.display = 'flex';

    closeModal();
    renderCalendar();
  }

  // Initial load
  loadMonth();
});
