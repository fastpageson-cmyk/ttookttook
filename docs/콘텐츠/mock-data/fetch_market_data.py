#!/usr/bin/env python3
"""0단계·미니 모의투자용 실제 시장 데이터 생성 스크립트 (stocks.json / rates.json).

출처
  - 주가·지수 : FinanceDataReader (한국거래소 공개 시세). 수정주가 기준.
  - 기준금리   : FRED `IRSTCI01KRM156N`
                (OECD, Immediate Rates: Central Bank Rates for Korea — 월평균 콜금리 수준)
  - ⚠️ 위 금리는 한국은행이 발표하는 '기준금리' 그 자체가 아니라 월평균 단기금리다.
       정책 방향(인상/인하 국면)을 보여주는 용도로는 충분하지만, 특정 시점의
       기준금리 값을 인용할 때는 한국은행 원자료를 확인할 것.

기간: 2016-07 ~ 2026-07 (520주). 종목 선정 근거는 README 참조.

사용법:
    pip install finance-datareader
    python3 fetch_market_data.py
출력: stocks.json, rates.json (같은 폴더) — src/data/ 로도 복사할 것
"""
import csv
import io
import json
import urllib.request
from datetime import date

import FinanceDataReader as fdr

WEEKS = 520
START, END = '2016-07-01', '2026-07-17'

# 0단계의 교육 의도: "무지식 상태의 단일 종목 몰빵/단타는 예측 불가능한 고변동이며,
# 대부분 지수를 이기지 못한다"를 실데이터로 체감시킨다. (2026-07-22 재선정)
# 선정 기준 — ①실제 화제였던 대형·테마주(주린이가 몰빵했을 법한 이름) ②전부 큰 낙폭 경험
# (몰빵 최악 -74~-96%) ③8종목 중 6종목이 KOSPI(+238%)에 미달. 나머지 2종목(두산에너빌리티·
# 삼성SDI)은 지수를 이겼지만 -80~90% 폭락을 견뎌야 했다 → "이겨도 예측 불가·고통"을 보여준다.
# 즉 '몰빵=무조건 손실'(거짓)이 아니라 '몰빵=고변동·예측 불가'(참)를 가르친다. 특정 종목 추천이 아니다.
# 이전 구성(삼성전자·SK하이닉스 등)은 SK하이닉스 +5255%처럼 장기 몰빵이 대박으로 보여 교육 의도와 어긋났다.
STOCKS = [
    ('096530', '씨젠', '진단키트 테마주'),
    ('019170', '신풍제약', '코로나 치료제 테마주'),
    ('011200', 'HMM', '해운 경기순환주'),
    ('035720', '카카오', '플랫폼 성장주'),
    ('090430', '아모레퍼시픽', '중국 소비 테마주'),
    ('036570', '엔씨소프트', '게임 성장주'),
    ('034020', '두산에너빌리티', '원전·중공업주'),
    ('006400', '삼성SDI', '2차전지 성장주'),
]
INDEX = ('KS11', 'KOSPI', '지수 추종')

FRED = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}&cosd=2015-01-01&coed=2026-12-31'


def weekly_close(code):
    s = fdr.DataReader(code, START, END)['Close'].resample('W-FRI').last().dropna()
    return s


def fetch_rate_monthly():
    with urllib.request.urlopen(FRED.format(sid='IRSTCI01KRM156N'), timeout=30) as r:
        rows = list(csv.reader(io.StringIO(r.read().decode('utf-8'))))[1:]
    return [(date.fromisoformat(d), float(v)) for d, v in rows if v not in ('.', '')]


def classify(levels):
    """주간 금리 계열 → 국면 라벨. 화면(실습1 밴드)이 쓰는 5개 라벨을 그대로 생성한다."""
    n = len(levels)
    raw = []
    for i, v in enumerate(levels):
        j = max(0, i - 26)
        chg = v - levels[j]
        if chg > 0.25:
            raw.append('긴축기 (금리 인상)')
        elif chg < -0.25:
            raw.append('완화 전환 (금리 인하)')
        elif v >= 3.0:
            # 3% 이상에서 횡보할 때만 '고금리 유지'. 2%대는 3.5%에서 내려온 완화 국면이라
            # 고금리로 부르면 오해를 준다(2016~2018년의 1%대와도 구분되어야 함).
            raw.append('고금리 유지')
        elif v <= 1.0:
            raw.append('저금리 유지')
        else:
            raw.append('완화 유지')
    # 짧은 조각(8주 미만)은 앞 구간에 흡수 — 밴드가 잘게 쪼개지지 않도록
    out = raw[:]
    i = 0
    while i < n:
        j = i
        while j + 1 < n and out[j + 1] == out[i]:
            j += 1
        if j - i + 1 < 8 and i > 0:
            for k in range(i, j + 1):
                out[k] = out[i - 1]
            i = 0  # 병합 후 처음부터 다시 훑는다
            continue
        i = j + 1
    return out


def main():
    idx = weekly_close(INDEX[0]).tail(WEEKS)
    dates = list(idx.index)
    assert len(dates) == WEEKS, f'지수 주간 데이터가 {len(dates)}주 (520주 필요)'

    # 금리: 월별 → 주별 forward-fill (정책금리는 계단식이므로 보간하지 않는다)
    monthly = fetch_rate_monthly()
    weekly_rate = []
    for d in dates:
        dd = d.date()
        v = [val for md, val in monthly if md <= dd]
        weekly_rate.append(round(v[-1], 2) if v else monthly[0][1])
    phases = classify(weekly_rate)

    rates = {
        'meta': {
            'source': 'FRED IRSTCI01KRM156N (OECD, Immediate Rates: Central Bank Rates for Korea)',
            'sourceUrl': 'https://fred.stlouisfed.org/series/IRSTCI01KRM156N',
            'note': ('한국은행 기준금리 원자료가 아니라 월평균 단기(콜)금리 수준이다. '
                     '금리 국면(인상/인하)을 보여주는 용도로 사용한다.'),
            'period': f'{dates[0].date()} ~ {dates[-1].date()}',
            'totalWeeks': WEEKS,
            'generatedBy': 'docs/콘텐츠/mock-data/fetch_market_data.py',
        },
        'weeklyRates': [
            {'week': i + 1, 'baseRate': weekly_rate[i], 'phase': phases[i]}
            for i in range(WEEKS)
        ],
    }

    def pack(code, name, typ):
        s = weekly_close(code).reindex(dates).ffill().bfill()
        return {'code': name, 'ticker': code, 'type': typ,
                'prices': [round(float(v), 1) for v in s.values]}

    stocks = {
        'meta': {
            'source': 'FinanceDataReader (한국거래소 공개 시세, 수정주가)',
            'period': f'{dates[0].date()} ~ {dates[-1].date()}',
            'totalWeeks': WEEKS,
            'unit': '주간 종가(원)',
            'disclaimer': ('실제 과거 시세다. 특정 종목에 대한 추천·평가가 아니며 '
                           '과거 수익률은 미래를 보장하지 않는다. 교육용으로만 사용한다.'),
            'generatedBy': 'docs/콘텐츠/mock-data/fetch_market_data.py',
        },
        'stocks': [pack(c, n, t) for c, n, t in STOCKS],
        'indexEtf': pack(*INDEX),
    }

    for fn, obj in (('rates.json', rates), ('stocks.json', stocks)):
        with open(fn, 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)

    # 요약 출력
    print(f"기간 {dates[0].date()} ~ {dates[-1].date()} ({WEEKS}주)")
    print('\n[금리 국면]')
    cur, s0 = phases[0], 0
    for i in range(1, WEEKS + 1):
        if i == WEEKS or phases[i] != cur:
            print(f'  {s0+1:3d}~{i:3d}주  {cur:18s} {weekly_rate[s0]:.2f}% → {weekly_rate[i-1]:.2f}%')
            if i < WEEKS:
                cur, s0 = phases[i], i
    print('\n[종목 10년 성과]')
    for s in stocks['stocks'] + [stocks['indexEtf']]:
        p = s['prices']
        peak, mdd = p[0], 0.0
        for v in p:
            peak = max(peak, v)
            mdd = min(mdd, v / peak - 1)
        print(f"  {s['code']:8s} {s['type']:12s} {(p[-1]/p[0]-1)*100:+9.1f}%  MDD {mdd*100:6.1f}%")


if __name__ == '__main__':
    main()
