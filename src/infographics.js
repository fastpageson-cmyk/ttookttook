// 강의 카드용 인포그래픽 (인라인 SVG)
//
// 원칙: 디자인 시스템과 한 몸으로 움직이도록 색을 하드코딩하지 않고 CSS 변수를 쓴다
// (인라인 SVG라 fill="var(--blue)"가 그대로 동작한다). 차분하게 — 얇은 선, 보더 우선,
// 상태색은 의미가 있을 때만. 폰트는 부모(Pretendard)를 상속한다.
//
// 각 함수는 SVG 문자열을 반환하고, 강의 카드의 `figure` 필드에 넣으면 렌더된다.

const NS = 'viewBox'
// 공통 래퍼 — 반응형(width 100%), 좌표계는 함수마다 지정
function svg(vb, body) {
  return `<svg ${NS}="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" class="ig">${body}</svg>`
}
const txt = (x, y, s, opt = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${opt.anchor || 'middle'}" font-size="${opt.size || 13}" font-weight="${opt.weight || 400}" fill="${opt.fill || 'var(--sub)'}"${opt.mono ? ' font-variant-numeric="tabular-nums"' : ''}>${s}</text>`

// ── 2주차 · 복리 vs 단리 (시간이 만드는 스노우볼) ──────────────
export function compoundVsSimple() {
  const W = 340, H = 200, pad = { l: 34, r: 14, t: 16, b: 26 }
  const yrs = 20, rate = 0.08
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b
  const compound = i => Math.pow(1 + rate, i)
  const simple = i => 1 + rate * i
  const maxV = compound(yrs)
  const X = i => pad.l + iw * (i / yrs)
  const Y = v => pad.t + ih * (1 - (v - 1) / (maxV - 1))
  const path = fn => Array.from({ length: yrs + 1 }, (_, i) => `${X(i).toFixed(1)},${Y(fn(i)).toFixed(1)}`).join(' ')
  const grid = [1, 2, 3, 4].map(v => {
    const y = pad.t + ih * (1 - (v - 1) / (maxV - 1))
    return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/>` +
      txt(pad.l - 6, y + 3.5, v + '배', { anchor: 'end', size: 10, fill: 'var(--mut)', mono: 1 })
  }).join('')
  return svg(`0 0 ${W} ${H}`,
    grid +
    `<polyline points="${path(simple)}" fill="none" stroke="var(--mut-soft)" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>` +
    `<polyline points="${path(compound)}" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<circle cx="${X(yrs).toFixed(1)}" cy="${Y(compound(yrs)).toFixed(1)}" r="4" fill="var(--blue)"/>` +
    txt(X(yrs) - 4, Y(compound(yrs)) - 8, '복리', { anchor: 'end', size: 12, weight: 700, fill: 'var(--blue)' }) +
    txt(X(yrs) - 4, Y(simple(yrs)) + 16, '단리', { anchor: 'end', size: 12, weight: 700, fill: 'var(--mut)' }) +
    txt(pad.l, H - 6, '0년', { anchor: 'start', size: 10, fill: 'var(--mut)' }) +
    txt(W - pad.r, H - 6, `${yrs}년 · 연 8%`, { anchor: 'end', size: 10, fill: 'var(--mut)' }))
}

// ── 3주차 · 레버리지 증폭 구조 (양날의 검) ───────────────────
export function leverageAmplify() {
  const W = 340, H = 214
  const cx = W / 2
  // 위: 상승 / 아래: 하락. 왼쪽 시장 ±10%, 오른쪽 내 계좌 ±20%
  function pair(baseY, up) {
    const col = up ? 'var(--up)' : 'var(--down)'
    const soft = up ? 'var(--up-soft)' : 'var(--down-soft)'
    const sign = up ? '+' : '−'
    const mkt = 26, acc = 52  // 막대 높이(2배)
    const bl = 84, br = 232, bw = 40
    const mY = baseY - mkt, aY = baseY - acc
    return (
      // 시장 막대
      `<rect x="${bl}" y="${mY}" width="${bw}" height="${mkt}" rx="4" fill="${soft}" stroke="${col}"/>` +
      txt(bl + bw / 2, baseY + 15, '시장', { size: 11, fill: 'var(--mut)' }) +
      txt(bl + bw / 2, mY - 6, `${sign}10%`, { size: 12, weight: 700, fill: col, mono: 1 }) +
      // 화살표
      `<path d="M${bl + bw + 14},${baseY - mkt / 2} L${br - 18},${baseY - mkt / 2}" stroke="var(--mut)" stroke-width="1.5" marker-end="url(#ig-arrow)"/>` +
      txt((bl + bw + br) / 2, baseY - mkt / 2 - 8, '2배', { size: 10, weight: 700, fill: 'var(--mut)' }) +
      // 내 계좌 막대(2배)
      `<rect x="${br}" y="${aY}" width="${bw}" height="${acc}" rx="4" fill="${col}"/>` +
      txt(br + bw / 2, baseY + 15, '내 계좌', { size: 11, fill: 'var(--mut)' }) +
      txt(br + bw / 2, aY - 6, `${sign}20%`, { size: 13, weight: 800, fill: col, mono: 1 })
    )
  }
  return svg(`0 0 ${W} ${H}`,
    `<defs><marker id="ig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--mut)"/></marker></defs>` +
    pair(96, true) +
    `<line x1="20" x2="${W - 20}" y1="112" y2="112" stroke="var(--line)" stroke-width="1"/>` +
    pair(200, false))
}

// ── 4주차 · MDD 회복의 비대칭 (음의 복리) ────────────────────
export function drawdownRecovery() {
  const rows = [
    { loss: 10, need: 11.1 },
    { loss: 30, need: 42.9 },
    { loss: 50, need: 100.0 },
  ]
  const W = 340, rowH = 52, top = 10, labelW = 66, barX = 74, barMax = W - barX - 58
  const maxNeed = 100
  let body = ''
  rows.forEach((r, i) => {
    const y = top + i * rowH
    const w = barMax * (r.need / maxNeed)
    body +=
      txt(labelW, y + 22, `−${r.loss}%`, { anchor: 'end', size: 15, weight: 800, fill: 'var(--down)', mono: 1 }) +
      txt(labelW, y + 38, '손실', { anchor: 'end', size: 10, fill: 'var(--mut)' }) +
      // 트랙
      `<rect x="${barX}" y="${y + 8}" width="${barMax}" height="22" rx="6" fill="var(--fill)"/>` +
      // 필요 수익률 막대
      `<rect x="${barX}" y="${y + 8}" width="${w.toFixed(1)}" height="22" rx="6" fill="var(--up)"/>` +
      txt(barX + w + 6, y + 24, `+${r.need}%`, { anchor: 'start', size: 13, weight: 800, fill: 'var(--up)', mono: 1 })
  })
  const H = top + rows.length * rowH + 4
  return svg(`0 0 ${W} ${H}`,
    body +
    txt(barX, H - 2, '원금으로 돌아가는 데 필요한 수익률', { anchor: 'start', size: 10, fill: 'var(--mut)' }))
}

// ── 5주차 · PER = 몇 년 치 이익인가 ──────────────────────────
export function perExplain() {
  const W = 340, H = 184
  const n = 10, bx = 20, gap = 6, bw = (W - bx * 2 - gap * (n - 1)) / n
  const by = 92, bh = 38
  let bars = ''
  for (let i = 0; i < n; i++) {
    const x = bx + i * (bw + gap)
    bars += `<rect x="${x.toFixed(1)}" y="${by}" width="${bw.toFixed(1)}" height="${bh}" rx="3" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1"/>`
  }
  return svg(`0 0 ${W} ${H}`,
    txt(W / 2, 26, 'PER 10배', { size: 15, weight: 800, fill: 'var(--ink)' }) +
    txt(W / 2, 46, '주가 = 기업이 10년 동안 버는 이익', { size: 12, fill: 'var(--sub)' }) +
    `<line x1="${bx}" x2="${W - bx}" y1="72" y2="72" stroke="var(--line)"/>` +
    bars +
    // 브레이스
    `<path d="M${bx},${by + bh + 10} q0,6 6,6 L${W / 2 - 8},${by + bh + 16} q6,0 6,6 q0,-6 6,-6 L${W - bx - 6},${by + bh + 16} q6,0 6,-6" fill="none" stroke="var(--mut)" stroke-width="1.2"/>` +
    txt(W / 2, by + bh + 34, '1년 치 이익 × 10', { size: 11, fill: 'var(--mut)' }))
}

// ── 6주차 · 손익통산 (일반계좌 vs ISA) ───────────────────────
export function taxOffset() {
  const W = 340, H = 200
  function stack(x, title, taxedBase, note, highlight) {
    const bx = x, bw = 92, top = 44
    const gain = 44, loss = 20, hgt = 1.0  // px per (만원): gain 300만=44, loss 100만=20 (scaled)
    // 이익(+300) 막대 위로, 손실(-100) 막대 아래로
    const col = highlight ? 'var(--blue)' : 'var(--ink)'
    return (
      txt(bx + bw / 2, 26, title, { size: 12, weight: 700, fill: col }) +
      `<line x1="${bx - 4}" x2="${bx + bw + 4}" y1="${top + 60}" y2="${top + 60}" stroke="var(--line-strong)"/>` +
      // 이익
      `<rect x="${bx}" y="${top + 60 - gain}" width="${bw}" height="${gain}" rx="3" fill="var(--up-soft)" stroke="var(--up)"/>` +
      txt(bx + bw / 2, top + 60 - gain / 2 + 4, '+300만', { size: 11, weight: 700, fill: 'var(--up)', mono: 1 }) +
      // 손실
      `<rect x="${bx}" y="${top + 60}" width="${bw}" height="${loss}" rx="3" fill="var(--down-soft)" stroke="var(--down)"/>` +
      txt(bx + bw / 2, top + 60 + loss / 2 + 4, '−100만', { size: 10, weight: 700, fill: 'var(--down)', mono: 1 }) +
      // 과세 대상 안내
      txt(bx + bw / 2, top + 96, note, { size: 11, weight: 700, fill: col }) +
      txt(bx + bw / 2, top + 112, `과세 ${taxedBase}`, { size: 10, fill: 'var(--mut)', mono: 1 })
    )
  }
  return svg(`0 0 ${W} ${H}`,
    stack(28, '일반 계좌', '300만원', '손실은 무시', false) +
    `<line x1="${W / 2}" x2="${W / 2}" y1="16" y2="${H - 12}" stroke="var(--line)" stroke-dasharray="3 4"/>` +
    stack(W / 2 + 24, 'ISA', '200만원', '손익통산', true))
}

// 주차 → 카드 인덱스 → 인포그래픽 (강의 카드에 주입할 때 사용)
export const FIGURES = {
  2: { 0: compoundVsSimple },
  3: { 0: leverageAmplify },
  4: { 1: drawdownRecovery },
  5: { 0: perExplain },
  6: { 2: taxOffset },
}
