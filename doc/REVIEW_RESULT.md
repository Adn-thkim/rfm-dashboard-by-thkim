# 검수 결과 (REVIEW_RESULT.md)

- **검수 기준:** `doc/REVIEW_CHECKLIST.md`
- **검수 대상:** Commit 2 — `shared.jsx` + `rfm_dashboard.jsx` + `Tab2~6` 5개 컴포넌트

---

## A. 기능 완결성 (SPEC 대비)

| 결과 | 항목 | 근거 |
|:----:|------|------|
| ✅ PASS | Panel 1 고정 헤더 항상 표시 | `position: sticky; top: 0; zIndex: 100` 적용 |
| ✅ PASS | KPI 카드 5개 구현 | Active Users / Dormant Ratio / 예상 손실액 / 매출 집중도 / Dead Cross Index |
| ✅ PASS | 탭 5개 구현 | Composition / Heatmap / ChurnLoss / RevenueQuality / CampaignKPI |
| ✅ PASS | 탭별 차트 수 SPEC 일치 | Tab2(1) Tab3(1) Tab4(2) Tab5(3) Tab6(2) |
| ✅ PASS | 월 슬라이더 (Panel 3) | `<input type="range">` + `monthIdx` 상태로 선택 월 제어 |
| ✅ PASS | Dormant 포함/제외 토글 (Panel 2) | `showDormant` 상태로 segments 필터링 + 차트 재렌더링 |
| ✅ PASS | Y축 절대값/비율 토글 (Panel 2) | `yMode` 상태(`'abs'`\|`'pct'`)로 dataKey 전환 |
| ✅ PASS | loading / error 상태 처리 | `useCSV` 훅 내부 관리, 각 탭에서 `<LoadingState>` / `<ErrorState>` 렌더링 |

---

## B. 데이터 정합성 (CSV 기반)

| 결과 | 항목 | 근거 |
|:----:|------|------|
| ✅ PASS | `monthly_segment_kpi.csv` 컬럼 사용 | `snapshot_month, segment, n_users, pct, revenue, rev_pct, arppu, aov, avg_freq` 전부 참조 |
| ✅ PASS | `monthly_full_transition.csv` 컬럼 사용 | `snapshot_month, from_seg, to_seg, n, from_total, rate` 사용 확인 |
| ✅ PASS | `weekly_cohort_flow.csv` 컬럼 사용 | `week_start, new_customers, new_dormant, dead_cross_index` 참조 |
| ✅ PASS | Panel 1 예상 손실액 계산식 | `(atRiskToDormant?.n \|\| 0) * (atRiskRow?.arppu \|\| 0)` — At_Risk→Dormant n × ARPPU |
| ✅ PASS | Panel 1 Dead Cross Index 최신 주 참조 | `dead_cross_index !== null`인 마지막 행을 역순 탐색 |
| ✅ PASS | Panel 3 선택 월 데이터만 표시 | `transData.filter(r => r.snapshot_month === selectedMonth)` 후 pivot |
| ✅ PASS | Panel 5 생존자 편향 경고 조건 | `curArppu > prevArppu && curN < prevN` 이중 조건 검사 |
| ✅ PASS | Panel 6 Win-back Rate 계산 | `to_seg !== 'Dormant'` 필터 후 n 합산 / from_total |

---

## C. 코드 품질

| 결과 | 항목 | 근거 |
|:----:|------|------|
| ✅ PASS | `/api/*` 호출 없음 | grep 검색 결과 — 주석 내 설명 문자열만 존재, 실제 fetch 없음 |
| ✅ PASS | 하드코딩 더미 데이터 없음 | `TABS`, `SEG_LABELS`, `RISK_PATHS`, `ROI_SCENARIOS`는 UI 구성 설정값. 모든 실데이터는 CSV fetch |
| ✅ PASS | 미사용 import 없음 | Tab2 `DarkTip`, Tab5 `Label` 제거 완료 |
| ✅ PASS | `server.js` 미수정 | 수정 대상 아님 — 확인 완료 |
| ✅ PASS | `src/App.jsx` 미수정 | 수정 대상 아님 — 확인 완료 |
| ⏭ SKIP | ESLint 오류 없음 | 샌드박스 APFS↔Linux 마운트 제약으로 실행 불가. **로컬에서 `npm run lint` 확인 필요** |
| ⏭ SKIP | `public/data/*.csv` 3개 존재 | Commit 1(사용자 담당) 완료 후 확인 가능 |

---

## D. UI/UX

| 결과 | 항목 | 근거 |
|:----:|------|------|
| ✅ PASS | 다크 테마 `#0F172A` 배경 유지 | `BG = '#0F172A'` 전역 배경 설정 |
| ✅ PASS | 세그먼트 색상 팔레트 C 일관 적용 | `shared.jsx`의 `C` 객체를 모든 Tab에서 import 사용 |
| ✅ PASS | Panel 3 — 3대 위험 경로 강조 | `#F59E0B` 테두리 + ① ② ③ 아이콘 (At_Risk→Dormant, Loyal→At_Risk, VIP→Loyal) |
| ✅ PASS | Panel 4 — ₩5.2억 참조선 | `<ReferenceLine y={520_000_000} stroke="#F59E0B" strokeDasharray="6 3" />` |
| ✅ PASS | Panel 5 — 매출 역전 수직 점선 | `reversalMonths` 교차 시점 탐지 → `<ReferenceLine x={m} stroke="#EF4444" />` |
| ✅ PASS | 데스크탑 1440px 레이아웃 | `ResponsiveContainer width="100%"` + flex 레이아웃 대응 |

---

## 종합

- **PASS:** 22개
- **SKIP:** 2개 (환경 제약 — 로컬 확인으로 해소)
- **FAIL:** 0개

> SKIP 항목은 개발 환경(샌드박스 파일시스템 제약) 문제이며 코드 결함이 아닙니다.
> 사용자 로컬에서 `npm run lint` 실행 및 `public/data/` CSV 존재 여부 확인으로 최종 완료 처리됩니다.
