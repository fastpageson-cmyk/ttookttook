// 3-6 0단계 종료 리포트 — 수익률/MDD/매매횟수/수수료 + 지수ETF 적립 매수 비교선 + 전체 매매 로그
import { useStore } from '../state/store.jsx'
import { fmtWon, fmtPct } from '../engine/constants.js'
import LineChart from '../components/LineChart.jsx'

export default function SessionReport() {
  const { state, dispatch } = useStore()
  const { report, simulation: sim } = state
  const r = report

  return (
    <div>
      <div className="eyebrow">0단계 결과</div>
      <h2 className="section-title mt8">
        {state.user.nickname}님의 첫 투자,<br />
        {r.finalReturn >= 0 ? '이렇게 끝났습니다' : '숫자로 확인해보세요'}
      </h2>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">최종 수익률</div>
          <div className={`stat-value ${r.finalReturn >= 0 ? 'pos' : 'neg'}`}>{fmtPct(r.finalReturn)}</div>
          <div className="stat-sub">{fmtWon(sim.startingCash)} → {fmtWon(r.finalValue)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">지수ETF에 적립만 했다면</div>
          <div className={`stat-value ${r.benchmarkReturn >= 0 ? 'pos' : 'neg'}`}>{fmtPct(r.benchmarkReturn)}</div>
          <div className="stat-sub">같은 돈, 4주마다 기계적 매수</div>
        </div>
        <div className="stat">
          <div className="stat-label">최대낙폭 (MDD)</div>
          <div className="stat-value neg">{fmtPct(r.mdd)}</div>
          <div className="stat-sub">고점 대비 가장 깊은 하락</div>
        </div>
        <div className="stat">
          <div className="stat-label">매매 횟수 · 비용</div>
          <div className="stat-value">{r.totalTrades}회</div>
          <div className="stat-sub">수수료·세금 {fmtWon(r.totalFees)}</div>
        </div>
      </div>

      <div className="card pad">
        <b style={{ fontSize: 14.5 }}>내 계좌 vs 지수ETF 적립 매수</b>
        <LineChart
          height={210}
          series={[
            { data: sim.valueHistory, color: '#3182f6', width: 2.2 },
            { data: r.benchmarkHistory, color: '#8b95a1', width: 2, dash: '6 5' },
          ]}
        />
        <div className="legend">
          <span><span className="sw" style={{ background: '#3182f6' }} />내 계좌</span>
          <span><span className="sw" style={{ background: '#8b95a1' }} />지수ETF 4주 적립 매수</span>
        </div>
      </div>

      <div className="card pad mt16">
        <b style={{ fontSize: 14.5 }}>전체 매매 로그 ({sim.trades.length}건)</b>
        {sim.trades.length === 0 ? (
          <p className="muted mt8">매매 기록이 없습니다.</p>
        ) : (
          <div style={{ maxHeight: 240, overflowY: 'auto', marginTop: 8 }}>
            <table className="trade-log">
              <thead>
                <tr><th>주차</th><th>종목</th><th>구분</th><th>수량</th><th>체결가</th><th>수수료</th></tr>
              </thead>
              <tbody>
                {sim.trades.map((t) => (
                  <tr key={t.id}>
                    <td>{t.week}주</td>
                    <td>{t.stockCode}</td>
                    <td><span className={`badge ${t.type}`}>{t.type === 'buy' ? '매수' : '매도'}</span></td>
                    <td>{t.quantity}</td>
                    <td>{fmtWon(t.price)}</td>
                    <td>{fmtWon(t.fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="tiny mt8">이 매매 기록이 다음 화면 실수 분석의 입력 데이터가 됩니다.</p>
      </div>

      <button className="btn block mt20" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'aiReport' })}>
        내 실수 보기 →
      </button>
    </div>
  )
}
