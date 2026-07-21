#!/usr/bin/env python3
"""실습2(금리 인하기 리플레이)용 2020년 실제 데이터 생성 스크립트.

출처: FRED (Federal Reserve Bank of St. Louis)
  - SP500 : S&P 500 지수 종가 (일별)
  - DFF   : Effective Federal Funds Rate, 미국 실효 연방기금금리 (일별)

FRED의 CSV 엔드포인트는 API 키 없이 공개되어 있다. 일별 데이터를 주 단위(그 주의
마지막 거래일 종가)로 리샘플링해 52주 배열로 만든다. 재실행하면 같은 결과가 나온다.

사용법:  python3 fetch_sp500_2020.py
출력  :  sp500_scenario.json (같은 폴더) — src/data/ 로도 복사할 것
"""
import csv
import io
import json
import urllib.request
from datetime import date

FRED = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}&cosd={start}&coed={end}'
START, END = '2019-12-23', '2021-01-05'  # 주 경계 보정을 위해 앞뒤로 여유


def fetch(series_id):
    url = FRED.format(sid=series_id, start=START, end=END)
    with urllib.request.urlopen(url, timeout=30) as r:
        text = r.read().decode('utf-8')
    rows = list(csv.reader(io.StringIO(text)))
    out = {}
    for d, v in rows[1:]:
        if v in ('.', ''):      # 휴장일·결측
            continue
        out[date.fromisoformat(d)] = float(v)
    return out


def weekly_last(daily, year=2020):
    """ISO 주차별 '마지막 관측치'로 리샘플링."""
    buckets = {}
    for d, v in sorted(daily.items()):
        iso_year, iso_week, _ = d.isocalendar()
        if iso_year != year:
            continue
        buckets[iso_week] = v      # 정렬되어 있으므로 마지막 값이 남는다
    return [buckets[w] for w in sorted(buckets) if w <= 52]


def main():
    idx = weekly_last(fetch('SP500'))
    rate = weekly_last(fetch('DFF'))
    n = min(len(idx), len(rate), 52)
    idx, rate = idx[:n], rate[:n]

    # 최대 낙폭(MDD) — 러닝 피크 대비 최저점. 단순 max/min으로 잡으면
    # 연말 고점이 잡혀 낙폭이 사라지므로 반드시 진행 방향으로 계산한다.
    run_peak, mdd, peak, trough_after_peak = idx[0], 0.0, idx[0], idx[0]
    for v in idx:
        run_peak = max(run_peak, v)
        dd = v / run_peak - 1
        if dd < mdd:
            mdd, peak, trough_after_peak = dd, run_peak, v
    data = {
        'meta': {
            'source': 'FRED (Federal Reserve Bank of St. Louis) — SP500, DFF',
            'sourceUrl': 'https://fred.stlouisfed.org/series/SP500',
            'description': (
                '2020년 실제 S&P 500 주간 종가와 미국 실효 연방기금금리(주간). '
                '코로나19 급락과 연준의 긴급 금리 인하, 이후 반등이 그대로 담겨 있다.'
            ),
            'weeks': n,
            'year': 2020,
            'startIndexValue': round(idx[0], 2),
            'peak': round(peak, 2),
            'trough': round(trough_after_peak, 2),
            'maxDrawdownPct': round(mdd * 100, 1),
            'yearReturnPct': round((idx[-1] / idx[0] - 1) * 100, 1),
            'rateStart': rate[0],
            'rateEnd': rate[-1],
            'generatedBy': 'docs/콘텐츠/mock-data/fetch_sp500_2020.py',
        },
        'weeklyIndex': [round(v, 2) for v in idx],
        'weeklyBaseRate': [round(v, 2) for v in rate],
    }
    with open('sp500_scenario.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(json.dumps(data['meta'], ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
