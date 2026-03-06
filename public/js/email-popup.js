(function() {
  'use strict';

  var STORAGE_KEY = 'dgEmailPopupDone';

  if (localStorage.getItem(STORAGE_KEY)) return;

  function buildPopup() {
    var overlay = document.createElement('div');
    overlay.id = 'dg-email-popup-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.55)',
      'z-index:9999', 'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'box-sizing:border-box'
    ].join(';');

    var isMobile = window.innerWidth < 480;

    var card = document.createElement('div');
    card.style.cssText = [
      'background:#fff', 'border-radius:14px',
      'padding:' + (isMobile ? '24px 20px 20px' : '32px 28px 28px'),
      'max-width:420px', 'width:100%', 'position:relative',
      'box-shadow:0 8px 40px rgba(0,0,0,0.22)', 'text-align:center',
      'font-family:inherit'
    ].join(';');

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = [
      'position:absolute', 'top:12px', 'right:16px',
      'background:none', 'border:none', 'font-size:1.6em',
      'cursor:pointer', 'color:#888', 'line-height:1', 'padding:0'
    ].join(';');
    closeBtn.onclick = dismiss;

    var logo = document.createElement('div');
    logo.style.cssText = 'font-size:2.2em; margin-bottom:8px;';
    logo.textContent = '💧';

    var heading = document.createElement('h2');
    heading.style.cssText = 'margin:0 0 8px; color:#1a1a2e; font-size:1.35em;';
    heading.textContent = 'Get 10% Off Your First Service!';

    var sub = document.createElement('p');
    sub.style.cssText = 'color:#555; margin:0 0 20px; font-size:0.95em; line-height:1.5;';
    sub.textContent = 'Join the D&G Soft Wash email list and we\'ll take 10% off your first booking.';

    var form = document.createElement('form');
    form.id = 'dg-email-popup-form';
    form.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

    function makeInput(type, placeholder, required) {
      var inp = document.createElement('input');
      inp.type = type;
      inp.placeholder = placeholder;
      inp.required = !!required;
      inp.style.cssText = [
        'padding:10px 14px', 'border:1.5px solid #ddd', 'border-radius:8px',
        'font-size:16px', 'outline:none', 'transition:border-color 0.2s',
        'box-sizing:border-box', 'width:100%'
      ].join(';');
      inp.onfocus = function() { inp.style.borderColor = '#2d6a4f'; };
      inp.onblur  = function() { inp.style.borderColor = '#ddd'; };
      return inp;
    }

    var nameInp  = makeInput('text',  'Your name',  true);
    var emailInp = makeInput('email', 'Your email', true);

    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Claim My 10% Off';
    submitBtn.style.cssText = [
      'background:#2d6a4f', 'color:#fff', 'border:none',
      'border-radius:8px', 'padding:14px', 'font-size:1em',
      'font-weight:600', 'cursor:pointer', 'transition:background 0.2s',
      'touch-action:manipulation', '-webkit-tap-highlight-color:transparent'
    ].join(';');
    submitBtn.onmouseover = function() { submitBtn.style.background = '#1b4332'; };
    submitBtn.onmouseout  = function() { submitBtn.style.background = '#2d6a4f'; };

    var noThanks = document.createElement('button');
    noThanks.type = 'button';
    noThanks.textContent = 'No thanks';
    noThanks.style.cssText = [
      'background:none', 'border:none', 'color:#aaa',
      'font-size:0.85em', 'cursor:pointer', 'padding:10px',
      'touch-action:manipulation', '-webkit-tap-highlight-color:transparent'
    ].join(';');
    noThanks.onclick = dismiss;

    var errMsg = document.createElement('p');
    errMsg.style.cssText = 'color:#dc2626; font-size:0.85em; margin:0; min-height:1.2em;';

    form.appendChild(nameInp);
    form.appendChild(emailInp);
    form.appendChild(submitBtn);
    form.appendChild(noThanks);
    form.appendChild(errMsg);

    form.onsubmit = function(e) {
      e.preventDefault();
      errMsg.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing up…';

      fetch('/api/email-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInp.value.trim(), email: emailInp.value.trim() })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          localStorage.setItem(STORAGE_KEY, '1');
          form.innerHTML = '';
          var msg = document.createElement('p');
          msg.style.cssText = 'color:#2d6a4f; font-size:1.05em; font-weight:600; margin:16px 0 0;';
          msg.textContent = "You're in! 10% off your first service.";
          form.appendChild(msg);
          setTimeout(function() { removePopup(overlay); }, 3000);
        } else {
          errMsg.textContent = data.error || 'Something went wrong. Please try again.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Claim My 10% Off';
        }
      })
      .catch(function() {
        errMsg.textContent = 'Network error. Please try again.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Claim My 10% Off';
      });
    };

    card.appendChild(closeBtn);
    card.appendChild(logo);
    card.appendChild(heading);
    card.appendChild(sub);
    card.appendChild(form);
    overlay.appendChild(card);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) dismiss();
    });

    return overlay;
  }

  function removePopup(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  var popupEl = null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    removePopup(popupEl);
  }

  function showPopup() {
    if (localStorage.getItem(STORAGE_KEY)) return;
    popupEl = buildPopup();
    document.body.appendChild(popupEl);
  }

  setTimeout(showPopup, 5000);
})();
