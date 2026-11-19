'use strict';
const B = window.Boram,
  KEY = 'boram-work-v1';
let db;
try {
  db = JSON.parse(localStorage.getItem(KEY));
  if (db?.version !== 1 || !Array.isArray(db.employees)) db = B.seed();
} catch {
  db = B.seed();
}
let session;
try {
  session = JSON.parse(sessionStorage.getItem('boram-session'));
} catch {}
let state = {
  role: session?.role || 'admin',
  employee: session?.employee || 'e1',
  period: B.month(),
  date: B.today(),
  tab: 'conditions',
  view: 'month',
  search: '',
  status: '전체',
  method: '전체',
  employeeFilter: '전체',
  type: '전체',
  from: '',
  to: '',
  noticeType: '전체',
  readFilter: '전체',
  noticeId: null,
};
const icons = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-7.87a4 4 0 0 1 0 7.75',
  calendar:
    'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m2 10h3m4 0h3m-10 4h3',
  clock: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  wallet: 'M20 8V5H4a2 2 0 0 1 0-4h14v4M4 5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16V8zm12 7h4',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-3-5h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  store:
    'M3 10v11h18V10M2 10l2-7h16l2 7M8 21v-8h8v8M2 10c2 2 4 2 5 0 2 2 4 2 5 0 2 2 4 2 5 0 2 2 4 2 5 0',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-9 12a3 3 0 0 0 6 0',
  arrow: 'm9 5 7 7-7 7',
  left: 'm15 5-7 7 7 7',
  plus: 'M12 5v14M5 12h14',
  search: 'M21 21l-5-5m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  download: 'M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5',
  edit: 'm16 3 5 5-12 12H4v-5zM14 5l5 5',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  alert: 'm12 3 10 18H2zM12 9v4m0 3v1',
  shield: 'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6zm-4 10 3 3 5-6',
  file: 'M14 2H5v20h14V7zM14 2v6h5M8 12h8m-8 4h8',
  menu: 'M3 6h18M3 12h18M3 18h18',
  logout: 'M9 3H3v18h6m6-14 5 5-5 5m-8-5h13',
  sun: 'M12 3V1m0 22v-2M3 12H1m22 0h-2M5 5 3 3m18 18-2-2M5 19l-2 2M21 3l-2 2m-2 9a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  qr: 'M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h3v3h3v3h-6z',
  copy: 'M8 8h13v13H8zM16 8V3H3v13h5',
  plane: 'm22 2-7 20-4-9-9-4zM11 13 22 2',
  refresh: 'M3 11a9 9 0 0 1 16-6l2 3m0-6v6h-6M21 13A9 9 0 0 1 5 19l-2-3m0 6v-6h6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
};
const I = (name, cls = '') =>
  `<svg class="${cls}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons.file}"/></svg>`;
const E = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const money = (v) => Number(v || 0).toLocaleString('ko-KR') + '원';
const timeText = (n) => `${Math.floor(n / 60)}시간${n % 60 ? ' ' + (n % 60) + '분' : ''}`;
const dateLabel = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
const emp = (id) => db.employees.find((e) => e.id === id) || db.employees[0];
const current = () => emp(state.employee);
const admin = () => state.role === 'admin';
const statusColor = (s) =>
  ({
    정상: 'green',
    재직: 'green',
    승인: 'green',
    완료: 'green',
    지각: 'orange',
    대기: 'orange',
    '승인 대기': 'orange',
    결근: 'red',
    반려: 'red',
    예정: 'blue',
    OTP: 'blue',
    QR: 'purple',
    'Wi-Fi': 'green',
    휴직: 'orange',
    퇴사: 'red',
    충족: 'green',
  })[s] || '';
const badge = (s, c) => `<span class="badge ${c || statusColor(s)}"><i></i>${E(s)}</span>`;
const av = (e) =>
  `<span class="avatar ${['', 'purple', 'green', 'orange'][db.employees.indexOf(e) % 4] || ''}">${E(e.name.slice(-2))}</span>`;
const person = (e) =>
  `<div class="profile">${av(e)}<div><b>${E(e.name)}</b><div class="row-sub">${E(e.position)} · ${E(e.type)}</div></div></div>`;
const btn = (label, action, arg = '', cls = '', icon = '') =>
  `<button type="button" class="btn ${cls}" data-action="${action}" data-id="${E(arg)}">${icon ? I(icon) : ''}${label}</button>`;
const link = (label, path, cls = '', icon = '') =>
  `<a class="btn ${cls}" href="#/${path}">${icon ? I(icon) : ''}${label}</a>`;
const empty = (text, sub = '등록된 데이터가 여기에 표시됩니다.') =>
  `<div class="empty-state">${I('file')}<h3>${text}</h3><p>${sub}</p></div>`;
const kv = (a, b) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`;
const field = (label, name, value = '', type = 'text', extra = '', full = false) =>
  `<div class="${full ? 'full' : ''}"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${E(value)}" ${extra}></div>`;
const select = (label, name, opts, value) =>
  `<div><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${opts.map((v) => `<option ${v === value ? 'selected' : ''}>${E(v)}</option>`).join('')}</select></div>`;
const area = (label, name, value = '') =>
  `<div class="full"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" maxlength="1000">${E(value)}</textarea></div>`;
function toast(s) {
  const t = document.querySelector('#toast');
  t.textContent = s;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 3500);
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  } catch {
    toast('저장 공간이 부족합니다. 큰 계약서 파일을 삭제한 뒤 다시 시도하세요.');
    return false;
  }
}
function save(message = '저장했어요') {
  const ok = persist();
  render();
  if (ok && message) toast(message);
  return ok;
}
function notify(type, title, body, target = 'home', employee = null) {
  db.notifications.unshift({
    id: B.id(),
    type,
    title,
    body,
    date: B.today(),
    target,
    employee,
    read: false,
  });
  db.audit.unshift({ date: new Date().toISOString(), title, role: state.role });
}
function route() {
  return (location.hash.replace(/^#\/?/, '') || 'home').split('/');
}
function go(p) {
  location.hash = '#/' + p;
  if (route().join('/') === p) render();
}
function closeModal() {
  const old = document.querySelector('#modal-root');
  old.innerHTML = '';
  if (closeModal.stream) closeModal.stream.getTracks().forEach((t) => t.stop());
  closeModal.stream = null;
  closeModal.focus?.focus?.();
}
function modal(title, html, form, wide = false, submit = '저장') {
  closeModal.focus = document.activeElement;
  document.querySelector('#modal-root').innerHTML =
    `<div class="modal-backdrop"><section class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${title}</h2><button class="icon-btn" data-action="close" aria-label="닫기">${I('close')}</button></div>${form ? `<form data-form="${form}"><div class="error" id="form-error"></div>` : ''}${html}${form ? `<div class="modal-footer">${btn('취소', 'close')}<button class="btn primary" type="submit">${submit}</button></div></form>` : ''}</section></div>`;
  setTimeout(() => document.querySelector('.modal input,.modal select,.modal button')?.focus(), 30);
}
function fail(s) {
  let n = document.querySelector('#form-error');
  if (n) n.textContent = s;
  else toast(s);
  return false;
}
function confirmAction(title, body, action, arg) {
  modal(
    title,
    `<p class="modal-message">${body}</p><div class="modal-footer">${btn('취소', 'close')}${btn('확인', action, arg, 'danger')}</div>`,
  );
}
const navAdmin = [
  ['home', 'home', '홈'],
  ['Authen', 'check', '출퇴근 인증'],
  ['employees', 'users', '직원 관리'],
  ['schedule', 'calendar', '근무 일정'],
  ['records', 'clock', '출퇴근 기록'],
  ['payroll', 'wallet', '급여 관리'],
  ['conditions', 'settings', '계정 / 근로조건'],
  ['store', 'store', '사업장 설정'],
  ['notifications', 'bell', '알림'],
  ['roull', 'store', '룰렛'],
];
const navEmployee = [
  ['home', 'home', '홈'],
  ['schedule', 'calendar', '내 근무 일정'],
  ['attendance', 'qr', '출퇴근 인증'],
  ['records', 'clock', '근무기록'],
  ['payroll', 'wallet', '내 급여'],
  ['conditions', 'users', '내 정보'],
  ['leave', 'plane', '휴가'],
  ['notifications', 'bell', '알림'],
];
function shell(html, page) {
  let items = admin() ? navAdmin : navEmployee;
  let notifications = db.notifications.filter(
    (n) => !n.read && (!n.employee || n.employee === state.employee),
  );
  document.querySelector('#app').innerHTML =
    `<aside class="sidebar" id="sidebar"><a href="#/home" class="logo">Boram<span>WORK, BETTER TOGETHER</span></a><div class="nav-label">${admin() ? 'WORKSPACE' : 'MY WORKSPACE'}</div><nav>${items.map(([p, i, t]) => `<a class="nav-item ${page === p ? 'active' : ''}" href="#/${p}">${I(i)}${t}${p === 'notifications' && notifications.length ? `<span class="badge blue">${notifications.length}</span>` : ''}</a>`).join('')}</nav><div class="sidebar-bottom"><span class="demo-label">체험 데이터 · 이 브라우저에 저장</span><button class="role-switch" data-action="role">${I('refresh')}${admin() ? '직원 화면으로 전환' : '관리자 화면으로 전환'}</button><button class="role-switch" data-action="guide">${I('file')}사용 안내 · 소스 코드</button><button class="role-switch" data-action="logout">${I('logout')}로그아웃</button></div></aside><div class="workspace"><header class="topbar"><div class="actions"><button class="icon-btn mobile-menu" data-action="menu" aria-label="메뉴 열기">${I('menu')}</button><span class="store-name">${I('store')} &nbsp;${E(db.store.name)}</span><small>운영 중 ${badge('POP-UP', 'blue')}</small></div><div class="topbar-right"><span class="demo-label">${admin() ? '관리자' : '직원'} 체험</span><a href="#/notifications" class="icon-btn" aria-label="알림">${I('bell')}${notifications.length ? '<i class="dot"></i>' : ''}</a><button class="profile" data-action="role">${admin() ? '<span class="avatar">보람</span>' : av(current())}<div><b>${admin() ? '김보람' : E(current().name)}</b><small>${admin() ? '관리자' : '직원'}</small></div></button></div></header><main class="content">${html}</main></div><nav class="bottom-nav">${(admin() ? navAdmin.slice(0, 4) : [navEmployee[0], navEmployee[1], navEmployee[2], navEmployee[3]]).map(([p, i, t]) => `<a class="${page === p ? 'active' : ''}" href="#/${p}">${I(i)}${t.replace('근무 ', '').replace(' 관리', '').replace('내 ', '')}</a>`).join('')}<button data-action="more">${I('more')}더보기</button></nav>`;
}
function head(title, desc, actions = '', eyebrow = 'WORKSPACE') {
  return `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${desc}</p></div><div class="actions">${actions}</div></div>`;
}
function monthControl() {
  return `<div class="actions">${btn('', 'monthPrev', '', '', 'left')}<input aria-label="조회 월" type="month" value="${state.period}" data-change="period">${btn('', 'monthNext', '', '', 'arrow')}</div>`;
}
function stat(title, value, unit, icon, color = '', note = '') {
  return `<div class="stat ${color}"><div class="stat-icon">${I(icon)}</div><div class="stat-title">${title}</div><strong>${value}<em>${unit}</em></strong><small>${note || '선택 기간 기준'}</small></div>`;
}
function quick() {
  const links = admin()
    ? [
        ['roull', 'store', '룰렛', '상품'],
        ['Authen', 'check', '출퇴근 인증', '간단한 인증'],
        ['employees', 'users', '직원 관리', '함께 일하는 우리 팀'],
        ['schedule', 'calendar', '근무 일정', '빈틈없는 일정 관리'],
        ['records', 'clock', '출퇴근 기록', '매일의 기록을 한눈에'],
        ['payroll', 'wallet', '급여 관리', '꼼꼼한 급여 정산'],
      ]
    : [
        ['attendance', 'qr', '출근 인증', '오늘도 좋은 하루'],
        ['schedule', 'calendar', '내 일정', '다가오는 근무 확인'],
        ['records', 'clock', '근무기록', '나의 근무시간'],
        ['payroll', 'wallet', '내 급여', '이번 달 예상 급여'],
      ];
  return `<div class="quick">${links.map(([p, i, t, d]) => `<a href="#/${p}"><div class="quick-icon">${I(i)}</div><div><b>${t}</b><small>${d}</small></div>${I('arrow')}</a>`).join('')}</div>`;
}
function calendar(personal = false) {
  let year = +state.period.slice(0, 4),
    month = +state.period.slice(5),
    days = new Date(year, month, 0).getDate(),
    offset = new Date(year, month - 1, 1).getDay(),
    cells = '';
  for (let i = 0; i < offset; i++) cells += '<div class="day empty"></div>';
  for (let d = 1; d <= days; d++) {
    let date = state.period + '-' + String(d).padStart(2, '0'),
      ss = db.shifts.filter(
        (s) => s.date === date && (!personal || s.employees.includes(state.employee)),
      ),
      rr = db.records.filter((r) => r.date === date && r.employee === state.employee);
    let content = '';
    if (personal) {
      const status = rr.some((r) => r.status === '결근')
        ? '결근'
        : rr.some((r) => r.status === '지각')
          ? '지각'
          : rr.length
            ? rr[0].status
            : ss.length
              ? '예정'
              : '근무 없음';
      content = status === '근무 없음' ? '' : badge(status);
    } else if (ss.length) {
      let missing = ss.reduce((a, s) => a + B.coverage(s).missing, 0);
      content =
        badge(missing ? `${missing}명 부족` : '인원 충족', missing ? 'red' : 'green') +
        `<small>${ss.length}개 일정</small>`;
    }
    cells += `<button class="day ${date === state.date ? 'selected' : ''} ${date === B.today() ? 'today' : ''}" data-action="day" data-id="${date}" aria-label="${date} 일정"><span class="day-num">${d}</span>${content}</button>`;
  }
  return `<div class="calendar">${['일', '월', '화', '수', '목', '금', '토'].map((d, i) => `<div class="weekday ${i === 0 ? 'sun' : ''}">${d}</div>`).join('')}${cells}</div><div class="legend">${(personal
    ? [
        ['정상', '#16a378'],
        ['지각', '#e6972a'],
        ['결근', '#e45563'],
        ['예정', '#2463eb'],
        ['근무 없음', '#bdc6d4'],
      ]
    : [
        ['인원 충족', '#16a378'],
        ['인원 부족', '#e45563'],
      ]
  )
    .map(([n, c]) => `<span style="--c:${c}">${n}</span>`)
    .join('')}</div>`;
}
function home() {
  const today = B.today(),
    todayShifts = db.shifts.filter((s) => s.date === today),
    todayRecords = db.records.filter((r) => r.date === today),
    people = new Set(todayShifts.flatMap((s) => s.employees)).size,
    shortages = db.shifts
      .filter((s) => s.date >= today && B.coverage(s).missing > 0)
      .sort((a, b) => a.date.localeCompare(b.date)),
    me = current();
  if (!admin()) {
    let ss = todayShifts.filter((s) => s.employees.includes(me.id)),
      next = db.shifts
        .filter((s) => s.date > today && s.employees.includes(me.id))
        .sort((a, b) => a.date.localeCompare(b.date))[0];
    let pay = B.payroll(db, me, state.period);
    return (
      head('내 하루를 한눈에', '오늘의 일정과 근무 현황을 확인하세요.', monthControl(), 'MY WORK') +
      `<div class="hero-greeting"><div><div class="eyebrow">HAVE A GOOD DAY</div><h2>안녕하세요, ${E(me.name)}님 👋</h2><p>오늘도 함께 만드는 좋은 하루. ${E(db.store.name)}</p></div>${I('sun')}</div><div class="grid2 equal"><section class="card"><div class="card-head"><h2>오늘의 근무</h2>${badge(todayRecords.some((r) => r.employee === me.id && r.in) ? '출근 완료' : '예정', 'blue')}</div><small>${dateLabel(today)}</small><div class="shift-time">${ss.length ? ss.map((s) => `${s.start} — ${s.end}`).join('<br>') : '오늘은 쉬어가는 날'}</div><p class="muted">${ss.length ? '휴게 ' + ss[0].break + '분 · ' + E(ss[0].note) : '등록된 근무 일정이 없습니다.'}</p><div class="section-gap">${link('출퇴근 인증', 'attendance', 'primary', 'qr')}</div></section><section class="card"><div class="card-head"><h2>다음 근무</h2>${I('calendar')}</div>${next ? kv('근무일', dateLabel(next.date)) + kv('시간', next.start + ' — ' + next.end) : empty('다음 근무가 없어요')}<div class="section-gap">${kv('이번 달 근무', timeText(pay.minutes))}${kv('예상 급여', money(pay.total))}</div></section></div>${quick()}<section class="card section-gap"><div class="card-head"><h2>내 소식</h2>${link('전체 보기', 'notifications', 'small')}</div>${noticePreview()}</section>`
    );
  }
  let normal = todayRecords.filter((r) => r.status === '정상').length,
    late = todayRecords.filter((r) => r.status === '지각').length;
  return (
    head(
      '오늘도, 보람찬 하루',
      '매장의 오늘을 확인하고, 팀의 내일을 준비하세요.',
      `<span class="btn">${I('calendar')}${dateLabel(today)}</span>`,
      'OVERVIEW',
    ) +
    `<div class="stats">${stat('오늘 근무', people, '명', 'users', '', `등록 직원 ${db.employees.filter((e) => e.status === '재직').length}명`)}${stat('출근 완료', normal + late, '명', 'check', 'green', '오늘 출근 기록 기준')}${stat('지각', late, '명', 'clock', 'orange', '오늘 지각 기록 기준')}${stat(
      '다가오는 결원',
      shortages.reduce((a, s) => a + B.coverage(s).missing, 0),
      '명',
      'alert',
      'red',
      `${shortages.length}개 시간대 확인 필요`,
    )}</div>${shortages.length ? `<div class="banner">${I('alert')}<div><b>${dateLabel(shortages[0].date)} ${shortages[0].start}–${shortages[0].end}, ${B.coverage(shortages[0]).missing}명이 부족해요</b><p>필요 ${shortages[0].required}명 · 배정 ${shortages[0].employees.length}명. 일정을 확인하고 팀원을 추가해 주세요.</p></div>${btn('인원 배정', 'shift', shortages[0].id, 'danger', 'arrow')}</div>` : ''}<div class="grid2"><section class="card"><div class="card-head"><div><h2>이번 주 근무 현황</h2><small>함께하는 일정을 미리 확인하세요</small></div>${link('전체 일정', 'schedule', 'small')}</div>${weekOverview()}<div class="section-gap"><div class="card-head"><h3>오늘의 근무자</h3><small>${people}명 배정</small></div>${
      [...new Set(todayShifts.flatMap((s) => s.employees))]
        .slice(0, 4)
        .map((id) => {
          let e = emp(id),
            r = todayRecords.find((r) => r.employee === id);
          return `<div class="list-item">${av(e)}<div><a class="name-link" href="#/employee/${id}">${E(e.name)}</a><p>${E(e.position)} · 09:00 – 18:00</p></div>${badge(r?.status || '예정')}</div>`;
        })
        .join('') || empty('오늘 배정된 직원이 없어요')
    }</div></section><section class="card"><div class="card-head"><h2>주요 알림</h2>${link('전체 보기', 'notifications', 'small')}</div>${noticePreview()}<div class="note">${I('shield')} 브라우저 체험 모드<br>변경 사항은 현재 브라우저에 저장됩니다.</div></section></div><div class="card-head"><h2>빠른 기능 바로가기</h2><small>자주 사용하는 기능을 더 빠르게</small></div>${quick()}`
  );
}
function weekOverview() {
  let start = new Date(B.today() + 'T12:00:00');
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  let html = '';
  for (let i = 0; i < 7; i++) {
    let d = new Date(start);
    d.setDate(d.getDate() + i);
    let date = B.iso(d),
      ss = db.shifts.filter((s) => s.date === date),
      n = new Set(ss.flatMap((s) => s.employees)).size;
    html += `<div class="week-cell ${date === B.today() ? 'today' : ''}"><small>${d.getMonth() + 1}/${d.getDate()} ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}</small><b>${n}<small>명</small></b><span>${ss.some((s) => B.coverage(s).missing) ? '확인 필요' : '✓ 충족'}</span></div>`;
  }
  return `<div class="week-strip">${html}</div>`;
}
function noticePreview() {
  return (
    db.notifications
      .filter((n) => !n.employee || admin() || n.employee === state.employee)
      .slice(0, 4)
      .map(
        (n) =>
          `<button class="list-item" style="text-align:left;width:100%" data-action="notice" data-id="${n.id}"><span class="list-icon ${n.type === '인원 부족' ? 'red' : ''}">${I(n.type === '인원 부족' ? 'alert' : 'bell')}</span><div><b>${E(n.title)}</b><p>${n.date} · ${E(n.type)}</p></div>${!n.read ? '<span class="badge blue">NEW</span>' : ''}</button>`,
      )
      .join('') || empty('새로운 알림이 없어요')
  );
}
function roull() {
  return head('상품 돌림판', '사장님이 쏜다 쏜다 쏜다');
}
function Authen() {
  return `<div class="attendance-page">
        <div class="page-header">
            <h4>WORKSPACE</h4>
            <h1>출퇴근 인증 화면입니다.</h1>
            <p>오늘의 보람을 기록하세요.</p><label for="attendance-admin-key">관리자 발급 키</label><input id="attendance-admin-key" type="password" autocomplete="off"><p id="attendance-issue-status" role="status"></p>
        </div>

        <div class="attendance-container">

            <!-- QR 키오스크 -->
            <div class="auth-card">
                <div class="card-header">
                    <div>
                        <h3>✅ QR 키오스크</h3>
                        <p>매장에 비치된 QR로 간편하게 출퇴근 인증</p>
                    </div>
                </div>

                <div class="qr-content">

                    <div id="qrcode"></div><input id="qr-link" aria-label="QR 인증 링크" readonly hidden>

                    <div class="qr-info">
                        <p>유효기간 : <span id="qr-date">-</span></p>
                        <p>재발급 횟수 : <span id="qr-count">0</span>회</p>

                        <button onclick="refreshQR()">
                            ⟳ QR 재발급
                        </button>
                    </div>

                </div>
            </div>

            <!-- OTP 인증 -->
            <div class="auth-card">
                <div class="card-header">
                    <div>
                        <h3>🔢 현장 출퇴근 OTP 코드</h3>
                        <p>현장에서 사용하는 출퇴근 전용 코드입니다.</p>
                    </div>
                </div>

                <div class="otp-content">

                    <div class="otp-number">
                        <h1 id="otp-code">—</h1>

                        <button onclick="copyOTP()">
                            📋
                        </button>
                    </div>

                    <div class="otp-info">
                        <p>갱신 횟수 : <span id="otp-count">0</span>회</p>
                        <p>유효기간 : <span id="otp-expire">-</span></p>

                        <button onclick="refreshOTP()">
                            ⟳ 새 코드로 갱신
                        </button>
                    </div>

                </div>

                <p class="info-text">
                    ⓘ 현장 출퇴근 OTP와 로그인 OTP는 별도의 코드입니다.
                </p>
            </div>

            <!-- Wi-Fi / IP -->
            <div class="auth-card">
                <div class="card-header">
                    <div>
                        <h3>📶 Wi-Fi / IP 허용 목록</h3>
                        <p>허용 네트워크 설정을 체험할 수 있습니다.</p>
                    </div>
                </div>

                <div class="network-actions">
                    <button onclick="addNetwork()">
                        + 허용 네트워크 추가
                    </button>
                </div>

                <div id="network-list"></div>

            </div>

        </div>
    </div>
    `;
}
async function attendanceRequest(action, method, details, adminKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminKey) headers['X-Boram-Admin-Key'] = adminKey;
  let response, result;
  try {
    response = await fetch('/api/attendance/' + action, {
      method: 'POST',
      headers,
      body: JSON.stringify({ store: db.store.code, method, ...details }),
    });
    result = await response.json();
  } catch {
    throw new Error('Boram 인증 서버에 연결할 수 없습니다. Flask 서버 주소로 접속해 주세요.');
  }
  if (!response.ok) throw new Error(result.error || '서버에서 인증 요청을 처리하지 못했습니다.');
  return result;
}

async function issueAttendance(method) {
  const key = document.getElementById('attendance-admin-key');
  const status = document.getElementById('attendance-issue-status');
  if (!key || key.readOnly) return;
  if (!key.value) {
    status.textContent = '관리자 발급 키를 입력해 주세요.';
    key.focus();
    return;
  }
  key.readOnly = true;
  status.textContent = '코드를 발급하고 있습니다.';
  try {
    const issued = await attendanceRequest(
      'issue',
      method,
      { seconds: db.store.otpSeconds },
      key.value,
    );
    if (!document.contains(key)) return;
    const expires = new Date(issued.expiresAt * 1000).toLocaleString('ko-KR');
    if (method === 'OTP') {
      document.getElementById('otp-code').textContent = issued.code;
      document.getElementById('otp-count').textContent = issued.count;
      document.getElementById('otp-expire').textContent = expires;
    } else {
      const qrElement = document.getElementById('qrcode');
      const link = document.getElementById('qr-link');
      const url = new URL('/', location.href);
      url.hash = '/attendance/' + issued.code;
      link.value = url.href;
      link.hidden = false;
      qrElement.innerHTML = '';
      if (typeof QRCode === 'function') {
        new QRCode(qrElement, { text: link.value, width: 160, height: 160 });
      } else {
        qrElement.textContent = 'QR 이미지를 불러올 수 없습니다. 아래 인증 링크를 공유해 주세요.';
      }
      document.getElementById('qr-date').textContent = expires;
      document.getElementById('qr-count').textContent = issued.count;
    }
    status.textContent = method + ' 코드가 발급됐습니다.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    key.readOnly = false;
  }
}

function refreshOTP() {
  return issueAttendance('OTP');
}

function refreshQR() {
  return issueAttendance('QR');
}

async function copyOTP() {
  const code = document.getElementById('otp-code');
  if (!/^[0-9]{6}$/.test(code.textContent)) return toast('OTP를 먼저 발급해 주세요.');
  try {
    await navigator.clipboard.writeText(code.textContent);
    toast('OTP 코드를 복사했어요.');
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(code);
    selection.removeAllRanges();
    selection.addRange(range);
    toast('선택된 OTP 코드를 복사해 주세요.');
  }
}

let pendingAttendanceQr = '';

function qrToken(value) {
  const match = value.trim().match(/(?:^|#\/attendance\/)(BORAM-[A-Za-z0-9_-]{32})$/);
  return match?.[1] || '';
}

function openAttendanceQR(code = '') {
  modal(
    'QR 출퇴근 인증',
    `<p class="modal-message">QR을 스캔하거나 인증 링크를 붙여 넣어 주세요.</p><video id="qr-video" muted playsinline style="width:100%;max-height:220px;border-radius:10px;background:#eef3fb;display:none"></video>${btn('카메라 켜기', 'camera', '', 'soft', 'qr')}<div class="section-gap">${field('QR 인증 링크 또는 코드', 'code', code, 'text', 'required')}</div>`,
    'qr',
    false,
    'QR 코드 확인',
  );
}
let networks = [
  {
    name: '사무실 유선IP',
    ip: '203.236.122.10',
  },
];

function renderNetworks() {
  const list = document.getElementById('network-list');

  list.innerHTML = networks
    .map(
      (network, index) => `
        <div class="network-item">

            <span>
                📶 ${network.name}
            </span>

            <span>
                ${network.ip}
            </span>

            <button onclick="deleteNetwork(${index})">
                삭제
            </button>

        </div>
    `,
    )
    .join('');
}

function addNetwork() {
  const name = prompt('네트워크 이름을 입력하세요.');

  if (!name) return;

  const ip = prompt('허용할 IP 주소를 입력하세요.');

  if (!ip) return;

  networks.push({
    name: name,
    ip: ip,
  });

  renderNetworks();
}

function deleteNetwork(index) {
  if (confirm('이 네트워크를 삭제하시겠습니까?')) {
    networks.splice(index, 1);

    renderNetworks();
  }
}
function employees() {
  let list = db.employees.filter(
    (e) =>
      (e.name + e.phone).includes(state.search) &&
      (state.status === '전체' || e.status === state.status) &&
      (state.type === '전체' || e.type === state.type),
  );
  return (
    head(
      '직원 관리',
      '함께 일하는 팀원들의 정보를 관리하세요.',
      btn('직원 추가', 'employeeAdd', '', 'primary', 'plus'),
      'TEAM',
    ) +
    `<section class="card"><div class="filters"><div class="search">${I('search')}<input placeholder="이름 또는 연락처 검색" aria-label="직원 검색" value="${E(state.search)}" data-input="search"></div>${filterSelect('type', ['전체', '주중', '주말', '파트타임'], '근무형태')}${filterSelect('status', ['전체', '재직', '휴직', '퇴사'], '상태')}<span class="btn">${E(db.store.name)}</span></div><div class="table-wrap desktop-table"><table><thead><tr><th>직원</th><th>연락처</th><th>근무형태</th><th>상태</th><th>시급</th><th>관리</th></tr></thead><tbody>${list.map((e) => `<tr><td><a href="#/employee/${e.id}">${person(e)}</a></td><td data-label="연락처">${E(e.phone)}</td><td>${E(e.type)}</td><td>${badge(e.status)}</td><td data-label="시급">${money(e.wage)}</td><td><div class="actions">${link('근무현황', 'employee/' + e.id, 'small soft', 'calendar')}${link('설정', 'conditions/' + e.id, 'small', 'settings')}${link('급여', 'payroll/' + e.id, 'small purple', 'wallet')}</div></td></tr>`).join('')}</tbody></table></div>${!list.length ? empty('검색 결과가 없어요', '검색어나 필터를 변경해 보세요.') : ''}<div class="table-foot"><span>총 ${list.length}명의 직원</span><span>이름을 누르면 근무 캘린더로 이동합니다.</span></div></section>`
  );
}
function filterSelect(key, opts, label) {
  return `<select data-change="${key}" aria-label="${label}">${opts.map((v) => `<option value="${v}" ${state[key] === v ? 'selected' : ''}>${v === '전체' ? label + ' 전체' : v}</option>`).join('')}</select>`;
}
function employeeHeader() {
  let e = current();
  return `<section class="card profile-card">${av(e)}<div><h2>${E(e.name)} ${badge(e.status)}</h2><p>${E(e.position)} · ${E(e.phone)} · 입사 ${e.join}</p></div><div class="actions">${admin() ? btn('정보 수정', 'employeeEdit', e.id, 'small', 'edit') : ''}${link('근무현황', 'employee/' + e.id, 'small soft')}${link('급여', 'payroll/' + e.id, 'small purple')}</div></section>`;
}
function employeePage() {
  const e = current(),
    rr = db.records.filter((r) => r.employee === e.id && r.date.startsWith(state.period));
  return (
    head(
      E(e.name) + '님의 근무현황',
      '매일의 근무를 색상 캘린더로 확인하세요.',
      monthControl(),
      'ATTENDANCE',
    ) +
    employeeHeader() +
    `<div class="grid2"><section class="card"><div class="card-head"><h2>${state.period.replace('-', '년 ')}월</h2>${btn('오늘', 'today', '', 'small')}</div>${calendar(true)}</section><section class="card">${dayDetail(true)}</section></div><div class="stats">${stat('근무일수', new Set(rr.filter((r) => r.in).map((r) => r.date)).size, '일', 'calendar')}${stat('총 근무시간', Math.floor(rr.reduce((a, r) => a + B.workMinutes(r), 0) / 60), '시간', 'clock', 'green')}${stat('지각', rr.filter((r) => r.status === '지각').length, '회', 'alert', 'orange')}${stat('결근', rr.filter((r) => r.status === '결근').length, '회', 'close', 'red')}</div>`
  );
}
function dayDetail(personal) {
  let ss = db.shifts.filter(
    (s) => s.date === state.date && (!personal || s.employees.includes(state.employee)),
  );
  let rr = db.records.filter((r) => r.date === state.date && r.employee === state.employee);
  return `<div class="detail-title"><div class="eyebrow">SELECTED DAY</div><h2>${dateLabel(state.date)}</h2></div>${personal ? (rr.length ? rr.map((r) => `<div class="section-gap">${badge(r.status)}${kv('예정 근무', r.start + ' — ' + r.end)}${kv('출근', r.in || '미기록')}${kv('퇴근', r.out || '미기록')}${kv('휴게시간', r.break + '분')}${kv('실제 근무', timeText(B.workMinutes(r)))}${kv('인증방식', badge(r.method))}<p class="note">${E(r.note || '등록된 특이사항이 없습니다.')}</p><div class="actions">${admin() ? btn('결근 변경', 'absence', r.id, 'small danger') + btn('수정', 'record', r.id, 'small soft', 'edit') + btn('삭제', 'recordDelete', r.id, 'small danger', 'trash') : btn('수정 요청', 'request', r.id, 'soft', 'edit')}</div></div>`).join('') : ss.length ? ss.map((s) => `${badge('예정')}${kv('예정 근무', s.start + ' — ' + s.end)}${kv('휴게시간', s.break + '분')}<div class="section-gap">${admin() ? btn('근무 기록 등록', 'recordNew', s.id, 'soft', 'plus') : link('출퇴근 인증', 'attendance', 'primary', 'qr')}</div>`).join('') : empty('근무가 없는 날이에요')) : ss.map((s) => `<div class="section-gap">${badge(B.coverage(s).missing ? B.coverage(s).missing + '명 부족' : '충족', B.coverage(s).missing ? 'red' : 'green')}${kv('근무시간', s.start + ' — ' + s.end)}${kv('필요 / 배정', s.required + '명 / ' + s.employees.length + '명')}<div class="actions section-gap">${btn('인원 배정', 'shift', s.id, 'primary small', 'users')}${btn('삭제', 'shiftDelete', s.id, 'danger small', 'trash')}</div></div>`).join('') || empty('등록된 일정이 없어요')} ${!personal && admin() ? `<div class="section-gap">${btn('근무 추가', 'shift', '', 'soft', 'plus')}</div>` : ''}`;
}
function schedule() {
  if (!admin()) return employeePage();
  let list = db.shifts
    .filter((s) => s.date.startsWith(state.period))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  if (state.view === 'week') {
    let d = new Date(state.date + 'T12:00:00'),
      last = new Date(d);
    last.setDate(d.getDate() + 6);
    list = list.filter((s) => s.date >= state.date && s.date <= B.iso(last));
  }
  return (
    head(
      '근무 일정',
      '필요한 인원을 배정하고, 빈자리를 미리 채워 보세요.',
      btn('근무 추가', 'shift', '', 'primary', 'plus'),
      'SCHEDULE',
    ) +
    `<section class="card"><div class="card-head">${monthControl()}<div class="segmented">${[
      ['month', '월'],
      ['week', '주'],
      ['list', '목록'],
    ]
      .map(
        ([v, t]) =>
          `<button class="${state.view === v ? 'active' : ''}" data-action="view" data-id="${v}">${t}</button>`,
      )
      .join(
        '',
      )}</div></div><div class="filters"><span class="badge blue">운영 ${db.store.start} ~ ${db.store.end}</span>${state.view === 'week' ? `<input type="date" value="${state.date}" data-change="date" aria-label="주간 시작일">` : ''}</div>${state.view === 'month' ? `<div class="grid2" style="margin:0"><div>${calendar()}</div><div>${dayDetail(false)}</div></div>` : list.map((s) => `<div class="schedule-row"><div class="date-tile"><small>${s.date.slice(5, 7)}월</small><b>${+s.date.slice(8)}</b></div><div class="cover"><b>${s.start} — ${s.end}</b><p>${s.employees.map((id) => E(emp(id).name)).join(', ') || '배정 없음'}</p><p>필요 ${s.required}명 · 배정 ${s.employees.length}명 · 휴게 ${s.break}분</p></div>${badge(B.coverage(s).missing ? B.coverage(s).missing + '명 부족' : '충족', B.coverage(s).missing ? 'red' : 'green')}<div class="actions">${btn('배정 / 수정', 'shift', s.id, 'small soft', 'edit')}${btn('삭제', 'shiftDelete', s.id, 'small danger')}</div></div>`).join('') || empty('등록된 근무 일정이 없어요')}</section>`
  );
}
function records() {
  let rr = db.records
    .filter(
      (r) =>
        (admin() || r.employee === state.employee) &&
        r.date.startsWith(state.period) &&
        emp(r.employee).name.includes(state.search) &&
        (state.status === '전체' ||
          (state.status === '퇴근' ? !!r.out : r.status === state.status)) &&
        (state.method === '전체' || r.method === state.method) &&
        (!state.from || r.date >= state.from) &&
        (!state.to || r.date <= state.to),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  let requests = db.requests.filter((r) => admin() || r.employee === state.employee);
  return (
    head(
      admin() ? '출퇴근 기록' : '내 근무기록',
      '정확한 기록에서 시작하는 편안한 근무 관리.',
      monthControl(),
      'RECORDS',
    ) +
    `<div class="stats">${stat('조회 기록', rr.length, '건', 'users')}${stat('정상 출근', rr.filter((r) => r.status === '정상').length, '건', 'check', 'green')}${stat('지각 / 결근', rr.filter((r) => ['지각', '결근'].includes(r.status)).length, '건', 'alert', 'orange')}${stat('OTP 인증', rr.length ? Math.round((rr.filter((r) => r.method === 'OTP').length / rr.length) * 100) : 0, '%', 'shield', 'purple')}</div><section class="card"><div class="filters">${admin() ? `<div class="search">${I('search')}<input value="${E(state.search)}" data-input="search" placeholder="직원명 검색" aria-label="직원명"></div>` : ''}<input type="date" data-change="from" value="${state.from}" aria-label="조회 시작일"><input type="date" data-change="to" value="${state.to}" aria-label="조회 종료일">${filterSelect('status', ['전체', '정상', '지각', '결근', '예정', '퇴근'], '상태')}${filterSelect('method', ['전체', 'OTP', 'QR', 'Wi-Fi', '수동'], '인증방식')}${btn('조회', 'query', '', 'primary', 'search')}${btn('초기화', 'resetFilters')}</div><div class="table-wrap desktop-table"><table><thead><tr><th>직원 / 날짜</th><th>출근</th><th>퇴근</th><th>휴게</th><th>근무시간</th><th>인증</th><th>상태</th><th>관리</th></tr></thead><tbody>${rr.map((r) => `<tr><td><b>${E(emp(r.employee).name)}</b><div class="row-sub">${r.date} · ${E(r.location)}</div></td><td data-label="출근">${r.in || '—'}</td><td data-label="퇴근">${r.out || '—'}</td><td data-label="휴게">${r.break}분</td><td>${timeText(B.workMinutes(r))}</td><td>${badge(r.method)}</td><td>${badge(r.status)}</td><td><div class="actions">${btn('상세', 'recordDetail', r.id, 'small')}${admin() ? btn('수정', 'record', r.id, 'small soft') + btn('결근 변경', 'absence', r.id, 'small danger') : btn('수정 요청', 'request', r.id, 'small soft')}</div></td></tr>`).join('')}</tbody></table></div>${!rr.length ? empty('조회된 기록이 없어요', '조회 기간과 필터를 확인해 주세요.') : ''}</section><section class="card section-gap"><div class="card-head"><h2>근무시간 수정 요청</h2>${badge(requests.filter((r) => r.status === '대기').length + '건 대기', 'orange')}</div>${requests.map((q) => `<div class="list-item"><span class="list-icon">${I('edit')}</span><div><b>${E(emp(q.employee).name)} · ${q.date}</b><p>${q.in} ~ ${q.out} / 휴게 ${q.break}분 · ${E(q.reason)}</p>${q.response ? `<p>처리 사유: ${E(q.response)}</p>` : ''}</div>${badge(q.status)}${admin() && q.status === '대기' ? `<div class="actions">${btn('승인', 'requestApprove', q.id, 'small soft')}${btn('반려', 'requestReject', q.id, 'small danger')}</div>` : ''}</div>`).join('') || empty('수정 요청이 없어요')}</section>`
  );
}
function employeeSelect() {
  return `<select data-change="employee" aria-label="직원 선택">${db.employees.map((e) => `<option value="${e.id}" ${state.employee === e.id ? 'selected' : ''}>${E(e.name)} · ${E(e.position)}</option>`).join('')}</select>`;
}
function payrollPage() {
  let e = current(),
    p = B.payroll(db, e, state.period);
  return (
    head(
      admin() ? '급여 관리' : '내 급여',
      '근무기록을 바탕으로 이번 달의 보람을 확인하세요.',
      `${admin() ? employeeSelect() : ''}${monthControl()}`,
      'PAYROLL',
    ) +
    `<h1 class="print-only">Boram · ${E(e.name)} ${state.period} 급여 내역</h1><div class="grid2 equal"><div class="balance"><small>${E(e.name)}님의 ${state.period.slice(5)}월 ${p.confirmed ? '확정' : '예상'} 급여 · 세전</small><strong>${money(p.total)}</strong>${badge(p.confirmed ? '확정 완료' : '정산 전', 'blue')}<p style="margin-top:13px;font-size:11px;color:#d9e7ff">총 ${timeText(p.minutes)} · 시급 ${money(e.wage)}</p></div><section class="card"><h2>급여 구성</h2>${kv('기본급', money(p.base))}${kv('주휴수당', money(p.weekly))}${kv('야간수당', money(p.night))}${kv('기타수당', money(p.other))}</section></div><div class="banner info no-print">${I('file')}<div><b>근무시간 × 시급 + 입력한 수당</b><p>수당은 관리자가 확인 후 입력하는 체험용 계산입니다. 공제·세금·법적 지급요건은 자동 계산하지 않습니다.</p></div></div><section class="card"><div class="card-head"><div><h2>일별 근무 내역</h2><small>${E(e.name)} · ${state.period}</small></div><div class="actions no-print">${admin() ? btn('수당 설정', 'allowances', e.id, 'small', 'edit') + btn(p.confirmed ? '확정 취소' : '급여 확정', 'payConfirm', e.id, 'primary small', 'check') : ''}${btn('CSV 내보내기', 'csv', '', 'small', 'download')}${btn('PDF / 인쇄', 'print', '', 'small', 'file')}</div></div><div class="table-wrap desktop-table"><table><thead><tr><th>날짜</th><th>출근 / 퇴근</th><th>휴게</th><th>근무시간</th><th>시급</th><th>기본급</th><th>상태</th></tr></thead><tbody>${p.rows.map((r) => `<tr><td>${r.date}</td><td>${r.in || '—'} / ${r.out || '—'}</td><td>${r.break}분</td><td>${timeText(B.workMinutes(r))}</td><td>${money(e.wage)}</td><td><b>${money(Math.round((B.workMinutes(r) / 60) * e.wage))}</b></td><td>${badge(r.status)}</td></tr>`).join('')}</tbody></table></div>${!p.rows.length ? empty('아직 근무 내역이 없어요') : ''}<div class="table-foot"><span>월 전체 근무 분을 합산한 뒤 기본급을 반올림합니다.</span><b>총 ${money(p.total)}</b></div></section>`
  );
}
const conditionTabs = [
  ['conditions', '근로조건'],
  ['fixed', '고정 스케줄'],
  ['insurance', '4대보험'],
  ['leave', '휴가'],
  ['contracts', '근로계약서'],
  ['account', '계정 정보'],
];
function conditions() {
  let e = current();
  return (
    head(
      admin() ? '계정 / 근로조건' : '내 정보',
      '근로조건과 나의 정보를 한곳에서 확인하세요.',
      admin() ? employeeSelect() : '',
      'PEOPLE',
    ) +
    employeeHeader() +
    `<div class="tabs">${conditionTabs.map(([v, t]) => `<button class="tab ${state.tab === v ? 'active' : ''}" data-action="tab" data-id="${v}">${t}</button>`).join('')}</div>` +
    conditionContent(e)
  );
}
function conditionContent(e) {
  const c = e.conditions || {};
  switch (state.tab) {
    case 'conditions':
      return `<div class="grid2"><section class="card"><div class="card-head"><h2>근로조건</h2>${admin() ? btn('조건 수정', 'conditionEdit', e.id, 'small soft', 'edit') : badge('조회 전용')}</div><div class="condition-grid">${[
        ['수습기간', c.probation || '없음', 'users'],
        ['무급 휴게시간', (c.break || 0) + '분', 'clock'],
        ['주휴수당', c.weekly || '조건 확인', 'wallet'],
        ['야간근로수당', c.night || '조건 확인', 'sun'],
      ]
        .map(
          ([t, v, i]) =>
            `<div class="condition"><h3>${I(i)} &nbsp; ${t}</h3><strong>${E(v)}</strong><p class="field-note">${t.includes('수당') ? '적용 여부와 금액은 관리자 확인' : ''}</p></div>`,
        )
        .join(
          '',
        )}</div></section><section class="card"><h2>계약 정보</h2>${kv('기본 시급', money(e.wage))}${kv('근무형태', E(e.type))}${kv('근무 매장', E(db.store.name))}${kv('계약 시작일', E(c.start || e.join))}${kv('계약 종료일', E(c.end || '미정'))}${kv('상태', badge(e.status))}</section></div>`;
    case 'fixed':
      return `<section class="card"><div class="card-head"><h2>고정 근무 스케줄</h2><div class="actions">${admin() ? btn('스케줄 추가', 'fixedEdit', '', 'soft', 'plus') + btn('이달 일정에 적용', 'fixedApply', e.id, 'primary', 'calendar') : ''}</div></div><div class="note">고정 스케줄을 저장한 뒤 ‘이달 일정에 적용’을 누르면 선택 월의 같은 날짜·시간 일정에 배정합니다. 이미 배정된 일정은 중복 생성하지 않습니다.</div>${e.fixed.map((f, i) => `<div class="list-item"><span class="avatar">${['일', '월', '화', '수', '목', '금', '토'][f.day]}</span><div><b>${f.start} — ${f.end}</b><p>휴게 ${f.break}분 · ${timeText(B.duration(f.start, f.end, f.break))}</p></div>${admin() ? btn('수정', 'fixedEdit', i, 'small soft') + btn('삭제', 'fixedDelete', i, 'small danger') : ''}</div>`).join('') || empty('고정 스케줄이 없어요')}</section>`;
    case 'insurance':
      return `<section class="card"><div class="card-head"><h2>4대보험 가입 정보</h2>${admin() ? btn('가입 정보 수정', 'insurance', e.id, 'soft', 'edit') : badge('조회 전용')}</div><div class="condition-grid">${e.insurance.map((x) => `<div class="condition"><h3>${I('shield')} ${x.name}</h3><strong>${x.joined ? '가입' : '미가입'}</strong><p class="field-note">가입일 ${x.date || '—'}</p></div>`).join('')}</div><p class="note">입력된 가입 현황을 표시합니다. 실제 보험기관과 연동되지 않습니다.</p></section>`;
    case 'leave':
      return leavePage(true);
    case 'contracts':
      return `<section class="card"><div class="card-head"><h2>근로계약서</h2>${admin() ? btn('계약서 업로드', 'contractUpload', e.id, 'primary', 'plus') : ''}</div>${e.contracts.map((c) => `<div class="list-item"><span class="list-icon">${I('file')}</span><div><b>${E(c.name)}</b><p>등록 ${c.date} · 계약 ${E(c.start)} ~ ${E(c.end)}</p></div>${badge('완료')}<div class="actions">${btn('미리보기', 'contractView', c.id, 'small soft')}${btn('다운로드', 'contractDownload', c.id, 'small', 'download')}${admin() ? btn('삭제', 'contractDelete', c.id, 'small danger') : ''}</div></div>`).join('') || empty('등록된 계약서가 없어요', 'PDF 또는 이미지 파일을 업로드할 수 있어요.')}</section>`;
    case 'account':
      return `<section class="card"><div class="card-head"><h2>계정 정보</h2>${btn('정보 수정', 'accountEdit', e.id, 'soft', 'edit')}</div>${kv('아이디', E(e.login))}${kv('이름', E(e.name))}${kv('전화번호', E(e.phone))}${kv('이메일', E(e.email))}${kv('계정 상태', badge(e.status))}<div class="actions section-gap">${btn('비밀번호 변경', 'password', e.id)}${admin() ? btn(e.status === '퇴사' ? '계정 활성화' : '계정 비활성화', 'deactivate', e.id, 'danger') : ''}</div><div class="note">체험 모드에서는 실제 비밀번호를 저장하거나 변경하지 않습니다. 계정 비활성화는 직원 체험 선택과 근무 배정 목록에 반영됩니다.</div></section>`;
  }
}
function leavePage(inside = false) {
  let e = current(),
    items = db.leaves.filter((l) => l.employee === e.id),
    used = items.filter((l) => l.status === '승인').reduce((a, l) => a + Number(l.days), 0);
  return (
    (inside
      ? ''
      : head('휴가', '잠깐의 쉼도, 보람 있게.', admin() ? employeeSelect() : '', 'TIME OFF')) +
    `<div class="stats" style="grid-template-columns:repeat(3,1fr)">${stat('부여', e.leaveGranted, '일', 'plane')}${stat('사용', used, '일', 'check', 'green')}${stat('잔여', Math.max(0, e.leaveGranted - used), '일', 'calendar', 'purple')}</div><section class="card"><div class="card-head"><h2>휴가 신청 내역</h2><div class="actions">${admin() ? btn('휴가 부여', 'leaveGrant', e.id, 'soft', 'plus') : ''}${btn('휴가 신청', 'leaveApply', e.id, 'primary', 'plane')}</div></div>${items.map((l) => `<div class="list-item"><span class="list-icon">${I('plane')}</span><div><b>${l.type} · ${l.date} · ${l.days}일</b><p>${E(l.reason)} · 신청 ${l.created}</p>${l.response ? `<p>${E(l.response)}</p>` : ''}</div>${badge(l.status)}${admin() && l.status === '대기' ? `<div class="actions">${btn('승인', 'leaveApprove', l.id, 'small soft')}${btn('반려', 'leaveReject', l.id, 'small danger')}</div>` : ''}</div>`).join('') || empty('휴가 신청 내역이 없어요')}</section>`
  );
}
function storePage() {
  let s = db.store;
  return (
    head(
      '사업장 설정',
      '우리 매장에 맞게 근무 환경을 설정하세요.',
      btn('인증 상세 설정', 'authSettings', '', 'soft', 'shield'),
      'SETTINGS',
    ) +
    `<form data-form="store"><div class="grid2"><section class="card"><div class="card-head"><h2>기본 정보</h2>${badge('POP-UP', 'blue')}</div><div class="form-grid">${field('사업장명', 'name', s.name, 'text', 'required')}${field('대표자', 'owner', s.owner)}${field('사업자등록번호', 'business', s.business)}${field('전화번호', 'phone', s.phone)}${field('이메일', 'email', s.email, 'email')}${field('주소', 'address', s.address, 'text', '', true)}${field('운영 시작일', 'start', s.start, 'date', 'required')}${field('운영 종료일', 'end', s.end, 'date', 'required')}${field('영업 시작', 'open', s.open, 'time', 'required')}${field('영업 종료', 'close', s.close, 'time', 'required')}${field('공휴일 / 휴무일', 'holidays', s.holidays)}${field('지점 / 매장 목록', 'branches', s.branches)}${area('근무시간 정책', 'policy', s.policy)}</div></section><div><section class="card"><h2>사업장 연결 코드</h2><div class="code-box">${E(s.code)}</div><p class="muted">직원 가입 시 입력하는 연결 코드예요.</p><div class="section-gap">${btn('코드 복사', 'copy', s.code, 'soft', 'copy')}</div></section><section class="card section-gap"><h2>출퇴근 인증</h2><p class="note">OTP와 QR은 서버에서 검증합니다. GPS·네트워크 설정은 체험용입니다.</p>${['OTP', 'QR', 'GPS', 'Wi-Fi', 'IP'].map((m) => `<label class="check"><input type="checkbox" name="methods" value="${m}" ${s.methods.includes(m) ? 'checked' : ''}>${m} 인증</label>`).join('')}</section></div></div><div class="actions"><button class="btn primary" type="submit">설정 저장</button>${btn('체험 데이터 초기화', 'resetDemo', '', 'danger')}</div></form>`
  );
}
function notifications() {
  let nn = db.notifications.filter(
    (n) =>
      (admin() || !n.employee || n.employee === state.employee) &&
      (state.noticeType === '전체' || n.type === state.noticeType) &&
      (state.readFilter === '전체' || n.read === (state.readFilter === '읽음')) &&
      (n.title + n.body).includes(state.search),
  );
  let n = nn.find((n) => n.id === state.noticeId) || nn[0];
  return (
    head(
      '알림',
      '팀의 중요한 소식을 놓치지 마세요.',
      btn('모두 읽음', 'readAll', '', 'soft', 'check'),
      'INBOX',
    ) +
    `<div class="tabs">${['전체', '인원 부족', '지각', '결근', '근무 일정', '급여', '시스템'].map((t) => `<button class="tab ${state.noticeType === t ? 'active' : ''}" data-action="noticeType" data-id="${t}">${t}</button>`).join('')}</div><div class="filters"><div class="search">${I('search')}<input placeholder="알림 검색" aria-label="알림 검색" data-input="search" value="${E(state.search)}"></div>${filterSelect('readFilter', ['전체', '읽음', '읽지 않음'], '읽음 상태')}</div><div class="grid2 equal"><section class="card">${nn.map((n) => `<button style="width:100%;text-align:left" class="notification ${n.read ? '' : 'unread'} ${state.noticeId === n.id ? 'selected' : ''}" data-action="noticeSelect" data-id="${n.id}">${badge(n.type, 'blue')}<h3 style="margin:12px 0 7px">${E(n.title)}</h3><small>${n.date}</small></button>`).join('') || empty('알림이 없어요')}</section><section class="card">${n ? `${badge(n.type, 'blue')}<h2 style="margin:20px 0">${E(n.title)}</h2><p>${E(n.body)}</p><p class="note">${n.date}</p><div class="actions section-gap">${btn('읽음으로 표시', 'read', n.id, 'soft', 'check')}${link('관련 화면으로 이동', n.target, 'primary', 'arrow')}</div>` : empty('확인할 알림을 선택하세요')}</section></div>`
  );
}
function attendance() {
  const ss = db.shifts.filter((s) => s.date === B.today() && s.employees.includes(state.employee)),
    open = db.records.find(
      (r) => r.employee === state.employee && r.in && !r.out && r.status !== '결근',
    );
  let allDone =
    ss.length &&
    ss.every((s) =>
      db.records.some((r) => r.shiftId === s.id && r.employee === state.employee && r.out),
    );
  return (
    head(
      '출퇴근 인증',
      '오늘의 보람을 기록하세요.',
      `<span class="btn">${dateLabel(B.today())}</span>`,
      'CHECK IN',
    ) +
    `<div class="grid2 equal"><section class="card"><div class="card-head"><h2>${open ? '퇴근 인증' : '출근 인증'}</h2>${badge(open ? '근무 중' : allDone ? '오늘 근무 완료' : '출근 전', open ? 'green' : 'blue')}</div>${ss.length ? ss.map((s) => kv('배정 시간', s.start + ' — ' + s.end)).join('') : empty('오늘 배정된 근무가 없어요', '관리자에게 근무 배정을 요청해 주세요.')}<form data-form="attendance"><div class="error" id="form-error"></div><label for="otp">현장 인증번호</label><input id="otp" class="otp-input" name="otp" maxlength="6" pattern="[0-9]{6}" inputmode="numeric" placeholder="000000" required autocomplete="one-time-code"><div class="note">관리자 화면에 표시된 6자리 OTP를 입력해 주세요.</div><div class="actions"><button class="btn primary" type="submit" ${(!ss.length && !open) || allDone ? 'disabled' : ''}>${I('check')}${open ? '퇴근 인증하기' : '출근 인증하기'}</button>${btn('QR 인증', 'qr', '', 'soft', 'qr')}</div></form></section><section class="card"><h2>오늘의 기록</h2>${
      db.records
        .filter((r) => r.employee === state.employee && r.date === B.today())
        .map(
          (r) =>
            `<div class="section-gap">${badge(r.status)}${kv('출근', r.in || '미기록')}${kv('퇴근', r.out || '근무 중')}${kv('휴게시간', r.break + '분')}${kv('실제 근무시간', r.out ? timeText(B.workMinutes(r)) : '퇴근 후 계산')}${kv('인증', badge(r.method))}</div>`,
        )
        .join('') || empty('아직 출근하지 않았어요')
    }<div class="note">로그인 인증번호와 현장 출퇴근 인증번호는 다른 용도입니다. 인증 코드는 서버에서 확인합니다.</div></section></div>`
  );
}
function authPage() {
  let [p] = route();
  let signup = p === 'signup';
  document.querySelector('#app').innerHTML =
    `<div class="auth-page"><section class="auth-brand"><div class="logo">Boram<span>WORK, BETTER TOGETHER</span></div><h1>함께 일하는 오늘,<br>더 보람 있게.</h1><p>작은 팝업의 큰 가능성.<br>일정부터 출퇴근, 급여까지 한곳에서 관리하세요.</p><div class="auth-chips"><span>빈틈없는 근무 배정</span><span>간편한 출퇴근</span><span>투명한 근무기록</span></div></section><section class="auth-form"><div class="auth-box"><h2>${signup ? 'Boram 시작하기' : '반가워요, 다시 만나요'}</h2><p>${signup ? '역할을 선택하고 필요한 정보를 입력해 주세요.' : '우리 팀의 보람찬 하루를 시작해 보세요.'}</p><div class="tabs"><button class="tab ${admin() ? 'active' : ''}" data-action="authRole" data-id="admin">관리자</button><button class="tab ${!admin() ? 'active' : ''}" data-action="authRole" data-id="employee">직원</button></div><form data-form="${signup ? 'signup' : 'login'}"><div class="error" id="form-error"></div><div class="form-grid">${field('아이디', 'login', signup ? '' : admin() ? 'admin' : 'staff1', 'text', 'required autocomplete="username"')}${field('비밀번호', 'password', '', 'password', 'required minlength="4" autocomplete="current-password" placeholder="체험용 임의 비밀번호 4자 이상"')}${signup ? field('비밀번호 확인', 'confirm', '', 'password', 'required minlength="4"') + field('이름', 'name', '', 'text', 'required') + field('연락처', 'phone', '', 'tel', 'required') + (admin() ? field('사업장명', 'storeName', '', 'text', 'required') + field('사업자등록번호', 'business', '') + field('주소', 'address', '') : '') : ''}</div>${!signup ? '<label class="check"><input type="checkbox" name="remember">아이디 기억하기</label>' : ''}<button class="btn primary" type="submit">${signup ? '가입하고 계속하기' : '로그인'} ${I('arrow')}</button></form>${link(signup ? '이미 계정이 있어요 · 로그인' : '처음이신가요? 회원가입', signup ? 'login' : 'signup', 'soft')}<div class="auth-demo"><b>브라우저 체험 버전</b><br>관리자 아이디 admin / 직원 아이디 staff1<br>비밀번호는 임의의 4자 이상 입력하세요. 실제 비밀번호는 입력하지 마세요.<br>로그인 OTP는 130958입니다. 실제 계정 보안 인증이 아닙니다.</div>${btn('빠르게 체험하기', 'demo', '', '', 'arrow')}</div></section></div>`;
}
function render() {
  let [p, id] = route();
  if (p === 'attendance' && id && qrToken(id)) {
    pendingAttendanceQr = id;
    p = 'attendance';
    id = '';
    history.replaceState(null, '', '#/attendance');
  }
  if (['login', 'signup'].includes(p) || !session) {
    authPage();
    return;
  }
  if (!admin() && !db.employees.some((e) => e.id === state.employee && e.status !== '퇴사')) {
    session = null;
    sessionStorage.removeItem('boram-session');
    authPage();
    return;
  }
  if (id && db.employees.some((e) => e.id === id) && admin()) state.employee = id;
  if (pendingAttendanceQr && !admin()) {
    const code = pendingAttendanceQr;
    pendingAttendanceQr = '';
    history.replaceState(null, '', '#/attendance');
    shell(attendance(), 'attendance');
    openAttendanceQR(code);
    return;
  }
  const restricted = ['employees', 'store', 'Authen'];
  if (!admin() && restricted.includes(p)) {
    go('home');
    return;
  }
  if (!admin() && id && id !== state.employee) {
    go('home');
    return;
  }
  let html;
  switch (p) {
    case 'Authen':
      html = Authen();
      break;
    case 'roull':
      html = roull();
      break;
    case 'employees':
      html = employees();
      break;
    case 'employee':
      html = employeePage();
      break;
    case 'schedule':
      html = schedule();
      break;
    case 'records':
      html = records();
      break;
    case 'payroll':
      html = payrollPage();
      break;
    case 'conditions':
      html = conditions();
      break;
    case 'leave':
      html = leavePage();
      break;
    case 'store':
      html = storePage();
      break;
    case 'notifications':
      html = notifications();
      break;
    case 'attendance':
      html = attendance();
      break;
    default:
      p = 'home';
      html = home();
  }
  shell(html, p);
}
function openEmployee(id) {
  let e = id
    ? emp(id)
    : {
        name: '',
        phone: '',
        email: '',
        position: '스태프',
        type: '주중',
        status: '재직',
        join: B.today(),
        wage: 12000,
        login: '',
      };
  modal(
    id ? '직원 정보 수정' : '새 직원 추가',
    `<input type="hidden" name="id" value="${id || ''}"><div class="form-grid">${field('이름', 'name', e.name, 'text', 'required maxlength="30"')}${field('연락처', 'phone', e.phone, 'tel', 'required')}${field('이메일', 'email', e.email, 'email')}${field('로그인 아이디', 'login', e.login, 'text', 'required pattern="[A-Za-z0-9_-]+"')}${select('직책', 'type', ['스태프', '알바'], e.type)}${select('근무형태', 'type', ['주중', '주말', '파트타임'], e.type)}${select('상태', 'status', ['재직', '휴직', '퇴사'], e.status)}${field('입사일', 'join', e.join, 'date', 'required')}${field('기본 시급', 'wage', e.wage, 'number', 'required min="0" max="1000000" step="1"')}</div>`,
    'employee',
  );
}
function openShift(id) {
  let s = db.shifts.find((s) => s.id === id) || {
    id: '',
    date: state.date,
    start: '09:00',
    end: '18:00',
    break: 60,
    required: 4,
    employees: [],
    note: '',
  };
  modal(
    '근무 일정 · 직원 배정',
    `<input type="hidden" name="id" value="${s.id}"><div class="form-grid">${field('근무일', 'date', s.date, 'date', 'required')}${field('필요 인원', 'required', s.required, 'number', 'required min="1" max="1000"')}${field('시작 시간', 'start', s.start, 'time', 'required')}${field('종료 시간', 'end', s.end, 'time', 'required')}${field('휴게시간 (분)', 'break', s.break, 'number', 'required min="0" max="1439"')}${field('근무 메모', 'note', s.note)}</div><div class="card-head section-gap"><h3>배정할 직원</h3><span id="assignment-count" class="badge blue">${s.employees.length}명 선택</span></div><div class="assign-list">${db.employees
      .filter((e) => e.status === '재직' || s.employees.includes(e.id))
      .map(
        (e) =>
          `<label><input name="assigned" type="checkbox" value="${e.id}" ${s.employees.includes(e.id) ? 'checked' : ''}>${av(e)}<span>${E(e.name)}<small style="display:block">${E(e.position)} · ${E(e.status)}</small></span></label>`,
      )
      .join(
        '',
      )}</div><p class="note">종료 시간이 시작보다 이르면 익일 퇴근으로 처리합니다. 배정이 부족해도 저장 가능하며 결원으로 표시됩니다.</p>`,
    'shift',
    true,
  );
}
function openRecord(id, newShift) {
  let r = db.records.find((r) => r.id === id);
  if (!r) {
    let s = db.shifts.find((s) => s.id === newShift);
    if (!s) return;
    r = {
      id: '',
      shiftId: s.id,
      employee: state.employee,
      date: s.date,
      start: s.start,
      end: s.end,
      in: s.start,
      out: s.end,
      break: s.break,
      status: '정상',
      method: '수동',
      note: '',
    };
  }
  modal(
    '출퇴근 기록 수정',
    `<input type="hidden" name="id" value="${r.id}"><input type="hidden" name="shiftId" value="${r.shiftId}"><input type="hidden" name="employee" value="${r.employee}"><p class="modal-message">${E(emp(r.employee).name)} · ${r.date}</p><div class="form-grid">${field('근무일', 'date', r.date, 'date', 'required')}${select('상태', 'status', ['정상', '지각', '결근', '예정'], r.status)}${field('출근 시간', 'in', r.in, 'time')}${field('퇴근 시간', 'out', r.out, 'time')}${field('휴게시간 (분)', 'break', r.break, 'number', 'required min="0" max="1439"')}${area('수정 사유 (필수)', 'reason', '')}</div><p class="note">인증방식 ${E(r.method)} · 원본 인증방식은 수정할 수 없습니다. 변경하면 해당 월의 급여 확정이 해제됩니다.</p>`,
    'record',
  );
}
function unconfirm(employee, date) {
  let key = employee + '_' + date.slice(0, 7);
  if (db.payroll[key]) db.payroll[key].confirmed = false;
}
const adminActions = new Set([
  'employeeAdd',
  'employeeEdit',
  'shift',
  'shiftDelete',
  'shiftDeleteYes',
  'record',
  'recordNew',
  'recordDelete',
  'recordDeleteYes',
  'absence',
  'absenceYes',
  'allowances',
  'payConfirm',
  'payConfirmYes',
  'conditionEdit',
  'fixedEdit',
  'fixedDelete',
  'fixedApply',
  'insurance',
  'leaveGrant',
  'leaveApprove',
  'leaveReject',
  'contractUpload',
  'contractDelete',
  'contractDeleteYes',
  'deactivate',
  'deactivateYes',
  'authSettings',
  'requestApprove',
  'requestReject',
  'resetDemo',
  'resetDemoYes',
]);
document.addEventListener('click', async (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action,
    id = el.dataset.id;
  try {
    if (adminActions.has(a) && !admin()) return toast('관리자 화면에서만 사용할 수 있어요.');
    switch (a) {
      case 'close':
        closeModal();
        break;
      case 'menu':
        document.querySelector('#sidebar')?.classList.toggle('open');
        break;
      case 'more':
        modal(
          '전체 메뉴',
          `<div>${(admin() ? navAdmin : navEmployee).map(([p, i, t]) => `<a href="#/${p}" class="nav-item" data-action="close">${I(i)}${t}</a>`).join('')}</div><div class="section-gap">${btn('역할 전환', 'role', '', 'soft', 'refresh')}${btn('사용 안내', 'guide', '', '', 'file')}${btn('로그아웃', 'logout', '', '', 'logout')}</div>`,
        );
        break;
      case 'authRole':
        state.role = id;
        authPage();
        break;
      case 'demo':
        session = { role: state.role, employee: state.employee };
        sessionStorage.setItem('boram-session', JSON.stringify(session));
        go('home');
        break;
      case 'role':
        modal(
          '화면 체험 전환',
          `<p class="modal-message">한 브라우저의 같은 데이터를 관리자·직원 시점에서 확인합니다. 실제 권한 인증 기능은 아닙니다.</p><div class="form-grid">${select('역할', 'role', ['관리자', '직원'], admin() ? '직원' : '관리자')}<div><label for="f-person">직원 선택</label><select name="person" id="f-person">${db.employees
            .filter((e) => e.status !== '퇴사')
            .map((e) => `<option value="${e.id}">${E(e.name)} · ${E(e.login)}</option>`)
            .join('')}</select></div></div>`,
          'role',
        );
        break;
      case 'logout':
        closeModal();
        session = null;
        sessionStorage.removeItem('boram-session');
        go('login');
        break;
      case 'monthPrev':
      case 'monthNext': {
        let d = new Date(state.period + '-01T12:00:00');
        d.setMonth(d.getMonth() + (a === 'monthNext' ? 1 : -1));
        state.period = B.iso(d).slice(0, 7);
        state.date = state.period + '-01';
        render();
        break;
      }
      case 'today':
        state.period = B.month();
        state.date = B.today();
        render();
        break;
      case 'day':
        state.date = id;
        render();
        break;
      case 'view':
        state.view = id;
        render();
        break;
      case 'tab':
        state.tab = id;
        render();
        break;
      case 'query':
        render();
        break;
      case 'resetFilters':
        Object.assign(state, {
          search: '',
          status: '전체',
          method: '전체',
          type: '전체',
          from: '',
          to: '',
        });
        render();
        break;
      case 'employeeAdd':
        openEmployee();
        break;
      case 'employeeEdit':
        openEmployee(id);
        break;
      case 'shift':
        openShift(id);
        break;
      case 'shiftDelete':
        confirmAction(
          '근무 일정을 삭제할까요?',
          '배정된 직원의 예정 일정만 삭제됩니다. 이미 남은 출퇴근 기록은 유지됩니다.',
          'shiftDeleteYes',
          id,
        );
        break;
      case 'shiftDeleteYes':
        db.shifts = db.shifts.filter((s) => s.id !== id);
        notify(
          '근무 일정',
          '근무 일정이 삭제됐어요',
          '직원들의 변경된 일정을 확인해 주세요.',
          'schedule',
        );
        closeModal();
        save('일정을 삭제했어요');
        break;
      case 'record':
        openRecord(id);
        break;
      case 'recordNew':
        openRecord('', id);
        break;
      case 'recordDetail': {
        let r = db.records.find((r) => r.id === id);
        if (!r || (!admin() && r.employee !== state.employee)) return;
        modal(
          '근무 기록 상세',
          `${person(emp(r.employee))}<div class="section-gap">${kv('날짜', r.date)}${kv('예정 근무', r.start + ' — ' + r.end)}${kv('출근 / 퇴근', (r.in || '—') + ' / ' + (r.out || '—'))}${kv('휴게시간', r.break + '분')}${kv('실제 근무시간', timeText(B.workMinutes(r)))}${kv('인증 / 위치', E(r.method) + ' · ' + E(r.location))}${kv('상태', badge(r.status))}</div><h3 class="section-gap">변경 이력</h3><div class="timeline">${r.history.map((h) => `<p><b>${E(h.text)}</b>${E(h.date)} · ${E(h.reason)}</p>`).join('') || '<p>변경 이력이 없습니다.</p>'}</div><div class="modal-footer">${admin() ? btn('기록 수정', 'record', r.id, 'primary') : btn('수정 요청', 'request', r.id, 'primary')}</div>`,
        );
        break;
      }
      case 'recordDelete':
        confirmAction(
          '근무 기록을 삭제할까요?',
          '기록과 해당 기록의 수정 요청이 삭제되고 급여가 다시 계산됩니다.',
          'recordDeleteYes',
          id,
        );
        break;
      case 'recordDeleteYes': {
        let r = db.records.find((r) => r.id === id);
        if (r) unconfirm(r.employee, r.date);
        db.records = db.records.filter((r) => r.id !== id);
        db.requests = db.requests.filter((q) => q.record !== id);
        closeModal();
        save('기록을 삭제했어요');
        break;
      }
      case 'absence':
        confirmAction(
          '결근으로 변경할까요?',
          '출퇴근 원본 시간은 남겨 두고 결근으로 처리합니다. 급여 계산에서 이 근무시간이 제외됩니다.',
          'absenceYes',
          id,
        );
        break;
      case 'absenceYes': {
        let r = db.records.find((r) => r.id === id);
        if (!r) return;
        r.status = '결근';
        r.history.push({
          date: new Date().toLocaleString('ko-KR'),
          text: '결근으로 변경',
          reason: '관리자 처리',
        });
        unconfirm(r.employee, r.date);
        notify(
          '결근',
          '근무 상태가 결근으로 변경됐어요',
          r.date + ' 근무 상태를 확인하세요.',
          'records',
          r.employee,
        );
        closeModal();
        save();
        break;
      }
      case 'request': {
        let r = db.records.find((r) => r.id === id);
        if (!r || r.employee !== state.employee) return;
        if (db.requests.some((q) => q.record === id && q.status === '대기'))
          return toast('이미 승인 대기 중인 요청이 있어요.');
        modal(
          '근무시간 수정 요청',
          `<input type="hidden" name="record" value="${id}"><p class="modal-message">${r.date} · 현재 ${r.in || '—'} ~ ${r.out || '—'}</p><div class="form-grid">${field('변경 희망 출근', 'in', r.in, 'time', 'required')}${field('변경 희망 퇴근', 'out', r.out, 'time', 'required')}${field('휴게시간 (분)', 'break', r.break, 'number', 'required min="0" max="1439"')}${area('수정 요청 사유', 'reason', '')}</div>`,
          'request',
          false,
          '요청 제출',
        );
        break;
      }
      case 'requestApprove': {
        let q = db.requests.find((q) => q.id === id),
          r = q && db.records.find((r) => r.id === q.record);
        if (!q || !r || q.status !== '대기') return;
        Object.assign(r, {
          in: q.in,
          out: q.out,
          break: q.break,
          status: B.recordStatus(r.start, q.in),
        });
        r.history.push({
          date: new Date().toLocaleString('ko-KR'),
          text: '직원 수정 요청 승인',
          reason: q.reason,
        });
        q.status = '승인';
        unconfirm(r.employee, r.date);
        notify(
          '시스템',
          '근무시간 수정 요청이 승인됐어요',
          r.date + ' 기록에 반영됐습니다.',
          'records',
          r.employee,
        );
        save('요청을 승인하고 기록에 반영했어요');
        break;
      }
      case 'requestReject':
      case 'leaveReject':
        modal(
          '반려 사유 입력',
          `<input type="hidden" name="id" value="${id}"><input type="hidden" name="kind" value="${a}">${area('직원에게 전달할 사유', 'reason')}`,
          'reject',
          false,
          '반려',
        );
        break;
      case 'allowances': {
        let p = B.payroll(db, current(), state.period);
        modal(
          '수당 설정',
          `<p class="modal-message">${E(current().name)} · ${state.period}. 적용 요건을 확인한 금액을 입력하세요.</p><div class="form-grid">${field('주휴수당', 'weekly', p.weekly, 'number', 'min="0" max="100000000" required')}${field('야간수당', 'night', p.night, 'number', 'min="0" max="100000000" required')}${field('기타수당', 'other', p.other, 'number', 'min="0" max="100000000" required')}</div>`,
          'allowances',
        );
        break;
      }
      case 'payConfirm':
        confirmAction(
          '급여 ' +
            (B.payroll(db, current(), state.period).confirmed
              ? '확정을 취소할까요?'
              : '를 확정할까요?'),
          '이 브라우저에 정산 상태를 기록합니다. 실제 지급이나 이체는 실행하지 않습니다.',
          'payConfirmYes',
          id,
        );
        break;
      case 'payConfirmYes': {
        let key = state.employee + '_' + state.period;
        db.payroll[key] ||= {};
        db.payroll[key].confirmed = !db.payroll[key].confirmed;
        notify(
          '급여',
          '급여 정산 상태가 변경됐어요',
          state.period + ' 급여를 확인하세요.',
          'payroll',
          state.employee,
        );
        closeModal();
        save();
        break;
      }
      case 'csv':
        exportCSV();
        break;
      case 'print':
        window.print();
        break;
      case 'conditionEdit': {
        let e = current(),
          c = e.conditions;
        modal(
          '근로조건 수정',
          `<div class="form-grid">${field('기본 시급', 'wage', e.wage, 'number', 'min="0" max="1000000" required')}${field('수습기간', 'probation', c.probation)}${field('무급 휴게시간 (분)', 'break', c.break, 'number', 'min="0" max="1439" required')}${select('주휴수당', 'weekly', ['조건 확인', '적용', '미적용'], c.weekly)}${select('야간수당', 'night', ['조건 확인', '적용', '미적용'], c.night)}${field('계약 시작일', 'start', c.start, 'date', 'required')}${field('계약 종료일', 'end', c.end, 'date', 'required')}</div>`,
          'conditions',
        );
        break;
      }
      case 'fixedEdit': {
        let f =
          id !== '' ? current().fixed[+id] : { day: 1, start: '09:00', end: '18:00', break: 60 };
        if (!f) return;
        modal(
          '고정 근무 스케줄',
          `<input name="index" type="hidden" value="${id}"><div class="form-grid"><div><label>요일</label><select name="day">${['일', '월', '화', '수', '목', '금', '토'].map((d, i) => `<option value="${i}" ${i === f.day ? 'selected' : ''}>${d}요일</option>`).join('')}</select></div>${field('출근시간', 'start', f.start, 'time', 'required')}${field('퇴근시간', 'end', f.end, 'time', 'required')}${field('휴게시간 (분)', 'break', f.break, 'number', 'min="0" max="1439" required')}</div>`,
          'fixed',
        );
        break;
      }
      case 'fixedDelete':
        current().fixed.splice(+id, 1);
        save('고정 스케줄을 삭제했어요');
        break;
      case 'fixedApply':
        applyFixed();
        break;
      case 'insurance':
        modal(
          '4대보험 가입 정보',
          current()
            .insurance.map(
              (x, i) =>
                `<div class="condition section-gap"><label class="check"><input type="checkbox" name="joined${i}" ${x.joined ? 'checked' : ''}>${x.name} 가입</label>${field('가입일', 'date' + i, x.date, 'date')}</div>`,
            )
            .join(''),
          'insurance',
        );
        break;
      case 'leaveApply':
        modal(
          '휴가 신청',
          `<div class="form-grid">${select('휴가 종류', 'type', ['연차', '반차', '병가'], '연차')}${field('사용일', 'date', B.today(), 'date', 'required')}${field('사용 일수', 'days', 1, 'number', 'min="0.5" max="365" step="0.5" required')}${area('신청 사유', 'reason')}</div>`,
          'leave',
          false,
          '신청하기',
        );
        break;
      case 'leaveGrant':
        modal(
          '휴가 부여',
          `<p class="modal-message">현재 총 ${current().leaveGranted}일. 추가로 부여할 일수를 입력하세요.</p>${field('추가 부여 일수', 'days', 1, 'number', 'required min="0.5" max="365" step="0.5"')}`,
          'leaveGrant',
        );
        break;
      case 'leaveApprove': {
        let l = db.leaves.find((l) => l.id === id);
        if (!l || l.status !== '대기') return;
        let e = emp(l.employee),
          used = db.leaves
            .filter((q) => q.employee === e.id && q.status === '승인')
            .reduce((a, q) => a + q.days, 0);
        if (used + l.days > e.leaveGranted)
          return toast('잔여 휴가가 부족합니다. 먼저 휴가를 부여하세요.');
        l.status = '승인';
        notify('시스템', '휴가 신청이 승인됐어요', l.date + ' ' + l.type, 'leave', e.id);
        save('휴가를 승인했어요');
        break;
      }
      case 'contractUpload':
        modal(
          '근로계약서 업로드',
          `<div class="form-grid">${field('계약 시작일', 'start', current().conditions.start, 'date', 'required')}${field('계약 종료일', 'end', current().conditions.end, 'date', 'required')}<div class="full"><label>PDF / 이미지 (1MB 이하)</label><input type="file" name="file" accept="application/pdf,image/png,image/jpeg" required></div></div><p class="note">파일은 이 브라우저에 저장됩니다. 실제 개인정보가 담긴 문서는 체험에 사용하지 마세요.</p>`,
          'contract',
        );
        break;
      case 'contractView': {
        let c = current().contracts.find((c) => c.id === id);
        if (!c) return;
        modal(
          E(c.name),
          `${c.mime === 'application/pdf' ? `<iframe title="계약서 미리보기" class="file-preview" src="${c.data}"></iframe>` : `<img alt="계약서 미리보기" src="${c.data}" style="width:100%">`}<div class="modal-footer">${btn('다운로드', 'contractDownload', id, 'primary', 'download')}</div>`,
          null,
          true,
        );
        break;
      }
      case 'contractDownload': {
        let c = current().contracts.find((c) => c.id === id);
        if (c) download(c.data, c.name);
        break;
      }
      case 'contractDelete':
        confirmAction(
          '계약서를 삭제할까요?',
          '현재 브라우저에서 파일이 삭제됩니다.',
          'contractDeleteYes',
          id,
        );
        break;
      case 'contractDeleteYes':
        current().contracts = current().contracts.filter((c) => c.id !== id);
        closeModal();
        save();
        break;
      case 'accountEdit': {
        let e = current();
        modal(
          '내 정보 수정',
          `<div class="form-grid">${field('이름', 'name', e.name, 'text', 'required')}${field('연락처', 'phone', e.phone, 'tel', 'required')}${field('이메일', 'email', e.email, 'email')}</div>`,
          'account',
        );
        break;
      }
      case 'password':
        modal(
          '비밀번호 변경',
          `<p class="modal-message">체험 UI입니다. 입력값은 저장하지 않으며 실제 계정 비밀번호는 변경되지 않습니다.</p><div class="form-grid">${field('현재 비밀번호', 'old', '', 'password', 'required')}${field('새 비밀번호', 'password', '', 'password', 'required minlength="8"')}${field('새 비밀번호 확인', 'confirm', '', 'password', 'required minlength="8"')}</div>`,
          'password',
        );
        break;
      case 'deactivate':
        confirmAction(
          '계정 상태를 변경할까요?',
          '퇴사 상태의 직원은 신규 근무 배정과 직원 체험 선택에서 제외됩니다. 기존 근무 기록은 유지됩니다.',
          'deactivateYes',
          id,
        );
        break;
      case 'deactivateYes':
        emp(id).status = emp(id).status === '퇴사' ? '재직' : '퇴사';
        closeModal();
        save();
        break;
      case 'authSettings':
        modal(
          '출퇴근 인증 상세 설정',
          `<div class="form-grid">${field('OTP·QR 유효기간 (초)', 'otpSeconds', db.store.otpSeconds, 'number', 'min="30" max="3600" required')}${field('GPS 허용 반경 (m)', 'radius', db.store.radius, 'number', 'min="10" max="10000" required')}${area('허용 네트워크 / IP (한 줄에 하나)', 'networks', db.store.networks)}</div><div class="note">새로 발급하는 OTP·QR에 유효기간을 적용합니다. GPS와 네트워크 설정은 체험용입니다.</div>`,
          'authSettings',
        );
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(id);
          toast('복사했어요');
        } catch {
          modal(
            '복사할 코드',
            `<input value="${E(id)}" readonly style="width:100%" onclick="this.select()"><p class="note">코드를 선택해서 복사해 주세요.</p>`,
          );
        }
        break;
      case 'notice':
        state.noticeId = id;
        go('notifications');
        break;
      case 'noticeSelect':
        state.noticeId = id;
        render();
        break;
      case 'noticeType':
        state.noticeType = id;
        render();
        break;
      case 'read': {
        let n = db.notifications.find((n) => n.id === id);
        if (n) n.read = true;
        save('읽음으로 표시했어요');
        break;
      }
      case 'readAll':
        db.notifications
          .filter((n) => admin() || !n.employee || n.employee === state.employee)
          .forEach((n) => (n.read = true));
        save('알림을 모두 읽음으로 표시했어요');
        break;
      case 'qr':
        openAttendanceQR();
        break;
      case 'camera':
        await scanCamera();
        break;
      case 'resetDemo':
        confirmAction(
          '모든 체험 데이터를 초기화할까요?',
          '직원, 일정, 기록과 업로드 파일이 처음 상태로 돌아갑니다.',
          'resetDemoYes',
          '',
        );
        break;
      case 'resetDemoYes':
        db = B.seed();
        state.employee = 'e1';
        closeModal();
        save('체험 데이터를 초기화했어요');
        break;
      case 'guide':
        modal(
          'Boram 사용 안내',
          `<p class="modal-message">관리자와 직원 화면을 전환하며 같은 데이터를 확인할 수 있어요.</p>${kv('직원 이름', '개인 근무 캘린더')}${kv('설정', '근로조건 6개 탭')}${kv('근무 일정', '필요 인원 설정 · 직원 배정')}${kv('급여', '실제 근무시간 기반 계산 · 수당 입력')}${kv('PDF', '브라우저 인쇄 → PDF로 저장')}<div class="note">본 프로젝트는 브라우저 저장형 프런트엔드입니다. 실제 계정 인증, SMS OTP, 서버 권한 검증, 데이터베이스 동기화, 법정 급여 계산은 별도 구현이 필요합니다.</div><div class="modal-footer"><a class="btn primary" href="Boram_source.zip" download>${I('download')}전체 소스 다운로드</a></div>`,
        );
        break;
    }
  } catch (err) {
    console.error(err);
    toast('처리하지 못했어요. 입력값을 확인하고 다시 시도하세요.');
  }
});
function validateTimes(start, end, rest) {
  if (start === end) return '시작과 종료 시간을 다르게 입력해 주세요.';
  let span = B.duration(start, end, 0);
  if (!span) return '올바른 시작·종료 시간을 입력해 주세요.';
  if (!Number.isFinite(+rest) || +rest < 0 || +rest >= span)
    return '휴게시간은 전체 근무시간보다 짧아야 합니다.';
  return '';
}
const adminForms = new Set([
  'employee',
  'shift',
  'record',
  'allowances',
  'conditions',
  'fixed',
  'insurance',
  'leaveGrant',
  'contract',
  'store',
  'authSettings',
]);
document.addEventListener('submit', async (event) => {
  let form = event.target.closest('[data-form]');
  if (!form) return;
  event.preventDefault();
  let kind = form.dataset.form,
    f = new FormData(form),
    v = Object.fromEntries(f);
  try {
    if (adminForms.has(kind) && !admin()) return fail('관리자만 변경할 수 있어요.');
    switch (kind) {
      case 'login': {
        let role = state.role,
          employee = db.employees.find((e) => e.login === v.login && e.status !== '퇴사');
        if (role === 'admin' && v.login !== 'admin')
          return fail('체험 관리자 아이디는 admin입니다.');
        if (role === 'employee' && !employee)
          return fail('등록된 직원 아이디를 입력해 주세요. 예: staff1');
        state.pendingSession = { role, employee: employee?.id || state.employee };
        modal(
          '로그인 추가 인증',
          `<p class="modal-message">본인 인증 UI 체험입니다. 실제 문자는 발송하지 않습니다.</p>${field('체험 인증번호', 'otp', '', 'text', 'required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="one-time-code"')}<p class="note">체험 코드: <b>130958</b> · 유효시간 3분</p>`,
          'loginOtp',
          false,
          '인증하고 로그인',
        );
        state.otpExpires = Date.now() + 180000;
        break;
      }
      case 'loginOtp':
        if (Date.now() > state.otpExpires)
          return fail('인증 시간이 만료됐습니다. 닫은 뒤 다시 로그인해 주세요.');
        if (v.otp !== '130958') return fail('인증번호가 일치하지 않습니다. 체험 코드: 130958');
        session = state.pendingSession;
        state.role = session.role;
        state.employee = session.employee;
        sessionStorage.setItem('boram-session', JSON.stringify(session));
        closeModal();
        go('home');
        toast('체험 로그인이 완료됐어요');
        break;
      case 'signup': {
        if (v.password !== v.confirm) return fail('비밀번호 확인이 일치하지 않습니다.');
        if (db.employees.some((e) => e.login === v.login) || v.login === 'admin')
          return fail('이미 사용 중인 체험 아이디입니다.');
        if (admin()) {
          db.store.name = v.storeName;
          db.store.business = v.business;
          db.store.address = v.address;
          db.store.owner = v.name;
          persist();
          toast('체험 사업장을 등록했어요. admin으로 로그인하세요.');
          go('login');
        } else {
          state.pendingEmployee = { ...v };
          delete state.pendingEmployee.password;
          delete state.pendingEmployee.confirm;
          modal(
            '사업장 연결',
            `${field('사업장 코드', 'code', '', 'text', 'required placeholder="BRM2026"')}<p class="note">체험 사업장 코드: ${E(db.store.code)}</p>`,
            'join',
            false,
            '연결하고 시작하기',
          );
        }
        break;
      }
      case 'join':
        if (v.code.trim().toUpperCase() !== db.store.code.toUpperCase())
          return fail('사업장 코드를 확인해 주세요.');
        {
          let e = newEmployee(state.pendingEmployee);
          db.employees.push(e);
          session = { role: 'employee', employee: e.id };
          state.role = 'employee';
          state.employee = e.id;
          sessionStorage.setItem('boram-session', JSON.stringify(session));
          persist();
          closeModal();
          go('home');
          toast('사업장 연결이 완료됐어요');
          break;
        }
      case 'role':
        state.role = v.role === '관리자' ? 'admin' : 'employee';
        if (v.person) state.employee = v.person;
        if (!admin() && !db.employees.some((e) => e.id === state.employee && e.status !== '퇴사'))
          return fail('체험 가능한 직원이 없습니다.');
        session = { role: state.role, employee: state.employee };
        sessionStorage.setItem('boram-session', JSON.stringify(session));
        closeModal();
        Object.assign(state, { search: '', status: '전체', method: '전체', tab: 'conditions' });
        go('home');
        break;
      case 'employee':
        if (db.employees.some((e) => e.login === v.login && e.id !== v.id) || v.login === 'admin')
          return fail('이미 사용 중인 아이디예요.');
        {
          let data = { ...v, wage: +v.wage };
          if (v.id) {
            let e = emp(v.id);
            Object.assign(e, data);
            Object.keys(db.payroll)
              .filter((k) => k.startsWith(e.id + '_'))
              .forEach((k) => (db.payroll[k].confirmed = false));
          } else {
            db.employees.push(newEmployee(data));
          }
          closeModal();
          save('직원 정보를 저장했어요');
          break;
        }
      case 'shift': {
        let err = validateTimes(v.start, v.end, v.break);
        if (err) return fail(err);
        let assigned = [...new Set(f.getAll('assigned'))];
        let data = {
          id: v.id || B.id(),
          date: v.date,
          start: v.start,
          end: v.end,
          break: +v.break,
          required: +v.required,
          employees: assigned,
          note: v.note,
        };
        let old = db.shifts.findIndex((s) => s.id === v.id);
        if (old >= 0) db.shifts[old] = data;
        else db.shifts.push(data);
        notify(
          '근무 일정',
          '근무 일정이 변경됐어요',
          v.date + ' ' + v.start + ' ~ ' + v.end,
          'schedule',
        );
        state.date = v.date;
        state.period = v.date.slice(0, 7);
        closeModal();
        save('근무 일정과 배정을 저장했어요');
        break;
      }
      case 'record': {
        if (!v.reason.trim()) return fail('수정 사유를 입력해 주세요.');
        if (v.status !== '결근' && v.in && v.out) {
          let err = validateTimes(v.in, v.out, v.break);
          if (err) return fail(err);
        }
        if (v.out && !v.in) return fail('퇴근시간을 입력하려면 출근시간도 필요합니다.');
        let r = db.records.find((r) => r.id === v.id),
          shift = db.shifts.find((s) => s.id === v.shiftId);
        if (!r) {
          if (db.records.some((x) => x.shiftId === v.shiftId && x.employee === v.employee))
            return fail('같은 근무의 기록이 이미 있습니다.');
          r = {
            id: B.id(),
            shiftId: v.shiftId,
            employee: v.employee,
            start: shift?.start || v.in,
            end: shift?.end || v.out,
            method: '수동',
            location: db.store.name,
            history: [],
          };
          db.records.push(r);
        }
        if (r.date) unconfirm(r.employee, r.date);
        r.history.push({
          date: new Date().toLocaleString('ko-KR'),
          text: `${r.in || '—'} → ${v.in || '—'} / ${r.out || '—'} → ${v.out || '—'}`,
          reason: v.reason,
        });
        Object.assign(r, {
          date: v.date,
          in: v.in,
          out: v.out,
          break: +v.break,
          status: v.status,
          note: v.reason,
        });
        unconfirm(r.employee, r.date);
        closeModal();
        save('근무기록과 급여 계산을 갱신했어요');
        break;
      }
      case 'request': {
        let r = db.records.find((r) => r.id === v.record);
        if (!r || r.employee !== state.employee) return fail('본인의 기록만 요청할 수 있습니다.');
        let err = validateTimes(v.in, v.out, v.break);
        if (err) return fail(err);
        if (!v.reason.trim()) return fail('수정 사유를 입력해 주세요.');
        if (db.requests.some((q) => q.record === r.id && q.status === '대기'))
          return fail('이미 대기 중인 요청이 있습니다.');
        db.requests.unshift({
          id: B.id(),
          record: r.id,
          employee: r.employee,
          date: r.date,
          in: v.in,
          out: v.out,
          break: +v.break,
          reason: v.reason,
          status: '대기',
          response: '',
        });
        notify(
          '시스템',
          '새 근무시간 수정 요청',
          emp(r.employee).name + '님의 요청을 확인해 주세요.',
          'records',
          r.employee,
        );
        closeModal();
        save('관리자에게 수정 요청을 등록했어요');
        break;
      }
      case 'reject': {
        if (!admin()) return;
        if (!v.reason.trim()) return fail('반려 사유를 입력해 주세요.');
        let q = (v.kind === 'requestReject' ? db.requests : db.leaves).find((q) => q.id === v.id);
        if (!q || q.status !== '대기') return fail('이미 처리된 요청입니다.');
        q.status = '반려';
        q.response = v.reason;
        notify(
          '시스템',
          '신청이 반려됐어요',
          v.reason,
          v.kind === 'requestReject' ? 'records' : 'leave',
          q.employee,
        );
        closeModal();
        save();
        break;
      }
      case 'allowances': {
        let key = state.employee + '_' + state.period;
        db.payroll[key] = { weekly: +v.weekly, night: +v.night, other: +v.other, confirmed: false };
        closeModal();
        save('수당을 저장했어요');
        break;
      }
      case 'conditions':
        if (v.end < v.start) return fail('계약 종료일은 시작일 이후여야 합니다.');
        current().wage = +v.wage;
        current().conditions = {
          probation: v.probation,
          break: +v.break,
          weekly: v.weekly,
          night: v.night,
          start: v.start,
          end: v.end,
        };
        Object.keys(db.payroll)
          .filter((k) => k.startsWith(state.employee + '_'))
          .forEach((k) => (db.payroll[k].confirmed = false));
        closeModal();
        save();
        break;
      case 'fixed': {
        let err = validateTimes(v.start, v.end, v.break);
        if (err) return fail(err);
        let data = { day: +v.day, start: v.start, end: v.end, break: +v.break };
        if (v.index === '') current().fixed.push(data);
        else current().fixed[+v.index] = data;
        closeModal();
        save();
        break;
      }
      case 'insurance':
        for (let i = 0; i < current().insurance.length; i++) {
          if (v['joined' + i] && !v['date' + i]) return fail('가입한 보험의 가입일을 입력하세요.');
        }
        current().insurance.forEach((x, i) => {
          x.joined = !!v['joined' + i];
          x.date = x.joined ? v['date' + i] : '';
        });
        closeModal();
        save();
        break;
      case 'leave':
        if (v.type === '반차' && +v.days !== 0.5) return fail('반차는 0.5일로 입력해 주세요.');
        if (!v.reason.trim()) return fail('신청 사유를 입력해 주세요.');
        db.leaves.unshift({
          id: B.id(),
          employee: state.employee,
          type: v.type,
          date: v.date,
          days: +v.days,
          reason: v.reason,
          created: B.today(),
          status: '대기',
        });
        notify(
          '시스템',
          '새 휴가 신청',
          current().name + ' · ' + v.date + ' ' + v.type,
          'leave',
          state.employee,
        );
        closeModal();
        save('휴가 신청을 등록했어요');
        break;
      case 'leaveGrant':
        current().leaveGranted += +v.days;
        closeModal();
        save('휴가를 추가 부여했어요');
        break;
      case 'contract': {
        let file = f.get('file');
        if (!file || !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type))
          return fail('PDF, PNG, JPG 파일을 선택해 주세요.');
        if (file.size > 1024 * 1024) return fail('1MB 이하 파일만 가능합니다.');
        if (v.end < v.start) return fail('계약 기간을 확인해 주세요.');
        let data = await new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        let c = {
          id: B.id(),
          name: file.name,
          mime: file.type,
          data,
          date: B.today(),
          start: v.start,
          end: v.end,
        };
        current().contracts.push(c);
        if (!persist()) {
          current().contracts.pop();
          return fail('브라우저 저장 공간이 부족합니다.');
        }
        closeModal();
        render();
        toast('계약서를 저장했어요');
        break;
      }
      case 'account':
        Object.assign(current(), { name: v.name, phone: v.phone, email: v.email });
        closeModal();
        save();
        break;
      case 'password':
        if (v.password !== v.confirm) return fail('새 비밀번호 확인이 일치하지 않습니다.');
        form.reset();
        closeModal();
        toast('입력 검증 완료 · 체험 모드로 실제 비밀번호는 변경하지 않았어요');
        break;
      case 'store':
        if (v.end < v.start) return toast('운영 종료일을 확인해 주세요.');
        Object.assign(db.store, v, { methods: f.getAll('methods') });
        save('사업장 설정을 저장했어요');
        break;
      case 'authSettings':
        Object.assign(db.store, {
          otpSeconds: +v.otpSeconds,
          radius: +v.radius,
          networks: v.networks,
        });
        closeModal();
        save('체험 인증 설정을 저장했어요');
        break;
      case 'attendance':
      case 'qr': {
        if (admin()) return fail('직원 화면에서 출퇴근을 인증해 주세요.');
        const method = kind === 'qr' ? 'QR' : 'OTP';
        const code = method === 'QR' ? qrToken(v.code) : v.otp.trim();
        if (!code) return fail('QR 인증 링크 또는 코드를 확인해 주세요.');
        if (!db.store.methods.includes(method))
          return fail('사업장에서 허용하지 않은 인증방식입니다.');
        const button = form.querySelector('[type=submit]');
        if (button.disabled) return;
        const activeSession = session;
        const employee = state.employee;
        button.disabled = true;
        try {
          const result = await attendanceRequest('verify', method, { code });
          if (
            !result.verified ||
            !document.contains(form) ||
            session !== activeSession ||
            state.employee !== employee
          )
            return;
          if (method === 'QR') closeModal();
          checkAttendance(method);
        } catch (error) {
          if (document.contains(form)) fail(error.message);
        } finally {
          button.disabled = false;
        }
        break;
      }
    }
  } catch (err) {
    console.error(err);
    fail('처리 중 오류가 발생했습니다. 입력값을 다시 확인해 주세요.');
  }
});
function newEmployee(v) {
  let e = B.seed().employees[0];
  return {
    ...e,
    id: B.id(),
    name: v.name,
    phone: v.phone,
    email: v.email || '',
    position: v.position || '스태프',
    type: v.type || '파트타임',
    status: v.status || '재직',
    join: v.join || B.today(),
    wage: Number(v.wage || 12000),
    login: v.login,
    fixed: [],
    leaveGranted: 0,
    contracts: [],
    conditions: {
      probation: '없음',
      break: 60,
      weekly: '조건 확인',
      night: '조건 확인',
      start: B.today(),
      end: db.store.end,
    },
  };
}
function applyFixed() {
  let e = current(),
    days = new Date(+state.period.slice(0, 4), +state.period.slice(5), 0).getDate(),
    count = 0;
  for (let d = 1; d <= days; d++) {
    let date = state.period + '-' + String(d).padStart(2, '0');
    if (date < db.store.start || date > db.store.end) continue;
    let dow = new Date(date + 'T12:00:00').getDay();
    for (let f of e.fixed.filter((f) => f.day === dow)) {
      let s = db.shifts.find(
        (s) => s.date === date && s.start === f.start && s.end === f.end && s.break === f.break,
      );
      if (s) {
        if (!s.employees.includes(e.id)) {
          s.employees.push(e.id);
          count++;
        }
      } else {
        db.shifts.push({
          id: B.id(),
          date,
          start: f.start,
          end: f.end,
          break: f.break,
          required: 1,
          employees: [e.id],
          note: '고정 스케줄 적용',
        });
        count++;
      }
    }
  }
  notify(
    '근무 일정',
    '고정 스케줄을 적용했어요',
    state.period + ' ' + e.name + ' ' + count + '건',
    'schedule',
    e.id,
  );
  save(count + '건의 근무 배정을 적용했어요');
}
function checkAttendance(method) {
  if (!db.store.methods.includes(method)) return toast('사업장에서 허용하지 않은 인증방식입니다.');
  let employee = state.employee,
    today = B.today(),
    now = new Date(),
    t = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  let open = db.records.find(
    (r) => r.employee === employee && r.in && !r.out && r.status !== '결근',
  );
  if (open) {
    let span = B.duration(open.in, t, 0);
    if (span < open.break)
      return toast('현재 근무시간이 휴게시간보다 짧습니다. 관리자에게 기록 수정을 요청하세요.');
    open.out = t;
    open.history.push({ date: now.toLocaleString('ko-KR'), text: '퇴근 인증', reason: method });
    unconfirm(employee, open.date);
    save('퇴근을 기록했어요. 오늘도 수고했어요!');
    return;
  }
  let shift = db.shifts.find(
    (s) =>
      s.date === today &&
      s.employees.includes(employee) &&
      !db.records.some((r) => r.shiftId === s.id && r.employee === employee),
  );
  if (!shift) return toast('오늘 인증할 미기록 근무 배정이 없습니다.');
  let r = {
    id: B.id(),
    employee,
    shiftId: shift.id,
    date: today,
    start: shift.start,
    end: shift.end,
    in: t,
    out: '',
    break: shift.break,
    status: B.recordStatus(shift.start, t),
    method,
    location: db.store.name,
    note: '현장 인증',
    history: [],
  };
  db.records.push(r);
  unconfirm(employee, today);
  if (r.status === '지각')
    notify('지각', current().name + '님이 지각 출근했어요', today + ' ' + t, 'records', employee);
  save(t + ' 출근을 기록했어요');
}
async function scanCamera() {
  if (!('BarcodeDetector' in window))
    return toast('이 브라우저는 QR 인식을 지원하지 않습니다. 문자열 입력을 이용하세요.');
  try {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    closeModal.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    let video = document.querySelector('#qr-video');
    if (!video) {
      closeModal.stream.getTracks().forEach((t) => t.stop());
      return;
    }
    video.style.display = 'block';
    video.srcObject = closeModal.stream;
    await video.play();
    async function scan() {
      if (!document.contains(video) || !closeModal.stream) return;
      try {
        let codes = await detector.detect(video);
        if (codes.length) {
          let input = document.querySelector('[name=code]');
          if (input) input.value = codes[0].rawValue;
          closeModal.stream.getTracks().forEach((t) => t.stop());
          closeModal.stream = null;
          toast('QR을 읽었어요. 코드 확인을 눌러 주세요.');
          return;
        }
      } catch {}
      setTimeout(scan, 450);
    }
    scan();
  } catch {
    toast('카메라 접근이 허용되지 않았습니다. 문자열 입력을 이용하세요.');
  }
}
function download(url, name) {
  let a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function exportCSV() {
  let e = current(),
    p = B.payroll(db, e, state.period),
    rows = [
      ['직원', '날짜', '출근', '퇴근', '휴게(분)', '근무(분)', '기본급', '상태'],
      ...p.rows.map((r) => [
        e.name,
        r.date,
        r.in,
        r.out,
        r.break,
        B.workMinutes(r),
        Math.round((B.workMinutes(r) / 60) * e.wage),
        r.status,
      ]),
      [],
      ['월 합계', state.period, '기본급', p.base, '주휴수당', p.weekly, '야간수당', p.night],
      ['기타수당', p.other, '세전 합계', p.total, '확정', p.confirmed ? '확정' : '예상'],
    ];
  let csv = '\uFEFF' + rows.map((r) => r.map(B.csvCell).join(',')).join('\r\n');
  let url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  download(url, `Boram_${e.name}_${state.period}.csv`);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('급여 CSV를 내보냈어요');
}
document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.name === 'assigned') {
    let count = document.querySelectorAll('[name=assigned]:checked').length,
      required = +document.querySelector('[name=required]').value;
    let n = document.querySelector('#assignment-count');
    if (n)
      n.textContent = `${count}명 선택 / 필요 ${required}명${count < required ? ' · ' + (required - count) + '명 부족' : ' · 충족'}`;
    return;
  }
  if (el.dataset.change) {
    state[el.dataset.change] = el.value;
    if (el.dataset.change === 'period') state.date = state.period + '-01';
    if (el.dataset.change === 'employee') {
      let [p] = route();
      if (admin() && ['conditions', 'payroll'].includes(p)) {
        go(p + '/' + el.value);
        return;
      }
    }
    render();
  }
});
let searchTimer;
document.addEventListener('input', (event) => {
  let el = event.target;
  if (el.dataset.input) {
    state[el.dataset.input] = el.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      let pos = el.selectionStart;
      render();
      let next = document.querySelector('[data-input="' + el.dataset.input + '"]');
      if (next) {
        next.focus();
        next.setSelectionRange(pos, pos);
      }
    }, 180);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    document.querySelector('#sidebar')?.classList.remove('open');
  }
  if (e.key === 'Tab' && document.querySelector('.modal')) {
    const els = [
      ...document.querySelectorAll(
        '.modal button,.modal a,.modal input,.modal select,.modal textarea',
      ),
    ].filter((x) => !x.disabled && x.type !== 'hidden');
    let first = els[0],
      last = els.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
});
window.addEventListener('hashchange', () => {
  closeModal();
  Object.assign(state, { search: '', status: '전체', method: '전체', from: '', to: '' });
  render();
  window.scrollTo(0, 0);
});
window.addEventListener('storage', (e) => {
  if (e.key === KEY && e.newValue) {
    try {
      const next = JSON.parse(e.newValue);
      if (next.version === 1) {
        db = next;
        render();
      }
    } catch {}
  }
});
persist();
render();
