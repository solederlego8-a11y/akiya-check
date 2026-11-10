// 注文ボタンの振り分け＋FormSubmit（AJAX）送信。バックエンド無しで動く。
(function () {
  const cfg = window.AKIYA_CONFIG || {};
  const contact = (cfg.CONTACT || []).join('@');
  const endpoint = 'https://formsubmit.co/ajax/' + contact;
  const nativeEndpoint = 'https://formsubmit.co/' + contact;

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

  function showDone(form) {
    form.querySelectorAll('input,textarea,select,button,label,.err').forEach((el) => { el.style.display = 'none'; });
    const ok = form.querySelector('.ok');
    if (ok) ok.style.display = 'block';
  }

  // AJAX が通らない環境（拡張機能・アプリ内ブラウザ等）向けに、通常の POST で送り直す。
  // FormSubmit が _next の URL（?sent=1）に戻すので、戻ったら完了表示にする。
  function nativeSubmit(form, data) {
    const back = location.href.split('#')[0].split('?')[0] + '?sent=1' + (form.id ? '#' + form.id : '');
    const f = document.createElement('form');
    f.method = 'POST'; f.action = nativeEndpoint; f.style.display = 'none';
    Object.entries(Object.assign({}, data, { _next: back })).forEach(([k, v]) => {
      const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i);
    });
    document.body.appendChild(f);
    f.submit();
  }

  document.querySelectorAll('a.contact-mail').forEach((a) => { a.href = 'mailto:' + contact; a.textContent = contact; });

  const sent = new URLSearchParams(location.search).get('sent') === '1';

  document.querySelectorAll('form.f[data-formsubmit]').forEach((form) => {
    if (sent) showDone(form);
    let failures = 0;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const err = form.querySelector('.err');
      const data = Object.fromEntries(new FormData(form).entries());
      if (data._honey) return; // bot
      delete data._honey;
      data._subject = form.dataset.subject || 'Akiya Check';
      data._captcha = 'false';
      data._template = 'table';
      if (data.email) data._replyto = data.email;
      // 自動返信（チェックリスト配布など）。フォームの data-autoresponse に本文を持つ
      if (form.dataset.autoresponse) data._autoresponse = form.dataset.autoresponse;

      // 1回失敗した後の再送は通常の POST で行う
      if (failures > 0) { btn.disabled = true; btn.textContent = 'Sending…'; nativeSubmit(form, data); return; }

      btn.disabled = true; btn.textContent = 'Sending…';
      if (err) err.style.display = 'none';
      try {
        const ctrl = 'AbortController' in window ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 15000) : null;
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data), signal: ctrl ? ctrl.signal : undefined });
        if (timer) clearTimeout(timer);
        const body = await res.json().catch(() => ({}));
        // FormSubmit は失敗時も 200 で {"success":"false"} を返すことがある
        if (!res.ok || String(body.success) !== 'true') throw new Error(body.message || ('HTTP ' + res.status));
        showDone(form);
      } catch (ex) {
        failures++;
        btn.disabled = false; btn.textContent = form.dataset.retry || 'Try again';
        if (err) err.style.display = 'block';
        else alert('Sorry, sending failed. Please email us directly: ' + contact);
        if (window.console) console.warn('Form send failed:', ex);
      }
    });
  });
})();
