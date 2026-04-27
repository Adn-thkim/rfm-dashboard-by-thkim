# RFM Dashboard

정적 CSV 데이터를 기반으로 고객 RFM 세그먼트 변화를 시각화하는 React 대시보드입니다.  
운영 관점에서 바로 확인해야 하는 핵심 지표를 상단 KPI 보드에 고정하고, 세그먼트 분포, 전이, 이탈 손실, 매출 품질, Win-back 성과를 탭 구조로 분리했습니다.

## Visit Dashboard

- 운영 대시보드: [RFM Dashboard](https://rfm-dashboard-by-thkim-git-main-taeho-kims-projects-bdfdf470.vercel.app)
- 로컬 확인: `npm install` 후 `npm run dev`

## Purpose

대시보드는 단순 분석 결과 화면이 아니라, 전이율 추이와 캠페인 효과를 지속적으로 추적하는 CRM 운영 모니터링 레이어입니다.

> 고객 포트폴리오의 건강성을 동적으로 감시하고, 이탈 손실을 최소화하기 위한 선제적 의사결정을 지원합니다.

구체적으로 아래 3가지 목적을 수행합니다.

1. **조기 경보 (Early Warning)**  
   At_Risk 모수 확대, `VIP → Loyal` 하향 전이 가속, 데드크로스와 같은 구조적 이상 신호를 임계치 기반으로 조기에 감지합니다.
2. **손실 정량화 (Loss Quantification)**  
   전이율과 ARPPU를 결합해 월별 예상 손실액을 계산하고, 마케팅 자원 배분 우선순위를 금액 기준으로 판단할 수 있게 합니다.
3. **실행안 추적 (Campaign Monitoring)**  
   `At_Risk → Dormant` 방어 캠페인의 복귀율, 전이율 감소, Revenue Uplift를 추적하고 ROI 시뮬레이션과 실제 성과를 비교합니다.

## Overview

- 프론트엔드: `React 19` + `Vite`
- 차트: `Recharts`
- 데이터 소스: `public/data/*.csv`
- 배포 방식: Vercel 등 정적 호스팅
- 현재 프론트엔드는 `/api/*`를 호출하지 않으며, 로드 시 CSV를 직접 `fetch`합니다.

## Dashboard Structure

### Panel 1. KPI Scoreboard
- 활성 고객 수
- 휴면 비율
- 예상 이탈 손실액
- VIP + Loyal 매출 집중도
- Dead Cross Index

### Tab 1. Segment Composition
- 월별 세그먼트 구성 스택 영역 차트
- `Dormant` 포함/제외 토글
- 절대값/비율 모드 전환

### Tab 2. Transition Heatmap
- 7x7 세그먼트 전이 히트맵
- 월 슬라이더
- 위험 전이 경로 강조

### Tab 3. Churn Loss Quantification
- 최신 월 예상 손실액
- 연간 환산 손실액
- 월별 손실 추이
- 손실 3요인 분해

### Tab 4. Revenue Quality
- 세그먼트별 매출 추이
- 세그먼트별 ARPPU 추이
- 최신 월 버블 차트

### Tab 5. Campaign KPI Tracker
- At_Risk → Loyal 복귀율
- At_Risk → Dormant 전이율
- Dormant → 활성 Win-back Rate
- ROI 시나리오 기준선 비교

## Data Files

앱은 아래 3개 CSV만으로 동작합니다.

- `public/data/monthly_segment_kpi.csv`
  - 세그먼트별 고객 수, 비중, 매출, ARPPU, AOV, 평균 구매 빈도
- `public/data/monthly_full_transition.csv`
  - 월별 세그먼트 간 전이 수와 전이율
- `public/data/weekly_cohort_flow.csv`
  - 주별 신규 유입, 신규 휴면, Dead Cross Index

데이터 정의는 [doc/DATA_TABLES.md](./doc/DATA_TABLES.md)에서 확인할 수 있습니다.

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

브라우저에서 Vite 개발 서버 주소를 열면 됩니다.

### 3. Production build

```bash
npm run build
npm run preview
```

## Data Refresh

CSV를 다시 생성하려면 Python 스크립트를 사용합니다.

### Prerequisites

- MySQL access
- Python 3.x
- `.env` 또는 OS 환경변수

필수 환경변수:

```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=ecommerce
```

### Install Python packages

```bash
pip install pandas sqlalchemy pymysql python-dotenv
```

### Extract CSV files

```bash
python scripts/extract_data.py
```

실행 결과:

- `public/data/monthly_segment_kpi.csv`
- `public/data/monthly_full_transition.csv`
- `public/data/weekly_cohort_flow.csv`

\* `scripts/extract_data.py`는 로컬 DB 접근 정보와 내부 추출 로직이 포함돼 있어 GitHub 업로드 대상에서 제외했습니다.

## Deployment

`vercel.json` 기준으로 정적 빌드 결과물 `dist/`를 배포합니다.

```bash
npm run build
```

Vercel에서는 다음 설정이 사용됩니다.

- Build Command: `npm run build`
- Output Directory: `dist`

## Project Structure

```text
rfm-app/
├── public/data/                 # 대시보드 원본 CSV
├── scripts/extract_data.py      # MySQL → CSV 추출 스크립트
├── src/rfm_dashboard.jsx        # 대시보드 엔트리
├── src/components/Tab2_*.jsx    # 분포/히트맵/손실/매출/캠페인 패널
├── src/components/shared.jsx    # 공통 색상, 포맷터, 로딩/에러 UI
├── server.js                    # 참고용 Express API 서버
└── doc/                         # 스펙, 데이터 정의, 리뷰 문서
```

\* `scripts/extract_data.py`는 로컬 DB 접근 정보와 내부 추출 로직이 포함돼 있어 GitHub 업로드 대상에서 제외했습니다.

## Notes

- 현재 메인 앱은 정적 CSV 기반입니다.
- `server.js`는 현재 프론트엔드 기본 실행 경로에 포함되지 않습니다.
- `src/App.jsx`는 `RFMDashboard`만 렌더링하는 얇은 엔트리입니다.
- 대시보드는 데스크톱 중심 사용을 전제로 설계되어 있습니다.

## Tech Stack

- React
- Vite
- Recharts
- Python
- MySQL
- Vercel
