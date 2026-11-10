/* 공통 화면 부품 — 버튼, 카드, 창(모달), 대화창, 알림
   글자는 항상 textContent로 넣는다 (이미지에 글자를 넣지 않는 원칙, prd.md 1절) */
window.R01 = window.R01 || {};
(function (R) {
  const U = (R.ui = {});

  /* h('div', {class:'x', onClick: fn}, '글자', 자식요소...) */
  U.h = function (tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v === false || v == null) return;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat(Infinity).forEach((k) => {
      if (k == null || k === false) return;
      el.append(k instanceof Node ? k : document.createTextNode(String(k)));
    });
    return el;
  };
  const h = U.h;

  U.button = (label, onClick, opts = {}) =>
    h('button', { type: 'button', class: 'btn' + (opts.primary ? ' primary' : '') + (opts.small ? ' small' : ''),
      disabled: !!opts.disabled, onClick }, label);

  /* 자료 카드. state: '' | 'selected' | 'tried'(회색) | 'locked' */
  U.card = (title, opts = {}) =>
    h('div', { class: 'card ' + (opts.state || ''), role: opts.onClick ? 'button' : null,
      tabindex: opts.onClick && opts.state !== 'tried' ? '0' : null,
      onClick: opts.onClick && opts.state !== 'tried' ? opts.onClick : null,
      onKeydown: opts.onClick ? (e) => { if (e.key === 'Enter' && opts.state !== 'tried') opts.onClick(); } : null },
    opts.tag ? h('span', { class: 'card-tag' }, opts.tag) : null,
    h('span', { class: 'card-title' }, title),
    opts.sub ? h('span', { class: 'card-sub' }, opts.sub) : null);

  /* 창(모달). lines: 문단 목록, buttons: [{label, primary, onClick}] — onClick 뒤에 창은 닫힌다 */
  U.modal = function ({ lines, buttons }) {
    const back = h('div', { class: 'modal-back', role: 'dialog', 'aria-modal': 'true' });
    const close = () => back.remove();
    const box = h('div', { class: 'modal' },
      (lines || []).map((t) => h('p', null, t)),
      h('div', { class: 'actions' }, buttons.map((b) =>
        U.button(b.label, () => { close(); if (b.onClick) b.onClick(); }, { primary: b.primary }))));
    back.append(box);
    document.body.append(back);
    const first = box.querySelector('.btn.primary') || box.querySelector('.btn');
    if (first) first.focus();
    close.box = box;
    return close;
  };

  /* 대화창: 줄 목록을 클릭(또는 Enter)으로 넘김. lines: [[말하는 사람, 대사], ...]
     opts.portrait: 초상 이미지 경로 (래미 등), opts.onLine(i): 줄이 보일 때마다 (기록용) */
  U.dialogue = function (lines, onDone, opts = {}) {
    let i = 0;
    const who = h('div', { class: 'dlg-who' });
    const say = h('div', { class: 'dlg-text' });
    const hint = h('div', { class: 'dlg-next mono' }, '▶ 클릭');
    const face = opts.portrait ? h('div', { class: 'dlg-face', style: 'background-image:url(' + opts.portrait + ')' }) : null;
    const box = h('div', { class: 'dlg' + (face ? ' has-face' : ''), tabindex: '0', role: 'button' },
      face, h('div', { class: 'dlg-body' }, who, say, hint));
    function show() {
      who.textContent = lines[i][0]; say.textContent = lines[i][1];
      if (opts.onLine) opts.onLine(i);
    }
    function next() {
      i += 1;
      if (i < lines.length) show(); else { box.remove(); if (onDone) onDone(); }
    }
    box.addEventListener('click', next);
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
    show();
    document.body.append(box);
    box.focus();
  };

  let toastTimer;
  U.toast = function (msg) {
    let el = document.getElementById('toast');
    if (!el) { el = h('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.append(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  };
})(window.R01);
