// 화면 3-1 스플래시/온보딩, 시작(닉네임) — 회원가입 없음(빌드 브리프 확정)
import { h } from '../ui.js'
import { register, go } from '../router.js'
import { S, save } from '../state.js'
import { SLOGAN, DISCLAIMER } from '../content.js'

const ONB_CARDS = [
  { ico: '📉', t: '일단, 아무것도 모른 채 투자합니다', d: '교육도 설명도 없습니다. 가상 자금 1,000만 원으로 10년치 시장을 직접 겪어보세요. 잃어도 되는 곳이니까요.' },
  { ico: '🔍', t: '처참한 결과를 리포트로 받습니다', d: '수익률, 최대낙폭, 수수료… 그리고 당신의 매매 실수 3가지를 분석한 리포트가 도착합니다.' },
  { ico: '📚', t: '그 실패를 교재 삼아 배웁니다', d: '내가 잃었던 바로 그 구간으로 거시경제부터 배웁니다. 남의 예시가 아니라 내 데이터로요.' },
]

register('splash', () => {
  const dots = ONB_CARDS.map((_, i) => h('i', { class: i === 0 ? 'on' : '' }))
  const track = h('div', { class: 'onb-track' },
    ONB_CARDS.map(c => h('div', { class: 'onb-card' },
      h('span', { class: 'ico' }, c.ico),
      h('b', {}, c.t),
      h('p', { class: 'desc' }, c.d),
    )))
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / (track.scrollWidth / ONB_CARDS.length))
    dots.forEach((d, j) => d.classList.toggle('on', j === Math.min(i, ONB_CARDS.length - 1)))
  }, { passive: true })

  return h('div', { class: 'screen splash' },
    h('div', { class: 'splash-logo' }, '똑똑'),
    h('h1', { class: 'hero' }, '먼저 잃고,', h('br'), '똑똑해집니다'),
    h('p', { class: 'desc', style: 'margin-top:12px' },
      '지식 없이 시작한 투자는 어떻게 끝날까요?', h('br'), '여기서 미리, 안전하게 겪어보세요.'),
    track,
    h('div', { class: 'onb-dots' }, dots),
    h('div', { class: 'cta-area' },
      h('button', { class: 'btn', onclick: () => go('nickname') }, '바로 투자해보기'),
      h('p', { class: 'disclaimer' }, DISCLAIMER),
    ),
  )
})

register('nickname', () => {
  const input = h('input', {
    value: S.user.nickname || '',
    placeholder: '예: 주린이김똑똑',
    maxlength: '12',
    style: 'width:100%;border:2px solid var(--line);border-radius:14px;padding:16px;font-size:17px;font-weight:700;font-family:inherit;',
  })
  input.addEventListener('focus', () => (input.style.borderColor = 'var(--blue)'))
  input.addEventListener('blur', () => (input.style.borderColor = 'var(--line)'))
  const start = () => {
    const nick = input.value.trim() || '주린이'
    S.user.nickname = nick
    S.onboarded = true
    save()
    go('diag')
  }
  input.addEventListener('keydown', e => { if (e.key === 'Enter') start() })
  return h('div', { class: 'screen' },
    h('div', { class: 'topbar' }, h('button', { class: 'btn-back', onclick: () => go('splash') }, '‹')),
    h('h1', { class: 'hero', style: 'margin:8px 0 6px' }, '뭐라고 불러드릴까요?'),
    h('p', { class: 'desc' }, '회원가입은 없습니다. 닉네임 하나면 바로 시작해요.'),
    h('div', { style: 'margin-top:28px' }, input),
    h('div', { class: 'cta-area' },
      h('button', { class: 'btn', onclick: start }, '시작하기'),
      h('p', { class: 'disclaimer' }, '본 서비스는 투자 시뮬레이션 학습 도구이며, 실제 투자 조언이 아닙니다.'),
    ),
  )
})
