// 공용 UI 헬퍼 — DOM 빌더, 숫자 포맷/카운트업, SVG 라인차트, 바텀시트

export function h(tag, props = {}, ...kids) {
  const n = document.createElement(tag)
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue
    if (k === 'class') n.className = v
    else if (k === 'html') n.innerHTML = v
    else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k === 'style') n.style.cssText = v
    else n.setAttribute(k, v === true ? '' : v)
  }
  for (const kid of kids.flat(9)) {
    if (kid == null || kid === false) continue
    n.append(kid.nodeType ? kid : document.createTextNode(kid))
  }
  return n
}

// 자식 목록에서 null/false를 걸러 붙인다.
// ⚠️ DOM의 append()는 null을 받으면 문자열 "null"을 그대로 렌더한다.
// 조건부 자식(`cond ? h(...) : null`)을 붙일 때는 반드시 이 함수를 쓸 것.
export function appendKids(parent, ...kids) {
  for (const kid of kids.flat(9)) {
    if (kid == null || kid === false) continue
    parent.append(kid.nodeType ? kid : document.createTextNode(kid))
  }
  return parent
}

export const fmt = (n, d = 0) =>
  Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d })
export const won = n => fmt(Math.round(n)) + '원'
export const pct = (n, d = 1) => (n > 0 ? '+' : '') + n.toFixed(d) + '%'
export const numClass = n => (n > 0 ? 'num-up' : n < 0 ? 'num-down' : 'num-flat')

// 숫자 카운트업 모션 (토스식) — 0에서 target까지 차오름
export function countUp(node, target, { dur = 1100, decimals = 0, prefix = '', suffix = '', signed = false } = {}) {
  const t0 = performance.now()
  const ease = x => 1 - Math.pow(1 - x, 3)
  const render = v => {
    const sign = signed && v > 0 ? '+' : ''
    node.textContent = prefix + sign + fmt(v, decimals) + suffix
  }
  function frame(t) {
    const p = Math.min(1, (t - t0) / dur)
    render(target * ease(p))
    if (p < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

// SVG 라인차트
export function lineChart({
  w = 640, h = 260, pad = { t: 14, r: 14, b: 24, l: 48 },
  series = [], bands = [], markers = [], vline = null,
  yFmt = v => fmt(v), xMax = null,
}) {
  const all = series.flatMap(s => s.data).filter(v => v != null && isFinite(v))
  let ymin = Math.min(...all), ymax = Math.max(...all)
  if (!isFinite(ymin)) { ymin = 0; ymax = 1 }
  if (ymin === ymax) { ymin -= 1; ymax += 1 }
  const rng = ymax - ymin
  ymin -= rng * 0.08; ymax += rng * 0.08
  const n = Math.max(2, xMax ?? Math.max(...series.map(s => s.data.length)))
  const X = i => pad.l + (w - pad.l - pad.r) * (i / (n - 1))
  const Y = v => pad.t + (h - pad.t - pad.b) * (1 - (v - ymin) / (ymax - ymin))
  let out = ''
  for (const b of bands) {
    const x0 = X(Math.max(0, b.x0)), x1 = X(Math.min(b.x1, n - 1))
    out += `<rect data-band="${b.id ?? ''}" x="${x0.toFixed(1)}" y="${pad.t}" width="${(x1 - x0).toFixed(1)}" height="${h - pad.t - pad.b}" fill="${b.color}" style="cursor:${b.id != null ? 'pointer' : 'default'}"/>`
    if (b.label) out += `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${pad.t + 14}" text-anchor="middle" font-size="10" font-weight="700" fill="${b.labelColor || '#8b95a1'}" pointer-events="none">${b.label}</text>`
  }
  for (let g = 0; g < 4; g++) {
    const v = ymin + (ymax - ymin) * (g / 3)
    out += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#e5e8eb" stroke-width="1"/>`
    out += `<text x="${pad.l - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end" font-size="10" fill="#8b95a1">${yFmt(v)}</text>`
  }
  for (const s of series) {
    const pts = s.data.map((v, i) => (v == null ? null : `${X(i).toFixed(1)},${Y(v).toFixed(1)}`)).filter(Boolean)
    if (!pts.length) continue
    if (s.fill) {
      const lastI = s.data.length - 1
      out += `<polygon points="${X(0).toFixed(1)},${Y(ymin).toFixed(1)} ${pts.join(' ')} ${X(lastI).toFixed(1)},${Y(ymin).toFixed(1)}" fill="${s.fill}"/>`
    }
    out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.5}" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`
  }
  if (vline != null) {
    out += `<line x1="${X(vline).toFixed(1)}" x2="${X(vline).toFixed(1)}" y1="${pad.t}" y2="${h - pad.b}" stroke="#8b95a1" stroke-width="1.5" stroke-dasharray="4 3"/>`
  }
  for (const m of markers) {
    out += `<circle cx="${X(m.x).toFixed(1)}" cy="${Y(m.y).toFixed(1)}" r="${m.r || 4}" fill="${m.color}" stroke="#fff" stroke-width="1.5" pointer-events="none"/>`
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.classList.add('chart')
  svg.innerHTML = out
  return svg
}

// 바텀시트 — close() 반환
export function openSheet(...children) {
  const dim = h('div', { class: 'sheet-dim' })
  const sheet = h('div', { class: 'sheet' }, ...children)
  const close = () => { dim.remove(); sheet.remove() }
  dim.addEventListener('click', close)
  document.body.append(dim, sheet)
  return close
}

export function topbar(title, onBack) {
  return h('div', { class: 'topbar' },
    onBack ? h('button', { class: 'btn-back', onclick: onBack, 'aria-label': '뒤로' }, '‹') : null,
    h('div', { class: 'tb-title' }, title),
  )
}
