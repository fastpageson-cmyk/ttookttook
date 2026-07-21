#!/usr/bin/env python3
"""5주차(기업 분석)용 실제 재무지표 생성 스크립트 → fundamentals.json

출처
  - 재무제표 : DART 오픈API (금융감독원 전자공시) `fnlttSinglAcntAll`
               연결재무제표(CFS) 우선, 없으면 개별(OFS). 사업보고서(reprt_code=11011).
  - 주가/주식수 : FinanceDataReader (KRX 공개시세)

지표 계산 (모두 '공시 시점' 기준)
  - 영업이익률 = 영업이익 / 매출액
  - PER        = 시가총액 / 당기순이익
  - PBR        = 시가총액 / 자본총계
  - 업종 평균 PER = 같은 업종 비교군(peer)들의 PER 중앙값 — 실제로 계산한 값

⚠️ API 키는 환경변수 DART_API_KEY 또는 .env.local 에서 읽는다.
   키를 코드·출력 JSON·프론트엔드 번들에 절대 넣지 않는다(이 앱은 정적 SPA라 번들은 공개된다).

사용법:
    cp .env.example .env.local   # 그리고 키를 채운다
    python3 fetch_dart_fundamentals.py
출력: fundamentals.json (같은 폴더) — src/data/ 로도 복사할 것
"""
import json
import os
import urllib.parse
import urllib.request
from statistics import median

import FinanceDataReader as fdr

# 사업연도: 이 보고서가 공시된 뒤의 1년을 투자 구간으로 쓴다.
FISCAL_YEAR = 2024
# 사업보고서는 보통 다음 해 3월 말에 공시된다 → 그 이후부터 지표를 '알 수 있는' 상태가 된다.
WINDOW_START = f'{FISCAL_YEAR + 1}-04-01'
WEEKS = 52

# 앱에서 고를 수 있는 8종목 + 업종 평균 계산용 비교군(peer)
UNIVERSE = [
    ('005930', '삼성전자', '반도체'),
    ('000660', 'SK하이닉스', '반도체'),
    ('035420', 'NAVER', '인터넷'),
    ('035720', '카카오', '인터넷'),
    ('005380', '현대차', '자동차'),
    ('033780', 'KT&G', '필수소비재'),
    ('090430', '아모레퍼시픽', '필수소비재'),
    ('015760', '한국전력', '유틸리티'),
]
PEERS = [
    ('000990', 'DB하이텍', '반도체'),
    ('036570', '엔씨소프트', '인터넷'),
    ('000270', '기아', '자동차'),
    ('051900', 'LG생활건강', '필수소비재'),
    ('036460', '한국가스공사', '유틸리티'),
]

DART = 'https://opendart.fss.or.kr/api'


def api_key():
    k = os.environ.get('DART_API_KEY')
    if not k:
        try:
            # 이 스크립트는 docs/콘텐츠/mock-data/ 에 있으므로 프로젝트 루트는 세 단계 위
            root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
            for line in open(os.path.join(root, '.env.local'), encoding='utf-8'):
                line = line.strip()
                if line.startswith('DART_API_KEY='):
                    k = line.split('=', 1)[1].strip()
        except FileNotFoundError:
            pass
    if not k:
        raise SystemExit('DART_API_KEY 가 없습니다. .env.example 를 .env.local 로 복사해 키를 넣으세요.')
    return k


def corp_map(key):
    import io
    import zipfile
    import xml.etree.ElementTree as ET
    raw = urllib.request.urlopen(f'{DART}/corpCode.xml?crtfc_key={key}', timeout=60).read()
    z = zipfile.ZipFile(io.BytesIO(raw))
    root = ET.fromstring(z.read(z.namelist()[0]))
    out = {}
    for c in root.iter('list'):
        sc = (c.findtext('stock_code') or '').strip()
        if sc:
            out[sc] = c.findtext('corp_code')
    return out


def _num(v):
    v = (v or '').replace(',', '').strip()
    if v in ('', '-'):
        return None
    try:
        return int(v)
    except ValueError:
        return None


def financials(key, corp_code):
    """연결(CFS) 우선, 없으면 개별(OFS). 매출액·영업이익·당기순이익·자본총계를 뽑는다."""
    for fs in ('CFS', 'OFS'):
        q = urllib.parse.urlencode({
            'crtfc_key': key, 'corp_code': corp_code,
            'bsns_year': str(FISCAL_YEAR), 'reprt_code': '11011', 'fs_div': fs,
        })
        d = json.loads(urllib.request.urlopen(f'{DART}/fnlttSinglAcntAll.json?{q}', timeout=40).read())
        if d.get('status') != '000':
            continue
        # 계정'명'은 회사마다 다르다(매출액/영업수익, 당기순이익(손실)/연결당기순이익 …).
        # 반면 IFRS 표준 계정 ID는 동일하므로 ID로 매칭하고, ID가 없을 때만 이름으로 보정한다.
        BY_ID = {
            'ifrs-full_Revenue': 'revenue',
            'dart_OperatingIncomeLoss': 'op',
            'ifrs-full_ProfitLoss': 'net',
            'ifrs-full_Equity': 'equity',
        }
        BY_NAME = {
            '매출액': 'revenue', '영업수익': 'revenue',
            '영업이익': 'op', '영업이익(손실)': 'op',
            '당기순이익': 'net', '당기순이익(손실)': 'net', '연결당기순이익': 'net',
            '자본총계': 'equity',
        }
        picked = {}
        for it in d['list']:
            amt = _num(it.get('thstrm_amount'))
            if amt is None:
                continue
            key_ = BY_ID.get((it.get('account_id') or '').strip())
            if not key_:
                key_ = BY_NAME.get(it['account_nm'].replace(' ', ''))
            # 자본총계는 재무상태표에서만, 손익 항목은 손익계산서에서만 인정
            if not key_:
                continue
            if key_ == 'equity' and it['sj_div'] != 'BS':
                continue
            if key_ != 'equity' and it['sj_div'] not in ('IS', 'CIS'):
                continue
            picked.setdefault(key_, amt)   # 같은 항목이 여러 번 나오면 첫 번째(대표 계정)
        if {'revenue', 'op', 'net', 'equity'} <= picked.keys():
            picked['fs_div'] = fs
            return picked
    return None


def interim(key, corp_code, year=FISCAL_YEAR + 1):
    """반기보고서(11012)의 매출·영업이익 + 전년 동기 대비.
    5주차의 '진짜 신호' 이벤트를 지어내지 않고 실제 공시 숫자로 만들기 위해 쓴다."""
    for fs in ('CFS', 'OFS'):
        q = urllib.parse.urlencode({
            'crtfc_key': key, 'corp_code': corp_code,
            'bsns_year': str(year), 'reprt_code': '11012', 'fs_div': fs,
        })
        d = json.loads(urllib.request.urlopen(f'{DART}/fnlttSinglAcntAll.json?{q}', timeout=40).read())
        if d.get('status') != '000':
            continue
        cur, prev = {}, {}
        for it in d['list']:
            k = {'ifrs-full_Revenue': 'revenue', 'dart_OperatingIncomeLoss': 'op'}.get(
                (it.get('account_id') or '').strip())
            if not k or it['sj_div'] not in ('IS', 'CIS'):
                continue
            # 반기·분기 보고서는 '_add_amount'가 누적치(반기=6개월)다.
            # thstrm_amount 는 해당 분기 3개월치라 전년 동기 비교에 쓰면 기준이 어긋난다.
            cur.setdefault(k, _num(it.get('thstrm_add_amount')) or _num(it.get('thstrm_amount')))
            prev.setdefault(k, _num(it.get('frmtrm_add_amount')) or _num(it.get('frmtrm_q_amount')))
        if cur.get('revenue') and cur.get('op'):
            out = {'revenue': cur['revenue'], 'op': cur['op']}
            if prev.get('revenue'):
                out['revenueYoY'] = round((cur['revenue'] / prev['revenue'] - 1) * 100, 1)
            if prev.get('op') and prev['op'] > 0:
                out['opYoY'] = round((cur['op'] / prev['op'] - 1) * 100, 1)
            return out
    return None


def latest_report(key, corp_code):
    """정기공시 목록에서 반기보고서의 실제 접수일을 가져온다."""
    q = urllib.parse.urlencode({
        'crtfc_key': key, 'corp_code': corp_code,
        'bgn_de': f'{FISCAL_YEAR + 1}0701', 'end_de': f'{FISCAL_YEAR + 1}1031',
        'pblntf_ty': 'A', 'page_count': '10',
    })
    d = json.loads(urllib.request.urlopen(f'{DART}/list.json?{q}', timeout=40).read())
    for it in (d.get('list') or []):
        if '반기보고서' in it['report_nm']:
            return {'date': it['rcept_dt'], 'name': it['report_nm']}
    return None


def main():
    key = api_key()
    cmap = corp_map(key)
    listing = fdr.StockListing('KRX').set_index('Code')

    # 지표 산정 기준일의 주가 — 공시 직후 시점
    px_at = {}
    weekly = {}
    for code, name, _ in UNIVERSE + PEERS:
        s = fdr.DataReader(code, WINDOW_START, '2026-07-17')['Close'].resample('W-FRI').last().dropna()
        px_at[code] = float(s.iloc[0])
        if any(code == c for c, _, _ in UNIVERSE):
            weekly[name] = [round(float(v), 1) for v in s.values[:WEEKS]]

    rows = {}
    for code, name, sector in UNIVERSE + PEERS:
        f = financials(key, cmap[code])
        if not f:
            print(f'  ⚠️ {name}: 재무제표를 못 받음 — 건너뜀')
            continue
        shares = int(listing.loc[code, 'Stocks'])
        mcap = px_at[code] * shares
        rows[name] = {
            'code': code, 'sector': sector, 'fsDiv': f['fs_div'],
            'per': round(mcap / f['net'], 1) if f['net'] and f['net'] > 0 else None,
            'pbr': round(mcap / f['equity'], 2) if f['equity'] else None,
            'opm': round(f['op'] / f['revenue'] * 100, 1) if f['revenue'] else None,
            'revenue': f['revenue'], 'op': f['op'], 'net': f['net'],
        }

    # 업종 평균 PER — 비교군 포함 같은 업종 PER의 중앙값(적자 기업 제외)
    sector_per = {}
    for _, _, sector in UNIVERSE + PEERS:
        vals = [r['per'] for r in rows.values() if r['sector'] == sector and r['per'] and r['per'] > 0]
        if vals:
            sector_per[sector] = round(median(vals), 1)

    universe = []
    for _, name, sector in UNIVERSE:
        if name not in rows:
            continue
        r = dict(rows[name])
        r['sectorPer'] = sector_per.get(sector)
        r['peers'] = [n for n, x in rows.items() if x['sector'] == sector and n != name]
        r['name'] = name
        # 실제 반기보고서 — 5주차 '신호' 이벤트를 지어내지 않기 위해 실제 공시·실적을 함께 저장
        rep = latest_report(key, cmap[r['code']])
        itm = interim(key, cmap[r['code']])
        if rep and itm:
            r['disclosure'] = {**rep, **itm}
        universe.append(r)

    out = {
        'meta': {
            'source': 'DART 오픈API (금융감독원 전자공시) — 사업보고서 재무제표 / FinanceDataReader (주가·상장주식수)',
            'sourceUrl': 'https://opendart.fss.or.kr/',
            'fiscalYear': FISCAL_YEAR,
            'valuationDate': WINDOW_START,
            'weeks': WEEKS,
            'note': ('지표는 {y}년 사업보고서(공시 후 시점 주가 기준)로 계산했다. '
                     'PER=시가총액/당기순이익, PBR=시가총액/자본총계, 영업이익률=영업이익/매출액. '
                     '업종 평균 PER은 같은 업종 비교군 PER의 중앙값이다. '
                     '특정 종목에 대한 추천이 아니며 과거 수익률은 미래를 보장하지 않는다.').format(y=FISCAL_YEAR),
            'generatedBy': 'docs/콘텐츠/mock-data/fetch_dart_fundamentals.py',
        },
        'universe': universe,
        'weeklyPrices': weekly,
    }
    with open('fundamentals.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    print(f'\n{FISCAL_YEAR}년 사업보고서 기준 · 평가일 {WINDOW_START}')
    print(f"{'종목':12s} {'업종':8s} {'PER':>7s} {'업종평균':>8s} {'PBR':>6s} {'영업이익률':>8s} {'52주후':>8s}")
    for r in universe:
        px = weekly[r['name']]
        ret = (px[-1] / px[0] - 1) * 100 if len(px) >= 2 else float('nan')
        per = f"{r['per']:.1f}" if r['per'] else '적자'
        print(f"{r['name']:12s} {r['sector']:8s} {per:>7s} {str(r['sectorPer']):>8s} "
              f"{r['pbr']:>6.2f} {r['opm']:>7.1f}% {ret:>+7.1f}%")


if __name__ == '__main__':
    main()
