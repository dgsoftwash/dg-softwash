// D&G Soft Wash Price Calculator

// Add-on pricing and durations based on house size
const houseAddons = {
  350: [ // Rancher
    { name: 'Roof Wash', price: 125, duration: 1 },
    { name: 'Driveway Hot Wash', price: 75, duration: 1.5 },
    { name: 'Driveway Heavy Stain (Peroxide/Degreaser)', price: 125, duration: 2 },
    { name: 'UV Protectant', price: 25, duration: 1 },
    { name: 'Streak-Free Window Cleaning', price: 25, duration: 0.75 }
  ],
  575: [ // Single Family
    { name: 'Roof Wash', price: 225, duration: 1 },
    { name: 'Driveway Hot Wash', price: 75, duration: 1.5 },
    { name: 'Driveway Heavy Stain (Peroxide/Degreaser)', price: 125, duration: 2 },
    { name: 'UV Protectant', price: 65, duration: 1 },
    { name: 'Streak-Free Window Cleaning', price: 60, duration: 0.75 }
  ],
  805: [ // Plus+
    { name: 'Roof Wash', price: 400, duration: 1 },
    { name: 'Driveway Hot Wash', price: 125, duration: 1.5 },
    { name: 'Driveway Heavy Stain (Peroxide/Degreaser)', price: 175, duration: 2 },
    { name: 'UV Protectant', price: 100, duration: 1 },
    { name: 'Streak-Free Window Cleaning', price: 85, duration: 0.75 }
  ]
};

// RV Add-on pricing and durations based on RV size
const rvAddons = {
  75: [ // Short Bus
    { name: 'UV Protectant', price: 20, duration: 0.5 },
    { name: 'Streak-Free Window Cleaning', price: 20, duration: 0.25 }
  ],
  125: [ // Medium Bumper Pull
    { name: 'UV Protectant', price: 35, duration: 0.5 },
    { name: 'Streak-Free Window Cleaning', price: 35, duration: 0.25 }
  ],
  200: [ // Big Boy 5th Wheel
    { name: 'UV Protectant', price: 50, duration: 0.5 },
    { name: 'Streak-Free Window Cleaning', price: 50, duration: 0.25 }
  ]
};

// Base durations (hours) for main services
const BASE_DURATIONS = {
  'Rancher House Wash': 2,
  'Single Family House Wash': 3,
  'Plus+ House Wash': 4,
  'Little Deck': 2,
  'Medium Deck': 2,
  'Large Deck': 2,
  'Standard Fence (1/4 Acre)': 2,
  'Large Fence (1/2 Acre)': 2,
  'Short Bus RV': 1,
  'Medium Bumper Pull RV': 1,
  'Big Boy 5th Wheel RV': 1,
  'Boat (20ft or Less)': 1,
  'Boat (21-26ft)': 1
};

document.addEventListener('DOMContentLoaded', function() {
  const selectedServicesEl = document.getElementById('selected-services');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');
  const totalSavingsEl = document.getElementById('total-savings');
  const savingsLineEl = document.getElementById('savings-line');
  const cashDiscountEl = document.getElementById('cash-discount');
  const returnCustomerEl = document.getElementById('return-customer');
  const multiServiceDiscountEl = document.getElementById('multi-service-discount');
  const multiServiceTextEl = document.getElementById('multi-service-text');
  const multiServiceAmountEl = document.getElementById('multi-service-amount');
  const houseAddonsEl = document.getElementById('house-addons');
  const houseAddonOptionsEl = document.getElementById('house-addon-options');
  const rvAddonsEl = document.getElementById('rv-addons');
  const rvAddonOptionsEl = document.getElementById('rv-addon-options');

  // Handle grouped checkboxes (only one selection allowed per group)
  function handleGroupedCheckbox(checkbox) {
    const group = checkbox.dataset.group;
    if (group && checkbox.checked) {
      // Uncheck all other checkboxes in the same group
      document.querySelectorAll(`input[data-group="${group}"]`).forEach(input => {
        if (input !== checkbox) {
          input.checked = false;
        }
      });
    }
  }

  // Listen for all checkbox changes
  document.querySelectorAll('.calculator-services input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', function() {
      handleGroupedCheckbox(this);

      // Handle add-ons for house
      if (this.dataset.group === 'house') {
        if (this.checked) {
          showHouseAddons(parseInt(this.value));
        } else {
          houseAddonsEl.style.display = 'none';
          houseAddonOptionsEl.innerHTML = '';
        }
      }

      // Handle add-ons for RV
      if (this.dataset.group === 'rv') {
        if (this.checked) {
          showRvAddons(parseInt(this.value));
        } else {
          rvAddonsEl.style.display = 'none';
          rvAddonOptionsEl.innerHTML = '';
        }
      }

      updateCalculator();
    });
  });

  // Listen for discount checkbox changes
  cashDiscountEl.addEventListener('change', updateCalculator);
  returnCustomerEl.addEventListener('change', updateCalculator);

  function showHouseAddons(price) {
    const addons = houseAddons[price];
    if (addons) {
      houseAddonOptionsEl.innerHTML = addons.map(addon => `
        <label class="service-option">
          <input type="checkbox" value="${addon.price}" data-name="${addon.name}" data-category="house-addon" data-duration="${addon.duration}">
          <span class="option-details">
            <span class="option-name">${addon.name}</span>
            <span class="option-price">+$${addon.price}</span>
          </span>
        </label>
      `).join('');
      houseAddonsEl.style.display = 'block';

      // Add listeners to new checkboxes
      houseAddonOptionsEl.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', updateCalculator);
      });
    } else {
      houseAddonsEl.style.display = 'none';
    }
  }

  function showRvAddons(price) {
    const addons = rvAddons[price];
    if (addons) {
      rvAddonOptionsEl.innerHTML = addons.map(addon => `
        <label class="service-option">
          <input type="checkbox" value="${addon.price}" data-name="${addon.name}" data-category="rv-addon" data-duration="${addon.duration}">
          <span class="option-details">
            <span class="option-name">${addon.name}</span>
            <span class="option-price">+$${addon.price}</span>
          </span>
        </label>
      `).join('');
      rvAddonsEl.style.display = 'block';

      // Add listeners to new checkboxes
      rvAddonOptionsEl.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', updateCalculator);
      });
    } else {
      rvAddonsEl.style.display = 'none';
    }
  }

  function updateCalculator() {
    let selectedItems = [];
    let subtotal = 0;
    let serviceCount = 0;

    // Get all checked checkboxes
    document.querySelectorAll('.calculator-services input[type="checkbox"]:checked').forEach(input => {
      const price = parseInt(input.value);
      const name = input.dataset.name;
      const category = input.dataset.category;
      const group = input.dataset.group;

      if (category === 'house-addon' || category === 'rv-addon') {
        // Add-ons don't count as separate services
        selectedItems.push({ name: '  + ' + name, price });
        subtotal += price;
      } else {
        selectedItems.push({ name, price });
        subtotal += price;
        serviceCount++;
      }
    });

    // Update selected services display
    if (selectedItems.length === 0) {
      selectedServicesEl.innerHTML = '<p class="empty-cart">No services selected</p>';
    } else {
      selectedServicesEl.innerHTML = selectedItems.map(item => `
        <div class="selected-item">
          <span class="selected-item-name">${item.name}</span>
          <span class="selected-item-price">$${item.price}</span>
        </div>
      `).join('');
    }

    // Update subtotal
    subtotalEl.textContent = '$' + subtotal.toFixed(2);

    // Calculate discounts
    let totalDiscountPercent = 0;

    // Multi-service discount (auto-applied)
    if (serviceCount >= 3) {
      totalDiscountPercent += 15;
      multiServiceDiscountEl.style.display = 'flex';
      multiServiceTextEl.textContent = '3+ Services Discount';
      multiServiceAmountEl.textContent = '-15%';
    } else if (serviceCount >= 2) {
      totalDiscountPercent += 10;
      multiServiceDiscountEl.style.display = 'flex';
      multiServiceTextEl.textContent = '2+ Services Discount';
      multiServiceAmountEl.textContent = '-10%';
    } else {
      multiServiceDiscountEl.style.display = 'none';
    }

    // Cash discount
    if (cashDiscountEl.checked) {
      totalDiscountPercent += 10;
    }

    // Return customer discount
    if (returnCustomerEl.checked) {
      totalDiscountPercent += 10;
    }

    // Calculate savings
    const savingsAmount = subtotal * (totalDiscountPercent / 100);
    const total = subtotal - savingsAmount;

    // Update savings display
    if (savingsAmount > 0) {
      savingsLineEl.style.display = 'flex';
      totalSavingsEl.textContent = '-$' + savingsAmount.toFixed(2);
    } else {
      savingsLineEl.style.display = 'none';
    }

    // Update total
    totalEl.textContent = '$' + total.toFixed(2);
  }

  // Initialize
  updateCalculator();

  // Book Now button — save estimate to localStorage and go to contact page
  document.getElementById('book-now-btn').addEventListener('click', function() {
    const items = [];
    document.querySelectorAll('.calculator-services input[type="checkbox"]:checked').forEach(input => {
      const isAddon = input.dataset.category === 'house-addon' || input.dataset.category === 'rv-addon';
      const duration = isAddon
        ? parseFloat(input.dataset.duration || 0)
        : (BASE_DURATIONS[input.dataset.name] || 1);
      items.push({
        name: input.dataset.name,
        price: parseInt(input.value),
        isAddon,
        duration
      });
    });

    if (items.length === 0) {
      alert('Please select at least one service before booking.');
      return;
    }

    const rawDuration = items.reduce((sum, item) => sum + (item.duration || 0), 0);
    const totalDuration = Math.ceil(rawDuration);

    localStorage.setItem('dg_estimate', JSON.stringify({
      items,
      subtotal: subtotalEl.textContent,
      savings: savingsLineEl.style.display !== 'none' ? totalSavingsEl.textContent : null,
      total: totalEl.textContent,
      totalDuration
    }));

    window.location.href = '/contact';
  });
});
