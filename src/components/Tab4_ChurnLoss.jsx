/**
 * Tab4_ChurnLoss.jsx — Panel 4: 이탈 손실 정량화
 *
 * KPI 카드 2개:
 *   - 최신 월 예상 손실액 (At_Risk→Dormant n × At_Risk ARPPU)
 *   - 연간 환산 손실액 (× 12)
 *
 * 차트 1 — 월별 예상 손실액 라인 + 참조선 (₩5.2억)
 * 차트 2 — 손실 3요인 분해 라인 (정규화, 기준월=1.0)
 *   Series: At_Risk n_users / 전이율(%) / At_Risk ARPPU
 *
 * 데이터: monthly_full_transition.csv + monthly_segment_kpi.csv
 */

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { C, ax, DarkTip, LoadingState, ErrorState } from './shared';

const CARD   = '#1E293B';
const BORDER = '#334155';
const TEXT   = '#F1F5F9';
const MUTED  = '#94A3B8';
const THRESHOLD = 520_000_000; // ₩5.2억

function fw(v) {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_0000_0000) return `₩${(n / 1_0000_0000).toFixed(2)}억`;
  if (Math.abs(n) >= 10_000)      return `₩${Math.round(n / 10_000).toLocaleString()}만`;
  return `₩${n.toLocaleString()}`;
}

function KpiCard({ label, value, sub, alert }) {
  const colors = { red: '#EF4444', orange: '#F97316' };
  const c = alert ? (colors[alert] || MUTED) : TEXT;
  return (
    <div style={{
      flex: 1, background: CARD,
      border: `1px solid ${alert ? (colors[alert] || BORDER) : BORDER}`,
      borderRadius: 8, padding: '16px 20px',
    }}>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Tab4_ChurnLoss({ transData, kpiData, loading, error }) {
  // 월별 손실액 계산
  const monthlyLoss = useMemo(() => {
    if (!transData.length || !kpiData.length) return [];

    const months = [...new Set(transData.map(r => r.snapshot_month))].sort();
    return months.map(month => {
      const t = transData.find(r =>
        r.snapshot_month === month && r.from_seg === 'At_Risk' && r.to_seg === 'Dormant'
      );
      const k = kpiData.find(r => r.snapshot_month === month && r.segment === 'At_Risk');
      const loss = (t?.n || 0) * (k?.arppu || 0);
      const nUsers = k?.n_users || 0;
      const rate   = t?.rate    || 0;
      const arppu  = k?.arppu   || 0;
      return { month, loss, nUsers, rate, arppu };
    });
  }, [transData, kpiData]);

  // 최신 월 KPI
  const latest    = monthlyLoss[monthlyLoss.length - 1];
  const latestLoss = latest?.loss || 0;
  const annualLoss = latestLoss * 12;

  // 손실 3요인 정규화 (첫 번째 유효 월 = 1.0)
  const factorData = useMemo(() => {
    const base = monthlyLoss.find(d => d.nUsers > 0);
    if (!base) return [];
    return monthlyLoss.map(d => ({
      month:  d.month,
      nUsersNorm: base.nUsers ? d.nUsers / base.nUsers : null,
      rateNorm:   base.rate   ? d.rate   / base.rate   : null,
      arppuNorm:  base.arppu  ? d.arppu  / base.arppu  : null,
    }));
  }, [monthlyLoss]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>
          이탈 손실 정량화
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>
          이탈 위험을 전이율(%)이 아닌 원화 손실액으로 환산하여 의사결정자의 언어로 표현
        </p>
      </div>

      {/* KPI 카드 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="최신 월 예상 이탈 손실액"
          value={fw(latestLoss)}
          sub={`기준: ${latest?.month || '—'} / At_Risk→Dormant n × ARPPU`}
          alert={latestLoss >= THRESHOLD ? 'red' : latestLoss >= THRESHOLD * 0.8 ? 'orange' : null}
        />
        <KpiCard
          label="연간 환산 이탈 손실액"
          value={fw(annualLoss)}
          sub="최신 월 손실액 × 12 (단순 환산)"
        />
      </div>

      {/* 차트 1 — 월별 예상 손실액 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: TEXT }}>
          월별 예상 이탈 손실액 추이
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyLoss} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
            <XAxis dataKey="month" tick={ax} tickLine={false} angle={-30} textAnchor="end" height={50} />
            <YAxis
              tick={ax} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1e8 ? `${(v/1e8).toFixed(1)}억` : v >= 1e4 ? `${Math.round(v/1e4)}만` : v}
              width={60}
            />
            <Tooltip
              content={<DarkTip formatter={v => fw(v)} />}
            />
            {/* 참조선: ₩5.2억 */}
            <ReferenceLine
              y={THRESHOLD}
              stroke="#F59E0B"
              strokeDasharray="6 3"
              label={{
                value: '₩5.2억 임계',
                position: 'insideTopRight',
                fill: '#F59E0B',
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="loss"
              name="예상 손실액"
              stroke={C.At_Risk}
              strokeWidth={2.5}
              dot={{ r: 3, fill: C.At_Risk }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 차트 2 — 손실 3요인 분해 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: TEXT }}>
          손실 3요인 분해 (정규화)
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: MUTED }}>
          기준 월 = 1.0 으로 정규화 — 어떤 요인이 손실 증가를 주도하는지 파악
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={factorData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
            <XAxis dataKey="month" tick={ax} tickLine={false} angle={-30} textAnchor="end" height={50} />
            <YAxis
              tick={ax} tickLine={false} axisLine={false}
              tickFormatter={v => v?.toFixed(2)}
              width={45}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{
                    background: '#1E293B', border: '1px solid #334155',
                    borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#CBD5E1',
                  }}>
                    <div style={{ marginBottom: 4, color: '#94A3B8' }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ color: p.color, lineHeight: 1.8 }}>
                        {p.name}: {p.value != null ? p.value.toFixed(3) : '—'}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={1} stroke="#334155" strokeDasharray="4 2" />
            <Line
              type="monotone"
              dataKey="nUsersNorm"
              name="At_Risk 모수"
              stroke={C.At_Risk}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="rateNorm"
              name="전이율 (rate)"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="arppuNorm"
              name="At_Risk ARPPU"
              stroke={C.Loyal}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
