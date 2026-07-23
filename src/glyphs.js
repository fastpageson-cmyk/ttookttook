// 단색 SVG 글리프 — OS 이모지 대체 (2026-07-22 디자인 원칙 정비)
// 원칙: 사진풍 OS 이모지는 플랫폼마다 다르게 렌더되고 디자인 시스템(보더 우선·단색)과 충돌한다.
// 색은 currentColor만 쓴다 → 부모의 CSS color(토큰)를 그대로 따라간다. infographics.js와 같은 계열.
const svg = (size, inner, vb = 24) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${vb} ${vb}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`

// 자물쇠 — 잠긴 진도/커리큘럼 행
export const lockGlyph = (size = 16) => svg(size,
  `<rect x="5" y="10.5" width="14" height="9.5" rx="2.5" stroke="currentColor" stroke-width="2"/>
   <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`)

// 졸업모 — 졸업 리포트 히어로·홈 졸업 카드
export const gradCapGlyph = (size = 44) => svg(size,
  `<path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
   <path d="M6.5 10.8v4.7c0 1.2 2.5 2.7 5.5 2.7s5.5-1.5 5.5-2.7v-4.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
   <path d="M21.5 8.5v5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`)

// 하락 차트 — 스플래시 카드 1 (아무것도 모른 채 투자)
export const chartDownGlyph = (size = 32) => svg(size,
  `<path d="M3 5v14a2 2 0 0 0 2 2h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
   <path d="m6.5 8 4.5 4.5 3-3L20 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="M20 11.5V15h-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`)

// 돋보기 — 스플래시 카드 2 (결과를 리포트로 받는다)
export const magnifierGlyph = (size = 32) => svg(size,
  `<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2"/>
   <path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`)

// 책 — 스플래시 카드 3 (실패를 교재 삼아 배운다)
export const bookGlyph = (size = 32) => svg(size,
  `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
   <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" stroke="currentColor" stroke-width="2"/>
   <path d="M8.5 7.5h7M8.5 11h4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`)

// 코인 — 사전 게이미피케이션 획득 포인트 (동그라미 + 안쪽 '원' 표식)
export const coinGlyph = (size = 20) => svg(size,
  `<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/>
   <circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/>`)

// 불꽃 — 연속 정답(콤보) 스트릭 표시
export const flameGlyph = (size = 18) => svg(size,
  `<path d="M12 3c.5 3-1.8 3.8-3 5.5-1.4 2-2 3.6-2 5.5a5 5 0 0 0 10 0c0-1.6-.6-3-1.6-4.2-.4 1-1 1.6-1.9 1.9.6-2.4-.3-5.7-1.5-8.7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`)

// 격자(사전) — 마이페이지 진입 카드·사전 헤더
export const gridGlyph = (size = 22) => svg(size,
  `<rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
   <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
   <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
   <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>`)

// 트로피 — 퀴즈 결과 등급
export const trophyGlyph = (size = 40) => svg(size,
  `<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
   <path d="M7 6H4.5v1A3.5 3.5 0 0 0 8 10.5M17 6h2.5v1A3.5 3.5 0 0 1 16 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
   <path d="M12 14v3M8.5 20h7M9.5 20c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`)
