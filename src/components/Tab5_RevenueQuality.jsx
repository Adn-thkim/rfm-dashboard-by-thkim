/**
 * Tab5_RevenueQuality.jsx — Panel 5: 매출 품질 분석
 *
 * 차트 1 — 세그먼트별 R12M(revenue) 추이 라인
 *   - Dormant 제외 6개 세그먼트
 *   - At_Risk revenue ≥ Loyal revenue 교차 시점 → 수직 점선 + "⚠ 매출 역전" 레이블
 *
 * 차트 2 — 세그먼트별 ARPPU 추이 라인
 *   - Dormant 제외 6개 세그먼트
 *   - 생존자 편향 경고: ARPPU 전월 상승 + n_users 전월 감소 동시 발생 시 ⚠️ 마커
 *
 * 차트 3 — 세그먼트 버블 차트 (최신 월 스냅샷)
 *   - X: rev_pct, Y: arppu, 크기: n_users
 *   - Dormant 제외
 *
 * 데이터: monthly_segment_kpi.csv
 */

import { useMemo } from 'react';
import {
  LineChart, Line, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ZAxis, Cell,
} from 'recharts';
import { C, SEG_ORDER, ax, LoadingState, ErrorState } from './shared';

const CARD   = '#1E293B';
const TEXT   = '#F1F5F9';
const MUTED  = '#94A3B8';

const NON_DORMANT = SEG_ORDER.filter(s => s !== 'Dormant');

function fw(v) {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_0000_0000) return `₩${(n / 1_0000_0000).toFixed(1)}억`;
  if (Math.abs(n) >= 10_000)      return `₩${Math.round(n / 10_000).toLocaleString()}만`;
  return `₩${n.toLocaleString()}`;
}

export default function Tab5_RevenueQuality({ kpiData, loading, error }) {

  // ── 월별 pivot ──────────────────────────────────────────
  const { months, byMonth } = useMemo(() => {
    if (!kpiData.length) return { months: [], byMonth: {} };
    const ms = [...new Set(kpiData.map(r => r.snapshot_month))].sort();
    const bm = {};
    ms.forEach(m => {
      bm[m] = {};
      kpiData.filter(r => r.snapshot_month === m).forEach(r => {
        bm[m][r.segment] = r;
      });
    });
    return { months: ms, byMonth: bm };
  }, [kpiData]);

  // ── 차트 1: R12M 데이터 + 매출 역전 탐지 ───────────────
  const { revData, reversalMonths } = useMemo(() => {
    const rd = months.map(m => {
      const row = { month: m };
      NON_DORMANT.forEach(seg => {
        row[seg] = byMonth[m]?.[seg]?.revenue ?? null;
      });
      return row;
    });

    // At_Risk rev ≥ Loyal rev 인 월
    const rm = [];
    for (let i = 1; i < months.length; i++) {
      const m = months[i];
      const atRisk = byMonth[m]?.At_Risk?.revenue || 0;
      const loyal  = byMonth[m]?.Loyal?.revenue   || 0;
      const prev_atRisk = byMonth[months[i-1]]?.At_Risk?.revenue || 0;
      const prev_loyal  = byMonth[months[i-1]]?.Loyal?.revenue   || 0;
      // 교차 시점: 이전 달엔 At_Risk < Loyal 이었다가 이번 달 At_Risk ≥ Loyal
      if (prev_atRisk < prev_loyal && atRisk >= loyal) rm.push(m);
    }
    return { revData: rd, reversalMonths: rm };
  }, [months, byMonth]);

  // ── 차트 2: ARPPU + 생존자 편향 마커 ───────────────────
  const { arppuData, survivorBias } = useMemo(() => {
    const ad = months.map(m => {
      const row = { month: m };
      NON_DORMANT.forEach(seg => {
        row[seg] = byMonth[m]?.[seg]?.arppu ?? null;
      });
      return row;
    });

    // 생존자 편향: 각 세그먼트별로 (ARPPU ↑ AND n_users ↓)인 월 탐지
    // → 해당 월에 ⚠️ 마커로 표시
    const sb = {}; // { month: [seg, ...] }
    for (let i = 1; i < months.length; i++) {
      const m    = months[i];
      const prev = months[i - 1];
      NON_DORMANT.forEach(seg => {
        const curArppu  = byMonth[m]?.[seg]?.arppu   || 0;
        const prevArppu = byMonth[prev]?.[seg]?.arppu || 0;
        const curN      = byMonth[m]?.[seg]?.n_users  || 0;
        const prevN     = byMonth[prev]?.[seg]?.n_users || 0;
        if (curArppu > prevArppu && curN < prevN) {
          if (!sb[m]) sb[m] = [];
          sb[m].push(seg);
        }
      });
    }
    return { arppuData: ad, survivorBias: sb };
  }, [months, byMonth]);

  // ── 차트 3: 버블 데이터 (최신 월) ──────────────────────
  const bubbleData = useMemo(() => {
    if (!months.length) return [];
    const latest = months[months.length - 1];
    return NON_DORMANT
      .map(seg => {
        const r = byMonth[latest]?.[seg];
        if (!r) return null;
        return {
          seg,
          x: r.rev_pct   || 0,
          y: r.arppu      || 0,
          z: r.n_users    || 0,
        };
      })
      .filter(Boolean);
  }, [months, byMonth]);

  const latestMonth = months[months.length - 1];

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>
          매출 품질 분석
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>
          R12M과 ARPPU 동시 변화 추적 — 매출 상승이 실질 성장인지 생존자 편향인지 판별
        </p>
      </div>

      {/* 차트 1 — R12M 추이 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: TEXT }}>
          세그먼트별 R12M(매출) 추이
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: MUTED }}>
          Dormant 제외 · 수직 점선 = At_Risk 매출 역전 교차 시점
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
            <XAxis dataKey="month" tick={ax} tickLine={false} angle={-30} textAnchor="end" height={50} />
            <YAxis
              tick={ax} tickLine={false} axisLine={false}
              tickFormatter={v => v != null ? (v >= 1e8 ? `${(v/1e8).toFixed(0)}억` : v >= 1e4 ? `${Math.round(v/1e4)}만` : v) : ''}
              width={55}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#CBD5E1' }}>
                    <div style={{ marginBottom:4, color:'#94A3B8' }}>{label}</div>
                    {payload.filter(p => p.value != null).map((p,i) => (
                      <div key={i} style={{ color: p.color, lineHeight:1.8 }}>
                        {p.name}: {fw(p.value)}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {/* 매출 역전 교차 시점 수직 점선 */}
            {reversalMonths.map(m => (
              <ReferenceLine
                key={m}
                x={m}
                stroke="#EF4444"
                strokeDasharray="5 3"
                label={{ value: '⚠ 매출 역전', position: 'insideTopLeft', fill: '#EF4444', fontSize: 10 }}
              />
            ))}
            {NON_DORMANT.map(seg => (
              <Line
                key={seg}
                type="monotone"
                dataKey={seg}
                stroke={C[seg]}
                strokeWidth={seg === 'At_Risk' || seg === 'Loyal' ? 2.5 : 1.5}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 차트 2 — ARPPU 추이 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: TEXT }}>
          세그먼트별 ARPPU 추이
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: MUTED }}>
          ⚠️ 마커 = 생존자 편향 경고 (ARPPU 상승 + n_users 감소 동시 발생)
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={arppuData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
            <XAxis dataKey="month" tick={ax} tickLine={false} angle={-30} textAnchor="end" height={50} />
            <YAxis
              tick={ax} tickLine={false} axisLine={false}
              tickFormatter={v => v != null ? (v >= 10000 ? `${Math.round(v/10000)}만` : v.toLocaleString()) : ''}
              width={60}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const hasBias = survivorBias[label];
                return (
                  <div style={{ background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#CBD5E1' }}>
                    <div style={{ marginBottom:4, color:'#94A3B8' }}>{label}</div>
                    {hasBias && (
                      <div style={{ color:'#F59E0B', marginBottom:4 }}>
                        ⚠️ 생존자 편향 의심: {hasBias.join(', ')}
                      </div>
                    )}
                    {payload.filter(p => p.value != null).map((p,i) => (
                      <div key={i} style={{ color: p.color, lineHeight:1.8 }}>
                        {p.name}: {fw(p.value)}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {/* 생존자 편향 경고 세로선 */}
            {Object.keys(survivorBias).map(m => (
              <ReferenceLine
                key={m}
                x={m}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
            ))}
            {NON_DORMANT.map(seg => (
              <Line
                key={seg}
                type="monotone"
                dataKey={seg}
                stroke={C[seg]}
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 차트 3 — 버블 차트 */}
      <div style={{ background: CARD, borderRadius: 8, padding: '20px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: TEXT }}>
          세그먼트 포지셔닝 버블 차트
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: MUTED }}>
          기준: {latestMonth} · X = 매출 비중(%), Y = ARPPU, 버블 크기 = 고객 수
        </p>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
            <XAxis
              type="number"
              dataKey="x"
              name="매출 비중"
              tick={ax}
              tickFormatter={v => `${v}%`}
              label={{ value: '매출 비중 (%)', position: 'insideBottom', offset: -10, fill: MUTED, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="ARPPU"
              tick={ax}
              tickFormatter={v => v >= 10000 ? `${Math.round(v/10000)}만` : v}
              width={60}
              label={{ value: 'ARPPU (원)', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="z" range={[80, 1400]} name="고객 수" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div style={{ background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#CBD5E1' }}>
                    <div style={{ fontWeight:700, color: C[d.seg] || TEXT, marginBottom:4 }}>{d.seg}</div>
                    <div>매출 비중: {d.x?.toFixed(2)}%</div>
                    <div>ARPPU: {fw(d.y)}</div>
                    <div>고객 수: {d.z?.toLocaleString()}명</div>
                  </div>
                );
              }}
            />
            <Scatter data={bubbleData} isAnimationActive={false}>
              {bubbleData.map((entry, i) => (
                <Cell key={i} fill={C[entry.seg] || '#6B7280'} fillOpacity={0.85} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* 버블 범례 */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
          {bubbleData.map(d => (
            <div key={d.seg} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: MUTED }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background: C[d.seg] }} />
              {d.seg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
