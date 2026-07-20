"""
뚝뚝 0단계/1주차 프로토타입용 목업 데이터 생성 스크립트.

중요: 이 스크립트가 만드는 데이터는 실제 과거 시세가 아니라, 금리 레짐에 따라
그럴듯하게 움직이도록 설계한 합성(synthetic) 데이터입니다. 프론트엔드 프로토타입이
동작하도록 하기 위한 목업이며, 실제 데이터 소스가 확정되면 이 파일들을 교체해야 합니다.

실행: python3 generate_mock_data.py
출력: rates.json, stocks.json, sp500_scenario.json (같은 폴더에 생성)
"""
import json
import numpy as np

rng = np.random.default_rng(seed=42)

# ---------------------------------------------------------------
# 1. 기준금리 시계열 (주 단위, 총 520주 ≈ 10년)
#    0단계 블라인드 자유투자에 쓰인다. 뚜렷한 긴축기(금리 인상)를 포함시켜
#    1주차 거시경제 학습(카드 3~4, 실습1)과 서사적으로 연결한다.
# ---------------------------------------------------------------
TOTAL_WEEKS = 520

def build_rate_series():
    weeks = []
    rate = 2.0
    for w in range(1, TOTAL_WEEKS + 1):
        if w <= 120:
            phase = "완화 유지"
            rate = 2.0
        elif w <= 220:
            phase = "긴축기 (금리 인상)"
            # 2.0% -> 5.0% 로 서서히 인상
            progress = (w - 120) / (220 - 120)
            rate = 2.0 + progress * 3.0
        elif w <= 300:
            phase = "고금리 유지"
            rate = 5.0
        elif w <= 420:
            phase = "완화 전환 (금리 인하)"
            progress = (w - 300) / (420 - 300)
            rate = 5.0 - progress * 2.5
        else:
            phase = "저금리 유지"
            rate = 2.5
        weeks.append({"week": w, "baseRate": round(rate, 2), "phase": phase})
    return weeks

rates = build_rate_series()
rate_by_week = {r["week"]: r["baseRate"] for r in rates}

# ---------------------------------------------------------------
# 2. 종목 8개 + 지수 ETF 1개 주간 종가 시계열
#    각 종목은 금리 레짐에 대한 민감도(beta)와 변동성(vol)이 다르게 설계됨
# ---------------------------------------------------------------
STOCKS = [
    {"code": "A전자",   "type": "성장주",   "beta": -1.4, "vol": 0.035, "start": 62000},
    {"code": "B바이오", "type": "고변동 테마주", "beta": -1.6, "vol": 0.05,  "start": 18000},
    {"code": "C케미칼", "type": "경기민감주", "beta": -0.6, "vol": 0.03,  "start": 34000},
    {"code": "D플랫폼", "type": "성장주",   "beta": -1.3, "vol": 0.04,  "start": 45000},
    {"code": "E에너지", "type": "원자재 연동", "beta":  0.3, "vol": 0.03,  "start": 27000},
    {"code": "F리테일", "type": "경기방어주", "beta": -0.3, "vol": 0.02,  "start": 15000},
    {"code": "G헬스케어","type": "방어주",    "beta": -0.1, "vol": 0.018, "start": 52000},
    {"code": "H반도체", "type": "고베타 성장주", "beta": -1.5, "vol": 0.045, "start": 71000},
]
INDEX_ETF = {"code": "지수ETF", "type": "지수 추종", "beta": -0.8, "vol": 0.018, "start": 10000}

def build_price_series(beta, vol, start_price):
    prices = [start_price]
    price = start_price
    prev_rate = rate_by_week[1]
    for w in range(2, TOTAL_WEEKS + 1):
        cur_rate = rate_by_week[w]
        rate_change = cur_rate - prev_rate  # %p, 레짐 구간에서는 양수(인상)/음수(인하)
        drift = beta * rate_change * 0.02  # 금리 변화가 주가 방향에 주는 압력
        noise = rng.normal(loc=0.0015, scale=vol)  # 약한 우상향 기본 드리프트 + 노이즈
        weekly_return = drift + noise
        price = max(price * (1 + weekly_return), start_price * 0.20)  # 시작가의 20% 절대 하한(파산 방지)
        prices.append(round(price, 1))
        prev_rate = cur_rate
    return prices

stock_series = {}
for s in STOCKS:
    stock_series[s["code"]] = {
        "type": s["type"],
        "prices": build_price_series(s["beta"], s["vol"], s["start"]),
    }
index_series = {
    "code": INDEX_ETF["code"],
    "type": INDEX_ETF["type"],
    "prices": build_price_series(INDEX_ETF["beta"], INDEX_ETF["vol"], INDEX_ETF["start"]),
}

stocks_output = {
    "meta": {
        "disclaimer": "실제 과거 시세가 아닌 합성 목업 데이터입니다. 금리 레짐에 따라 그럴듯하게 움직이도록 설계했습니다.",
        "totalWeeks": TOTAL_WEEKS,
        "unit": "주간 종가, 임의 통화 단위",
    },
    "stocks": [
        {"code": code, "type": v["type"], "prices": v["prices"]}
        for code, v in stock_series.items()
    ],
    "indexEtf": index_series,
}

# ---------------------------------------------------------------
# 3. 실습2용 "금리 인하기 급락-회복" 시나리오 (스타일라이즈드, 실제 지수 아님)
#    52주(1년) 구간, 급락 후 금리 인하와 함께 반등하는 모양을 의도적으로 만든다.
# ---------------------------------------------------------------
def build_crash_recovery_scenario():
    weeks = 52
    prices = []
    rates_scn = []
    price = 100.0
    rate = 4.0
    for w in range(1, weeks + 1):
        if w <= 6:
            # 급락 구간
            price *= (1 - rng.uniform(0.03, 0.07))
            rate = 4.0
        elif w <= 10:
            # 긴급 금리 인하 + 바닥 다지기
            rate = max(rate - rng.uniform(0.3, 0.6), 0.25)
            price *= (1 + rng.normal(0.0, 0.02))
        else:
            # 저금리 유지 + 반등
            rate = max(rate - rng.uniform(0.0, 0.05), 0.25)
            price *= (1 + rng.normal(0.02, 0.025))
        prices.append(round(price, 2))
        rates_scn.append(round(rate, 2))
    return prices, rates_scn

crash_prices, crash_rates = build_crash_recovery_scenario()

sp500_scenario = {
    "meta": {
        "disclaimer": "실제 2020년 S&P500 데이터가 아닙니다. '금리 인하와 지수 반등이 겹치는 모양'을 보여주기 위해 만든 스타일라이즈드(연출된) 시나리오입니다. 실제 데이터로 교체 전까지 실습2(가이드형 리플레이)의 임시 자료로 사용하세요.",
        "weeks": 52,
        "startIndexValue": 100.0,
    },
    "weeklyIndex": crash_prices,
    "weeklyBaseRate": crash_rates,
}

# ---------------------------------------------------------------
# 저장
# ---------------------------------------------------------------
with open("rates.json", "w", encoding="utf-8") as f:
    json.dump({"meta": {"disclaimer": "실제 한국은행 기준금리가 아닌 합성 목업 데이터입니다.", "totalWeeks": TOTAL_WEEKS}, "weeklyRates": rates}, f, ensure_ascii=False, indent=2)

with open("stocks.json", "w", encoding="utf-8") as f:
    json.dump(stocks_output, f, ensure_ascii=False, indent=2)

with open("sp500_scenario.json", "w", encoding="utf-8") as f:
    json.dump(sp500_scenario, f, ensure_ascii=False, indent=2)

print("생성 완료: rates.json, stocks.json, sp500_scenario.json")
