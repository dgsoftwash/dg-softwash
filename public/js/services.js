// D&G Soft Wash — Services page: dynamic content from /api/services-content

(function() {
  var PHONE = '8048321953';
  var PHONE_DISPLAY = '(804) 832-1953';

  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderListItem(item) {
    if (item.call) {
      return '<li>' + esc(item.text) + ': <strong><a href="tel:' + PHONE + '">Call for Estimate: ' + PHONE_DISPLAY + '</a></strong></li>';
    }
    if (item.price_key) {
      var priceSpan = '<span data-price-key="' + esc(item.price_key) + '">...</span>';
      var prefix = item.prefix ? esc(item.prefix) : '';
      var priceContent = prefix + priceSpan;
      if (item.strong) {
        return '<li>' + esc(item.text) + ': <strong>' + priceContent + '</strong></li>';
      }
      return '<li>' + esc(item.text) + ': ' + priceContent + '</li>';
    }
    return '<li>' + esc(item.text) + '</li>';
  }

  function renderCard(card) {
    var descHtml = '';
    if (card.description) {
      card.description.split('\n\n').forEach(function(para) {
        if (para.trim()) descHtml += '<p>' + esc(para.trim()) + '</p>';
      });
    }

    var imgHtml = card.image_url
      ? '<img src="' + esc(card.image_url) + '" alt="' + esc(card.title) + '" class="service-inline-img" loading="lazy">'
      : '';

    var listHtml = '';
    if (card.list_items && card.list_items.length) {
      listHtml = '<ul>' + card.list_items.map(renderListItem).join('') + '</ul>';
    }

    return '<div class="service-detail-card">' +
      '<div class="service-detail-content">' +
        '<h2>' + esc(card.title) + '</h2>' +
        imgHtml +
        descHtml +
        listHtml +
      '</div>' +
    '</div>';
  }

  var container = document.getElementById('services-cards-container');

  fetch('/api/services-content')
    .then(function(res) { return res.json(); })
    .then(function(cards) {
      if (!cards.length) {
        container.innerHTML = '<p style="color:#666; padding:20px 0;">No services found.</p>';
        return;
      }
      container.innerHTML = cards.map(renderCard).join('');

      // Update dynamic prices from pricing API
      return fetch('/api/pricing')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var priceMap = {};
          data.services.forEach(function(s) { priceMap[s.key] = s.price; });
          document.querySelectorAll('[data-price-key]').forEach(function(el) {
            var price = priceMap[el.dataset.priceKey];
            if (price !== undefined) el.textContent = '$' + price;
          });
        });
    })
    .catch(function() {
      container.innerHTML = '<p style="color:#dc2626; padding:20px 0;">Failed to load services. Please refresh the page.</p>';
    });
})();
