/**
 * Tab2_Composition.jsx — Panel 2: 세그먼트 분포 모니터
 *
 * 차트: 스택 영역 차트 (StackedArea)
 * 컨트롤:
 *   - Dormant 포함/제외 토글
 *   - Y축 절대값(명) / 비율(%) 토글
 * 데이터: monthly_segment_kpi.csv
 */

import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { C, SEG_ORDER, ax, LoadingState, ErrorState } from './shared';

const BG    = '#0F172A';
const CARD  = '#1E293B';
const BORDER = '#334155';
const TEXT  = '#F1F5F9';
const MUTED = '#94A3B8';

export default function Tab2_Composition({ kpiData, loading, error }) {
  const [showDormant, setShowDormant] = useState(true);
  const [yMode, setYMode] = useState('abs'); // 'abs' | 'pct'

  // 세그먼트 목록 (Dormant 포함 여부에 따라)
  const segments = useMemo(() => {
    return showDormant ? SEG_ORDER : SEG_ORDER.filter(s => s !== 'Dormant');
  }, [showDormant]);

  // pivot: snapshot_month → { segment: value }
  const chartData = useMemo(() => {
    if (!kpiData.length) return [];

    const months = [...new Set(kpiData.map(r => r.snapshot_month))].sort();
    return months.map(month => {
      const rows = kpiData.filter(r => r.snapshot_month === month);
      const obj = { month };
      rows.forEach(r => {
        obj[r.segment] = yMode === 'abs' ? (r.n_users || 0) : (r.pct || 0);
      });
      return obj;
    });
  }, [kpiData, yMode]);

  // Y축 레이블 포맷
  const yTickFormatter = (v) =>
    yMode === 'abs' ? (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v) : `${v}%`;

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>
            세그먼트 분포 모니터
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>
            7개 세그먼트의 월별 구성 비율 — 고객 포트폴리오 질적 변화 추적
          </p>
        </div>

        {/* 컨트롤 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Dormant 토글 */}
          <button
            onClick={() => setShowDormant(v => !v)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: `1px solid ${showDormant ? C.Dormant : BORDER}`,
              background: showDormant ? C.Dormant : CARD,
              color: showDormant ? '#FFF' : MUTED,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Dormant {showDormant ? '포함' : '제외'}
          </button>

          {/* Y축 모드 토글 */}
          <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
            {['abs', 'pct'].map(m => (
              <button
                key={m}
                onClick={() => setYMode(m)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: yMode === m ? '#3B82F6' : CARD,
                  color: yMode === m ? '#FFF' : MUTED,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {m === 'abs' ? '절대값(명)' : '비율(%)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 스택 영역 차트 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px' }}>
        <ResponsiveContainer width="100%" height={420}>
          <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis
              dataKey="month"
              tick={ax}
              tickLine={false}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={ax}
              tickLine={false}
              axisLine={false}
              tickFormatter={yTickFormatter}
              width={55}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                // 위에서 아래 순서로 표시 (역순)
                const sorted = [...payload].reverse();
                return (
                  <div style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: '#CBD5E1',
                    maxHeight: 280,
                    overflowY: 'auto',
                  }}>
                    <div style={{ marginBottom: 6, color: '#94A3B8', fontWeight: 600 }}>{label}</div>
                    {sorted.map((p, i) => (
                      <div key={i} style={{ color: p.fill, lineHeight: 1.8 }}>
                        {p.name}: {yMode === 'abs'
                          ? `${(p.value || 0).toLocaleString()}명`
                          : `${(p.value || 0).toFixed(2)}%`}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: MUTED, paddingTop: 12 }}
              formatter={(value) => (
                <span style={{ color: MUTED }}>{value}</span>
              )}
            />
            {/* 스택 순서: 아래(Dormant) → 위(VIP) */}
            {segments.map(seg => (
              <Area
                key={seg}
                type="monotone"
                dataKey={seg}
                stackId="1"
                stroke={C[seg] || '#6B7280'}
                fill={C[seg] || '#6B7280'}
                fillOpacity={0.85}
                strokeWidth={1}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 설명 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
        {segments.map(seg => (
          <div key={seg} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: C[seg] }} />
            {seg}
          </div>
        ))}
      </div>
    </div>
  );
}
