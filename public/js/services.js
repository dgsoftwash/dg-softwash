// Update service prices on the Services page from /api/pricing
fetch('/api/pricing')
  .then(function(res) { return res.json(); })
  .then(function(data) {
    var priceMap = {};
    data.services.forEach(function(s) { priceMap[s.key] = s.price; });
    document.querySelectorAll('[data-price-key]').forEach(function(el) {
      var price = priceMap[el.dataset.priceKey];
      if (price !== undefined) el.textContent = '$' + price;
    });
  })
  .catch(function() {}); // silently fail — hardcoded fallback prices stay visible
