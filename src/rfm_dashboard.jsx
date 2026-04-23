/**
 * rfm_dashboard.jsx — Panel 1 고정 헤더 + 탭 5개 (Commit 2)
 *
 * 데이터 아키텍처:
 *   public/data/monthly_segment_kpi.csv      → kpiData
 *   public/data/monthly_full_transition.csv  → transData
 *   public/data/weekly_cohort_flow.csv       → weeklyData
 *
 * 금지 사항: /api/* 호출 없음, 하드코딩 배열 없음
 */

import { useState, useEffect, useMemo } from 'react';

// ── Tab 컴포넌트 (각 파일이 준비된 순서대로 추가) ─────────────
import Tab2_Composition  from './components/Tab2_Composition';
import Tab3_Heatmap      from './components/Tab3_Heatmap';
import Tab4_ChurnLoss    from './components/Tab4_ChurnLoss';
import Tab5_RevenueQuality from './components/Tab5_RevenueQuality';
import Tab6_CampaignKPI  from './components/Tab6_CampaignKPI';

// ── 공통 스타일 상수 ──────────────────────────────────────────
const BG   = '#0F172A';
const CARD = '#1E293B';
const BORDER = '#334155';
const TEXT  = '#F1F5F9';
const MUTED = '#94A3B8';

// ── 인라인 CSV 파서 (papaparse 미설치 환경 대응) ─────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // 따옴표로 감싸진 필드 처리
    const values = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { values.push(cur); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur);
    const row = {};
    headers.forEach((h, i) => {
      const raw = (values[i] ?? '').trim();
      const num = Number(raw);
      row[h] = raw === '' ? null : isNaN(num) ? raw : num;
    });
    return row;
  }).filter(r => Object.values(r).some(v => v !== null));
}

// ── useCSV 훅 ─────────────────────────────────────────────────
function useCSV(path) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(path)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${path}`);
        return r.text();
      })
      .then(text => {
        if (!cancelled) {
          setData(parseCSV(text));
          setLoading(false);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [path]);

  return { data, loading, error };
}

// ── KPI 카드 컴포넌트 ─────────────────────────────────────────
function KpiCard({ label, value, sub, alert }) {
  const alertColors = {
    red:    { border: '#EF4444', bg: '#450a0a' },
    orange: { border: '#F97316', bg: '#431407' },
    yellow: { border: '#EAB308', bg: '#422006' },
    green:  { border: '#10B981', bg: '#052e16' },
  };
  const ac = alert ? (alertColors[alert] || {}) : {};

  return (
    <div style={{
      flex: 1,
      background: ac.bg || CARD,
      border: `1px solid ${ac.border || BORDER}`,
      borderRadius: 8,
      padding: '12px 16px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: ac.border || TEXT, lineHeight: 1.2 }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── 탭 버튼 ───────────────────────────────────────────────────
const TABS = [
  { id: 'composition',    label: 'Composition'    },
  { id: 'heatmap',        label: 'Heatmap'        },
  { id: 'churnloss',      label: 'ChurnLoss'      },
  { id: 'revenuequality', label: 'RevenueQuality' },
  { id: 'campaignkpi',    label: 'CampaignKPI'    },
];

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function RFMDashboard() {
  const [activeTab, setActiveTab] = useState('composition');

  // CSV 로드 (최상위에서 1회)
  const { data: kpiData,   loading: kpiL,   error: kpiE   } = useCSV('/data/monthly_segment_kpi.csv');
  const { data: transData, loading: transL, error: transE } = useCSV('/data/monthly_full_transition.csv');
  const { data: weeklyData,loading: weeklyL,error: weeklyE} = useCSV('/data/weekly_cohort_flow.csv');

  const anyLoading = kpiL || transL || weeklyL;
  const anyError   = kpiE || transE || weeklyE;

  // ── Panel 1 KPI 계산 ─────────────────────────────────────
  const kpis = useMemo(() => {
    if (!kpiData.length || !transData.length || !weeklyData.length) return null;

    // 최신 snapshot_month 추출
    const months = [...new Set(kpiData.map(r => r.snapshot_month))].sort();
    const latestMonth = months[months.length - 1];
    const prevMonth   = months[months.length - 2] ?? null;

    const latestKpi = kpiData.filter(r => r.snapshot_month === latestMonth);
    const prevKpi   = prevMonth ? kpiData.filter(r => r.snapshot_month === prevMonth) : [];

    // 1. Active Users
    const activeUsers = latestKpi
      .filter(r => r.segment !== 'Dormant')
      .reduce((s, r) => s + (r.n_users || 0), 0);
    const prevActiveUsers = prevKpi
      .filter(r => r.segment !== 'Dormant')
      .reduce((s, r) => s + (r.n_users || 0), 0);
    const activeAlert = prevActiveUsers && activeUsers < prevActiveUsers ? 'orange' : null;

    // 2. Dormant Ratio
    const dormantRow = latestKpi.find(r => r.segment === 'Dormant');
    const dormantPct = dormantRow?.pct ?? 0;
    const dormantAlert = dormantPct >= 71.73 ? 'red' : null;

    // 3. 예상 이탈 손실액 (At_Risk → Dormant transition × At_Risk ARPPU)
    const atRiskToDormant = transData.find(
      r => r.snapshot_month === latestMonth && r.from_seg === 'At_Risk' && r.to_seg === 'Dormant'
    );
    const atRiskRow = latestKpi.find(r => r.segment === 'At_Risk');
    const expectedLoss = (atRiskToDormant?.n || 0) * (atRiskRow?.arppu || 0);

    // 전월 손실액
    const prevAtRiskToDormant = transData.find(
      r => r.snapshot_month === prevMonth && r.from_seg === 'At_Risk' && r.to_seg === 'Dormant'
    );
    const prevAtRiskRow = prevKpi.find(r => r.segment === 'At_Risk');
    const prevExpectedLoss = (prevAtRiskToDormant?.n || 0) * (prevAtRiskRow?.arppu || 0);
    const lossAlert = prevExpectedLoss && expectedLoss > prevExpectedLoss ? 'orange' : null;

    // 4. VIP + Loyal 매출 집중도
    const vipRev   = latestKpi.find(r => r.segment === 'VIP')?.revenue   || 0;
    const loyalRev = latestKpi.find(r => r.segment === 'Loyal')?.revenue || 0;
    const totalRev = latestKpi
      .filter(r => r.segment !== 'Dormant')
      .reduce((s, r) => s + (r.revenue || 0), 0);
    const revConc = totalRev ? ((vipRev + loyalRev) / totalRev * 100) : 0;
    const revConcAlert = revConc >= 70 ? 'yellow' : null;

    // 5. Dead Cross Index (최신 주)
    const weeks = [...weeklyData].sort((a, b) => a.week_start > b.week_start ? 1 : -1);
    // null이 아닌 마지막 행 찾기
    const latestWeek = [...weeks].reverse().find(r => r.dead_cross_index !== null);
    const dci = latestWeek?.dead_cross_index ?? null;
    const dciAlert = dci !== null && dci < 1.0 ? 'red' : null;

    return {
      latestMonth,
      activeUsers, activeAlert, prevActiveUsers,
      dormantPct, dormantAlert,
      expectedLoss, lossAlert,
      revConc, revConcAlert,
      dci, dciAlert,
      latestWeek: latestWeek?.week_start,
    };
  }, [kpiData, transData, weeklyData]);

  // ── 포맷 헬퍼 (Panel 1 전용) ────────────────────────────
  const fw = (v) => {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 1_0000_0000) return `₩${(n / 1_0000_0000).toFixed(1)}억`;
    if (Math.abs(n) >= 10_000)      return `₩${(n / 10_000).toFixed(0)}만`;
    return `₩${n.toLocaleString()}`;
  };

  // ── render ─────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: TEXT }}>

      {/* ════════════ Panel 1 — 고정 헤더 ════════════ */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: BG,
        borderBottom: `1px solid ${BORDER}`,
        padding: '12px 24px',
      }}>
        {/* 타이틀 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>
            RFM 고객 생애주기 대시보드
          </h1>
          {kpis?.latestMonth && (
            <span style={{ fontSize: 12, color: MUTED, background: CARD, padding: '2px 8px', borderRadius: 4 }}>
              기준: {kpis.latestMonth}
            </span>
          )}
          {anyLoading && (
            <span style={{ fontSize: 12, color: MUTED }}>⏳ 데이터 로딩 중…</span>
          )}
          {anyError && (
            <span style={{ fontSize: 12, color: '#EF4444' }}>⚠ {anyError}</span>
          )}
        </div>

        {/* KPI 카드 5개 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <KpiCard
            label="활성 고객 수 (Active Users)"
            value={kpis ? kpis.activeUsers.toLocaleString() + '명' : '—'}
            sub={kpis?.prevActiveUsers
              ? `전월 ${kpis.prevActiveUsers.toLocaleString()}명 → ${kpis.activeUsers < kpis.prevActiveUsers ? '▼' : '▲'} ${Math.abs(kpis.activeUsers - kpis.prevActiveUsers).toLocaleString()}`
              : undefined}
            alert={kpis?.activeAlert}
          />
          <KpiCard
            label="휴면 비율 (Dormant Ratio)"
            value={kpis ? kpis.dormantPct.toFixed(2) + '%' : '—'}
            sub="경보 기준 ≥ 71.73%"
            alert={kpis?.dormantAlert}
          />
          <KpiCard
            label="월별 예상 이탈 손실액"
            value={kpis ? fw(kpis.expectedLoss) : '—'}
            sub="At_Risk→Dormant n × At_Risk ARPPU"
            alert={kpis?.lossAlert}
          />
          <KpiCard
            label="VIP+Loyal 매출 집중도"
            value={kpis ? kpis.revConc.toFixed(1) + '%' : '—'}
            sub="경보 기준 ≥ 70%"
            alert={kpis?.revConcAlert}
          />
          <KpiCard
            label="Dead Cross Index"
            value={kpis?.dci != null ? kpis.dci.toFixed(3) : '—'}
            sub={kpis?.latestWeek ? `기준주: ${kpis.latestWeek}` : '신규/휴면 유입 비율'}
            alert={kpis?.dciAlert}
          />
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === t.id ? 700 : 400,
                background: activeTab === t.id ? '#3B82F6' : CARD,
                color: activeTab === t.id ? '#FFF' : MUTED,
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════ Panel 2~6 탭 컨텐츠 ════════════ */}
      <div style={{ padding: '24px' }}>
        {activeTab === 'composition' && (
          <Tab2_Composition kpiData={kpiData} loading={kpiL} error={kpiE} />
        )}
        {activeTab === 'heatmap' && (
          <Tab3_Heatmap transData={transData} loading={transL} error={transE} />
        )}
        {activeTab === 'churnloss' && (
          <Tab4_ChurnLoss
            transData={transData} kpiData={kpiData}
            loading={transL || kpiL} error={transE || kpiE}
          />
        )}
        {activeTab === 'revenuequality' && (
          <Tab5_RevenueQuality kpiData={kpiData} loading={kpiL} error={kpiE} />
        )}
        {activeTab === 'campaignkpi' && (
          <Tab6_CampaignKPI transData={transData} loading={transL} error={transE} />
        )}
      </div>
    </div>
  );
}
