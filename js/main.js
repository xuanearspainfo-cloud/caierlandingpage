(function () {
  'use strict';

  function initStickyHeader() {
    var header = document.getElementById('sticky-header');
    if (!header) return;

    var THRESHOLD = 60;
    var ticking = false;

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          header.classList.toggle('header--scrolled', window.scrollY > THRESHOLD);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  function initScrollAnimations() {
    var elements = document.querySelectorAll('[data-animate]');
    if (!elements.length) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        // Stagger siblings
        var parent = entry.target.parentElement;
        var siblings = parent ? parent.querySelectorAll('[data-animate]') : [];
        var idx = Array.prototype.indexOf.call(siblings, entry.target);
        entry.target.style.transitionDelay = (idx * 90) + 'ms';
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = link.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        var header = document.getElementById('sticky-header');
        var headerH = header ? header.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  function initBookingForm() {
    var form = document.getElementById('bookingForm');
    if (!form) return;

    var rules = {
      name: {
        required: true,
        minLength: 2,
        error: '请输入您的姓名（至少2个字符）'
      },
      phone: {
        required: true,
        pattern: /^[0-9+\-\s]{8,15}$/,
        error: '请输入有效的手机号码（例如 012-3253380）'
      }
    };

    function getField(id) { return document.getElementById(id); }

    function showError(id, msg) {
      var field = getField(id);
      var errorEl = field && field.nextElementSibling;
      if (field) field.classList.add('is-invalid');
      if (errorEl && errorEl.classList.contains('form-error')) errorEl.textContent = msg;
    }

    function clearError(id) {
      var field = getField(id);
      var errorEl = field && field.nextElementSibling;
      if (field) field.classList.remove('is-invalid');
      if (errorEl && errorEl.classList.contains('form-error')) errorEl.textContent = '';
    }

    function validate() {
      var valid = true;
      Object.keys(rules).forEach(function (id) {
        var rule = rules[id];
        var field = getField(id);
        var val = field ? field.value.trim() : '';
        clearError(id);
        if (rule.required && !val) { showError(id, rule.error); valid = false; return; }
        if (rule.minLength && val.length < rule.minLength) { showError(id, rule.error); valid = false; return; }
        if (rule.pattern && !rule.pattern.test(val)) { showError(id, rule.error); valid = false; return; }
      });
      return valid;
    }

    // Real-time clear on input
    Object.keys(rules).forEach(function (id) {
      var field = getField(id);
      if (field) {
        field.addEventListener('input', function () { clearError(id); });
        field.addEventListener('blur', function () {
          var val = field.value.trim();
          var rule = rules[id];
          if (rule.required && !val) showError(id, rule.error);
          else if (rule.minLength && val.length < rule.minLength) showError(id, rule.error);
          else if (rule.pattern && val && !rule.pattern.test(val)) showError(id, rule.error);
        });
      }
    });

    // Preserve UTM params in hidden fields
    (function () {
      var params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      var search = new URLSearchParams(window.location.search);
      params.forEach(function (key) {
        var val = search.get(key);
        if (!val) return;
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = val;
        form.appendChild(input);
      });
    })();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      var btn = document.getElementById('submitBtn');
      var btnText = btn && btn.querySelector('.btn__text');
      var btnLoading = btn && btn.querySelector('.btn__loading');

      if (btn) btn.disabled = true;
      if (btnText) btnText.hidden = true;
      if (btnLoading) btnLoading.hidden = false;

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            form.innerHTML = [
              '<div class="booking-form__success">',
              '  <div class="success-icon">✓</div>',
              '  <h3>预约提交成功！Booking Submitted!</h3>',
              '  <p>我们会尽快通过WhatsApp联系您确认预约时间。<br>We will contact you via WhatsApp to confirm your booking.</p>',
              '  <a href="https://wa.me/60123253380?text=%E6%82%A8%E5%A5%BD%EF%BC%8C%E6%88%91%E5%88%9A%E5%88%9A%E6%8F%90%E4%BA%A4%E4%BA%86%E9%A2%84%E7%BA%A6%E8%A1%A8%E6%A0%BC%EF%BC%8C%E8%AF%B7%E7%A1%AE%E8%AE%A4" class="btn btn--whatsapp" target="_blank" rel="noopener">',
              '    WhatsApp 跟进确认',
              '  </a>',
              '</div>'
            ].join('');
          } else {
            throw new Error('Server error');
          }
        })
        .catch(function () {
          if (btn) btn.disabled = false;
          if (btnText) btnText.hidden = false;
          if (btnLoading) btnLoading.hidden = true;
          showError('phone', '提交失败，请直接WhatsApp或电话联系我们：012-325 3380');
        });
    });
  }

  function initFabBehavior() {
    var fab = document.getElementById('whatsapp-fab');
    var booking = document.getElementById('booking');
    if (!fab || !booking) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        fab.classList.toggle('whatsapp-fab--hidden', entry.isIntersecting);
      });
    }, { threshold: 0.3 });

    observer.observe(booking);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStickyHeader();
    initScrollAnimations();
    initSmoothScroll();
    initBookingForm();
    initFabBehavior();
  });
})();
