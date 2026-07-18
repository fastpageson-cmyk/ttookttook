import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 포트 5175 고정: 같은 머신에서 처인:담다(5173) 등 다른 프로토타입과 동시 실행 대비
export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
})
