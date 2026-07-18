// 커스텀 SVG 라인차트 — 금리 레짐 밴드 오버레이 / 매매 마커 / 점진 재생(revealX) / 좌우 이중 축 지원
// 라이브러리 대신 직접 구현: 실습 화면들의 오버레이 요구가 특수해서 제어권이 필요.
const W = 720
const PAD = { t: 16, r: 46, b: 24, l: 50 }

function niceRange(min, max) {
  if (min === max) { min -= 1; max += 1 }
  const padY = (max - min) * 0.07
  return [min - padY, max + padY]
}

export function fmtCompact(n) {
  const abs = Math.abs(n)
  if (abs >= 1e8) return `${(n / 1e8).toFixed(1)}억`
  if (abs >= 1e4) return `${Math.round(n / 1e4).toLocaleString('ko-KR')}만`
  return Math.round(n).toLocaleString('ko-KR')
}

export default function LineChart({
  series,            // [{data:number[], startX=1, color, width=2, dash, axis:'left'|'right', label}]
  bands = [],        // [{from, to, color, label}]
  markers = [],      // [{x, y, kind:'buy'|'sell'}]
  height = 240,
  revealX = null,    // 이 x까지만 그리기 (점진 재생)
  fmtLeft = fmtCompact,
  fmtRight = (v) => v.toFixed(1),
  onBandClick = null,
}) {
  const H = height
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  let xMin = Infinity; let xMax = -Infinity
  const axisVals = { left: [], right: [] }
  for (const s of series) {
    const startX = s.startX ?? 1
    xMin = Math.min(xMin, startX)
    xMax = Math.max(xMax, startX + s.data.length - 1)
    axisVals[s.axis === 'right' ? 'right' : 'left'].push(...s.data)
  }
  const xTo = (x) => PAD.l + ((x - xMin) / Math.max(1, xMax - xMin)) * innerW

  const scales = {}
  for (const axis of ['left', 'right']) {
    if (!axisVals[axis].length) continue
    const [lo, hi] = niceRange(Math.min(...axisVals[axis]), Math.max(...axisVals[axis]))
    scales[axis] = (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * innerH
    scales[`${axis}Range`] = [lo, hi]
  }

  const clipX = revealX == null ? null : xTo(Math.min(revealX, xMax))
  const gridYs = [0, 0.5, 1].map((f) => PAD.t + f * innerH)
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(xMin + f * (xMax - xMin)))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img">
      {/* 레짐 밴드 */}
      {bands.map((b, i) => {
        const x1 = xTo(Math.max(b.from, xMin))
        const x2 = xTo(Math.min(b.to, xMax))
        if (x2 <= x1) return null
        return (
          <g key={i} onClick={onBandClick ? () => onBandClick(b) : undefined}
            style={onBandClick ? { cursor: 'pointer' } : undefined}>
            <rect x={x1} y={PAD.t} width={x2 - x1} height={innerH} fill={b.color} />
            {b.label && (
              <text x={(x1 + x2) / 2} y={PAD.t + 13} textAnchor="middle"
                fontSize="10.5" fontWeight="700" fill={b.labelColor || '#8b95a1'}>{b.label}</text>
            )}
          </g>
        )
      })}

      {/* 그리드 + y축 라벨 (좌) */}
      {scales.left && gridYs.map((y, i) => {
        const [lo, hi] = scales.leftRange
        const v = hi - (i / (gridYs.length - 1)) * (hi - lo)
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#e5e8eb" strokeWidth="1" />
            <text x={PAD.l - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill="#8b95a1">
              {fmtLeft(v)}
            </text>
          </g>
        )
      })}
      {/* y축 라벨 (우) */}
      {scales.right && gridYs.map((y, i) => {
        const [lo, hi] = scales.rightRange
        const v = hi - (i / (gridYs.length - 1)) * (hi - lo)
        return (
          <text key={i} x={W - PAD.r + 6} y={y + 3.5} textAnchor="start" fontSize="10" fill="#8b95a1">
            {fmtRight(v)}
          </text>
        )
      })}
      {/* x축 라벨 */}
      {xTicks.map((x, i) => (
        <text key={i} x={xTo(x)} y={H - 7} textAnchor="middle" fontSize="10" fill="#8b95a1">
          {x}주
        </text>
      ))}

      {/* 시리즈 */}
      <g clipPath={clipX != null ? 'url(#reveal)' : undefined}>
        {clipX != null && (
          <defs>
            <clipPath id="reveal">
              <rect x="0" y="0" width={clipX} height={H} />
            </clipPath>
          </defs>
        )}
        {series.map((s, i) => {
          const startX = s.startX ?? 1
          const scale = scales[s.axis === 'right' ? 'right' : 'left']
          const pts = s.data.map((v, j) => `${xTo(startX + j).toFixed(1)},${scale(v).toFixed(1)}`).join(' ')
          return (
            <polyline key={i} points={pts} fill="none"
              stroke={s.color} strokeWidth={s.width ?? 2}
              strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />
          )
        })}
      </g>

      {/* 매매 마커: 매수 ▲(빨강) / 매도 ▼(파랑) */}
      {markers.map((m, i) => {
        const x = xTo(m.x)
        const y = scales.left(m.y)
        const size = 5.5
        const pts = m.kind === 'buy'
          ? `${x},${y + 4} ${x - size},${y + 4 + size * 1.6} ${x + size},${y + 4 + size * 1.6}`
          : `${x},${y - 4} ${x - size},${y - 4 - size * 1.6} ${x + size},${y - 4 - size * 1.6}`
        return <polygon key={i} points={pts} fill={m.kind === 'buy' ? '#f04452' : '#3182f6'} />
      })}
    </svg>
  )
}
