/**
 * Tab6_CampaignKPI.jsx — Panel 6: Win-back 캠페인 성과 추적
 *
 * KPI 카드 3개 (최신 월):
 *   1. At_Risk → Loyal 복귀율 (목표 10% 대비 진행 바)
 *   2. At_Risk → Dormant 전이율 (목표 15% 감소 대비)
 *   3. Win-back Rate (Dormant → 활성 전체)
 *
 * 차트 1 — 복귀율 & Win-back Rate 라인 차트
 * 차트 2 — ROI 시뮬레이션 vs 실측 (참조선 3개)
 *   - 보수적 8% (ROI 655%)
 *   - 중립 10% (ROI 694%)
 *   - 낙관적 12% (ROI 723%)
 *
 * 데이터: monthly_full_transition.csv
 */

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { C, ax, LoadingState, ErrorState } from './shared';

const CARD   = '#1E293B';
const BORDER = '#334155';
const TEXT   = '#F1F5F9';
const MUTED  = '#94A3B8';

// ROI 시나리오 참조선
// 낙관 12% 색상을 #10B981(C.Loyal)과 겹치지 않도록 하늘색으로 변경
const ROI_SCENARIOS = [
  { rate: 8,  roi: 655, color: '#64748B', label: '보수 8% (ROI 655%)' },
  { rate: 10, roi: 694, color: '#F59E0B', label: '중립 10% (ROI 694%)' },
  { rate: 12, roi: 723, color: '#38BDF8', label: '낙관 12% (ROI 723%)' },
];

function ProgressBar({ value, target, color }) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 4 }}>
        <span>실적 {value?.toFixed(2)}%</span>
        <span>목표 {target}%</span>
      </div>
      <div style={{ height: 6, background: '#0F172A', borderRadius: 3 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color || '#3B82F6',
          borderRadius: 3,
          transition: 'width 0.5s',
        }} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, target, showBar }) {
  return (
    <div style={{
      flex: 1, background: CARD,
      border: `1px solid ${color ? color + '55' : BORDER}`,
      borderRadius: 8, padding: '16px 20px',
    }}>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || TEXT }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{sub}</div>}
      {showBar && target != null && value != null && (
        <ProgressBar value={parseFloat(value)} target={target} color={color} />
      )}
    </div>
  );
}

export default function Tab6_CampaignKPI({ transData, loading, error }) {

  // 월별 집계
  const { months, campaignData } = useMemo(() => {
    if (!transData.length) return { months: [], campaignData: [] };

    const ms = [...new Set(transData.map(r => r.snapshot_month))].sort();

    const cd = ms.map(month => {
      const rows = transData.filter(r => r.snapshot_month === month);

      // At_Risk → Loyal 복귀율
      const arToLoyal = rows.find(r => r.from_seg === 'At_Risk' && r.to_seg === 'Loyal');
      const returnRate = arToLoyal?.rate ?? null;

      // At_Risk → Dormant 전이율
      const arToDormant = rows.find(r => r.from_seg === 'At_Risk' && r.to_seg === 'Dormant');
      const churnRate = arToDormant?.rate ?? null;

      // Win-back Rate: Dormant → 활성 세그먼트 전체
      // = SUM(n where from=Dormant AND to!=Dormant) / from_total(Dormant)
      const dormantRows = rows.filter(r => r.from_seg === 'Dormant');
      const fromTotal   = dormantRows[0]?.from_total || 0;
      const winbackN    = dormantRows
        .filter(r => r.to_seg !== 'Dormant')
        .reduce((s, r) => s + (r.n || 0), 0);
      const winbackRate = fromTotal ? (winbackN / fromTotal) * 100 : null;

      return { month, returnRate, churnRate, winbackRate };
    });

    return { months: ms, campaignData: cd };
  }, [transData]);

  // 최신 월 KPI
  const latest = campaignData[campaignData.length - 1];

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>
          Win-back 캠페인 성과 추적
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>
          3단계 At_Risk 이탈 방어 캠페인 — 실제 전이율 추이 및 ROI 시뮬레이션 비교
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#F59E0B' }}>
          ※ 현재 수치는 캠페인 미실시 상태의 자연 전이율입니다.
          캠페인 집행 시점부터 캠페인 대상 수치가 별도로 추가됩니다.
        </p>
      </div>

      {/* KPI 카드 3개 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="At_Risk → Loyal 복귀율 (최신 월)"
          value={latest?.returnRate != null ? `${latest.returnRate.toFixed(2)}%` : '—'}
          sub={`캠페인 미대상 자연 전이율 · 캠페인 목표 10% 대비 · 기준: ${latest?.month || '—'}`}
          color={C.Loyal}
          target={10}
          showBar
        />
        <KpiCard
          label="At_Risk → Dormant 전이율 (최신 월)"
          value={latest?.churnRate != null ? `${latest.churnRate.toFixed(2)}%` : '—'}
          sub="캠페인 미대상 자연 전이율 · 목표: 전월 대비 15% 감소"
          color={C.At_Risk}
        />
        <KpiCard
          label="Win-back Rate (Dormant → 활성)"
          value={latest?.winbackRate != null ? `${latest.winbackRate.toFixed(2)}%` : '—'}
          sub="캠페인 미대상 · Dormant → 전체 활성 세그먼트 자연 복귀 비율"
          color={C.Potential}
        />
      </div>

      {/* 차트 1 — Win-back Rate 추이 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: TEXT }}>
          Win-back Rate 추이
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: MUTED }}>
          캠페인 미대상 자연 전이율 기준 · 캠페인 집행 후 실측치와 비교 예정
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={campaignData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
            <XAxis dataKey="month" tick={ax} tickLine={false} angle={-30} textAnchor="end" height={50} />
            <YAxis
              tick={ax} tickLine={false} axisLine={false}
              tickFormatter={v => `${v?.toFixed(1)}%`}
              width={45}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#CBD5E1' }}>
                    <div style={{ marginBottom:4, color:'#94A3B8' }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ color: p.color, lineHeight:1.8 }}>
                        {p.name}: {p.value != null ? `${p.value.toFixed(2)}%` : '—'}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="returnRate"
              name="At_Risk→Loyal 자연 복귀율"
              stroke={C.Loyal}
              strokeWidth={2.5}
              dot={{ r: 3, fill: C.Loyal }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="winbackRate"
              name="Dormant→활성 자연 Win-back"
              stroke={C.Potential}
              strokeWidth={2}
              dot={{ r: 3, fill: C.Potential }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 차트 2 — ROI 시뮬레이션 vs 자연 전이율 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: TEXT }}>
          ROI 시뮬레이션 vs 자연 전이율 비교
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: MUTED }}>
          캠페인 미실시 상태의 At_Risk → Loyal 자연 전이율 —
          수평선까지의 격차가 캠페인 도입 시 기대 개선폭
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={campaignData} margin={{ top: 10, right: 120, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
            <XAxis dataKey="month" tick={ax} tickLine={false} angle={-30} textAnchor="end" height={50} />
            <YAxis
              tick={ax} tickLine={false} axisLine={false}
              tickFormatter={v => `${v?.toFixed(0)}%`}
              width={40}
              domain={[0, 14]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#CBD5E1' }}>
                    <div style={{ marginBottom:4, color:'#94A3B8' }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ color: p.color, lineHeight:1.8 }}>
                        {p.name}: {p.value != null ? `${p.value.toFixed(2)}%` : '—'}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />

            {/* ROI 시나리오 참조선 */}
            {ROI_SCENARIOS.map(s => (
              <ReferenceLine
                key={s.rate}
                y={s.rate}
                stroke={s.color}
                strokeDasharray="5 3"
                label={{
                  value: s.label,
                  position: 'insideRight',
                  fill: s.color,
                  fontSize: 11,
                }}
              />
            ))}

            {/* 자연 복귀율 (캠페인 미실시) */}
            <Line
              type="monotone"
              dataKey="returnRate"
              name="자연 복귀율"
              stroke={C.Loyal}
              strokeWidth={2.5}
              dot={{ r: 3, fill: C.Loyal }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>

        {/* ROI 시나리오 설명 */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {ROI_SCENARIOS.map(s => (
            <div key={s.rate} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#0F172A', border: `1px solid ${s.color}44`,
              borderRadius: 6, padding: '6px 12px', fontSize: 12,
            }}>
              <div style={{ width: 20, height: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
