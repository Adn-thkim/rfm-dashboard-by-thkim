/**
 * shared.jsx — 공통 유틸리티 (모든 Tab 컴포넌트에서 import)
 * 순환 참조 방지를 위해 rfm_dashboard.jsx 가 아닌 별도 파일로 관리.
 */

// ── 세그먼트 색상 팔레트 C ─────────────────────────────────────
export const C = {
  VIP:       '#F59E0B',
  Loyal:     '#10B981',
  At_Risk:   '#EF4444',
  Potential: '#8B5CF6',
  Regular:   '#6B7280',
  Low_Value: '#D1D5DB',
  Dormant:   '#374151',
};

// 스택 차트 레이어 순서 (아래→위)
export const SEG_ORDER = [
  'Dormant', 'Low_Value', 'Regular', 'Potential', 'At_Risk', 'Loyal', 'VIP',
];

// ── 숫자 포맷터 ────────────────────────────────────────────────
/** 원화 포맷 (₩ 1,234,567) */
export const fw = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_0000_0000)
    return `₩${(n / 1_0000_0000).toFixed(1)}억`;
  if (Math.abs(n) >= 10_000)
    return `₩${(n / 10_000).toFixed(0)}만`;
  return `₩${n.toLocaleString()}`;
};

/** 원화 전체 표기 (KPI 카드용) */
export const fwFull = (v) => {
  const n = Number(v) || 0;
  return '₩' + n.toLocaleString();
};

/** 정수 포맷 (콤마) */
export const fn = (v) => (Number(v) || 0).toLocaleString();

/** % 포맷 (소수점 1자리) */
export const fp = (v) => `${(Number(v) || 0).toFixed(1)}%`;

// ── recharts 공통 축 스타일 ────────────────────────────────────
export const ax = { fill: '#64748B', fontSize: 11 };

// ── 다크 테마 툴팁 ────────────────────────────────────────────
export function DarkTip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E293B',
      border: '1px solid #334155',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 12,
      color: '#CBD5E1',
    }}>
      {label && <div style={{ marginBottom: 4, color: '#94A3B8' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#CBD5E1', lineHeight: 1.6 }}>
          {p.name}: {formatter ? formatter(p.value, p.name) : (Number(p.value) || 0).toLocaleString()}
        </div>
      ))}
    </div>
  );
}

// ── 공통 카드 래퍼 ────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{
      background: '#1E293B',
      borderRadius: 8,
      padding: '16px 20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Loading / Error 상태 ──────────────────────────────────────
export function LoadingState() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 200, color: '#64748B', fontSize: 14,
    }}>
      데이터 로딩 중…
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 200, color: '#EF4444', fontSize: 14,
    }}>
      오류: {message}
    </div>
  );
}
