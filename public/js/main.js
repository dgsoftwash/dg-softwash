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
  var menuOpen = false;

  function openMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.classList.add('active');
      navLinks.style.display = 'flex';
      menuOpen = true;
    }
  }

  function closeMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.classList.remove('active');
      navLinks.style.display = '';
      menuOpen = false;
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');

    if (hamburger) {
      hamburger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (menuOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      // Also handle touch for Safari iOS
      hamburger.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (menuOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      // Close menu when a link is clicked
      if (navLinks) {
        navLinks.querySelectorAll('a').forEach(function(link) {
          link.addEventListener('click', function() {
            closeMenu();
          });
        });
      }

      // Close menu when tapping outside
      document.addEventListener('click', function(e) {
        if (menuOpen && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
          closeMenu();
        }
      });
    }
  });

  // Reset on page show (back-forward cache)
  window.addEventListener('pageshow', function() {
    closeMenu();
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
          formResponse.className = 'form-response success';
          formResponse.textContent = result.message;
          if (result.day2Notice) {
            const notice = document.createElement('p');
            notice.style.cssText = 'margin-top:8px; font-weight:bold;';
            notice.textContent = result.day2Notice;
            formResponse.appendChild(notice);
          }
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
