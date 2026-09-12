// 注文ボタンの振り分け＋FormSubmit（AJAX）送信。バックエンド無しで動く。
(function () {
  const cfg = window.AKIYA_CONFIG || {};
  const endpoint = 'https://formsubmit.co/ajax/' + (cfg.CONTACT || []).join('@');

  // Stripe リンクがあれば差し替え、無ければ #order フォームへ
  document.querySelectorAll('[data-buy]').forEach((a) => {
    const link = a.dataset.buy === 'compare' ? cfg.STRIPE_COMPARE : cfg.STRIPE_SINGLE;
    if (link) { a.href = link; a.target = '_blank'; a.rel = 'noopener'; }
    else {
      a.href = '#order';
      a.addEventListener('click', () => {
        const sel = document.querySelector('#order select[name="product"]');
        if (sel) sel.value = a.dataset.buy === 'compare' ? 'Compare 3 ($99)' : 'Single Report ($49)';
      });
    }
  });

  document.querySelectorAll('form.f[data-formsubmit]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const ok = form.querySelector('.ok');
      const data = Object.fromEntries(new FormData(form).entries());
      data._subject = form.dataset.subject || 'Akiya Check';
      data._captcha = 'false';
      data._template = 'table';
      if (data.email) data._replyto = data.email;
      // 自動返信（チェックリスト配布など）。フォームの data-autoresponse に本文を持つ
      if (form.dataset.autoresponse) data._autoresponse = form.dataset.autoresponse;
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.querySelectorAll('input,textarea,select,button').forEach((el) => { el.style.display = 'none'; });
        form.querySelectorAll('label').forEach((el) => { el.style.display = 'none'; });
        ok.style.display = 'block';
      } catch (err) {
        btn.disabled = false; btn.textContent = form.dataset.retry || 'Try again';
        alert('Sorry, sending failed. Please email us directly: ' + (cfg.CONTACT || []).join('@'));
      }
    });
  });
})();
