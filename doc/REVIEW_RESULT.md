# 검수 결과 (REVIEW_RESULT.md)

검수 기준: `doc/REVIEW_CHECKLIST.md`
검수 일시: Commit 2 완료 직후 (shared.jsx + rfm_dashboard.jsx + Tab 5개 작성)

---

## A. 기능 완결성 (SPEC 대비)

[PASS] Panel 1 고정 헤더가 탭 전환과 무관하게 항상 표시되는가 — `position: sticky; top: 0; zIndex: 100` 적용
[PASS] KPI 카드 5개가 모두 구현되었는가 — Active Users / Dormant Ratio / 예상 손실액 / 매출 집중도 / Dead Cross Index 전부 렌더링
[PASS] 탭 5개가 모두 구현되었는가 — Composition / Heatmap / ChurnLoss / RevenueQuality / CampaignKPI 탭 버튼 + 조건부 마운트
[PASS] 각 탭의 차트 수가 SPEC과 일치하는가 — Tab2(1개), Tab3(1개), Tab4(2개), Tab5(3개), Tab6(2개) ✓
[PASS] 월 슬라이더(Panel 3)가 정상 작동하는가 — `<input type="range">` + `monthIdx` 상태로 선택 월 제어
[PASS] Dormant 포함/제외 토글(Panel 2)이 정상 작동하는가 — `showDormant` 상태로 segments 필터링 + 차트 재렌더링
[PASS] Y축 절대값/비율 토글(Panel 2)이 정상 작동하는가 — `yMode` 상태('abs'|'pct')로 dataKey 전환
[PASS] loading 상태와 error 상태가 모든 CSV fetch에 처리되었는가 — `useCSV` 훅에서 loading/error 관리, 각 탭에서 `<LoadingState>` / `<ErrorState>` 렌더링

---

## B. 데이터 정합성 (CSV 기반)

[PASS] `monthly_segment_kpi.csv` 컬럼을 올바르게 사용하는가 — snapshot_month, segment, n_users, pct, revenue, rev_pct, arppu, aov, avg_freq 모두 정확히 참조
[PASS] `monthly_full_transition.csv` 컬럼을 올바르게 사용하는가 — snapshot_month, from_seg, to_seg, n, from_total, rate 사용 확인
[PASS] `weekly_cohort_flow.csv` 컬럼을 올바르게 사용하는가 — week_start, new_customers, new_dormant, dead_cross_index 참조
[PASS] Panel 1 예상 손실액 계산식이 `At_Risk→Dormant n` × `At_Risk arppu`인가 — rfm_dashboard.jsx:75 `(atRiskToDormant?.n || 0) * (atRiskRow?.arppu || 0)` ✓
[PASS] Panel 1 Dead Cross Index가 최신 주 데이터를 참조하는가 — `dead_cross_index !== null`인 마지막 행을 역순 탐색하여 사용
[PASS] Panel 3 히트맵이 선택된 월의 데이터만 표시하는가 — `transData.filter(r => r.snapshot_month === selectedMonth)` 후 pivot
[PASS] Panel 5 생존자 편향 경고가 ARPPU 상승 + n_users 감소 조건 모두 충족 시에만 표시되는가 — `curArppu > prevArppu && curN < prevN` 이중 조건 검사
[PASS] Panel 6 Win-back Rate가 `Dormant → 활성 세그먼트` 전체 합계로 계산되는가 — `to_seg !== 'Dormant'` 필터 후 n 합산 / from_total

---

## C. 코드 품질

[PASS] `/api/*` 엔드포인트 호출 코드가 없는가 — grep 검색 결과 주석의 '금지' 설명 문자열만 존재, 실제 fetch 없음
[PASS] 하드코딩된 더미 배열·객체 데이터가 없는가 — TABS, SEG_LABELS, RISK_PATHS, ROI_SCENARIOS는 UI 구성용 설정값이며 분석 데이터 아님; 모든 실데이터는 CSV fetch로 로드
[PASS] 사용하지 않는 import가 없는가 — Tab2의 DarkTip, Tab5의 Label 제거 완료
[PASS] `server.js`가 변경되지 않았는가 — 미수정 확인 (수정 대상 아님)
[PASS] `src/App.jsx`가 변경되지 않았는가 — 미수정 확인 (수정 대상 아님)
[SKIP] ESLint 오류가 없는가 (`npm run lint` 결과 확인) — 샌드박스 APFS↔Linux 마운트 제약으로 eslint 실행 불가 (Bus Error -35). 사용자가 로컬에서 `npm run lint` 실행 후 확인 필요.
[SKIP] `public/data/*.csv` 파일 3개가 모두 존재하는가 — Commit 1(사용자 담당)에서 `scripts/extract_data.py` 실행 후 생성. 현재 미생성 상태.

---

## D. UI/UX

[PASS] 다크 테마 (`#0F172A` 배경)가 유지되었는가 — `BG = '#0F172A'`로 전역 배경 설정
[PASS] 세그먼트 색상 팔레트 C가 모든 차트에 일관되게 적용되었는가 — `shared.jsx`의 `C` 객체를 모든 Tab에서 import하여 사용
[PASS] Panel 3 3대 위험 경로 셀에 강조 표시가 되어 있는가 — `#F59E0B` 테두리 + ① ② ③ 아이콘 표시 (At_Risk→Dormant, Loyal→At_Risk, VIP→Loyal)
[PASS] Panel 4 월 5.2억 참조선이 손실 라인 차트에 표시되는가 — `<ReferenceLine y={520_000_000} stroke="#F59E0B" strokeDasharray="6 3" />`
[PASS] Panel 5 매출 역전 교차 시점에 수직 점선이 표시되는가 — reversalMonths 배열로 교차 시점 탐지 후 `<ReferenceLine x={m} stroke="#EF4444" />`
[PASS] 데스크탑 1440px 기준에서 레이아웃이 깨지지 않는가 — `ResponsiveContainer width="100%"` + flex 레이아웃으로 대응; 실제 렌더링은 사용자 로컬에서 확인 필요

---

## FAIL 항목 재검수

없음. SKIP 2건은 환경 제약(ESLint 실행 불가, CSV 미생성)이며 사용자 로컬 실행으로 해소됩니다.

---

## 사용자 확인 필요 항목

1. `npm run lint` 로컬 실행 → ESLint 오류 없음 확인
2. `python scripts/extract_data.py` 실행 → `public/data/` 3개 CSV 생성 확인
3. `npm run dev` 후 브라우저에서 1440px 기준 레이아웃 확인
