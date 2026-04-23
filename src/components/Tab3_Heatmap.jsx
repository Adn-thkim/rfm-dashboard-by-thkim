/**
 * Tab3_Heatmap.jsx — Panel 3: 세그먼트 전이 히트맵
 *
 * 차트: 7×7 커스텀 div 히트맵 (recharts 미지원 → CSS Grid)
 * 컨트롤: 월 슬라이더 (available snapshot_months)
 * 강조: 3대 위험 경로 (★ 아이콘 + 테두리)
 *   ① At_Risk → Dormant
 *   ② Loyal → At_Risk
 *   ③ VIP → Loyal
 * 데이터: monthly_full_transition.csv
 */

import { useState, useMemo } from 'react';
import { C, LoadingState, ErrorState } from './shared';

const CARD  = '#1E293B';
const BORDER = '#334155';
const TEXT  = '#F1F5F9';
const MUTED = '#94A3B8';

const SEG_LABELS = ['VIP', 'Loyal', 'At_Risk', 'Potential', 'Regular', 'Low_Value', 'Dormant'];

// 3대 위험 경로 정의
const RISK_PATHS = [
  { from: 'At_Risk', to: 'Dormant', rank: '①', label: '최우선' },
  { from: 'Loyal',   to: 'At_Risk', rank: '②', label: '우선 대응' },
  { from: 'VIP',     to: 'Loyal',   rank: '③', label: '중기 방어' },
];

/** rate(0~100) → 열 색상 보간 (#1E293B → #EF4444) */
function heatColor(rate) {
  if (!rate || rate <= 0) return '#0F172A';
  const t = Math.min(rate / 100, 1);
  // #1E293B (30,41,59) → #EF4444 (239,68,68)
  const r = Math.round(30  + (239 - 30)  * t);
  const g = Math.round(41  + (68  - 41)  * t);
  const b = Math.round(59  + (68  - 59)  * t);
  return `rgb(${r},${g},${b})`;
}

/** 셀 글자색 (배경이 밝으면 어둡게) */
function cellTextColor(rate) {
  return rate > 40 ? '#FFF' : '#CBD5E1';
}

function isRiskPath(from, to) {
  return RISK_PATHS.find(p => p.from === from && p.to === to) ?? null;
}

export default function Tab3_Heatmap({ transData, loading, error }) {
  const [tooltip, setTooltip] = useState(null); // { from, to, rate, n, from_total, x, y }

  // 가용 월 목록
  const months = useMemo(() => {
    return [...new Set(transData.map(r => r.snapshot_month))].sort();
  }, [transData]);

  const [monthIdx, setMonthIdx] = useState(0);
  // months가 업데이트되면 최신 월로 초기화
  const selectedMonth = months[monthIdx] ?? null;

  // 선택된 월 → pivot matrix
  const matrix = useMemo(() => {
    if (!selectedMonth) return {};
    const filtered = transData.filter(r => r.snapshot_month === selectedMonth);
    const m = {};
    filtered.forEach(r => {
      if (!m[r.from_seg]) m[r.from_seg] = {};
      m[r.from_seg][r.to_seg] = { rate: r.rate, n: r.n, from_total: r.from_total };
    });
    return m;
  }, [transData, selectedMonth]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const CELL_SIZE = 78;
  const LABEL_W   = 90;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>
            세그먼트 전이 히트맵
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>
            7×7 전이 행렬 — 어느 이탈 경로가 가속되는지 즉각 진단
          </p>
        </div>

        {/* 위험 경로 범례 */}
        <div style={{ display: 'flex', gap: 12 }}>
          {RISK_PATHS.map(p => (
            <div key={p.rank} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 6, padding: '6px 10px', fontSize: 12,
            }}>
              <span style={{ color: '#F59E0B' }}>{p.rank}</span>
              <span style={{ color: TEXT }}>{p.from} → {p.to}</span>
              <span style={{ color: MUTED }}>({p.label})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 월 슬라이더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: CARD, borderRadius: 8, padding: '12px 16px' }}>
        <span style={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>기준 월:</span>
        <input
          type="range"
          min={0}
          max={Math.max(months.length - 1, 0)}
          value={monthIdx}
          onChange={e => setMonthIdx(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#3B82F6' }}
        />
        <span style={{
          fontSize: 14, fontWeight: 700, color: TEXT,
          background: '#0F172A', padding: '4px 12px', borderRadius: 4,
          minWidth: 72, textAlign: 'center',
        }}>
          {selectedMonth ?? '—'}
        </span>
        <span style={{ fontSize: 12, color: MUTED }}>
          ({monthIdx + 1} / {months.length})
        </span>
      </div>

      {/* 히트맵 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px', overflowX: 'auto' }}>
        {/* 색상 범례 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: MUTED }}>0%</span>
          <div style={{
            width: 200, height: 10, borderRadius: 4,
            background: 'linear-gradient(to right, #0F172A, #EF4444)',
          }} />
          <span style={{ fontSize: 11, color: MUTED }}>100%</span>
        </div>

        {/* 열 헤더 (to_seg) */}
        <div style={{ display: 'flex', marginLeft: LABEL_W, marginBottom: 4 }}>
          {SEG_LABELS.map(seg => (
            <div key={seg} style={{
              width: CELL_SIZE, textAlign: 'center',
              fontSize: 11, color: C[seg] || MUTED,
              fontWeight: 600, padding: '0 2px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {seg}
            </div>
          ))}
        </div>

        {/* 행 (from_seg) */}
        {SEG_LABELS.map(fromSeg => (
          <div key={fromSeg} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
            {/* 행 레이블 */}
            <div style={{
              width: LABEL_W, fontSize: 11, color: C[fromSeg] || MUTED,
              fontWeight: 600, paddingRight: 8, textAlign: 'right',
              whiteSpace: 'nowrap',
            }}>
              {fromSeg}
            </div>

            {/* 셀 */}
            {SEG_LABELS.map(toSeg => {
              const cell = matrix[fromSeg]?.[toSeg];
              const rate = cell?.rate ?? 0;
              const risk = isRiskPath(fromSeg, toSeg);

              return (
                <div
                  key={toSeg}
                  style={{
                    width: CELL_SIZE,
                    height: 42,
                    background: heatColor(rate),
                    borderRadius: 4,
                    marginRight: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: cell ? 'pointer' : 'default',
                    border: risk ? `2px solid #F59E0B` : '2px solid transparent',
                    position: 'relative',
                    transition: 'transform 0.1s',
                    fontSize: 12,
                    fontWeight: 600,
                    color: cellTextColor(rate),
                    flexDirection: 'column',
                    gap: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!cell) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      from: fromSeg, to: toSeg,
                      rate, n: cell.n, from_total: cell.from_total,
                      x: rect.left, y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {rate > 0 && (
                    <span>{rate.toFixed(1)}%</span>
                  )}
                  {risk && (
                    <span style={{ fontSize: 10, color: '#F59E0B' }}>{risk.rank}</span>
                  )}
                  {!rate && (
                    <span style={{ fontSize: 10, color: '#334155' }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* 툴팁 */}
        {tooltip && (
          <div style={{
            position: 'fixed',
            left: tooltip.x + CELL_SIZE / 2,
            top: tooltip.y - 80,
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
            color: '#CBD5E1',
            zIndex: 9999,
            pointerEvents: 'none',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
              {tooltip.from} → {tooltip.to}
            </div>
            <div>전이율: <b style={{ color: '#F59E0B' }}>{tooltip.rate?.toFixed(2)}%</b></div>
            <div>전이 수: {tooltip.n?.toLocaleString()}명 / {tooltip.from_total?.toLocaleString()}명</div>
          </div>
        )}
      </div>

      {/* 행 설명 */}
      <p style={{ fontSize: 11, color: MUTED, marginTop: 12 }}>
        행(Row): 이전 월 세그먼트 (from) &nbsp;|&nbsp; 열(Col): 현재 월 세그먼트 (to) &nbsp;|&nbsp;
        셀값: 전이율 % &nbsp;|&nbsp; ★ = 3대 위험 경로
      </p>
    </div>
  );
}
