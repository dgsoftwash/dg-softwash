// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
});

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
