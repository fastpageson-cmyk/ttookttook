// 초경량 화면 라우터 — 화면 = 이름별 render 함수
import { h } from './ui.js'

const screens = {}
const cleanups = []
let current = { name: null, params: {} }

export function register(name, fn) { screens[name] = fn }

export function go(name, params = {}) {
  current = { name, params }
  render()
}

// 화면 이탈 시 정리(타이머 해제 등)가 필요한 화면이 등록
export function onLeave(fn) { cleanups.push(fn) }

export function render() {
  while (cleanups.length) { try { cleanups.pop()() } catch { /* noop */ } }
  const root = document.getElementById('app')
  root.innerHTML = ''
  const fn = screens[current.name]
  root.append(fn ? fn(current.params) : h('div', { class: 'screen' }, '알 수 없는 화면: ' + current.name))
  window.scrollTo(0, 0)
}

export function tabbar(active) {
  const tab = (name, ico, label, screen) =>
    h('button', { class: active === name ? 'active' : '', onclick: () => go(screen) },
      h('span', { class: 'ico' }, ico), label)
  return h('nav', { class: 'tabbar' },
    tab('home', '🏠', '홈', 'home'),
    tab('my', '👤', '마이', 'my'),
  )
}
