# 데이터 테이블 정의 (DATA_TABLES.md)

대시보드 전체 지표를 커버하는 **최소 3개의 CSV 테이블** 정의서입니다.
`scripts/extract_data.py`를 실행하면 MySQL에서 각 쿼리를 실행하여 `public/data/`에 저장합니다.

---

## 갱신 주기 기준

| 주기 | 대상 지표 | 해당 테이블 |
|------|-----------|-------------|
| **월별 (Monthly)** | RFM 세그먼트, 전이율, R12M, ARPPU | `monthly_segment_kpi.csv`, `monthly_full_transition.csv` |
| **주별 (Weekly)** | Dead Cross Index, 신규 유입 vs 신규 Dormant | `weekly_cohort_flow.csv` |

> **참고:** 현재 데이터는 정적(Static) 상태이므로 갱신은 `extract_data.py` 재실행으로 수행합니다.
> 단, 각 테이블의 행 단위(granularity)는 위 주기 기준에 맞춰 정의합니다.

---

## Table 1 — `monthly_segment_kpi.csv`

### 용도
Panel 1 (KPI 카드), Panel 2 (세그먼트 분포), Panel 5 (매출 품질)에서 사용.

### 스키마

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `snapshot_month` | str (YYYY-MM) | 분석 기준월 |
| `segment` | str | 세그먼트명 (VIP / Loyal / At_Risk / Potential / Regular / Low_Value / Dormant) |
| `n_users` | int | 해당 세그먼트 고객 수 |
| `pct` | float | 전체 고객 대비 비율 (%) |
| `revenue` | float | 세그먼트 누적 매출 (원, R12M 기준) |
| `rev_pct` | float | 활성 고객(Dormant 제외) 전체 매출 대비 비율 (%) |
| `arppu` | float | 구매 고객당 평균 결제금액 (원) |
| `aov` | float | 주문당 평균 결제금액 (원) |
| `avg_freq` | float | 평균 구매 빈도 (회) |

### SQL 쿼리

```sql
SELECT
  snapshot_month,
  segment,
  n_users,
  ROUND(
    100.0 * n_users /
    SUM(n_users) OVER (PARTITION BY snapshot_month),
    2
  )                                                             AS pct,
  COALESCE(revenue,  0)                                         AS revenue,
  ROUND(
    100.0 * COALESCE(revenue, 0) /
    NULLIF(
      SUM(CASE WHEN segment != 'Dormant'
               THEN COALESCE(revenue, 0) ELSE 0 END)
      OVER (PARTITION BY snapshot_month),
      0
    ),
    2
  )                                                             AS rev_pct,
  ROUND(COALESCE(arppu,    0), 0)                               AS arppu,
  ROUND(COALESCE(aov,      0), 0)                               AS aov,
  ROUND(COALESCE(avg_freq, 0), 2)                               AS avg_freq
FROM rfm_monthly_snapshots
ORDER BY snapshot_month, segment;
```

### 출력 경로
`public/data/monthly_segment_kpi.csv`

---

## Table 2 — `monthly_full_transition.csv`

### 용도
Panel 3 (전이 히트맵), Panel 4 (이탈 손실 정량화), Panel 6 (캠페인 KPI)에서 사용.

### 스키마

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `snapshot_month` | str (YYYY-MM) | 기준월 (전이 발생 시점 = `from_seg` 세그먼트 기준 월) |
| `from_seg` | str | 이전 세그먼트 (7개 중 하나) |
| `to_seg` | str | 전이 후 세그먼트 (7개 중 하나) |
| `n` | int | 해당 경로 전이 고객 수 |
| `from_total` | int | `from_seg` 기준 전체 고객 수 (전이율 분모) |
| `rate` | float | 전이율 (%) = n / from_total × 100 |

### SQL 쿼리

```sql
SELECT
  a.snapshot_month,
  a.segment                                                              AS from_seg,
  b.segment                                                              AS to_seg,
  COUNT(*)                                                               AS n,
  SUM(COUNT(*)) OVER (PARTITION BY a.snapshot_month, a.segment)         AS from_total,
  ROUND(
    100.0 * COUNT(*) /
    NULLIF(
      SUM(COUNT(*)) OVER (PARTITION BY a.snapshot_month, a.segment),
      0
    ),
    2
  )                                                                      AS rate
FROM rfm_user_snapshots a
JOIN rfm_user_snapshots b
  ON  a.user_id        = b.user_id
  AND b.snapshot_month = DATE_FORMAT(
        DATE_ADD(
          STR_TO_DATE(CONCAT(a.snapshot_month, '-01'), '%Y-%m-%d'),
          INTERVAL 1 MONTH
        ),
        '%Y-%m'
      )
GROUP BY
  a.snapshot_month,
  a.segment,
  b.segment
ORDER BY
  a.snapshot_month,
  a.segment,
  b.segment;
```

### 출력 경로
`public/data/monthly_full_transition.csv`

---

## Table 3 — `weekly_cohort_flow.csv`

### 용도
Panel 1 (Dead Cross Index KPI 카드), Panel 2 (월별 신규 유입 vs 신규 Dormant 보조 시각화)에서 사용.

### 스키마

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `week_start` | str (YYYY-MM-DD) | 해당 주 시작일 (월요일 기준) |
| `new_customers` | int | 해당 주 신규 가입 고객 수 |
| `new_dormant` | int | 해당 주 신규 Dormant 전환 예정 고객 수 (마지막 주문일 + 365일 기준) |
| `dead_cross_index` | float | new_customers / new_dormant; 1.0 미만이면 데드크로스 구간 |

### SQL 쿼리

```sql
-- ① 주별 신규 가입 고객 수 (ISO Week: 월요일 시작)
WITH weekly_new AS (
  SELECT
    DATE_FORMAT(
      DATE_SUB(
        DATE(created_at),
        INTERVAL (DAYOFWEEK(created_at) + 5) % 7 DAY
      ),
      '%Y-%m-%d'
    )              AS week_start,
    COUNT(*)       AS new_customers
  FROM users
  WHERE created_at >= '2022-01-01'
  GROUP BY week_start
),

-- ② 사용자별 Dormant 전환 예정 주 (마지막 구매일 + 365일이 속한 주)
dormant_trigger AS (
  SELECT
    u.id AS user_id,
    DATE_FORMAT(
      DATE_SUB(
        DATE_ADD(
          COALESCE(MAX(DATE(o.created_at)), DATE(u.created_at)),
          INTERVAL 365 DAY
        ),
        INTERVAL
          (DAYOFWEEK(
             DATE_ADD(
               COALESCE(MAX(DATE(o.created_at)), DATE(u.created_at)),
               INTERVAL 365 DAY
             )
           ) + 5) % 7 DAY
      ),
      '%Y-%m-%d'
    )              AS dormant_week_start
  FROM users u
  LEFT JOIN orders o
    ON  u.id = o.user_id
    AND o.status NOT IN ('Cancelled', 'Returned')
  GROUP BY u.id
)

SELECT
  wn.week_start,
  COALESCE(wn.new_customers,   0) AS new_customers,
  COALESCE(dt.new_dormant,     0) AS new_dormant,
  CASE
    WHEN COALESCE(dt.new_dormant, 0) = 0 THEN NULL
    ELSE ROUND(
           COALESCE(wn.new_customers, 0) /
           COALESCE(dt.new_dormant,   0),
           3
         )
  END                              AS dead_cross_index
FROM weekly_new wn
LEFT JOIN (
  SELECT dormant_week_start AS week_start, COUNT(*) AS new_dormant
  FROM dormant_trigger
  GROUP BY dormant_week_start
) dt ON wn.week_start = dt.week_start
WHERE wn.week_start BETWEEN '2022-01-03' AND '2024-12-30'
ORDER BY wn.week_start;
```

### 출력 경로
`public/data/weekly_cohort_flow.csv`

---

## 패널별 테이블 사용 요약

| Panel | 테이블 | 사용 컬럼 |
|-------|--------|-----------|
| Panel 1 — KPI Scoreboard | `monthly_segment_kpi.csv` (최신 월) | `n_users`, `pct`, `revenue`, `rev_pct`, `arppu` |
| Panel 1 — KPI Scoreboard | `monthly_full_transition.csv` (최신 월) | `from_seg=At_Risk, to_seg=Dormant` → `n`, `rate` |
| Panel 1 — KPI Scoreboard | `weekly_cohort_flow.csv` (최신 주) | `dead_cross_index` |
| Panel 2 — Segment Composition | `monthly_segment_kpi.csv` | `snapshot_month`, `segment`, `n_users`, `pct` |
| Panel 3 — Transition Heatmap | `monthly_full_transition.csv` | 전체 컬럼 |
| Panel 4 — Churn Loss | `monthly_full_transition.csv` | `from_seg=At_Risk, to_seg=Dormant` → `n`, `rate` |
| Panel 4 — Churn Loss | `monthly_segment_kpi.csv` | `segment=At_Risk` → `arppu`, `n_users` |
| Panel 5 — Revenue Quality | `monthly_segment_kpi.csv` | `revenue`, `arppu`, `n_users`, `rev_pct` |
| Panel 6 — Campaign KPI | `monthly_full_transition.csv` | `At_Risk→Loyal`, `At_Risk→Dormant`, `Dormant→*` 경로 |
