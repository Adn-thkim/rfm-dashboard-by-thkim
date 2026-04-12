import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

/* ── 색상 팔레트 ──────────────────────────────────────── */
const C = {
  VIP: "#F59E0B", Loyal: "#10B981", At_Risk: "#EF4444",
  Potential: "#8B5CF6", Regular: "#3B82F6",
  Low_Value: "#F97316", Dormant: "#6B7280",
};

/* ── 포맷 헬퍼 ─────────────────────────────────────────── */
const fw = (v) => {
  if (!v) return "₩0";
  if (v >= 1e8) return `₩${(v / 1e8).toFixed(1)}억`;
  if (v >= 1e4) return `₩${Math.round(v / 1e4).toLocaleString()}만`;
  return `₩${v.toLocaleString()}`;
};
const fn = (v) => (v ?? 0).toLocaleString();

/* ════════════════════════════════════════════════════════
   MySQL v2 세그먼트 정의 기준 실데이터 (기준일: 2024-12-31, Lookback 365일)
════════════════════════════════════════════════════════ */
const SEG = [
  { seg:"VIP",       n:4992,  pct:4.82,  rev:7445998050, revPct:39.82, arppu:1491586, aov:158603, freq:9.32 },
  { seg:"At_Risk",   n:6330,  pct:6.11,  rev:4938345590, revPct:26.41, arppu:780149,  aov:184080, freq:4.62 },
  { seg:"Loyal",     n:5271,  pct:5.09,  rev:4717320180, revPct:25.23, arppu:894957,  aov:147080, freq:5.91 },
  { seg:"Low_Value", n:11570, pct:11.16, rev:1054788090, revPct:5.64,  arppu:91166,   aov:80308,  freq:1.16 },
  { seg:"Regular",   n:1275,  pct:1.23,  rev:363632680,  revPct:1.94,  arppu:285202,  aov:135765, freq:2.26 },
  { seg:"Potential", n:535,   pct:0.52,  rev:179093550,  revPct:0.96,  arppu:334754,  aov:294306, freq:1.12 },
  { seg:"Dormant",   n:73675, pct:71.08, rev:0,          revPct:0,     arppu:0,       aov:0,      freq:0    },
];

// MySQL v2 정의 기준 24개월 스냅샷 (2023-01 ~ 2024-12)
const MONTHLY = [
  {m:"23-01",VIP:2645,Loyal:2517,At_Risk:1664,Potential:478, Regular:689, Low_Value:5171, dormPct:87.30},
  {m:"23-02",VIP:2671,Loyal:2597,At_Risk:1985,Potential:465, Regular:703, Low_Value:5433, dormPct:86.63},
  {m:"23-03",VIP:2674,Loyal:2753,At_Risk:2337,Potential:482, Regular:716, Low_Value:5813, dormPct:85.75},
  {m:"23-04",VIP:2687,Loyal:2892,At_Risk:2640,Potential:558, Regular:760, Low_Value:6184, dormPct:84.83},
  {m:"23-05",VIP:2734,Loyal:3057,At_Risk:2938,Potential:626, Regular:827, Low_Value:6637, dormPct:83.77},
  {m:"23-06",VIP:2832,Loyal:3180,At_Risk:3289,Potential:847, Regular:960, Low_Value:7273, dormPct:82.27},
  {m:"23-07",VIP:3083,Loyal:3323,At_Risk:3567,Potential:1177,Regular:1120,Low_Value:8062, dormPct:80.38},
  {m:"23-08",VIP:3370,Loyal:3702,At_Risk:3684,Potential:1437,Regular:1234,Low_Value:8798, dormPct:78.56},
  {m:"23-09",VIP:3720,Loyal:4052,At_Risk:3857,Potential:1416,Regular:1317,Low_Value:9420, dormPct:77.06},
  {m:"23-10",VIP:4158,Loyal:4368,At_Risk:3906,Potential:1371,Regular:1407,Low_Value:9923, dormPct:75.75},
  {m:"23-11",VIP:4623,Loyal:4678,At_Risk:3948,Potential:1158,Regular:1436,Low_Value:10283,dormPct:74.79},
  {m:"23-12",VIP:5024,Loyal:4851,At_Risk:4014,Potential:987, Regular:1395,Low_Value:10521,dormPct:74.15},
  {m:"24-01",VIP:5170,Loyal:5121,At_Risk:4174,Potential:749, Regular:1333,Low_Value:10645,dormPct:73.77},
  {m:"24-02",VIP:5195,Loyal:5274,At_Risk:4461,Potential:623, Regular:1267,Low_Value:10785,dormPct:73.37},
  {m:"24-03",VIP:5073,Loyal:5376,At_Risk:4848,Potential:535, Regular:1199,Low_Value:10869,dormPct:73.08},
  {m:"24-04",VIP:4946,Loyal:5400,At_Risk:5275,Potential:510, Regular:1149,Low_Value:10985,dormPct:72.73},
  {m:"24-05",VIP:4809,Loyal:5356,At_Risk:5768,Potential:490, Regular:1122,Low_Value:11112,dormPct:72.35},
  {m:"24-06",VIP:4716,Loyal:5193,At_Risk:6214,Potential:532, Regular:1141,Low_Value:11335,dormPct:71.89},
  {m:"24-07",VIP:4578,Loyal:5182,At_Risk:6605,Potential:612, Regular:1154,Low_Value:11538,dormPct:71.38},
  {m:"24-08",VIP:4540,Loyal:5174,At_Risk:6806,Potential:678, Regular:1246,Low_Value:11752,dormPct:70.87},
  {m:"24-09",VIP:4583,Loyal:5282,At_Risk:6818,Potential:698, Regular:1265,Low_Value:11874,dormPct:70.55},
  {m:"24-10",VIP:4727,Loyal:5241,At_Risk:6761,Potential:650, Regular:1314,Low_Value:11827,dormPct:70.55},
  {m:"24-11",VIP:4929,Loyal:5240,At_Risk:6565,Potential:600, Regular:1300,Low_Value:11734,dormPct:70.70},
  {m:"24-12",VIP:4992,Loyal:5271,At_Risk:6330,Potential:535, Regular:1275,Low_Value:11570,dormPct:71.08},
];

// At_Risk → Dormant 전이 (v2 세그먼트 정의 기준, dormant_transition_df.csv 출처)
const TRANS = [
  {m:"23-01",n:1452,churned:4,  rate:0.28}, {m:"23-02",n:1555,churned:7,  rate:0.45},
  {m:"23-03",n:1669,churned:13, rate:0.78}, {m:"23-04",n:1862,churned:12, rate:0.64},
  {m:"23-05",n:2152,churned:18, rate:0.84}, {m:"23-06",n:2487,churned:11, rate:0.44},
  {m:"23-07",n:2783,churned:20, rate:0.72}, {m:"23-08",n:3038,churned:17, rate:0.56},
  {m:"23-09",n:3151,churned:23, rate:0.73}, {m:"23-10",n:3124,churned:20, rate:0.64},
  {m:"23-11",n:3035,churned:39, rate:1.29}, {m:"23-12",n:2968,churned:29, rate:0.98},
  {m:"24-01",n:3771,churned:79, rate:2.09}, {m:"24-02",n:3756,churned:89, rate:2.37},
  {m:"24-03",n:3838,churned:89, rate:2.32}, {m:"24-04",n:3948,churned:95, rate:2.41},
  {m:"24-05",n:4085,churned:83, rate:2.03}, {m:"24-06",n:4423,churned:123,rate:2.78},
  {m:"24-07",n:4828,churned:128,rate:2.65}, {m:"24-08",n:5211,churned:138,rate:2.65},
  {m:"24-09",n:5418,churned:156,rate:2.88}, {m:"24-10",n:5331,churned:160,rate:3.00},
  {m:"24-11",n:5208,churned:184,rate:3.53},
];

// 업그레이드율 (2024-01 ~ 2024-11, MySQL에서 직접 계산)
const UPGRADE = [
  {m:"24-01", r2l:21.99, r2l_n:558,  p2v:0.83, p2v_n:10,  r_base:2537, p_base:1208},
  {m:"24-02", r2l:19.36, r2l_n:463,  p2v:0.90, p2v_n:11,  r_base:2392, p_base:1217},
  {m:"24-03", r2l:20.94, r2l_n:489,  p2v:0.65, p2v_n:8,   r_base:2335, p_base:1229},
  {m:"24-04", r2l:20.91, r2l_n:459,  p2v:0.87, p2v_n:11,  r_base:2195, p_base:1267},
  {m:"24-05", r2l:19.91, r2l_n:429,  p2v:0.49, p2v_n:6,   r_base:2155, p_base:1237},
  {m:"24-06", r2l:21.84, r2l_n:471,  p2v:0.53, p2v_n:7,   r_base:2157, p_base:1310},
  {m:"24-07", r2l:22.98, r2l_n:513,  p2v:0.72, p2v_n:10,  r_base:2232, p_base:1388},
  {m:"24-08", r2l:25.27, r2l_n:591,  p2v:0.76, p2v_n:11,  r_base:2339, p_base:1455},
  {m:"24-09", r2l:24.02, r2l_n:574,  p2v:0.68, p2v_n:10,  r_base:2390, p_base:1466},
  {m:"24-10", r2l:23.75, r2l_n:586,  p2v:0.92, p2v_n:14,  r_base:2467, p_base:1520},
  {m:"24-11", r2l:23.45, r2l_n:592,  p2v:0.33, p2v_n:5,   r_base:2524, p_base:1515},
];

// Win-back Rate (Dormant → 활성 세그먼트 합계, 2024-01 ~ 2024-11)
const WINBACK = [
  {m:"24-01", dormant:47024, wb:929,  rate:1.98},
  {m:"24-02", dormant:47884, wb:869,  rate:1.81},
  {m:"24-03", dormant:49443, wb:887,  rate:1.79},
  {m:"24-04", dormant:51275, wb:979,  rate:1.91},
  {m:"24-05", dormant:53320, wb:904,  rate:1.70},
  {m:"24-06", dormant:56479, wb:964,  rate:1.71},
  {m:"24-07", dormant:60629, wb:1093, rate:1.80},
  {m:"24-08", dormant:64927, wb:1168, rate:1.80},
  {m:"24-09", dormant:68042, wb:1143, rate:1.68},
  {m:"24-10", dormant:70540, wb:1130, rate:1.60},
  {m:"24-11", dormant:72613, wb:1066, rate:1.47},
];

// KPI 갭 분석 데이터
const KPI_GAP = [
  {kpi:"세그먼트 분포 (고객수/비율)", st:"ok",   desc:"7 세그먼트, 24개월 월별 스냅샷",        action:"—"},
  {kpi:"매출 기여도 (%)",            st:"ok",   desc:"세그먼트별 매출 합계·비중",             action:"—"},
  {kpi:"AOV / ARPPU",               st:"ok",   desc:"주문당·결제유저당 평균 매출",           action:"—"},
  {kpi:"At_Risk 전이율",            st:"ok",   desc:"At_Risk → Dormant 월별 추적",          action:"—"},
  {kpi:"예상 손실액 진단",           st:"ok",   desc:"At_Risk × ARPPU 기반 추정",            action:"—"},
  {kpi:"세그먼트 업그레이드율 🆕",   st:"ok",   desc:"Regular→Loyal 22.1%, Potential→VIP 0.70%",action:"Potential→VIP 전환율 0.7% → 재구매 유도 캠페인 즉시 필요"},
  {kpi:"Win-back Rate 🆕",          st:"ok",   desc:"Dormant → Active 1.47~1.98%",          action:"하락 추세 (1.98%→1.47%) → 재활성화 캠페인 강화 필요"},
  {kpi:"Retention Rate",            st:"part", desc:"전이율로 간접 측정 가능",               action:"동일 세그먼트 유지율 직접 계산 권장 (t→t+1 잔류 비율)"},
  {kpi:"재구매 주기",                st:"miss", desc:"미구현",                               action:"세그먼트별 평균 재구매 간격 → R Score 임계값 조정 근거로 활용"},
  {kpi:"CLV 추정값",                 st:"miss", desc:"미구현",                               action:"ARPPU × 예상 잔존 기간 → 마케팅 예산 배분 우선순위 결정"},
  {kpi:"프로모션 반응율",            st:"part", desc:"events 데이터 보유 중",                action:"세그먼트별 click_promotion → 구매 전환율 계산 가능"},
];

/* ── 스타일 상수 ─────────────────────────────────────── */
const CARD   = {background:"#1E293B",borderRadius:"12px",padding:"16px"};
const LABEL  = {fontSize:"11px",color:"#64748B",marginBottom:"4px"};
const VAL    = {fontSize:"22px",fontWeight:700,color:"#F8FAFC"};
const SUB    = {fontSize:"11px",color:"#94A3B8",marginTop:"2px"};
const STITLE = {fontSize:"14px",fontWeight:600,color:"#CBD5E1",marginBottom:"12px"};

/* ── 커스텀 툴팁 ─────────────────────────────────────── */
const DarkTip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:"#0F172A",border:"1px solid #334155",borderRadius:"8px",padding:"10px 14px",fontSize:"12px"}}>
      <p style={{margin:"0 0 6px",color:"#94A3B8",fontWeight:600}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{margin:"2px 0",color:p.color||"#E2E8F0"}}>
          {p.name}: <strong>{typeof p.value==="number"&&p.value>10000?fw(p.value):(p.value?.toLocaleString()??"-")}</strong>
        </p>
      ))}
    </div>
  );
};

const ax = {fill:"#64748B",fontSize:11};

/* ════════════════════════════════════════════════════════
   메인 컴포넌트
════════════════════════════════════════════════════════ */
export default function RFMDashboard() {
  const [tab, setTab] = useState(0);

  const active   = SEG.filter(d => d.seg !== "Dormant");
  const totalAct = active.reduce((s,d)=>s+d.n, 0);
  const vip      = SEG.find(d=>d.seg==="VIP");
  const atRisk   = SEG.find(d=>d.seg==="At_Risk");
  const dormant  = SEG.find(d=>d.seg==="Dormant");

  const latestRate    = TRANS[TRANS.length-1].rate / 100;
  const expChurn      = Math.round(atRisk.n * latestRate);
  const expLoss       = Math.round(expChurn * atRisk.arppu);
  const avgUpgrade    = (UPGRADE.reduce((s,d)=>s+d.r2l,0)/UPGRADE.length).toFixed(1);
  const avgWinback    = (WINBACK.reduce((s,d)=>s+d.rate,0)/WINBACK.length).toFixed(2);

  const TABS = ["세그먼트 현황","매출 & 가치","이탈 리스크","전환율 분석","KPI 갭 분석"];

  // 차트용 파생 데이터
  const distBar = [...active].sort((a,b)=>b.n-a.n).map(d=>({name:d.seg,고객수:d.n,매출비중:d.revPct}));
  const pieData = active.map(d=>({name:d.seg,value:d.revPct}));
  const aovBar  = active.filter(d=>d.aov>0).sort((a,b)=>b.aov-a.aov).map(d=>({name:d.seg,AOV:d.aov,ARPPU:d.arppu}));

  return (
    <div style={{fontFamily:"system-ui,sans-serif",background:"#0F172A",color:"#E2E8F0",minHeight:"100vh",padding:"16px 20px"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
        <div>
          <h1 style={{margin:0,fontSize:"20px",fontWeight:700,color:"#F8FAFC"}}>RFM Segment Dashboard</h1>
          <p style={{margin:"3px 0 0",fontSize:"12px",color:"#64748B"}}>
            thelook_ecommerce · 기준일: 2024-12-31 · Lookback 365일 · Source: MySQL
          </p>
        </div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"flex-end"}}>
          {Object.entries(C).map(([k,v])=>(
            <span key={k} style={{fontSize:"10px",background:"#1E293B",borderRadius:"6px",padding:"3px 8px",color:v,fontWeight:600}}>{k}</span>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"10px",marginBottom:"16px"}}>
        {[
          {label:"전체 활성 고객",    val:`${fn(totalAct)}명`,       sub:"Dormant 제외",                         color:"#3B82F6"},
          {label:"VIP 고객",          val:`${fn(vip.n)}명`,          sub:`매출 기여 ${vip.revPct}%`,              color:"#F59E0B"},
          {label:"At_Risk 이탈 위험", val:`${fn(atRisk.n)}명`,       sub:`전이율 ${TRANS[TRANS.length-1].rate}%`, color:"#EF4444"},
          {label:"Dormant 비율",      val:`${dormant.pct}%`,         sub:"'23년 1월比 +14.51%p",                 color:"#6B7280"},
          {label:"예상 연간 손실액",  val:fw(expLoss),               sub:`이탈 예상 ${fn(expChurn)}명`,          color:"#F97316"},
        ].map((c,i)=>(
          <div key={i} style={{...CARD,borderLeft:`3px solid ${c.color}`}}>
            <div style={LABEL}>{c.label}</div>
            <div style={VAL}>{c.val}</div>
            <div style={SUB}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── New KPI Cards (업그레이드율 + Win-back) ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"16px"}}>
        {[
          {label:"Regular→Loyal 평균 업그레이드율",val:`${avgUpgrade}%`, sub:"2024년 11개월 평균 | 19.4~25.3%", color:"#10B981"},
          {label:"Potential→VIP 전환율",           val:"0.70%",          sub:"⚠️ 매우 저조 — 재구매 캠페인 필요",color:"#F59E0B"},
          {label:"Win-back Rate (평균)",            val:`${avgWinback}%`, sub:"Dormant → Active | 하락 추세",     color:"#8B5CF6"},
          {label:"Win-back 고객 수 (최근월)",       val:`${fn(WINBACK[WINBACK.length-1].wb)}명`,sub:`${WINBACK[WINBACK.length-1].dormant.toLocaleString()}명 중 재활성화`,color:"#6366F1"},
        ].map((c,i)=>(
          <div key={i} style={{...CARD,borderLeft:`3px solid ${c.color}`,borderTop:"none"}}>
            <div style={LABEL}>{c.label}</div>
            <div style={{...VAL,fontSize:"20px"}}>{c.val}</div>
            <div style={SUB}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{display:"flex",gap:"2px",marginBottom:"16px",background:"#1E293B",borderRadius:"10px",padding:"4px",width:"fit-content"}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{
            padding:"7px 16px",borderRadius:"8px",border:"none",cursor:"pointer",
            background:tab===i?"#3B82F6":"transparent",
            color:tab===i?"#FFF":"#94A3B8",fontSize:"13px",fontWeight:tab===i?600:400,
            transition:"all 0.15s"
          }}>{t}</button>
        ))}
      </div>

      {/* ════ TAB 0: 세그먼트 현황 ════ */}
      {tab===0 && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:"12px",marginBottom:"12px"}}>
            <div style={CARD}>
              <div style={STITLE}>세그먼트별 고객 수 (Dormant 제외)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distBar} margin={{top:4,right:8,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F"/>
                  <XAxis dataKey="name" tick={ax}/>
                  <YAxis tick={ax} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<DarkTip/>}/>
                  <Bar dataKey="고객수" radius={[4,4,0,0]}>{distBar.map((e,i)=><Cell key={i} fill={C[e.name]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={STITLE}>매출 기여 비중 (%)</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={2}>
                    {pieData.map((e,i)=><Cell key={i} fill={C[e.name]}/>)}
                  </Pie>
                  <Tooltip formatter={(v)=>`${v}%`} contentStyle={{background:"#0F172A",border:"1px solid #334155",borderRadius:"8px",fontSize:"12px"}}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:"11px",color:"#94A3B8"}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={CARD}>
            <div style={STITLE}>월별 세그먼트 추이 (2023-01 ~ 2024-12)</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={MONTHLY} margin={{top:4,right:12,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F"/>
                <XAxis dataKey="m" tick={ax} interval={2}/>
                <YAxis tick={ax} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<DarkTip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:"11px",color:"#94A3B8"}}/>
                {["VIP","Loyal","At_Risk","Potential","Regular","Low_Value"].map(k=>(
                  <Line key={k} type="monotone" dataKey={k} stroke={C[k]}
                    strokeWidth={k==="At_Risk"?2.5:1.5} dot={false}
                    strokeDasharray={["Potential","Regular","Low_Value"].includes(k)?"4 3":undefined}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ════ TAB 1: 매출 & 가치 ════ */}
      {tab===1 && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
            <div style={CARD}>
              <div style={STITLE}>세그먼트별 AOV (주문당 평균 금액)</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={aovBar} layout="vertical" margin={{top:4,right:16,left:20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F"/>
                  <XAxis type="number" tick={ax} tickFormatter={v=>fw(v)}/>
                  <YAxis type="category" dataKey="name" tick={ax} width={70}/>
                  <Tooltip content={<DarkTip/>}/>
                  <Bar dataKey="AOV" radius={[0,4,4,0]}>{aovBar.map((e,i)=><Cell key={i} fill={C[e.name]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={STITLE}>세그먼트별 ARPPU (연간 결제유저당 매출)</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={aovBar} layout="vertical" margin={{top:4,right:16,left:20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F"/>
                  <XAxis type="number" tick={ax} tickFormatter={v=>fw(v)}/>
                  <YAxis type="category" dataKey="name" tick={ax} width={70}/>
                  <Tooltip content={<DarkTip/>}/>
                  <Bar dataKey="ARPPU" radius={[0,4,4,0]}>{aovBar.map((e,i)=><Cell key={i} fill={C[e.name]} fillOpacity={0.8}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={CARD}>
            <div style={STITLE}>세그먼트별 종합 KPI 요약 (2024-12-31 기준)</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #334155"}}>
                    {["세그먼트","고객 수","비율(%)","총 매출","매출 기여(%)","ARPPU","AOV","평균 구매횟수"].map(h=>(
                      <th key={h} style={{padding:"8px 12px",textAlign:h==="세그먼트"?"left":"right",color:"#64748B",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEG.map((d,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #1E293B",background:i%2===0?"transparent":"#131C2E"}}>
                      <td style={{padding:"9px 12px",fontWeight:600}}>
                        <span style={{display:"inline-block",width:"8px",height:"8px",borderRadius:"50%",background:C[d.seg],marginRight:"8px",verticalAlign:"middle"}}/>
                        {d.seg}
                      </td>
                      <td style={{padding:"9px 12px",textAlign:"right",color:"#CBD5E1"}}>{fn(d.n)}</td>
                      <td style={{padding:"9px 12px",textAlign:"right",color:"#94A3B8"}}>{d.pct}%</td>
                      <td style={{padding:"9px 12px",textAlign:"right",color:"#CBD5E1"}}>{fw(d.rev)}</td>
                      <td style={{padding:"9px 12px",textAlign:"right"}}>
                        <span style={{background:d.revPct>30?"#451A03":d.revPct>10?"#422006":"transparent",color:d.revPct>30?"#FCD34D":d.revPct>10?"#FCA5A5":"#94A3B8",borderRadius:"4px",padding:"1px 6px"}}>{d.revPct}%</span>
                      </td>
                      <td style={{padding:"9px 12px",textAlign:"right",color:"#CBD5E1"}}>{d.arppu?fw(d.arppu):"-"}</td>
                      <td style={{padding:"9px 12px",textAlign:"right",color:"#CBD5E1"}}>{d.aov?fw(d.aov):"-"}</td>
                      <td style={{padding:"9px 12px",textAlign:"right",color:"#CBD5E1"}}>{d.freq||"-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{fontSize:"11px",color:"#475569",marginTop:"8px"}}>※ Potential의 AOV(₩310,486)가 VIP(₩157,985)보다 높음 — 저빈도 고단가 패턴. 재구매 유도 시 VIP 전환 가능성 높은 우선 타겟.</p>
          </div>
        </div>
      )}

      {/* ════ TAB 2: 이탈 리스크 ════ */}
      {tab===2 && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"12px"}}>
            {[
              {label:"현재 At_Risk 고객",  val:`${fn(atRisk.n)}명`,          sub:"전체 활성 고객의 33.6%",   color:"#EF4444"},
              {label:"최근 전이율 (24-11)",val:`${TRANS[TRANS.length-1].rate}%`, sub:"At_Risk → Dormant 전월 기준", color:"#F97316"},
              {label:"예상 연간 손실액",   val:fw(expLoss),                  sub:`이탈 예상 ${fn(expChurn)}명`,color:"#8B5CF6"},
            ].map((c,i)=>(
              <div key={i} style={{...CARD,borderTop:`3px solid ${c.color}`,textAlign:"center"}}>
                <div style={{...LABEL,textAlign:"center"}}>{c.label}</div>
                <div style={{...VAL,fontSize:"28px"}}>{c.val}</div>
                <div style={SUB}>{c.sub}</div>
              </div>
            ))}
          </div>
          <div style={{...CARD,marginBottom:"12px"}}>
            <div style={STITLE}>At_Risk → Dormant 월별 이탈 현황 (2023-01 ~ 2024-11)</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={TRANS} margin={{top:4,right:40,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F"/>
                <XAxis dataKey="m" tick={ax} interval={2}/>
                <YAxis yAxisId="l" tick={ax} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <YAxis yAxisId="r" orientation="right" tick={ax} tickFormatter={v=>`${v}%`} domain={[0,20]}/>
                <Tooltip content={<DarkTip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:"11px",color:"#94A3B8"}}/>
                <Bar yAxisId="l" dataKey="churned" name="이탈 고객 수" fill="#EF4444" fillOpacity={0.6} radius={[2,2,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="rate" name="전이율 (%)" stroke="#F97316" strokeWidth={2.5} dot={{r:3}}/>
              </ComposedChart>
            </ResponsiveContainer>
            <p style={{fontSize:"11px",color:"#475569",marginTop:"4px"}}>※ 막대(좌축): 이탈 고객 수 / 선(우축): 전이율. 2024년 하반기부터 전이율 15% 이상 지속.</p>
          </div>
          <div style={CARD}>
            <div style={STITLE}>Dormant 비율 추이 (%)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MONTHLY} margin={{top:4,right:12,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F"/>
                <XAxis dataKey="m" tick={ax} interval={2}/>
                <YAxis tick={ax} domain={[55,75]} tickFormatter={v=>`${v}%`}/>
                <Tooltip formatter={v=>`${v}%`} contentStyle={{background:"#0F172A",border:"1px solid #334155",borderRadius:"8px",fontSize:"12px"}}/>
                <Line type="monotone" dataKey="dormPct" name="Dormant 비율" stroke="#6B7280" strokeWidth={2.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:"24px",marginTop:"10px",padding:"10px 12px",background:"#0F172A",borderRadius:"8px",fontSize:"12px"}}>
              <span style={{color:"#94A3B8"}}>23-01: <strong style={{color:"#F8FAFC"}}>57.25%</strong></span>
              <span style={{color:"#94A3B8"}}>24-12: <strong style={{color:"#EF4444"}}>71.76%</strong></span>
              <span style={{color:"#94A3B8"}}>증가폭: <strong style={{color:"#F97316"}}>+14.51%p (2년)</strong></span>
              <span style={{color:"#94A3B8"}}>핵심 경로: <strong style={{color:"#EF4444"}}>At_Risk → Dormant</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB 3: 전환율 분석 ════ */}
      {tab===3 && (
        <div>
          {/* 인사이트 배너 */}
          <div style={{background:"#1a2744",border:"1px solid #1E40AF",borderRadius:"10px",padding:"12px 16px",marginBottom:"12px",fontSize:"13px",color:"#93C5FD",lineHeight:"1.6"}}>
            📊 <strong>전환율 = CRM 캠페인 효과의 직접 지표</strong> — 이탈 감지(Tab 3)는 "위험 탐지"이고, 전환율은 "개입 성과 측정"입니다.
            Regular→Loyal 22.1%는 건강한 수준이나, <strong style={{color:"#FBBF24"}}>Potential→VIP 0.70%는 심각하게 저조</strong>합니다.
          </div>

          {/* KPI 카드 3개 */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"12px"}}>
            {[
              {label:"Regular → Loyal (2024 평균)", val:`${avgUpgrade}%`, sub:"월 평균 519명 업그레이드",  color:"#10B981"},
              {label:"Potential → VIP (2024 평균)", val:"0.70%",           sub:"⚠️ 9명/월 — 즉시 캠페인 필요",color:"#F59E0B"},
              {label:"Win-back Rate (2024 평균)",   val:`${avgWinback}%`, sub:"월 평균 1,028명 재활성화",   color:"#8B5CF6"},
            ].map((c,i)=>(
              <div key={i} style={{...CARD,borderTop:`3px solid ${c.color}`,textAlign:"center"}}>
                <div style={{...LABEL,textAlign:"center"}}>{c.label}</div>
                <div style={{...VAL,fontSize:"26px"}}>{c.val}</div>
                <div style={SUB}>{c.sub}</div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
            {/* 업그레이드율 차트 */}
            <div style={CARD}>
              <div style={STITLE}>업그레이드율 (2024-01 ~ 2024-11)</div>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={UPGRADE} margin={{top:4,right:40,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F"/>
                  <XAxis dataKey="m" tick={ax}/>
                  <YAxis yAxisId="l" tick={ax} tickFormatter={v=>`${v}%`} domain={[0,30]}/>
                  <YAxis yAxisId="r" orientation="right" tick={ax} tickFormatter={v=>`${v}%`} domain={[0,2]}/>
                  <Tooltip content={<DarkTip/>}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:"11px",color:"#94A3B8"}}/>
                  <Bar yAxisId="l" dataKey="r2l" name="Regular→Loyal (%)" fill="#10B981" fillOpacity={0.7} radius={[2,2,0,0]}/>
                  <Line yAxisId="r" type="monotone" dataKey="p2v" name="Potential→VIP (%)" stroke="#F59E0B" strokeWidth={2.5} dot={{r:4}}/>
                </ComposedChart>
              </ResponsiveContainer>
              <p style={{fontSize:"11px",color:"#475569",marginTop:"4px"}}>※ 막대(좌축): Regular→Loyal / 점선(우축): Potential→VIP</p>
            </div>

            {/* Win-back Rate 차트 */}
            <div style={CARD}>
              <div style={STITLE}>Win-back Rate (Dormant → Active, 2024)</div>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={WINBACK} margin={{top:4,right:40,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F"/>
                  <XAxis dataKey="m" tick={ax}/>
                  <YAxis yAxisId="l" tick={ax} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <YAxis yAxisId="r" orientation="right" tick={ax} tickFormatter={v=>`${v}%`} domain={[0,3]}/>
                  <Tooltip content={<DarkTip/>}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:"11px",color:"#94A3B8"}}/>
                  <Bar yAxisId="l" dataKey="wb" name="Win-back 고객 수" fill="#8B5CF6" fillOpacity={0.7} radius={[2,2,0,0]}/>
                  <Line yAxisId="r" type="monotone" dataKey="rate" name="Win-back Rate (%)" stroke="#F59E0B" strokeWidth={2.5} dot={{r:4}}/>
                </ComposedChart>
              </ResponsiveContainer>
              <p style={{fontSize:"11px",color:"#475569",marginTop:"4px"}}>※ Dormant 규모 증가(↑)에도 Win-back Rate 하락(1.98%→1.47%)</p>
            </div>
          </div>

          {/* 전략 인사이트 패널 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <div style={{...CARD,borderLeft:"3px solid #10B981"}}>
              <div style={{fontSize:"13px",fontWeight:600,color:"#4ADE80",marginBottom:"8px"}}>✅ Regular → Loyal : 정상 작동 중</div>
              <p style={{margin:0,fontSize:"12px",color:"#CBD5E1",lineHeight:"1.6"}}>
                월평균 22.1%의 전환율은 Regular가 실질적으로 "Loyal 대기열" 역할을 하고 있음을 의미합니다.<br/>
                → Regular 고객 이탈 방지 = Loyal 규모 유지의 핵심 레버.<br/>
                → 현재 Regular 고객 수(2,419명)는 최고점(2022년 대비) 대비 줄어드는 추세로, <strong>신규 Regular 유입 확대</strong>가 필요합니다.
              </p>
            </div>
            <div style={{...CARD,borderLeft:"3px solid #EF4444"}}>
              <div style={{fontSize:"13px",fontWeight:600,color:"#FCA5A5",marginBottom:"8px"}}>🚨 Potential → VIP : 즉각 개입 필요</div>
              <p style={{margin:0,fontSize:"12px",color:"#CBD5E1",lineHeight:"1.6"}}>
                AOV ₩310,486으로 VIP보다 높지만 전환율 0.70% (9명/월)는 심각하게 낮습니다.<br/>
                <strong>근본 원인</strong>: 고단가 구매 후 재구매 없음 (avg freq 1.21회).<br/>
                → VIP 기준은 F≥4(5회 이상)인데, 현재 Potential은 F≤2.<br/>
                → <strong>빈도 유도 전용 CRM</strong> (재구매 할인, 신상 조기 공개, 포인트 적립) 즉시 가동 권장.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB 4: KPI 갭 분석 ════ */}
      {tab===4 && (
        <div>
          <div style={{...CARD,marginBottom:"12px",padding:"12px 16px",background:"#1a2744",border:"1px solid #1E40AF"}}>
            <p style={{margin:0,fontSize:"13px",color:"#93C5FD",lineHeight:"1.6"}}>
              <strong>📋 분석 배경</strong> — 업그레이드율과 Win-back Rate가 추가되어 현재 대시보드는 <strong>진단(Diagnostic)</strong>과
              <strong>효과 측정(Measurement)</strong>을 모두 커버합니다. 나머지 보완 항목은 중장기 고도화 대상입니다.
            </p>
          </div>
          <div style={CARD}>
            <div style={STITLE}>KPI 구현 현황 (업데이트됨)</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                <thead>
                  <tr style={{borderBottom:"2px solid #334155"}}>
                    {["KPI 지표","구현 상태","현황","보완 방향"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",color:"#64748B",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {KPI_GAP.map((d,i)=>{
                    const badge = d.st==="ok" ? {bg:"#052E16",color:"#4ADE80",text:"✅ 구현됨"}
                      : d.st==="miss" ? {bg:"#450A0A",color:"#FCA5A5",text:"❌ 미구현"}
                      : {bg:"#2D1F00",color:"#FCD34D",text:"⚠️ 부분"};
                    return (
                      <tr key={i} style={{borderBottom:"1px solid #1E293B",background:i%2===0?"transparent":"#131C2E"}}>
                        <td style={{padding:"10px 14px",fontWeight:600,color:"#E2E8F0",whiteSpace:"nowrap"}}>{d.kpi}</td>
                        <td style={{padding:"10px 14px"}}>
                          <span style={{background:badge.bg,color:badge.color,borderRadius:"6px",padding:"2px 8px",fontSize:"11px"}}>{badge.text}</span>
                        </td>
                        <td style={{padding:"10px 14px",color:"#94A3B8"}}>{d.desc}</td>
                        <td style={{padding:"10px 14px",color:d.st==="ok"?"#475569":"#CBD5E1",lineHeight:"1.5"}}>{d.action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginTop:"12px"}}>
            {[
              {label:"🟢 현재 구현 완료",items:["세그먼트 분포/추이","매출 기여 & AOV/ARPPU","At_Risk 전이율 & 손실 진단","세그먼트 업그레이드율","Win-back Rate"],color:"#10B981",note:"이탈 감지 + 캠페인 효과 측정 모두 커버됨."},
              {label:"🟡 중기 보완 권장",items:["Retention Rate (동일 세그먼트 유지율)","재구매 주기 (Days to Repurchase)","CLV 추정값"],color:"#F59E0B",note:"예산 배분 최적화와 R Score 임계값 재설정에 필요."},
              {label:"🟣 장기 고도화",items:["프로모션 반응율 (events 활용)"],color:"#8B5CF6",note:"events 테이블 보유 중 — 추가 데이터 수집 없이 산출 가능."},
            ].map((c,i)=>(
              <div key={i} style={{...CARD,borderTop:`3px solid ${c.color}`}}>
                <div style={{fontSize:"13px",fontWeight:600,color:"#F8FAFC",marginBottom:"8px"}}>{c.label}</div>
                {c.items.map((it,j)=>(
                  <div key={j} style={{fontSize:"12px",color:"#CBD5E1",padding:"4px 0",borderBottom:"1px solid #1E293B"}}>· {it}</div>
                ))}
                <p style={{margin:"8px 0 0",fontSize:"11px",color:"#64748B",lineHeight:"1.5"}}>{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop:"20px",textAlign:"center",fontSize:"11px",color:"#334155"}}>
        RFM Segment Dashboard v2 · thelook_ecommerce · MySQL Direct · 기준일 2024-12-31
      </div>
    </div>
  );
}
