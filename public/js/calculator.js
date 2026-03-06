// D&G Soft Wash Price Calculator — Dynamic (prices loaded from /api/pricing)

var pricingData = null; // { services: [], discounts: [] }

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

  // Fetch pricing from API, then build the calculator
  fetch('/api/pricing')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      pricingData = data;
      renderServices(data.services);
      updateDiscountPercents(data.discounts);
      attachListeners();
      updateCalculator();
    })
    .catch(function() {
      document.querySelector('.calculator-services').innerHTML =
        '<p style="color:#dc2626; padding:20px;">Failed to load pricing. Please refresh the page.</p>';
    });

  function serviceLabel(svc) {
    return `<label class="service-option">
      <input type="checkbox"
        ${svc.bookable_group ? 'data-group="' + svc.bookable_group + '"' : ''}
        value="${svc.price}"
        data-key="${svc.key}"
        data-name="${svc.label}"
        data-duration="${svc.duration}"
        ${svc.category === 'house-addon' || svc.category === 'rv-addon' ? 'data-category="' + svc.category + '"' : ''}>
      <span class="option-details">
        <span class="option-name">${svc.label}</span>
        <span class="option-price">$${svc.price}</span>
      </span>
    </label>`;
  }

  function renderServices(services) {
    const byCategory = {};
    services.forEach(function(svc) {
      if (!byCategory[svc.category]) byCategory[svc.category] = [];
      byCategory[svc.category].push(svc);
    });

    // House Washing
    const houseEl = document.getElementById('house-services');
    if (houseEl && byCategory['house']) {
      houseEl.innerHTML = byCategory['house'].map(serviceLabel).join('');
    }

    // Deck
    const deckEl = document.getElementById('deck-services');
    if (deckEl && byCategory['deck']) {
      deckEl.innerHTML = byCategory['deck'].map(serviceLabel).join('');
    }

    // Fence
    const fenceEl = document.getElementById('fence-services');
    if (fenceEl && byCategory['fence']) {
      fenceEl.innerHTML = byCategory['fence'].map(serviceLabel).join('');
    }

    // RV
    const rvEl = document.getElementById('rv-services');
    if (rvEl && byCategory['rv']) {
      rvEl.innerHTML = byCategory['rv'].map(serviceLabel).join('');
    }

    // Boat
    const boatEl = document.getElementById('boat-services');
    if (boatEl && byCategory['boat']) {
      boatEl.innerHTML = byCategory['boat'].map(serviceLabel).join('');
    }
  }

  function updateDiscountPercents(discounts) {
    // Update the displayed discount percentages from DB values
    const cashDisc = discounts.find(function(d) { return d.key === 'cash'; });
    const returnDisc = discounts.find(function(d) { return d.key === 'return-customer'; });
    if (cashDisc) {
      const el = cashDiscountEl && cashDiscountEl.closest('label') && cashDiscountEl.closest('label').querySelector('.discount-amount');
      if (el) el.textContent = '-' + cashDisc.percent + '%';
    }
    if (returnDisc) {
      const el = returnCustomerEl && returnCustomerEl.closest('label') && returnCustomerEl.closest('label').querySelector('.discount-amount');
      if (el) el.textContent = '-' + returnDisc.percent + '%';
    }
  }

  function showHouseAddons(parentKey) {
    if (!pricingData) return;
    const addons = pricingData.services.filter(function(s) {
      return s.category === 'house-addon' && s.parent_key === parentKey;
    });
    if (addons.length > 0) {
      houseAddonOptionsEl.innerHTML = addons.map(function(addon) {
        return `<label class="service-option">
          <input type="checkbox" value="${addon.price}" data-key="${addon.key}" data-name="${addon.label}" data-category="house-addon" data-duration="${addon.duration}">
          <span class="option-details">
            <span class="option-name">${addon.label}</span>
            <span class="option-price">+$${addon.price}</span>
          </span>
        </label>`;
      }).join('');
      houseAddonsEl.style.display = 'block';
      houseAddonOptionsEl.querySelectorAll('input').forEach(function(input) {
        input.addEventListener('change', updateCalculator);
      });
    } else {
      houseAddonsEl.style.display = 'none';
    }
  }

  function showRvAddons(parentKey) {
    if (!pricingData) return;
    const addons = pricingData.services.filter(function(s) {
      return s.category === 'rv-addon' && s.parent_key === parentKey;
    });
    if (addons.length > 0) {
      rvAddonOptionsEl.innerHTML = addons.map(function(addon) {
        return `<label class="service-option">
          <input type="checkbox" value="${addon.price}" data-key="${addon.key}" data-name="${addon.label}" data-category="rv-addon" data-duration="${addon.duration}">
          <span class="option-details">
            <span class="option-name">${addon.label}</span>
            <span class="option-price">+$${addon.price}</span>
          </span>
        </label>`;
      }).join('');
      rvAddonsEl.style.display = 'block';
      rvAddonOptionsEl.querySelectorAll('input').forEach(function(input) {
        input.addEventListener('change', updateCalculator);
      });
    } else {
      rvAddonsEl.style.display = 'none';
    }
  }

  function handleGroupedCheckbox(checkbox) {
    const group = checkbox.dataset.group;
    if (group && checkbox.checked) {
      document.querySelectorAll('input[data-group="' + group + '"]').forEach(function(input) {
        if (input !== checkbox) input.checked = false;
      });
    }
  }

  function attachListeners() {
    // Main service checkboxes (rendered into containers)
    document.querySelectorAll('.calculator-services input[type="checkbox"]').forEach(function(input) {
      input.addEventListener('change', function() {
        handleGroupedCheckbox(this);

        if (this.dataset.group === 'house') {
          if (this.checked) {
            // Clear any previously checked house addons
            houseAddonOptionsEl.innerHTML = '';
            showHouseAddons(this.dataset.key);
          } else {
            houseAddonsEl.style.display = 'none';
            houseAddonOptionsEl.innerHTML = '';
          }
        }

        if (this.dataset.group === 'rv') {
          if (this.checked) {
            rvAddonOptionsEl.innerHTML = '';
            showRvAddons(this.dataset.key);
          } else {
            rvAddonsEl.style.display = 'none';
            rvAddonOptionsEl.innerHTML = '';
          }
        }

        updateCalculator();
      });
    });

    cashDiscountEl.addEventListener('change', updateCalculator);
    returnCustomerEl.addEventListener('change', updateCalculator);
  }

  function updateCalculator() {
    if (!pricingData) return;

    const discounts = pricingData.discounts;
    const cashDisc = discounts.find(function(d) { return d.key === 'cash'; });
    const returnDisc = discounts.find(function(d) { return d.key === 'return-customer'; });
    const multi2Disc = discounts.find(function(d) { return d.key === 'multi-2'; });
    const multi3Disc = discounts.find(function(d) { return d.key === 'multi-3'; });

    let selectedItems = [];
    let subtotal = 0;
    let serviceCount = 0;

    document.querySelectorAll('.calculator-services input[type="checkbox"]:checked').forEach(function(input) {
      const price = parseInt(input.value);
      const name = input.dataset.name;
      const category = input.dataset.category;
      const isAddon = category === 'house-addon' || category === 'rv-addon';

      if (isAddon) {
        selectedItems.push({ name: '  + ' + name, price: price });
      } else {
        selectedItems.push({ name: name, price: price });
        serviceCount++;
      }
      subtotal += price;
    });

    if (selectedItems.length === 0) {
      selectedServicesEl.innerHTML = '<p class="empty-cart">No services selected</p>';
    } else {
      selectedServicesEl.innerHTML = selectedItems.map(function(item) {
        return '<div class="selected-item"><span class="selected-item-name">' + item.name + '</span><span class="selected-item-price">$' + item.price + '</span></div>';
      }).join('');
    }

    subtotalEl.textContent = '$' + subtotal.toFixed(2);

    let totalDiscountPercent = 0;

    // Multi-service discount (auto-applied)
    if (multi3Disc && serviceCount >= (multi3Disc.min_services || 3)) {
      totalDiscountPercent += multi3Disc.percent;
      multiServiceDiscountEl.style.display = 'flex';
      multiServiceTextEl.textContent = multi3Disc.label;
      multiServiceAmountEl.textContent = '-' + multi3Disc.percent + '%';
    } else if (multi2Disc && serviceCount >= (multi2Disc.min_services || 2)) {
      totalDiscountPercent += multi2Disc.percent;
      multiServiceDiscountEl.style.display = 'flex';
      multiServiceTextEl.textContent = multi2Disc.label;
      multiServiceAmountEl.textContent = '-' + multi2Disc.percent + '%';
    } else {
      multiServiceDiscountEl.style.display = 'none';
    }

    if (cashDiscountEl.checked && cashDisc) totalDiscountPercent += cashDisc.percent;
    if (returnCustomerEl.checked && returnDisc) totalDiscountPercent += returnDisc.percent;

    const savingsAmount = subtotal * (totalDiscountPercent / 100);
    const total = subtotal - savingsAmount;

    if (savingsAmount > 0) {
      savingsLineEl.style.display = 'flex';
      totalSavingsEl.textContent = '-$' + savingsAmount.toFixed(2);
    } else {
      savingsLineEl.style.display = 'none';
    }

    totalEl.textContent = '$' + total.toFixed(2);
  }

  // Book Now button
  document.getElementById('book-now-btn').addEventListener('click', function() {
    const items = [];
    document.querySelectorAll('.calculator-services input[type="checkbox"]:checked').forEach(function(input) {
      const isAddon = input.dataset.category === 'house-addon' || input.dataset.category === 'rv-addon';
      items.push({
        name: input.dataset.name,
        key: input.dataset.key,
        price: parseInt(input.value),
        isAddon: isAddon,
        duration: parseFloat(input.dataset.duration || 1)
      });
    });

    if (items.length === 0) {
      alert('Please select at least one service before booking.');
      return;
    }

    const rawDuration = items.reduce(function(sum, item) { return sum + (item.duration || 0); }, 0);
    const totalDuration = Math.ceil(rawDuration);

    const subtotal = document.getElementById('subtotal').textContent;
    const savings = document.getElementById('savings-line').style.display !== 'none'
      ? document.getElementById('total-savings').textContent : null;
    const total = document.getElementById('total').textContent;

    localStorage.setItem('dg_estimate', JSON.stringify({
      items: items,
      subtotal: subtotal,
      savings: savings,
      total: total,
      totalDuration: totalDuration
    }));

    window.location.href = '/contact';
  });
});
