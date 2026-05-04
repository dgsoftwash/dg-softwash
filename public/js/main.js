// Share Button
document.addEventListener('DOMContentLoaded', function() {
  var shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      var shareData = {
        title: 'D&G Soft Wash',
        text: 'Check out D&G Soft Wash — professional exterior cleaning services!',
        url: 'https://dgsoftwash.com'
      };
      if (navigator.share) {
        navigator.share(shareData).catch(function() {
          // User cancelled or share failed — do nothing
        });
      } else {
        navigator.clipboard.writeText(shareData.url).then(function() {
          shareBtn.textContent = '✓ Link Copied!';
          setTimeout(function() { shareBtn.textContent = '📤 Share Our Site'; }, 2000);
        }).catch(function() {
          // Clipboard failed — fallback alert
          window.prompt('Copy this link:', shareData.url);
        });
      }
    });
  }
});

// Mobile Menu Toggle
(function() {
  function isMenuOpen() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    return hamburger && hamburger.classList.contains('active') && 
           navLinks && navLinks.classList.contains('open');
  }

  function openMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.classList.add('active');
      navLinks.classList.add('open');
    }
  }

  function closeMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    }
  }

  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Use a small delay to ensure other scripts have initialized first
  function initHamburgerMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');

    if (!hamburger || !navLinks) {
      // Elements not ready yet, try again in 100ms
      setTimeout(initHamburgerMenu, 100);
      return;
    }

    // Ensure clean state on page load
    closeMenu();

    if (hamburger) {
      // Single click handler instead of both click and touchend
      hamburger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
      });

      // Close menu when a link is clicked
      if (navLinks) {
        navLinks.querySelectorAll('a').forEach(function(link) {
          link.addEventListener('click', function() {
            closeMenu();
          });
        });
      }

      // Close menu when clicking outside
      // Close menu when clicking outside
      document.addEventListener('click', function(e) {
        if (isMenuOpen() && navLinks && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
          closeMenu();
        }
      });
    }
  }
  
  // Initialize when DOM is ready, with fallback delay
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initHamburgerMenu, 50);
    });
  } else {
    setTimeout(initHamburgerMenu, 50);
  }

  // Reset on page show (back-forward cache)
  window.addEventListener('pageshow', function() {
    closeMenu();
  });

  // Reset on page visibility change (handles iOS app switching)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      closeMenu();
    }
  });
})();

// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contact-form');
  const formResponse = document.getElementById('form-response');

  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          // Redirect to confirmation page if booking details are present
          if (result.bookingRef) {
            const params = new URLSearchParams();
            if (result.bookingRef) params.set('ref', result.bookingRef);
            if (result.customerName) params.set('name', result.customerName);
            if (result.bookingService) params.set('service', result.bookingService);
            if (result.bookingDate) params.set('date', result.bookingDate);
            if (result.bookingTime) params.set('time', result.bookingTime);
            if (result.bookingPrice) params.set('price', result.bookingPrice);
            window.location.href = '/booking-confirmation?' + params.toString();
            return;
          }
          // Plain contact message (no appointment) — show inline
          formResponse.className = 'form-response success';
          formResponse.textContent = result.message;
          contactForm.reset();
        } else {
          formResponse.className = 'form-response error';
          formResponse.textContent = result.message || 'Something went wrong. Please try again.';
        }
      } catch (error) {
        formResponse.className = 'form-response error';
        formResponse.textContent = 'Unable to send message. Please try again later.';
      }
    });
  }

  // Gallery Filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.dataset.filter;

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Filter gallery items
      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
});
