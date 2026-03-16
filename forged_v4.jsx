import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// THEME CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════
const ThemeCtx = createContext('dark');

const DARK = {
  bg:'#070707', s1:'#0D0D0D', s2:'#111', s3:'#161616', s4:'#1C1C1C',
  border:'#222', borderMid:'#2A2A2A', borderLight:'#333',
  gold:'#FFD700', goldDim:'#C9A800', goldFaint:'rgba(255,215,0,0.06)', goldGlow:'rgba(255,215,0,0.18)',
  blue:'#00D9FF', blueFaint:'rgba(0,217,255,0.06)',
  white:'#FFFFFF', offWhite:'#E8E8E8', gray:'#444', light:'#777', lighter:'#AAA',
  green:'#00E676', red:'#FF4757', orange:'#FF9F43', purple:'#A29BFE',
  inputBg:'#0D0D0D', inputTxt:'#fff', overlay:'rgba(0,0,0,0.9)',
};
const LIGHT = {
  bg:'#F0EFE9', s1:'#E6E5DF', s2:'#F8F7F3', s3:'#ECEAE5', s4:'#E2E0DA',
  border:'#CFCDC7', borderMid:'#C7C5BF', borderLight:'#BFBDB7',
  gold:'#8B6900', goldDim:'#6D5200', goldFaint:'rgba(139,105,0,0.08)', goldGlow:'rgba(139,105,0,0.2)',
  blue:'#006FA6', blueFaint:'rgba(0,111,166,0.08)',
  white:'#1A1917', offWhite:'#2D2C2A', gray:'#9A9892', light:'#65635E', lighter:'#45433E',
  green:'#00703A', red:'#C0392B', orange:'#B85800', purple:'#6048A0',
  inputBg:'#F8F7F3', inputTxt:'#1A1917', overlay:'rgba(0,0,0,0.75)',
};

const useC = () => useContext(ThemeCtx) === 'light' ? LIGHT : DARK;

// ═══════════════════════════════════════════════════════════════════════════════
// RANK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const RANKS = [
  { name:null,      min:0,  icon:'',    color:'#555555', sub:'' },
  { name:'Virex',   min:3,  icon:'🗡️',  color:'#9B59B6', sub:'You have awakened. The forge begins to heat.' },
  { name:'Draxen',  min:7,  icon:'⚔️',  color:'#3498DB', sub:'The blade sharpens. Strike while the iron is hot.' },
  { name:'Krython', min:14, icon:'🔥',  color:'#E67E22', sub:'Fire-forged. Most never reach this point. You are not most.' },
  { name:'Valtrix', min:30, icon:'💎',  color:'#1ABC9C', sub:'Diamond discipline. You are built completely different.' },
  { name:'Zenovar', min:60, icon:'👑',  color:'#FFD700', sub:'You have transcended ordinary limits. FORGED MODE unlocked.', forgedMode:true },
];

const getRank = (streak) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (streak >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════════
const todayStr  = () => new Date().toISOString().split('T')[0];
const uid       = () => Math.random().toString(36).slice(2, 9);
const fmtFull   = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
const fmtMed    = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
const fmtShort  = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const fmtMonth  = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});
const getWeekKey = dateStr => { const d=new Date(dateStr+'T12:00:00'),j=new Date(d.getFullYear(),0,1),w=Math.ceil(((d-j)/86400000+j.getDay()+1)/7); return `${d.getFullYear()}-W${String(w).padStart(2,'0')}`; };
const getMonthKey = dateStr => dateStr.slice(0,7);

// Streak: only days with ≥1 completed task count
const calcStreak = (entries) => {
  let n = 0; const d = new Date();
  const tk = d.toISOString().split('T')[0];
  if (!entries[tk]?.tasks?.some(t => t.completed)) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    const s = d.toISOString().split('T')[0];
    if (entries[s]?.tasks?.some(t => t.completed)) { n++; d.setDate(d.getDate() - 1); } else break;
  }
  return n;
};

const getProgress = entry => {
  if (!entry?.tasks?.length) return { pct:0, done:0, total:0 };
  const done = entry.tasks.filter(t => t.completed).length;
  return { pct: Math.round(done / entry.tasks.length * 100), done, total: entry.tasks.length };
};
const streakMsg = n => n===0?'Start your streak today':n<3?'Getting started. Keep going.':n<7?'Building momentum.':n<14?"Solid. Don't stop now.":n<30?'Impressive consistency.':'Legendary discipline. 🏆';
const isReviewTime = () => { const d=new Date(); return {weekly:d.getDay()===0,monthly:d.getDate()>=new Date(d.getFullYear(),d.getMonth()+1,0).getDate()-2}; };

const MOODS = ['😤','😔','😐','🙂','😊','😄','💪','🔥','🚀','🧠'];
const MOOD_LABELS = ['Frustrated','Low','Neutral','Okay','Happy','Great','Strong','On Fire','Unstoppable','In The Zone'];
const GOAL_COLORS = ['#FFD700','#00D9FF','#FF6B6B','#00E676','#FF9F43','#A29BFE','#FD79A8','#55EFC4'];
const STATUS_OPTIONS = ['Not Started','In Progress','Halfway There','Almost Done','Complete'];
const STATUS_COLORS_MAP = {'Not Started':'#555','In Progress':'#00D9FF','Halfway There':'#FF9F43','Almost Done':'#FFD700','Complete':'#00E676'};
const STATUS_ICONS_MAP  = {'Not Started':'⬜','In Progress':'🔄','Halfway There':'⚡','Almost Done':'🔥','Complete':'✅'};

const store = {
  get: async k => { try { if(!window.storage)return null; const r=await window.storage.get(k); return r?JSON.parse(r.value):null; } catch{return null;} },
  set: async (k,v) => { try { if(!window.storage)return; await window.storage.set(k,JSON.stringify(v)); } catch(e){console.warn(e);} },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES (theme-aware)
// ═══════════════════════════════════════════════════════════════════════════════
const makeG = (theme) => {
  const C = theme === 'light' ? LIGHT : DARK;
  return `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: ${C.bg}; color: ${C.white}; font-family: 'DM Sans', sans-serif; transition: background .3s, color .3s; }
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.gold}55; border-radius: 2px; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn   { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes fillBar   { from{width:0} to{width:var(--w)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes checkIn   { 0%{transform:scale(0) rotate(-20deg)} 65%{transform:scale(1.2) rotate(4deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes goldPulse { 0%,100%{box-shadow:0 0 24px ${C.goldGlow}} 50%{box-shadow:0 0 44px ${C.gold}44} }
  @keyframes rankPop   { 0%{opacity:0;transform:scale(.7) translateY(30px)} 60%{transform:scale(1.05) translateY(-4px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes dayDone   { 0%{opacity:0;transform:translateY(16px) scale(.9)} 60%{transform:translateY(-4px) scale(1.03)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
  .v-enter  { animation: fadeUp .28s ease both; }
  .sc-enter { animation: scaleIn .22s ease both; }
  .rank-pop { animation: rankPop .5s cubic-bezier(.34,1.56,.64,1) both; }
  .day-done { animation: dayDone .45s cubic-bezier(.34,1.56,.64,1) both; }
  input, textarea, select {
    background: ${C.inputBg}; border: 1.5px solid ${C.border}; color: ${C.inputTxt};
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color .2s, box-shadow .2s, background .3s;
  }
  input:focus, textarea:focus, select:focus {
    border-color: ${C.gold}; box-shadow: 0 0 0 3px ${C.goldFaint};
  }
  input::placeholder, textarea::placeholder { color: ${C.borderLight}; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .16s ease; }
  button:active { transform: scale(.94) !important; }
  .task-cb {
    -webkit-appearance:none; appearance:none;
    width:21px; height:21px; min-width:21px; border:2px solid ${C.borderMid};
    border-radius:6px; cursor:pointer; transition:all .18s; position:relative;
    background: ${C.inputBg};
  }
  .task-cb:hover { border-color:${C.gold}; }
  .task-cb:checked { background:${C.gold}; border-color:${C.gold}; }
  .task-cb:checked::after {
    content:''; position:absolute; left:5px; top:2px;
    width:7px; height:11px; border:2.5px solid #000;
    border-top:none; border-left:none;
    transform:rotate(45deg); animation:checkIn .18s ease;
  }
  input[type=range] {
    -webkit-appearance:none; height:5px; border-radius:3px; outline:none; padding:0; width:100%; border:none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance:none; width:20px; height:20px; border-radius:50%;
    background:${C.gold}; cursor:pointer; box-shadow:0 0 10px ${C.gold}55; transition:box-shadow .2s;
  }
  input[type=range]::-webkit-slider-thumb:hover { box-shadow:0 0 22px ${C.gold}cc; }
  .btn-gold { background:${C.gold}; color:#000; border:none; font-weight:700; letter-spacing:.05em; text-transform:uppercase; }
  .btn-gold:hover { filter:brightness(1.08); transform:translateY(-1px); box-shadow:0 6px 24px ${C.gold}44; }
  .btn-outline { background:transparent; border:1.5px solid ${C.borderMid}; color:${C.light}; font-weight:600; }
  .btn-outline:hover { border-color:${C.gold}; color:${C.gold}; }
  .btn-blue { background:${C.blueFaint}; border:1px solid ${C.blue}33; color:${C.blue}; font-weight:600; }
  .btn-blue:hover { background:${C.blue}22; border-color:${C.blue}; box-shadow:0 4px 16px ${C.blue}33; }
  .btn-ghost { background:transparent; border:none; color:${C.gray}; }
  .btn-ghost:hover { color:${C.light}; }
  .btn-red { background:${C.red}11; border:1px solid ${C.red}33; color:${C.red}; font-weight:600; }
  .btn-red:hover { background:${C.red}22; }
  .nav-item { border-radius:10px; transition:all .16s; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; }
  .nav-item:hover { background:${C.goldFaint} !important; }
  .nav-item.active { background:${C.gold}18 !important; color:${C.gold} !important; }
  .card-hover { transition:transform .2s, box-shadow .2s; }
  .card-hover:hover { transform:translateY(-2px); box-shadow:0 12px 36px ${theme==='light'?'rgba(0,0,0,.12)':'rgba(0,0,0,.5)'}; }
  .row-hover { transition:background .18s, border-color .18s; cursor:pointer; }
  .row-hover:hover { background:${C.goldFaint} !important; border-color:${C.borderLight} !important; }
  @media (max-width:768px)  { .d-only{display:none!important} }
  @media (min-width:769px)  { .m-only{display:none!important} }
`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOGO
// ═══════════════════════════════════════════════════════════════════════════════
const ForgeLogo = ({ size=32, color='white' }) => (
  <svg width={size} height={Math.round(size*1.3)} viewBox="0 0 100 130" fill="none">
    <circle cx="50" cy="66" r="41" stroke={color} strokeWidth="2.4"/>
    <circle cx="50" cy="66" r="37" stroke={color} strokeWidth="1"/>
    <circle cx="50" cy="20" r="6" fill={color}/>
    <rect x="47.5" y="26" width="5" height="18" rx="2.5" fill={color}/>
    <path d="M33 46 C38 40 45.5 42 50 41 C54.5 42 62 40 67 46" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none"/>
    <path d="M48 42 L52 42 L51.1 115 L50 124 L48.9 115 Z" fill={color}/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const ProgressBar = ({ pct, color, h=6, animated=true, style={} }) => {
  const C = useC();
  const clampedPct = Math.max(0, Math.min(100, pct));
  const barColor = color === 'gold'
    ? `linear-gradient(90deg, ${C.goldDim}, ${C.gold})`
    : color || C.gold;
  return (
    <div style={{ background:C.border, borderRadius:99, overflow:'hidden', height:h, ...style }}>
      <div style={{
        '--w': `${clampedPct}%`,
        height:'100%', borderRadius:99,
        background: barColor,
        width: animated ? undefined : `${clampedPct}%`,
        animation: animated ? 'fillBar .85s cubic-bezier(.4,0,.2,1) both' : 'none',
        boxShadow: `0 0 8px ${C.gold}44`,
        transition: animated ? 'none' : 'width .35s ease',
      }} />
    </div>
  );
};

const Spinner = ({ size=20 }) => {
  const C = useC();
  return <div style={{ width:size, height:size, border:`2.5px solid ${C.border}`, borderTopColor:C.gold, borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />;
};

const Tag = ({ children, color }) => {
  const C = useC();
  const col = color || C.gold;
  return (
    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:col, background:`${col}18`, border:`1px solid ${col}30`, borderRadius:5, padding:'2px 7px', whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
};

const Card = ({ children, style={}, glow=false }) => {
  const C = useC();
  return (
    <div className="card-hover" style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 20px', animation:glow?'goldPulse 4s ease-in-out infinite':'none', ...style }}>
      {children}
    </div>
  );
};

const SectionLabel = ({ children }) => {
  const C = useC();
  return <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:C.light, marginBottom:10 }}>{children}</div>;
};

const EmptyState = ({ icon, title, sub }) => {
  const C = useC();
  return (
    <div style={{ textAlign:'center', padding:'48px 20px', color:C.light }}>
      <div style={{ fontSize:42, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:700, color:C.lighter, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13 }}>{sub}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RANK POPUP
// ═══════════════════════════════════════════════════════════════════════════════
function RankPopup({ rank, isForgedMode=false, onClose }) {
  const C = useC();
  return (
    <div style={{ position:'fixed', inset:0, background:C.overlay, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="rank-pop" style={{
        background: isForgedMode
          ? 'linear-gradient(145deg, #0A0800, #1A1400, #0A0800)'
          : `linear-gradient(145deg, ${C.s1}, ${C.s2})`,
        border: `2px solid ${rank.color}55`,
        borderRadius:24, padding:'40px 36px', textAlign:'center', maxWidth:340, width:'100%',
        boxShadow: `0 0 60px ${rank.color}33, 0 24px 60px rgba(0,0,0,.6)`,
      }}>
        {isForgedMode ? (
          <>
            <div style={{ fontSize:72, marginBottom:8, lineHeight:1 }}>⚔️</div>
            <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.18em', color:C.gold, marginBottom:10, animation:'pulse 2s ease infinite' }}>FORGED MODE</div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:52, color:C.gold, letterSpacing:'.1em', lineHeight:1, background:`linear-gradient(90deg, ${C.goldDim}, ${C.gold}, ${C.goldDim})`, backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'shimmer 2.5s linear infinite' }}>
              UNLOCKED
            </div>
            <div style={{ fontSize:14, color:C.lighter, marginTop:14, lineHeight:1.75 }}>
              60 consecutive days of ruthless execution. You are no longer building — you ARE the forge.
            </div>
            <div style={{ marginTop:10, fontSize:13, color:C.gold, fontStyle:'italic' }}>No Risk No Story ⚔️</div>
          </>
        ) : (
          <>
            <div style={{ fontSize:64, marginBottom:8, lineHeight:1 }}>{rank.icon}</div>
            <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.18em', color:rank.color, marginBottom:8 }}>RANK UP</div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:56, color:rank.color, letterSpacing:'.1em', lineHeight:1 }}>{rank.name}</div>
            <div style={{ marginTop:3, fontSize:11, color:C.light }}>Streak threshold: {rank.min} days</div>
            <div style={{ fontSize:14, color:C.lighter, marginTop:14, lineHeight:1.75 }}>{rank.sub}</div>
          </>
        )}
        <button onClick={onClose} style={{ marginTop:24, width:'100%', borderRadius:12, padding:'13px', fontWeight:800, fontSize:14, letterSpacing:'.06em', textTransform:'uppercase', background:rank.color, color:rank.color === '#FFD700' || rank.color === '#1ABC9C' ? '#000' : '#fff', border:'none' }}>
          Let's Go →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAY COMPLETE OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════
function DayCompleteOverlay({ onClose }) {
  const C = useC();
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.82)', zIndex:1500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div className="day-done" style={{ background:`linear-gradient(145deg, #001A09, #002A10)`, border:`2px solid ${C.green}55`, borderRadius:24, padding:'40px 36px', textAlign:'center', maxWidth:320, width:'100%', boxShadow:`0 0 60px ${C.green}33` }}>
        <div style={{ fontSize:64, lineHeight:1, marginBottom:10 }}>✅</div>
        <div style={{ fontFamily:"'Bebas Neue'", fontSize:44, color:C.green, letterSpacing:'.1em', lineHeight:1 }}>DAY COMPLETE</div>
        <div style={{ fontSize:14, color:C.lighter, marginTop:14, lineHeight:1.75 }}>All tasks completed. You showed up and delivered. That's what separates the built from the broken.</div>
        <div style={{ marginTop:10, fontSize:11, color:C.green, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', animation:'pulse 1.5s ease infinite' }}>No Risk No Story ⚔️</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function ReviewBanner({ onReview, onDismiss }) {
  const C = useC();
  const { weekly, monthly } = isReviewTime();
  if (!weekly && !monthly) return null;
  const type = weekly ? 'weekly' : 'monthly';
  return (
    <div className="sc-enter" style={{ background:`linear-gradient(135deg, ${C.s1}, ${C.s3})`, border:`1px solid ${C.gold}30`, borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
      <div style={{ fontSize:24 }}>⏰</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.gold }}>Time for your {type === 'weekly' ? 'Weekly' : 'Monthly'} Review</div>
        <div style={{ fontSize:12, color:C.light, marginTop:2 }}>Reflect on your {type} and get AI insights to level up.</div>
      </div>
      <button className="btn-gold" onClick={() => onReview(type)} style={{ borderRadius:8, padding:'8px 14px', fontSize:12, flexShrink:0 }}>Review →</button>
      <button className="btn-ghost" onClick={onDismiss} style={{ fontSize:20, padding:'2px 6px', flexShrink:0, color:C.light }}>×</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RANK BADGE (reusable mini badge)
// ═══════════════════════════════════════════════════════════════════════════════
function RankBadge({ rank, forgedMode, size='md' }) {
  const C = useC();
  if (!rank.name && !forgedMode) return null;
  const isLg = size === 'lg';
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:isLg?8:5, background:`${rank.color}18`, border:`1px solid ${rank.color}44`, borderRadius:isLg?12:8, padding:isLg?'6px 12px':'4px 9px' }}>
      <span style={{ fontSize:isLg?18:13 }}>{rank.icon}</span>
      <div>
        <div style={{ fontSize:isLg?13:10, fontWeight:800, color:rank.color, letterSpacing:'.05em', lineHeight:1 }}>{rank.name}</div>
        {forgedMode && <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:C.gold, lineHeight:1, marginTop:2, animation:'pulse 2s ease infinite' }}>FORGED MODE</div>}
      </div>
      {forgedMode && <span style={{ fontSize:isLg?14:11 }}>⚔️</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardView({ entries, goals, profile, progression, onNav, reviewBannerProps }) {
  const C = useC();
  const streak = calcStreak(entries);
  const rank = getRank(streak);
  const today = todayStr();
  const todayEntry = entries[today];
  const prog = getProgress(todayEntry);
  const daysLogged = Object.keys(entries).length;
  const totalTasks = Object.values(entries).reduce((s,e) => s+(e.tasks?.filter(t=>t.completed).length||0),0);
  const forgedMode = streak >= 60;

  return (
    <div className="v-enter" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {reviewBannerProps && <ReviewBanner {...reviewBannerProps} />}

      {/* Profile card + Streak */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14 }}>
        <div className="card-hover" style={{ background:C.s2, border:`1px solid ${forgedMode?C.gold+'44':C.border}`, borderRadius:16, padding:'16px 18px', cursor:'pointer', animation:forgedMode?'goldPulse 4s ease-in-out infinite':'none' }} onClick={() => onNav('profile')}>
          <div style={{ display:'flex', alignItems:'center', gap:13 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:50, height:50, borderRadius:'50%', background:`linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:`0 0 ${forgedMode?'30px':'16px'} ${C.goldGlow}` }}>
                {profile.avatar || '⚡'}
              </div>
              {forgedMode && <div style={{ position:'absolute', top:-4, right:-4, fontSize:14, lineHeight:1 }}>⚔️</div>}
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, letterSpacing:'-.02em', color:C.white }}>{profile.name || 'User'}</div>
              {/* RANK SHOWN NEXT TO USERNAME */}
              {rank.name ? (
                <div style={{ marginTop:4 }}><RankBadge rank={rank} forgedMode={forgedMode} /></div>
              ) : (
                <div style={{ fontSize:12, color:C.light, marginTop:2 }}>{profile.role || 'Keep going to earn your rank'}</div>
              )}
              {profile.tagline && <div style={{ fontSize:11, fontStyle:'italic', color:C.goldDim, marginTop:3 }}>{profile.tagline}</div>}
            </div>
          </div>
        </div>

        {/* Streak pill */}
        <div className="card-hover" style={{ background:forgedMode?'linear-gradient(135deg, #0F0E00, #1A1500)':'linear-gradient(135deg, #0F0E00, #1A1500)', border:`1px solid ${forgedMode?C.gold+'66':C.gold+'22'}`, borderRadius:16, padding:'14px 18px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'goldPulse 4s ease-in-out infinite', minWidth:86 }}>
          <div style={{ fontSize:forgedMode?22:26, lineHeight:1 }}>{forgedMode?'⚔️':'🔥'}</div>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:42, lineHeight:1.1, color:C.gold, marginTop:2 }}>{streak}</div>
          <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:C.goldDim }}>Streak</div>
        </div>
      </div>

      {/* Streak message + rank progress */}
      <div style={{ textAlign:'center', fontSize:12, color:C.light, fontStyle:'italic' }}>{streakMsg(streak)}</div>

      {/* Rank progress to next */}
      {(() => {
        const nextRankIdx = RANKS.findIndex(r => r.name === rank.name) + 1;
        const nextRank = RANKS[nextRankIdx];
        if (!nextRank) return null;
        const prevMin = rank.min || 0;
        const pct = Math.min(100, Math.round((streak - prevMin) / (nextRank.min - prevMin) * 100));
        return (
          <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
              <span style={{ fontSize:11, color:C.light }}>Progress to <strong style={{ color:nextRank.color }}>{nextRank.icon} {nextRank.name}</strong></span>
              <span style={{ fontFamily:"'JetBrains Mono'", fontSize:11, color:C.lighter }}>{streak}/{nextRank.min} days</span>
            </div>
            <ProgressBar pct={pct} color={nextRank.color} h={5} animated={false} />
            <div style={{ fontSize:10, color:C.gray, marginTop:5 }}>{nextRank.min - streak} more days to rank up</div>
          </div>
        );
      })()}

      {/* Today's progress */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
          <div>
            <SectionLabel>Today's Progress</SectionLabel>
            <div style={{ fontSize:12, color:C.lighter }}>{fmtFull(today)}</div>
            {todayEntry?.title && <div style={{ fontSize:12, color:C.gold, marginTop:2 }}>"{todayEntry.title}"</div>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"'JetBrains Mono'", fontSize:28, fontWeight:700, color:prog.pct===100?C.green:C.gold, lineHeight:1 }}>
              {prog.pct}<span style={{ fontSize:13 }}>%</span>
            </div>
            <div style={{ fontSize:11, color:C.light }}>{prog.done}/{prog.total} tasks</div>
          </div>
        </div>
        <ProgressBar pct={prog.pct} color={prog.pct===100?C.green:'gold'} h={8} animated={false} />
        {prog.pct === 100 && <div style={{ marginTop:8, fontSize:12, color:C.green, fontWeight:600 }}>✅ All tasks completed.</div>}
        {!todayEntry && <div style={{ marginTop:10, fontSize:12, color:C.light, textAlign:'center' }}>No log yet — hit "Log Today" below 👇</div>}
        {todayEntry && (
          <div style={{ marginTop:12, display:'flex', gap:16 }}>
            {todayEntry.mood && <div style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ fontSize:17 }}>{todayEntry.mood}</span><span style={{ fontSize:11, color:C.light }}>Mood</span></div>}
            {todayEntry.focusQuality && <div style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ fontFamily:"'JetBrains Mono'", fontSize:13, fontWeight:700, color:C.blue }}>{todayEntry.focusQuality}/10</span><span style={{ fontSize:11, color:C.light }}>Focus</span></div>}
          </div>
        )}
      </Card>

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[
          { v:totalTasks, l:'Tasks Done', c:C.green },
          { v:daysLogged, l:'Days Logged', c:C.blue },
          { v:progression.highestStreak, l:'Best Streak', c:C.orange },
        ].map(s => (
          <div key={s.l} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, padding:'13px 8px', textAlign:'center' }}>
            <div style={{ fontFamily:"'JetBrains Mono'", fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:9, color:C.light, textTransform:'uppercase', letterSpacing:'.06em', marginTop:3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <button className="btn-gold" onClick={() => onNav('log')} style={{ borderRadius:12, padding:'14px', fontSize:14 }}>✏️ Log Today</button>
        <button className="btn-outline" onClick={() => onNav('goals')} style={{ borderRadius:12, padding:'14px', fontSize:14, borderColor:C.borderMid, color:C.light }}>🎯 Goals</button>
        <button className="btn-blue" onClick={() => onNav('ai')} style={{ borderRadius:12, padding:'14px', fontSize:14 }}>💬 AI Coach</button>
        <button className="btn-outline" onClick={() => onNav('history')} style={{ borderRadius:12, padding:'14px', fontSize:14, borderColor:C.borderMid, color:C.light }}>📅 History</button>
      </div>

      {/* Goals preview */}
      {goals.length > 0 && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <SectionLabel>Active Goals</SectionLabel>
            <button onClick={() => onNav('goals')} style={{ fontSize:12, color:C.gold, padding:0, border:'none', background:'none', cursor:'pointer' }}>View all →</button>
          </div>
          {goals.slice(0,3).map(g => {
            const pct = Math.min(100, Math.round(g.currentProgress/g.targetNumber*100));
            return (
              <div key={g.id} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:C.offWhite }}>{g.title}</span>
                  <span style={{ fontFamily:"'JetBrains Mono'", fontSize:12, color:g.color }}>{pct}%</span>
                </div>
                <ProgressBar pct={pct} color={g.color} h={4} animated={false} />
              </div>
            );
          })}
        </Card>
      )}

      {/* Monthly Progress Chart on Home */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <SectionLabel>This Month's Completion</SectionLabel>
            <div style={{ fontSize:12, color:C.light, marginTop:-4 }}>{fmtMonth(todayStr())} — daily completion rates</div>
          </div>
          <button onClick={() => onNav('progress-history')} style={{ fontSize:11, color:C.gold, background:'none', border:'none', cursor:'pointer', padding:0 }}>Full history →</button>
        </div>
        <MonthlyProgressChart entries={entries} monthKey={todayStr().slice(0,7)} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY PROGRESS CHART — bar chart of each day's completion % in a given month
// ═══════════════════════════════════════════════════════════════════════════════
function MonthlyProgressChart({ entries, monthKey, compact=false }) {
  const C = useC();
  const [hovered, setHovered] = useState(null);

  // Build day slots for the month
  const [year, mon] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const today = todayStr();

  const bars = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    const dateStr = `${monthKey}-${day}`;
    const entry = entries[dateStr];
    const pct = entry
      ? (entry.completionPct !== undefined ? entry.completionPct : getProgress(entry).pct)
      : null;
    const isToday = dateStr === today;
    const isFuture = dateStr > today;
    return { day: i + 1, dateStr, pct, isToday, isFuture, entry };
  });

  const logged = bars.filter(b => b.pct !== null).length;
  const avgPct  = logged ? Math.round(bars.filter(b => b.pct !== null).reduce((s, b) => s + b.pct, 0) / logged) : 0;
  const perfect = bars.filter(b => b.pct === 100).length;

  const barColor = (pct) => {
    if (pct === null) return C.border;
    if (pct === 100) return C.green;
    if (pct >= 70)  return C.gold;
    if (pct >= 40)  return C.orange;
    return C.red;
  };

  const chartH = compact ? 60 : 90;

  return (
    <div>
      {/* Summary row */}
      <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
        {[
          { v: `${avgPct}%`, l:'Avg Completion', c: C.gold },
          { v: logged,        l:'Days Logged',   c: C.blue },
          { v: perfect,       l:'Perfect Days',  c: C.green },
        ].map(s => (
          <div key={s.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontFamily:"'JetBrains Mono'", fontSize:16, fontWeight:700, color:s.c }}>{s.v}</span>
            <span style={{ fontSize:10, color:C.light, textTransform:'uppercase', letterSpacing:'.06em' }}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ position:'relative' }}>
        {/* Y-axis lines */}
        {[25, 50, 75, 100].map(pct => (
          <div key={pct} style={{ position:'absolute', left:0, right:0, bottom:`${pct * chartH / 100}px`, borderTop:`1px dashed ${C.border}`, zIndex:0 }} />
        ))}

        <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:chartH, position:'relative', zIndex:1 }}>
          {bars.map(b => {
            const h = b.pct !== null ? Math.max(3, Math.round(b.pct * chartH / 100)) : 0;
            const col = barColor(b.pct);
            const isHov = hovered === b.day;
            return (
              <div
                key={b.day}
                onMouseEnter={() => setHovered(b.day)}
                onMouseLeave={() => setHovered(null)}
                style={{ flex:1, height:chartH, display:'flex', alignItems:'flex-end', cursor: b.entry ? 'pointer' : 'default', position:'relative' }}
              >
                {/* Bar */}
                <div style={{
                  width:'100%', height: b.isFuture ? 0 : (b.pct === null ? 3 : h),
                  background: b.pct === null && !b.isFuture ? C.s4 : col,
                  borderRadius:'3px 3px 1px 1px',
                  opacity: b.isToday ? 1 : b.isFuture ? 0 : (isHov ? 1 : 0.82),
                  transition:'all .2s ease',
                  boxShadow: b.isToday ? `0 0 8px ${col}88` : 'none',
                  border: b.isToday ? `1px solid ${col}` : 'none',
                  transform: isHov ? 'scaleY(1.04)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                }} />

                {/* Tooltip */}
                {isHov && b.entry && (
                  <div style={{
                    position:'absolute', bottom: h + 8, left:'50%', transform:'translateX(-50%)',
                    background:C.s1, border:`1px solid ${col}`, borderRadius:8,
                    padding:'6px 10px', zIndex:50, whiteSpace:'nowrap', pointerEvents:'none',
                    boxShadow:`0 4px 20px rgba(0,0,0,.5)`,
                  }}>
                    <div style={{ fontSize:11, fontWeight:700, color:col }}>{b.pct}%</div>
                    <div style={{ fontSize:10, color:C.light }}>{fmtShort(b.dateStr)}</div>
                    {b.entry.title && <div style={{ fontSize:9, color:C.gray, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis' }}>{b.entry.title}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis day labels — every 5th */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:2, marginTop:4 }}>
          {bars.map(b => (
            <div key={b.day} style={{ flex:1, textAlign:'center', fontSize:7, color: b.isToday ? C.gold : C.gray, fontWeight: b.isToday ? 700 : 400 }}>
              {b.day % 5 === 0 || b.day === 1 || b.isToday ? b.day : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
        {[
          { c: C.green,  l:'100%' },
          { c: C.gold,   l:'70–99%' },
          { c: C.orange, l:'40–69%' },
          { c: C.red,    l:'< 40%' },
          { c: C.s4,     l:'Not logged' },
        ].map(s => (
          <div key={s.l} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.c }} />
            <span style={{ fontSize:9, color:C.gray }}>{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOG VIEW — with live progress + Day Complete celebration
// ═══════════════════════════════════════════════════════════════════════════════
function LogView({ entries, setEntries, onDayComplete }) {
  const C = useC();
  const today = todayStr();
  const ex = entries[today];
  const [title, setTitle]         = useState(ex?.title || '');
  const [tasks, setTasks]         = useState(ex?.tasks || []);
  const [focus, setFocus]         = useState(ex?.focusQuality || 7);
  const [mood, setMood]           = useState(ex?.mood || '');
  const [notes, setNotes]         = useState(ex?.notes || '');
  const [reflections, setRefls]   = useState(ex?.reflections || '');
  const [newTask, setNewTask]     = useState('');
  const [saved, setSaved]         = useState(false);
  const [prevPct, setPrevPct]     = useState(0);
  const taskRef = useRef(null);
  const autoSaveTimer = useRef(null);

  // Live progress
  const done = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;

  // ── AUTO-SAVE — fires 1.2s after any field change ──
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const completionPct = total > 0 ? Math.round(done / total * 100) : 0;
      setEntries(p => ({ ...p, [today]:{ title, tasks, focusQuality:focus, mood, notes, reflections, completionPct, timestamp:new Date().toISOString() } }));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 1200);
    return () => clearTimeout(autoSaveTimer.current);
  }, [title, tasks, focus, mood, notes, reflections]);

  // Trigger day complete popup when reaching 100%
  useEffect(() => {
    if (pct === 100 && prevPct < 100 && total > 0) {
      onDayComplete();
    }
    setPrevPct(pct);
  }, [pct]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(p => [...p, { id:uid(), text:newTask.trim(), completed:false }]);
    setNewTask('');
    taskRef.current?.focus();
  };
  const toggleTask = id => setTasks(p => p.map(t => t.id===id?{...t,completed:!t.completed}:t));
  const removeTask = id => setTasks(p => p.filter(t => t.id!==id));
  const editTask   = (id, text) => setTasks(p => p.map(t => t.id===id?{...t,text}:t));

  const progressColor = pct === 100 ? C.green : pct >= 60 ? C.gold : pct >= 30 ? C.orange : C.red;

  return (
    <div className="v-enter" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Header + Live Progress Bar */}
      <Card>
        <SectionLabel>Daily Log</SectionLabel>
        <div style={{ fontSize:16, fontWeight:800, marginBottom:12, color:C.white }}>{fmtFull(today)}</div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder='Name this day (e.g. "Deep Work Friday")' style={{ width:'100%', borderRadius:10, padding:'10px 14px', fontSize:14 }} />

        {/* LIVE PROGRESS BAR */}
        {total > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:11, color:C.light, fontWeight:600 }}>Today's Completion</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono'", fontSize:11, color:C.lighter }}>{done}/{total} tasks</span>
                <span style={{ fontFamily:"'JetBrains Mono'", fontSize:22, fontWeight:800, color:progressColor, lineHeight:1 }}>{pct}%</span>
              </div>
            </div>
            <ProgressBar pct={pct} color={progressColor} h={10} animated={false} />
            {pct === 100 && (
              <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:7, padding:'8px 12px', background:`${C.green}12`, borderRadius:9, border:`1px solid ${C.green}33` }}>
                <span style={{ fontSize:16 }}>✅</span>
                <span style={{ fontSize:13, color:C.green, fontWeight:700 }}>All tasks completed.</span>
              </div>
            )}
            {pct > 0 && pct < 100 && (
              <div style={{ fontSize:10, color:C.light, marginTop:5 }}>{100-pct}% remaining — keep pushing</div>
            )}
          </div>
        )}
      </Card>

      {/* Tasks */}
      <Card>
        <SectionLabel>Tasks</SectionLabel>
        <div style={{ display:'flex', gap:9, marginBottom:12 }}>
          <input ref={taskRef} value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key==='Enter'&&addTask()} placeholder="Add task, press Enter..." style={{ flex:1, borderRadius:9, padding:'9px 13px', fontSize:14 }} />
          <button className="btn-gold" onClick={addTask} style={{ borderRadius:9, padding:'9px 14px', fontSize:13 }}>+ Add</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {tasks.length===0 && <div style={{ textAlign:'center', padding:'20px 0', fontSize:13, color:C.gray }}>No tasks yet. Add your first task above.</div>}
          {tasks.map((t, i) => (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 12px', background:t.completed?`${C.green}08`:C.s3, borderRadius:9, border:`1px solid ${t.completed?C.green+'22':C.border}`, transition:'all .2s' }}>
              <input type="checkbox" className="task-cb" checked={t.completed} onChange={() => toggleTask(t.id)} />
              <input value={t.text} onChange={e => editTask(t.id, e.target.value)} style={{ flex:1, background:'none', border:'none', borderRadius:0, padding:0, fontSize:14, color:t.completed?C.gray:C.offWhite, textDecoration:t.completed?'line-through':'none', outline:'none', boxShadow:'none' }} />
              <button className="btn-ghost" onClick={() => removeTask(t.id)} style={{ fontSize:16, padding:'0 3px', lineHeight:1, color:C.gray }}>×</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Focus */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <SectionLabel>Focus Quality</SectionLabel>
          <div style={{ fontFamily:"'JetBrains Mono'", fontSize:26, fontWeight:700, color:focus>=8?C.green:focus>=5?C.gold:C.red }}>
            {focus}<span style={{ fontSize:13, color:C.light }}>/10</span>
          </div>
        </div>
        <input type="range" min={1} max={10} value={focus} onChange={e => setFocus(+e.target.value)} style={{ background:`linear-gradient(to right, ${C.gold} ${(focus-1)/9*100}%, ${C.s4} ${(focus-1)/9*100}%)` }} />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          <span style={{ fontSize:10, color:C.gray }}>Scattered</span>
          <span style={{ fontSize:10, color:C.gray }}>Deep Flow</span>
        </div>
      </Card>

      {/* Mood */}
      <Card>
        <SectionLabel>Mood</SectionLabel>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
          {MOODS.map((m,i) => (
            <button key={m} title={MOOD_LABELS[i]} onClick={() => setMood(m)} style={{ fontSize:21, width:42, height:42, borderRadius:10, border:`2px solid ${mood===m?C.gold:C.border}`, background:mood===m?C.goldFaint:C.s3, transform:mood===m?'scale(1.12)':'scale(1)', transition:'all .16s' }}>
              {m}
            </button>
          ))}
        </div>
        {mood && <div style={{ marginTop:9, fontSize:12, color:C.gold }}>Feeling: {MOOD_LABELS[MOODS.indexOf(mood)]}</div>}
      </Card>

      {/* Notes */}
      <Card>
        <SectionLabel>Notes</SectionLabel>
        <div style={{ fontSize:11, color:C.light, marginBottom:8 }}>Key events, wins, blockers — what happened today?</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Today I shipped the feature, had a great 1:1..." rows={3} style={{ width:'100%', borderRadius:9, padding:'10px 13px', fontSize:14, resize:'vertical', lineHeight:1.65 }} />
      </Card>

      {/* Reflections */}
      <Card>
        <SectionLabel>Reflections</SectionLabel>
        <div style={{ fontSize:11, color:C.light, marginBottom:8 }}>What did you learn? What would you do differently?</div>
        <textarea value={reflections} onChange={e => setRefls(e.target.value)} placeholder="I learned that deep work blocks need to be 3+ hours..." rows={3} style={{ width:'100%', borderRadius:9, padding:'10px 13px', fontSize:14, resize:'vertical', lineHeight:1.65 }} />
      </Card>

      {/* Monthly Progress Chart */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <SectionLabel>This Month's Progress</SectionLabel>
            <div style={{ fontSize:12, color:C.light, marginTop:-4 }}>{fmtMonth(today)} — daily completion rates</div>
          </div>
          <Tag color={C.blue}>📊 Live</Tag>
        </div>
        <MonthlyProgressChart entries={{ ...entries, [today]: { title, tasks, focusQuality: focus, mood, notes, reflections, completionPct: pct } }} monthKey={today.slice(0,7)} />
      </Card>

      {/* Auto-save status indicator */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:12, background:saved?C.green+'14':C.s2, border:`1px solid ${saved?C.green+'44':C.border}`, transition:'all .4s' }}>
        <span style={{ fontSize:16 }}>{saved ? '✓' : '💾'}</span>
        <span style={{ fontSize:13, fontWeight:600, color:saved?C.green:C.light }}>
          {saved ? 'Auto-saved' : 'Auto-saves as you type'}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOALS VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function GoalsView({ goals, setGoals }) {
  const C = useC();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const blank = { title:'', description:'', targetNumber:'', currentProgress:'', unitOfMeasure:'', deadline:'', color:GOAL_COLORS[0], statusProgress:'Not Started', scoreProgress:5 };
  const [form, setForm] = useState(blank);

  const saveGoal = () => {
    if (!form.title || !form.targetNumber) return;
    const g = { ...form, targetNumber:+form.targetNumber, currentProgress:+(form.currentProgress||0), scoreProgress:+(form.scoreProgress||5), id:editId||uid() };
    if (editId) setGoals(p => p.map(x => x.id===editId?g:x));
    else setGoals(p => [...p, g]);
    setForm(blank); setAdding(false); setEditId(null);
  };
  const startEdit = g => { setForm({...g,targetNumber:String(g.targetNumber),currentProgress:String(g.currentProgress),scoreProgress:g.scoreProgress??5}); setEditId(g.id); setAdding(true); };
  const deleteGoal = id => setGoals(p => p.filter(g => g.id!==id));
  const bump    = (id, delta) => setGoals(p => p.map(g => g.id===id?{...g,currentProgress:Math.max(0,Math.min(g.targetNumber,g.currentProgress+delta))}:g));
  const setExact = (id, val) => setGoals(p => p.map(g => g.id===id?{...g,currentProgress:Math.max(0,Math.min(g.targetNumber,+val||0))}:g));
  const setStatus = (id, s) => setGoals(p => p.map(g => g.id===id?{...g,statusProgress:s}:g));
  const setScore  = (id, v) => setGoals(p => p.map(g => g.id===id?{...g,scoreProgress:v}:g));

  return (
    <div className="v-enter" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:C.white }}>Goals Tracker</div>
          <div style={{ fontSize:12, color:C.light, marginTop:2 }}>{goals.length} active goals</div>
        </div>
        <button className="btn-gold" onClick={() => { setForm(blank); setEditId(null); setAdding(true); }} style={{ borderRadius:10, padding:'10px 16px', fontSize:13 }}>+ New Goal</button>
      </div>

      {adding && (
        <div className="sc-enter" style={{ background:C.s2, border:`1.5px solid ${C.gold}33`, borderRadius:16, padding:'20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:14 }}>{editId?'Edit Goal':'New Goal'}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="Goal title (e.g. Read 24 books this year)" style={{ borderRadius:9, padding:'10px 13px', fontSize:14 }} />
            <input value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Description (optional)" style={{ borderRadius:9, padding:'10px 13px', fontSize:14 }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9 }}>
              {[['currentProgress','Current Progress','0'],['targetNumber','Target Number','24'],['unitOfMeasure','Unit','books, km...']].map(([k,l,ph]) => (
                <div key={k}>
                  <div style={{ fontSize:10, color:C.light, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>{l}</div>
                  <input type={k==='unitOfMeasure'?'text':'number'} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{ width:'100%', borderRadius:9, padding:'10px 13px', fontSize:14 }} />
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10, color:C.light, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>Word Progress — Status</div>
              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => setForm(p=>({...p,statusProgress:s}))} style={{ padding:'6px 11px', borderRadius:8, fontSize:12, fontWeight:600, border:`1.5px solid ${form.statusProgress===s?STATUS_COLORS_MAP[s]:C.border}`, background:form.statusProgress===s?STATUS_COLORS_MAP[s]+'18':C.s3, color:form.statusProgress===s?STATUS_COLORS_MAP[s]:C.gray, transition:'all .16s' }}>
                    {STATUS_ICONS_MAP[s]} {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <div style={{ fontSize:10, color:C.light, textTransform:'uppercase', letterSpacing:'.07em' }}>Number Progress — Score</div>
                <span style={{ fontFamily:"'JetBrains Mono'", fontSize:18, fontWeight:700, color:C.gold }}>{form.scoreProgress}<span style={{ fontSize:11, color:C.light }}>/10</span></span>
              </div>
              <input type="range" min={0} max={10} value={form.scoreProgress} onChange={e=>setForm(p=>({...p,scoreProgress:+e.target.value}))} style={{ background:`linear-gradient(to right, ${C.gold} ${form.scoreProgress*10}%, ${C.s4} ${form.scoreProgress*10}%)` }} />
            </div>
            <div>
              <div style={{ fontSize:10, color:C.light, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>Deadline</div>
              <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} style={{ width:'100%', borderRadius:9, padding:'10px 13px', fontSize:14 }} />
            </div>
            <div>
              <div style={{ fontSize:10, color:C.light, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Color Label</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {GOAL_COLORS.map(col => (
                  <button key={col} onClick={() => setForm(p=>({...p,color:col}))} style={{ width:26, height:26, borderRadius:'50%', background:col, border:form.color===col?'3px solid #fff':'3px solid transparent', padding:0 }} />
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:9, marginTop:4 }}>
              <button className="btn-gold" onClick={saveGoal} style={{ flex:1, borderRadius:9, padding:'11px', fontSize:14 }}>{editId?'Update':'Create Goal'}</button>
              <button className="btn-outline" onClick={() => { setAdding(false); setEditId(null); }} style={{ borderRadius:9, padding:'11px 16px', fontSize:14, borderColor:C.borderMid, color:C.light }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {goals.length===0 && !adding && <EmptyState icon="🎯" title="No goals yet" sub="Set your first goal and start tracking your progress" />}

      {goals.map(g => {
        const pct = Math.min(100, Math.round(g.currentProgress/g.targetNumber*100));
        const status = g.statusProgress || 'Not Started';
        const score  = g.scoreProgress ?? 5;
        const statusColor = STATUS_COLORS_MAP[status] || C.gray;
        return (
          <div key={g.id} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
            <div style={{ height:3, background:`linear-gradient(90deg, ${g.color}66, ${g.color})`, width:`${pct}%`, transition:'width .6s ease' }} />
            <div style={{ padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:3, color:C.white }}>{g.title}</div>
                  {g.description && <div style={{ fontSize:12, color:C.light, marginBottom:3 }}>{g.description}</div>}
                  {g.deadline && <div style={{ fontSize:11, color:C.gray }}>Due {fmtShort(g.deadline)}</div>}
                </div>
                <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                  <button className="btn-ghost" onClick={() => startEdit(g)} style={{ fontSize:15, padding:'4px 7px', borderRadius:6 }}>✏️</button>
                  <button className="btn-ghost" onClick={() => deleteGoal(g.id)} style={{ fontSize:15, padding:'4px 7px', borderRadius:6, color:C.red }}>×</button>
                </div>
              </div>
              {/* Amount Progress */}
              <div style={{ background:C.s3, borderRadius:11, padding:'12px 14px', marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:C.light, marginBottom:8 }}>Amount Progress</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontFamily:"'JetBrains Mono'", fontSize:13, color:C.lighter }}>{g.currentProgress} / {g.targetNumber} {g.unitOfMeasure}</span>
                  <span style={{ fontFamily:"'JetBrains Mono'", fontSize:15, fontWeight:700, color:g.color }}>{pct}%</span>
                </div>
                <ProgressBar pct={pct} color={g.color} h={7} animated={false} />
                <div style={{ display:'flex', gap:6, marginTop:10 }}>
                  <button onClick={() => bump(g.id,-1)} style={{ flex:1, borderRadius:7, padding:'6px', background:C.s4, border:`1px solid ${C.border}`, color:C.light, fontSize:12 }}>−1</button>
                  <input type="number" value={g.currentProgress} onChange={e=>setExact(g.id,e.target.value)} style={{ flex:1, borderRadius:7, padding:'6px', textAlign:'center', fontSize:12, fontFamily:"'JetBrains Mono'", color:g.color }} />
                  <button onClick={() => bump(g.id,1)} style={{ flex:1, borderRadius:7, padding:'6px', background:`${g.color}18`, border:`1px solid ${g.color}44`, color:g.color, fontSize:12, fontWeight:700 }}>+1</button>
                  <button onClick={() => bump(g.id,5)} style={{ flex:1, borderRadius:7, padding:'6px', background:`${g.color}18`, border:`1px solid ${g.color}44`, color:g.color, fontSize:12, fontWeight:700 }}>+5</button>
                </div>
              </div>
              {/* Word Progress */}
              <div style={{ background:C.s3, borderRadius:11, padding:'12px 14px', marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:C.light, marginBottom:8 }}>Word Progress — Status</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => setStatus(g.id,s)} style={{ padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:600, border:`1.5px solid ${status===s?STATUS_COLORS_MAP[s]:C.border}`, background:status===s?STATUS_COLORS_MAP[s]+'1A':C.s4, color:status===s?STATUS_COLORS_MAP[s]:C.gray, transition:'all .16s' }}>
                      {STATUS_ICONS_MAP[s]} {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Number Progress */}
              <div style={{ background:C.s3, borderRadius:11, padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:C.light }}>Number Progress — Score</div>
                  <span style={{ fontFamily:"'JetBrains Mono'", fontSize:20, fontWeight:700, color:score>=8?C.green:score>=5?C.gold:C.red }}>{score}<span style={{ fontSize:11, color:C.light }}>/10</span></span>
                </div>
                <input type="range" min={0} max={10} value={score} onChange={e=>setScore(g.id,+e.target.value)} style={{ background:`linear-gradient(to right, ${C.gold} ${score*10}%, ${C.s4} ${score*10}%)` }} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:9, color:C.gray }}>Just started</span>
                  <span style={{ fontSize:9, color:C.gray }}>Fully done</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORY VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function HistoryView({ entries, setEntries }) {
  const C = useC();
  const [expanded, setExpanded] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState(null);
  const sorted = Object.entries(entries).sort(([a],[b]) => b.localeCompare(a));

  const startEdit = (date, entry) => { setEditMode(date); setEditData({...entry,tasks:[...(entry.tasks||[])]}); setExpanded(date); };
  const saveEdit  = () => { setEntries(p=>({...p,[editMode]:{...editData}})); setEditMode(null); setEditData(null); };
  const deleteEntry = date => { setEntries(p=>{const n={...p};delete n[date];return n;}); if(expanded===date)setExpanded(null); };

  if (sorted.length===0) return <div className="v-enter"><EmptyState icon="📅" title="No history yet" sub="Log your first day to begin building your record" /></div>;

  return (
    <div className="v-enter" style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 18px', display:'flex', gap:20 }}>
        {[
          [sorted.length,'Days Logged',C.gold],
          [Object.values(entries).reduce((s,e)=>s+(e.tasks?.filter(t=>t.completed).length||0),0),'Tasks Done',C.blue],
          [sorted.length?Math.round(sorted.reduce((s,[,e])=>s+(e.focusQuality||0),0)/sorted.length*10)/10:0,'Avg Focus',C.green],
        ].map(([v,l,c])=>(
          <div key={l}>
            <div style={{ fontFamily:"'JetBrains Mono'", fontSize:22, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:9, color:C.light, textTransform:'uppercase', letterSpacing:'.06em' }}>{l}</div>
          </div>
        ))}
      </div>

      {sorted.map(([date, entry]) => {
        const prog = getProgress(entry);
        const isExp = expanded===date;
        const isEdit = editMode===date;
        return (
          <div key={date} style={{ background:C.s2, border:`1px solid ${isExp?C.borderLight:C.border}`, borderRadius:14, overflow:'hidden', transition:'border-color .2s' }}>
            <div className="row-hover" onClick={() => setExpanded(isExp?null:date)} style={{ padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:22 }}>{entry.mood||'📅'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.white }}>{entry.title||fmtMed(date)}</div>
                <div style={{ fontSize:11, color:C.light, marginTop:1 }}>{fmtMed(date)} · {prog.done}/{prog.total} tasks</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontFamily:"'JetBrains Mono'", fontSize:18, fontWeight:700, color:prog.pct===100?C.green:C.gold }}>{prog.pct}%</div>
                <div style={{ fontSize:10, color:C.light }}>Focus {entry.focusQuality||'—'}/10</div>
              </div>
              <div style={{ color:C.gray, fontSize:14 }}>{isExp?'▲':'▼'}</div>
            </div>
            <div style={{ height:2, background:C.border }}>
              <div style={{ height:'100%', width:`${prog.pct}%`, background:prog.pct===100?C.green:C.gold, transition:'width .4s' }} />
            </div>
            {isExp && (
              <div className="sc-enter" style={{ padding:'16px', borderTop:`1px solid ${C.border}` }}>
                {isEdit ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div><SectionLabel>Day Title</SectionLabel><input value={editData.title||''} onChange={e=>setEditData(p=>({...p,title:e.target.value}))} placeholder="Name this day..." style={{ width:'100%', borderRadius:8, padding:'9px 12px', fontSize:14 }} /></div>
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}><SectionLabel>Tasks</SectionLabel><button onClick={() => setEditData(p=>({...p,tasks:[...p.tasks,{id:uid(),text:'',completed:false}]}))} style={{ fontSize:11, color:C.gold, background:'none', border:'none', cursor:'pointer' }}>+ Add</button></div>
                      {editData.tasks.map((t,i)=>(
                        <div key={t.id} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
                          <input type="checkbox" className="task-cb" checked={t.completed} onChange={()=>setEditData(p=>({...p,tasks:p.tasks.map((x,j)=>j===i?{...x,completed:!x.completed}:x)}))} />
                          <input value={t.text} onChange={e=>setEditData(p=>({...p,tasks:p.tasks.map((x,j)=>j===i?{...x,text:e.target.value}:x)}))} style={{ flex:1, borderRadius:7, padding:'7px 10px', fontSize:13 }} />
                          <button onClick={()=>setEditData(p=>({...p,tasks:p.tasks.filter((_,j)=>j!==i)}))} style={{ color:C.red, background:'none', border:'none', fontSize:16, padding:'0 4px' }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div><SectionLabel>Focus: {editData.focusQuality}/10</SectionLabel><input type="range" min={1} max={10} value={editData.focusQuality} onChange={e=>setEditData(p=>({...p,focusQuality:+e.target.value}))} style={{ background:`linear-gradient(to right, ${C.gold} ${(editData.focusQuality-1)/9*100}%, ${C.s4} ${(editData.focusQuality-1)/9*100}%)` }} /></div>
                    <div><SectionLabel>Notes</SectionLabel><textarea value={editData.notes||''} onChange={e=>setEditData(p=>({...p,notes:e.target.value}))} rows={2} style={{ width:'100%', borderRadius:8, padding:'9px 12px', fontSize:13, resize:'vertical' }} /></div>
                    <div><SectionLabel>Reflections</SectionLabel><textarea value={editData.reflections||''} onChange={e=>setEditData(p=>({...p,reflections:e.target.value}))} rows={2} style={{ width:'100%', borderRadius:8, padding:'9px 12px', fontSize:13, resize:'vertical' }} /></div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn-gold" onClick={saveEdit} style={{ flex:1, borderRadius:9, padding:'10px', fontSize:13 }}>Save Changes</button>
                      <button className="btn-outline" onClick={()=>{setEditMode(null);setEditData(null);}} style={{ borderRadius:9, padding:'10px 14px', fontSize:13, borderColor:C.borderMid, color:C.light }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:7, marginBottom:12 }}>
                      <button className="btn-outline" onClick={()=>startEdit(date,entry)} style={{ borderRadius:8, padding:'6px 12px', fontSize:12, borderColor:C.borderMid, color:C.light }}>✏️ Edit</button>
                      <button className="btn-red" onClick={()=>deleteEntry(date)} style={{ borderRadius:8, padding:'6px 12px', fontSize:12 }}>🗑 Delete</button>
                    </div>
                    {entry.tasks?.length>0 && (
                      <div style={{ marginBottom:14 }}>
                        <SectionLabel>Tasks</SectionLabel>
                        {entry.tasks.map(t=>(
                          <div key={t.id} style={{ display:'flex', gap:9, padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ fontSize:14 }}>{t.completed?'✅':'⬜'}</span>
                            <span style={{ fontSize:13, color:t.completed?C.gray:C.lighter, textDecoration:t.completed?'line-through':'none' }}>{t.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.notes && <div style={{ marginBottom:12 }}><SectionLabel>Notes</SectionLabel><div style={{ fontSize:13, color:C.lighter, lineHeight:1.65 }}>{entry.notes}</div></div>}
                    {entry.reflections && <div><SectionLabel>Reflections</SectionLabel><div style={{ fontSize:13, color:C.lighter, lineHeight:1.65, fontStyle:'italic' }}>{entry.reflections}</div></div>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function AIView({ entries, goals, initialTab='chat' }) {
  const C = useC();
  const [tab, setTab] = useState(initialTab);
  useEffect(() => { setTab(initialTab); }, [initialTab]);

  const buildContext = useCallback((days=90) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-days);
    const relevant = Object.entries(entries).filter(([d])=>new Date(d+'T12:00:00')>=cutoff).sort(([a],[b])=>a.localeCompare(b));
    const entryText = relevant.map(([date,e])=>
      `[${date}${e.title?` — "${e.title}"`:''} | Tasks:${e.tasks?.filter(t=>t.completed).length||0}/${e.tasks?.length||0} | Focus:${e.focusQuality||'?'}/10 | Mood:${e.mood||'?'} | Completion:${e.completionPct??'?'}% | Notes:${e.notes||'—'} | Reflections:${e.reflections||'—'}]`
    ).join('\n');
    const goalsText = goals.map(g=>`• ${g.title}: ${g.currentProgress}/${g.targetNumber} ${g.unitOfMeasure} (${Math.round(g.currentProgress/g.targetNumber*100)}%) — Status:${g.statusProgress||'?'} Score:${g.scoreProgress??'?'}/10`).join('\n')||'None';
    return { entryText, goalsText, count:relevant.length };
  }, [entries, goals]);

  return (
    <div className="v-enter" style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'flex', gap:0, background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', marginBottom:14 }}>
        {[['chat','💬 AI Coach'],['weekly','📊 Weekly'],['monthly','🗓️ Monthly']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'11px 8px', background:tab===t?C.goldFaint:'none', border:'none', color:tab===t?C.gold:C.light, fontWeight:tab===t?700:500, fontSize:13, borderBottom:`2px solid ${tab===t?C.gold:'transparent'}`, transition:'all .18s' }}>{l}</button>
        ))}
      </div>
      {tab==='chat' && <ChatTab buildContext={buildContext} />}
      {tab==='weekly' && <ReviewTab type="weekly" entries={entries} buildContext={buildContext} />}
      {tab==='monthly' && <ReviewTab type="monthly" entries={entries} buildContext={buildContext} />}
    </div>
  );
}

function ChatTab({ buildContext }) {
  const C = useC();
  const [messages, setMessages] = useState([{ role:'assistant', content:"Hey — I'm your FORGED AI coach. I have full access to your performance data, streak, and goals. Ask me anything about your patterns, progress, or what to do next." }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const send = async () => {
    if (!input.trim()||loading) return;
    const userMsg = {role:'user',content:input.trim()};
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(''); setLoading(true);
    const { entryText, goalsText, count } = buildContext(90);
    const sys = `You are an elite performance coach for FORGED (slogan: No Risk No Story). You have ${count} journal entries and full goal data. Be direct, data-driven, motivational. Reference specific numbers when relevant. No fluff.

JOURNAL DATA:
${entryText||'No entries yet'}

GOALS:
${goalsText}`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:sys,messages:newMessages.map(m=>({role:m.role,content:m.content}))})});
      const data = await res.json();
      setMessages(p=>[...p,{role:'assistant',content:data.content?.map(b=>b.text||'').join('')||'Try again.'}]);
    } catch { setMessages(p=>[...p,{role:'assistant',content:'Connection error. Please try again.'}]); }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:12 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{ maxWidth:'84%', padding:'11px 15px', borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px', background:m.role==='user'?`linear-gradient(135deg,${C.goldDim},${C.gold})`:C.s2, color:m.role==='user'?'#000':C.lighter, border:m.role==='user'?'none':`1px solid ${C.border}`, fontSize:14, lineHeight:1.65, fontWeight:m.role==='user'?600:400 }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 14px', background:C.s2, borderRadius:14, border:`1px solid ${C.border}`, maxWidth:130 }}><Spinner size={14}/><span style={{ fontSize:12, color:C.light, animation:'pulse 1.4s ease infinite' }}>Thinking...</span></div>}
        <div ref={endRef} />
      </div>
      {messages.length===1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.gray, textTransform:'uppercase', letterSpacing:'.07em' }}>Try asking:</div>
          {["What are my strongest days?","Where am I losing focus?","How close am I to my goals?","What should I do next week?"].map(q=>(
            <button key={q} onClick={()=>setInput(q)} style={{ textAlign:'left', background:C.s2, border:`1px solid ${C.border}`, borderRadius:9, padding:'9px 13px', fontSize:13, color:C.lighter }}>{q}</button>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:9 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask your AI coach..." style={{ flex:1, borderRadius:12, padding:'12px 15px', fontSize:14 }} />
        <button className={loading?'btn-outline':'btn-gold'} onClick={send} disabled={loading} style={{ borderRadius:12, padding:'12px 16px', fontSize:14, opacity:loading?.6:1 }}>
          {loading?<Spinner size={16}/>:'→'}
        </button>
      </div>
    </div>
  );
}

function ReviewTab({ type, entries, buildContext }) {
  const C = useC();
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(null);
  const groups = {};
  Object.entries(entries).forEach(([date,entry])=>{
    const key = type==='weekly'?getWeekKey(date):getMonthKey(date);
    if(!groups[key]) groups[key]={key,dates:[],entries:{}};
    groups[key].dates.push(date);
    groups[key].entries[date]=entry;
  });
  const sortedGroups = Object.values(groups).sort((a,b)=>b.key.localeCompare(a.key));

  const generate = async (group) => {
    setLoading(group.key);
    const dates = group.dates.sort();
    const { goalsText } = buildContext(365);
    const periodEntries = dates.map(d=>{const e=group.entries[d];return `[${d}${e.title?` "${e.title}"`:''} Tasks:${e.tasks?.filter(t=>t.completed).length||0}/${e.tasks?.length||0} Focus:${e.focusQuality||'?'}/10 Completion:${e.completionPct??'?'}% Notes:${e.notes||'—'} Reflections:${e.reflections||'—'}]`;}).join('\n');
    const label = type==='weekly'?`Week of ${fmtShort(dates[0])}`:`${fmtMonth(dates[0])}`;
    const prompt=`You are an elite performance coach reviewing ${label} for the FORGED app (No Risk No Story).\n\nENTRIES:\n${periodEntries}\n\nGOALS:\n${goalsText}\n\nWrite:\n## PERIOD SCORE: [X/10]\n[One sentence summary]\n## TOP WINS 🏆\n[3 specific wins]\n## WEAK SPOTS ⚠️\n[2 honest observations with advice]\n## KEY PATTERN 🔍\n[1-2 behavioral patterns]\n## NEXT PRIORITIES 🎯\n[3 concrete actions]\n## FORGED VERDICT ⚔️\n[One powerful closing]\nMax 350 words. No fluff. Reference real data.`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
      const data = await res.json();
      const text = data.content?.map(b=>b.text||'').join('')||'Could not generate.';
      setReviews(p=>({...p,[group.key]:{text,createdAt:new Date().toLocaleString()}}));
    } catch { setReviews(p=>({...p,[group.key]:{text:'Connection error.',createdAt:''}})); }
    setLoading(null);
  };

  const renderText = text => text.split('\n').map((line,i)=>{
    if(line.startsWith('## ')) return <div key={i} style={{ fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'.09em',color:C.gold,marginTop:i>0?16:0,marginBottom:6,paddingBottom:5,borderBottom:`1px solid ${C.border}` }}>{line.replace('## ','')}</div>;
    if(line.match(/^[•\-]/)) return <div key={i} style={{ fontSize:13,color:C.lighter,lineHeight:1.7,paddingLeft:10 }}>› {line.replace(/^[•\-] ?/,'')}</div>;
    if(!line.trim()) return <div key={i} style={{ height:4 }}/>;
    return <div key={i} style={{ fontSize:13,color:C.lighter,lineHeight:1.75 }}>{line}</div>;
  });

  if(sortedGroups.length===0) return <EmptyState icon={type==='weekly'?'📊':'🗓️'} title={`No ${type} data yet`} sub="Log entries to start generating reviews" />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {sortedGroups.map(group=>{
        const prog={daysLogged:group.dates.length,avgFocus:Math.round(group.dates.reduce((s,d)=>s+(group.entries[d].focusQuality||0),0)/group.dates.length*10)/10,totalTasks:group.dates.reduce((s,d)=>s+(group.entries[d].tasks?.filter(t=>t.completed).length||0),0)};
        const review=reviews[group.key];
        const isLoading=loading===group.key;
        const label=type==='weekly'?`Week of ${fmtShort(group.dates.sort()[0])}`:`${fmtMonth(group.dates[0])}`;
        return (
          <div key={group.key} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:review?`1px solid ${C.border}`:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.white }}>{label}</div>
                <button onClick={()=>generate(group)} disabled={isLoading} className="btn-gold" style={{ borderRadius:9, padding:'7px 12px', fontSize:12, display:'flex', alignItems:'center', gap:5, opacity:isLoading?.7:1 }}>
                  {isLoading?<><Spinner size={12}/>Analyzing...</>:review?'↻ Refresh':'✨ Review'}
                </button>
              </div>
              <div style={{ fontSize:11, color:C.light }}>{prog.daysLogged} days · {prog.totalTasks} tasks · Focus avg {prog.avgFocus}/10</div>
            </div>
            {review&&!isLoading&&<div className="sc-enter" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:3 }}>{renderText(review.text)}{review.createdAt&&<div style={{ fontSize:10,color:C.gray,marginTop:12 }}>Generated {review.createdAt}</div>}</div>}
            {isLoading&&<div style={{ padding:'20px 16px', display:'flex', alignItems:'center', gap:10 }}><Spinner size={16}/><span style={{ fontSize:13, color:C.light }}>Analyzing your {type==='weekly'?'week':'month'}...</span></div>}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS VIEW (standalone page)
// ═══════════════════════════════════════════════════════════════════════════════
function ReviewsView({ entries, goals, reviews, setReviews }) {
  const C = useC();
  const [tab, setTab]     = useState('weekly');
  const [loading, setLoading] = useState(null);
  const [modal, setModal] = useState(null);

  const buildContext = useCallback(()=>{
    const entryText = Object.entries(entries).sort(([a],[b])=>a.localeCompare(b)).map(([date,e])=>`[${date}${e.title?` "${e.title}"`:''} Tasks:${e.tasks?.filter(t=>t.completed).length||0}/${e.tasks?.length||0} Focus:${e.focusQuality||'?'}/10 Completion:${e.completionPct??'?'}% Notes:${e.notes||'—'}]`).join('\n');
    const goalsText = goals.map(g=>`• ${g.title}: ${g.currentProgress}/${g.targetNumber} ${g.unitOfMeasure} (${Math.round(g.currentProgress/g.targetNumber*100)}%) Status:${g.statusProgress||'?'} Score:${g.scoreProgress??'?'}/10`).join('\n')||'None';
    return { entryText, goalsText };
  },[entries,goals]);

  const groupEntries = type => {
    const groups={};
    Object.entries(entries).forEach(([date,entry])=>{
      const key=type==='weekly'?getWeekKey(date):getMonthKey(date);
      if(!groups[key]) groups[key]={key,dates:[],entries:{}};
      groups[key].dates.push(date);
      groups[key].entries[date]=entry;
    });
    return Object.values(groups).sort((a,b)=>b.key.localeCompare(a.key));
  };

  const generateReview = async (group,type) => {
    const key=`${type}-${group.key}`;
    setLoading(key);
    const {goalsText}=buildContext();
    const dates=group.dates.sort();
    const label=type==='weekly'?`Week of ${fmtFull(dates[0])}`:`${fmtMonth(dates[0])}`;
    const periodEntries=dates.map(d=>{const e=group.entries[d];return `[${d}${e.title?` "${e.title}"`:''} Tasks:${e.tasks?.filter(t=>t.completed).length||0}/${e.tasks?.length||0} Focus:${e.focusQuality||'?'}/10 Completion:${e.completionPct??'?'}% Notes:${e.notes||'—'} Reflections:${e.reflections||'—'}]`;}).join('\n');
    const prompt=`You are an elite coach reviewing ${label} for FORGED (No Risk No Story).\n\nENTRIES:\n${periodEntries}\n\nGOALS:\n${goalsText}\n\n## PERIOD SCORE: [X/10]\n[One-sentence period summary]\n## TOP WINS 🏆\n[3 data-referenced wins]\n## WEAK SPOTS ⚠️\n[2 honest observations with advice]\n## KEY PATTERN 🔍\n[Behavioral patterns detected]\n## NEXT PERIOD PRIORITIES 🎯\n[3 concrete next steps]\n## FORGED VERDICT ⚔️\n[One powerful closing — No Risk No Story energy]\nMax 350 words.`;
    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
      const data=await res.json();
      const text=data.content?.map(b=>b.text||'').join('')||'Could not generate.';
      const newReview={text,label,createdAt:new Date().toLocaleString(),type};
      setReviews(p=>({...p,[key]:newReview}));
      setModal({key,...newReview});
    } catch { setReviews(p=>({...p,[key]:{text:'Connection error.',label,createdAt:'',type}})); }
    setLoading(null);
  };

  const deleteReview = key => { setReviews(p=>{const n={...p};delete n[key];return n;}); if(modal?.key===key)setModal(null); };

  const renderText = text => text.split('\n').map((line,i)=>{
    if(line.startsWith('## ')) return <div key={i} style={{ fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'.09em',color:C.gold,marginTop:i>0?18:0,marginBottom:7,paddingBottom:5,borderBottom:`1px solid ${C.border}` }}>{line.replace('## ','')}</div>;
    if(line.match(/^[•\-]/)) return <div key={i} style={{ fontSize:14,color:C.lighter,lineHeight:1.7,paddingLeft:10 }}>› {line.replace(/^[•\-] ?/,'')}</div>;
    if(!line.trim()) return <div key={i} style={{ height:5 }}/>;
    return <div key={i} style={{ fontSize:14,color:C.lighter,lineHeight:1.75 }}>{line}</div>;
  });

  const {weekly:isWeeklyTime,monthly:isMonthlyTime}=isReviewTime();
  const groups=groupEntries(tab);

  return (
    <div className="v-enter" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:`linear-gradient(135deg, ${C.s1}, ${C.s3})`, border:`1px solid ${C.blue}22`, borderRadius:16, padding:'18px 20px' }}>
        <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'.1em', color:C.blue, fontWeight:700, marginBottom:4 }}>📋 Reviews</div>
        <div style={{ fontSize:18, fontWeight:800, color:C.white, marginBottom:6 }}>Weekly & Monthly Reviews</div>
        <div style={{ fontSize:13, color:C.light, lineHeight:1.6 }}>AI analysis of each period. Click Generate to create a review. Read it as a full card.</div>
      </div>
      {(isWeeklyTime||isMonthlyTime) && (
        <div style={{ background:`linear-gradient(135deg, ${C.s1}, ${C.s3})`, border:`1px solid ${C.gold}30`, borderRadius:12, padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:22 }}>⏰</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.gold }}>Review time!</div>
            <div style={{ fontSize:12, color:C.light, marginTop:1 }}>{isWeeklyTime?"It's Sunday — review your week.":''}{isMonthlyTime&&!isWeeklyTime?"End of month — review it below.":''}</div>
          </div>
        </div>
      )}
      <div style={{ display:'flex', background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
        {[['weekly','📊 Weekly'],['monthly','🗓️ Monthly']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'11px', background:tab===t?C.goldFaint:'none', border:'none', color:tab===t?C.gold:C.light, fontWeight:tab===t?700:500, fontSize:14, borderBottom:`2px solid ${tab===t?C.gold:'transparent'}`, transition:'all .18s' }}>{l}</button>
        ))}
      </div>
      {groups.length===0&&<EmptyState icon="📋" title="No entries yet" sub="Log your daily performance to start generating reviews" />}
      {groups.map(group=>{
        const key=`${tab}-${group.key}`;
        const review=reviews[key];
        const isLoading=loading===key;
        const sortedDates=group.dates.sort();
        const label=tab==='weekly'?`Week of ${fmtShort(sortedDates[0])} — ${fmtShort(sortedDates[sortedDates.length-1])}`:`${fmtMonth(sortedDates[0])}`;
        const avgFocus=Math.round(sortedDates.reduce((s,d)=>s+(group.entries[d].focusQuality||0),0)/sortedDates.length*10)/10;
        const totalTasks=sortedDates.reduce((s,d)=>s+(group.entries[d].tasks?.filter(t=>t.completed).length||0),0);
        const avgCompletion=Math.round(sortedDates.reduce((s,d)=>s+(group.entries[d].completionPct||0),0)/sortedDates.length);
        const moods=sortedDates.map(d=>group.entries[d].mood).filter(Boolean);
        return (
          <div key={key} style={{ background:C.s2, border:`1px solid ${review?C.gold+'33':C.border}`, borderRadius:14, overflow:'hidden', transition:'border-color .2s' }}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:3, color:C.white }}>{label}</div>
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, color:C.light }}>{sortedDates.length} days</span>
                    <span style={{ fontSize:11, color:C.light }}>Focus {avgFocus}/10</span>
                    <span style={{ fontSize:11, color:C.light }}>{totalTasks} tasks done</span>
                    {avgCompletion>0&&<span style={{ fontSize:11, color:C.gold }}>{avgCompletion}% avg completion</span>}
                  </div>
                  {moods.length>0&&<div style={{ marginTop:6, display:'flex', gap:3 }}>{moods.slice(0,7).map((m,i)=><span key={i} style={{ fontSize:14 }}>{m}</span>)}</div>}
                </div>
                {review&&!isLoading&&<Tag color={C.gold}>✓ Review saved</Tag>}
              </div>
              <div style={{ display:'flex', gap:4, marginBottom:12, flexWrap:'wrap' }}>
                {sortedDates.map(d=>{
                  const pct=getProgress(group.entries[d]).pct;
                  return (
                    <div key={d} title={`${fmtShort(d)} — ${pct}%`} style={{ width:28, height:28, borderRadius:6, background:C.s3, border:`1px solid ${C.border}`, display:'flex', alignItems:'flex-end', overflow:'hidden', position:'relative' }}>
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${pct}%`, background:pct===100?C.green:C.gold, opacity:0.65 }} />
                      <div style={{ position:'relative', width:'100%', textAlign:'center', fontSize:8, color:C.lighter, paddingBottom:2 }}>{new Date(d+'T12:00:00').getDate()}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>generateReview(group,tab)} disabled={isLoading} className="btn-gold" style={{ flex:1, borderRadius:9, padding:'10px 14px', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:7, opacity:isLoading?.7:1 }}>
                  {isLoading?<><Spinner size={14}/>Analyzing...</>:review?'↻ Refresh Review':'✨ Generate Review'}
                </button>
                {review&&!isLoading&&(
                  <>
                    <button onClick={()=>setModal({key,...review})} className="btn-blue" style={{ flex:1, borderRadius:9, padding:'10px', fontSize:13 }}>📖 Read Review</button>
                    <button onClick={()=>deleteReview(key)} className="btn-red" style={{ borderRadius:9, padding:'10px 12px', fontSize:13 }}>🗑</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {modal&&(
        <div onClick={()=>setModal(null)} style={{ position:'fixed', inset:0, background:C.overlay, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="sc-enter" onClick={e=>e.stopPropagation()} style={{ background:C.s2, border:`1px solid ${C.gold}33`, borderRadius:20, padding:'24px', width:'100%', maxWidth:560, maxHeight:'82vh', overflowY:'auto', position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.blue, fontWeight:700, marginBottom:4 }}>✨ AI Review</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.white }}>{modal.label}</div>
                {modal.createdAt&&<div style={{ fontSize:11, color:C.gray, marginTop:3 }}>Generated {modal.createdAt}</div>}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>deleteReview(modal.key)} className="btn-red" style={{ borderRadius:9, padding:'7px 11px', fontSize:12 }}>🗑 Delete</button>
                <button onClick={()=>setModal(null)} className="btn-ghost" style={{ fontSize:22, padding:'2px 8px', color:C.light }}>×</button>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>{renderText(modal.text)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE VIEW — with theme toggle + rank display
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileView({ profile, setProfile, entries, goals, theme, setTheme }) {
  const C = useC();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const streak = calcStreak(entries);
  const rank = getRank(streak);
  const forgedMode = streak >= 60;
  const totalTasks = Object.values(entries).reduce((s,e)=>s+(e.tasks?.filter(t=>t.completed).length||0),0);
  const AVATARS = ['⚡','🔥','💪','🚀','🎯','🧠','🏆','💎','⚔️','🌟','🦁','🐉','☄️','🗡️','🎖️'];

  const saveProfile = () => { setProfile(form); setSaved(true); setTimeout(()=>setSaved(false),2000); };

  const FONT_SIZES = ['Small','Default','Large'];
  const CONTRAST  = ['Standard','High Contrast'];

  return (
    <div className="v-enter" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Profile Card */}
      <div style={{ background:forgedMode?'linear-gradient(145deg, #0A0800, #1A1400)':C.s2, border:`1px solid ${forgedMode?C.gold+'55':C.border}`, borderRadius:16, padding:'24px 20px', textAlign:'center', animation:forgedMode?'goldPulse 4s ease-in-out infinite':'none' }}>
        <div style={{ position:'relative', display:'inline-block', marginBottom:14 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, boxShadow:`0 0 ${forgedMode?'40px':'20px'} ${C.goldGlow}` }}>
            {form.avatar||'⚡'}
          </div>
          {forgedMode&&<div style={{ position:'absolute', top:-6, right:-6, fontSize:18, lineHeight:1 }}>⚔️</div>}
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:C.white, letterSpacing:'-.02em' }}>{form.name||'User'}</div>
        {/* RANK IN PROFILE */}
        {rank.name && (
          <div style={{ display:'flex', justifyContent:'center', marginTop:8, marginBottom:4 }}>
            <RankBadge rank={rank} forgedMode={forgedMode} size="lg" />
          </div>
        )}
        {form.role&&<div style={{ fontSize:13, color:C.light, marginTop:4 }}>{form.role}</div>}
        {form.tagline&&<div style={{ fontSize:12, fontStyle:'italic', color:C.goldDim, marginTop:4 }}>{form.tagline}</div>}
        {form.memberSince&&<div style={{ fontSize:11, color:C.gray, marginTop:8 }}>Member since {form.memberSince}</div>}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[
          [streak,'Day Streak',C.gold,'🔥'],
          [Object.keys(entries).length,'Days Logged',C.blue,'📅'],
          [totalTasks,'Tasks Done',C.green,'✅'],
          [goals.length,'Goals Set',C.orange,'🎯'],
          [goals.filter(g=>g.currentProgress>=g.targetNumber).length,'Goals Done',C.purple,'🏆'],
          [Object.keys(entries).length?Math.round(Object.values(entries).reduce((s,e)=>s+(e.focusQuality||0),0)/Object.keys(entries).length*10)/10:0,'Avg Focus',C.lighter,'🧠'],
        ].map(([v,l,c])=>(
          <div key={l} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 8px', textAlign:'center' }}>
            <div style={{ fontFamily:"'JetBrains Mono'", fontSize:20, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:9, color:C.light, textTransform:'uppercase', letterSpacing:'.05em', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── THEME & APPEARANCE ── */}
      <Card>
        <SectionLabel>Appearance</SectionLabel>

        {/* Dark / Light toggle */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:C.white }}>Theme</div>
            <div style={{ fontSize:11, color:C.light, marginTop:2 }}>Adjust the app's colour scheme</div>
          </div>
          <div style={{ display:'flex', background:C.s3, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            {[['dark','🌙 Dark'],['light','☀️ Light']].map(([t,l])=>(
              <button key={t} onClick={()=>setTheme(t)} style={{ padding:'8px 14px', background:theme===t?C.gold:'none', border:'none', color:theme===t?'#000':C.light, fontWeight:theme===t?700:400, fontSize:13, transition:'all .2s' }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Contrast */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:C.white }}>Text Contrast</div>
            <div style={{ fontSize:11, color:C.light, marginTop:2 }}>Enhance readability</div>
          </div>
          <div style={{ display:'flex', background:C.s3, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            {CONTRAST.map(c=>(
              <button key={c} onClick={()=>setForm(p=>({...p,contrast:c}))} style={{ padding:'8px 12px', background:form.contrast===c||(!form.contrast&&c==='Standard')?C.gold:'none', border:'none', color:form.contrast===c||(!form.contrast&&c==='Standard')?'#000':C.light, fontWeight:700, fontSize:11, transition:'all .2s' }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div style={{ paddingTop:12, borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.white, marginBottom:6 }}>Text Size</div>
          <div style={{ display:'flex', gap:8 }}>
            {FONT_SIZES.map(f=>(
              <button key={f} onClick={()=>setForm(p=>({...p,fontSize:f}))} style={{ flex:1, padding:'8px', borderRadius:9, border:`1.5px solid ${form.fontSize===f||(!form.fontSize&&f==='Default')?C.gold:C.border}`, background:form.fontSize===f||(!form.fontSize&&f==='Default')?C.goldFaint:C.s3, color:form.fontSize===f||(!form.fontSize&&f==='Default')?C.gold:C.light, fontWeight:600, fontSize:12, transition:'all .18s' }}>{f}</button>
            ))}
          </div>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card>
        <SectionLabel>Edit Profile</SectionLabel>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:C.light, marginBottom:8 }}>Avatar</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {AVATARS.map(a=>(
              <button key={a} onClick={()=>setForm(p=>({...p,avatar:a}))} style={{ fontSize:20, width:40, height:40, borderRadius:9, border:`2px solid ${form.avatar===a?C.gold:C.border}`, background:form.avatar===a?C.goldFaint:C.s3, transform:form.avatar===a?'scale(1.1)':'scale(1)', transition:'all .16s' }}>{a}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {[['name','Name','Your name'],['role','Role / Title','Entrepreneur, Developer...'],['tagline','Personal Motto','No Risk No Story'],['memberSince','Member Since','Jan 2025']].map(([k,l,ph])=>(
            <div key={k}>
              <div style={{ fontSize:10, color:C.light, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>{l}</div>
              <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{ width:'100%', borderRadius:9, padding:'10px 13px', fontSize:14 }} />
            </div>
          ))}
        </div>
        <button onClick={saveProfile} style={{ marginTop:14, width:'100%', borderRadius:10, padding:'13px', fontSize:14, fontWeight:800, letterSpacing:'.05em', textTransform:'uppercase', background:saved?C.green:C.gold, color:'#000', border:'none', transition:'all .3s' }}>
          {saved?'✓ Saved':'Save Profile'}
        </button>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS HISTORY VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function ProgressHistoryView({ entries }) {
  const C = useC();
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Derive all months that have at least one entry
  const monthKeys = [...new Set(Object.keys(entries).map(d => d.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
  const currentMonth = todayStr().slice(0, 7);

  // Stats per month
  const monthStats = (key) => {
    const days = Object.entries(entries).filter(([d]) => d.startsWith(key));
    if (!days.length) return null;
    const pcts = days.map(([, e]) => e.completionPct !== undefined ? e.completionPct : getProgress(e).pct);
    const avg  = Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
    const perfect = pcts.filter(p => p === 100).length;
    const focuses = days.map(([, e]) => e.focusQuality || 0).filter(Boolean);
    const avgFocus = focuses.length ? Math.round(focuses.reduce((s, f) => s + f, 0) / focuses.length * 10) / 10 : 0;
    const totalTasks = days.reduce((s, [, e]) => s + (e.tasks?.filter(t => t.completed).length || 0), 0);
    return { logged: days.length, avg, perfect, avgFocus, totalTasks };
  };

  const gradeColor = (avg) => avg >= 80 ? C.green : avg >= 60 ? C.gold : avg >= 40 ? C.orange : C.red;
  const gradeLabel = (avg) => avg >= 90 ? 'S' : avg >= 80 ? 'A' : avg >= 65 ? 'B' : avg >= 50 ? 'C' : avg >= 30 ? 'D' : 'F';

  const expandedKey = selectedMonth || (monthKeys.length > 0 ? monthKeys[0] : null);

  if (monthKeys.length === 0) {
    return (
      <div className="v-enter">
        <EmptyState icon="📈" title="No progress data yet" sub="Log your daily tasks to start building your progress history" />
      </div>
    );
  }

  return (
    <div className="v-enter" style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Header */}
      <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 20px' }}>
        <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'.1em', color:C.blue, fontWeight:700, marginBottom:4 }}>📈 Progress History</div>
        <div style={{ fontSize:20, fontWeight:800, color:C.white, marginBottom:4 }}>Monthly Progress Archive</div>
        <div style={{ fontSize:13, color:C.light }}>Every month's completion chart saved automatically from your daily logs.</div>
      </div>

      {/* Month cards */}
      {monthKeys.map(key => {
        const stats = monthStats(key);
        if (!stats) return null;
        const isExpanded = expandedKey === key;
        const isCurrent = key === currentMonth;
        const [yr, mo] = key.split('-').map(Number);
        const label = new Date(yr, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const grade = gradeLabel(stats.avg);
        const gc    = gradeColor(stats.avg);

        return (
          <div key={key} style={{ background:C.s2, border:`1px solid ${isExpanded ? C.gold + '44' : C.border}`, borderRadius:16, overflow:'hidden', transition:'border-color .2s' }}>
            {/* Month header row — clickable */}
            <div
              onClick={() => setSelectedMonth(isExpanded ? null : key)}
              style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}
              className="row-hover"
            >
              {/* Grade badge */}
              <div style={{ width:44, height:44, borderRadius:10, background:gc+'18', border:`1.5px solid ${gc}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontFamily:"'Bebas Neue'", fontSize:24, color:gc, lineHeight:1 }}>{grade}</span>
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:C.white }}>{label}</span>
                  {isCurrent && <Tag color={C.blue}>Current</Tag>}
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:C.light }}>{stats.logged} days logged</span>
                  <span style={{ fontSize:11, color:gc, fontWeight:600 }}>{stats.avg}% avg</span>
                  <span style={{ fontSize:11, color:C.green }}>{stats.perfect} perfect days</span>
                  <span style={{ fontSize:11, color:C.blue }}>Focus {stats.avgFocus}/10</span>
                </div>
              </div>

              {/* Mini sparkline — horizontal row of tiny colored bars */}
              <div style={{ display:'flex', alignItems:'flex-end', gap:1.5, height:28, width:60, flexShrink:0 }}>
                {(() => {
                  const [y, m] = key.split('-').map(Number);
                  const dim = new Date(y, m, 0).getDate();
                  return Array.from({ length: dim }, (_, i) => {
                    const d = `${key}-${String(i+1).padStart(2,'0')}`;
                    const e = entries[d];
                    const p = e ? (e.completionPct !== undefined ? e.completionPct : getProgress(e).pct) : null;
                    const h = p !== null ? Math.max(2, Math.round(p * 28 / 100)) : 1;
                    const col = p === null ? C.s4 : p === 100 ? C.green : p >= 70 ? C.gold : p >= 40 ? C.orange : C.red;
                    return <div key={i} style={{ flex:1, height:h, background:col, borderRadius:1, opacity: p === null ? 0.3 : 0.85 }} />;
                  });
                })()}
              </div>

              <div style={{ color:C.gray, fontSize:14, flexShrink:0 }}>{isExpanded ? '▲' : '▼'}</div>
            </div>

            {/* Expanded chart */}
            {isExpanded && (
              <div className="sc-enter" style={{ padding:'0 18px 18px', borderTop:`1px solid ${C.border}` }}>
                <div style={{ marginTop:16 }}>
                  <MonthlyProgressChart entries={entries} monthKey={key} />
                </div>

                {/* Month stats grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginTop:16 }}>
                  {[
                    { v:`${stats.avg}%`,       l:'Avg Completion', c: gc },
                    { v: stats.perfect,         l:'Perfect Days',   c: C.green },
                    { v:`${stats.avgFocus}/10`, l:'Avg Focus',      c: C.blue },
                    { v: stats.totalTasks,      l:'Tasks Done',     c: C.orange },
                  ].map(s => (
                    <div key={s.l} style={{ background:C.s3, borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                      <div style={{ fontFamily:"'JetBrains Mono'", fontSize:16, fontWeight:700, color:s.c }}>{s.v}</div>
                      <div style={{ fontSize:9, color:C.light, textTransform:'uppercase', letterSpacing:'.05em', marginTop:2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id:'dashboard',        icon:'⚡', label:'Home'     },
  { id:'log',              icon:'✏️', label:'Log'      },
  { id:'goals',            icon:'🎯', label:'Goals'    },
  { id:'progress-history', icon:'📈', label:'Progress' },
  { id:'ai',               icon:'💬', label:'AI Coach' },
  { id:'history',          icon:'📅', label:'History'  },
  { id:'reviews',          icon:'📋', label:'Reviews'  },
  { id:'profile',          icon:'👤', label:'Profile'  },
];

function SideNav({ view, setView, profile, streak, progression }) {
  const C = useC();
  const rank = getRank(streak);
  const forgedMode = streak >= 60;
  return (
    <aside style={{ width:220, flexShrink:0, background:C.s1, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', padding:'0 10px', overflowY:'auto' }}>
      <div style={{ padding:'22px 12px 16px', borderBottom:`1px solid ${C.border}`, marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <ForgeLogo size={26} color={C.gold} />
          <div>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:26, letterSpacing:'.1em', color:C.gold, lineHeight:1 }}>FORGED</div>
            <div style={{ fontSize:8, color:C.gray, letterSpacing:'.12em', textTransform:'uppercase', marginTop:1 }}>No Risk No Story</div>
          </div>
        </div>
        {/* Streak + Rank in sidebar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, background:C.s2, borderRadius:10, padding:'9px 12px', border:`1px solid ${forgedMode?C.gold+'33':C.border}` }}>
          <span style={{ fontSize:18 }}>{forgedMode?'⚔️':'🔥'}</span>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono'", fontSize:16, fontWeight:700, color:C.gold, lineHeight:1 }}>{streak} day{streak!==1?'s':''}</div>
            {rank.name ? (
              <div style={{ fontSize:10, fontWeight:700, color:rank.color, marginTop:2 }}>{rank.icon} {rank.name}{forgedMode?' ⚔️':''}</div>
            ) : (
              <div style={{ fontSize:10, color:C.gray, marginTop:2 }}>No rank yet</div>
            )}
          </div>
        </div>
      </div>
      {NAV_ITEMS.map(n=>(
        <button key={n.id} onClick={()=>setView(n.id)} className={`nav-item ${view===n.id?'active':''}`} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', background:'none', border:'none', color:view===n.id?C.gold:C.light, textAlign:'left', fontSize:14, fontWeight:view===n.id?700:400, width:'100%', marginBottom:2 }}>
          <span style={{ fontSize:17 }}>{n.icon}</span>
          <span>{n.label}</span>
          {view===n.id&&<div style={{ marginLeft:'auto', width:4, height:4, borderRadius:'50%', background:C.gold }} />}
        </button>
      ))}
      <div style={{ marginTop:'auto', padding:'16px 12px', borderTop:`1px solid ${C.border}` }}>
        <div style={{ fontSize:10, color:C.gray, lineHeight:1.7 }}>Data stored locally. AI powered by Claude.</div>
      </div>
    </aside>
  );
}

function MobileSideNav({ view, setView, profile, streak, progression, open, onClose }) {
  const C = useC();
  const rank = getRank(streak);
  const forgedMode = streak >= 60;
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:300, backdropFilter:'blur(3px)' }} />
      {/* Drawer */}
      <aside className="sc-enter" style={{ position:'fixed', top:0, left:0, bottom:0, width:248, background:C.s1, borderRight:`1px solid ${C.border}`, zIndex:400, display:'flex', flexDirection:'column', padding:'0 10px', overflowY:'auto' }}>
        {/* Brand */}
        <div style={{ padding:'22px 12px 16px', borderBottom:`1px solid ${C.border}`, marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <ForgeLogo size={24} color={C.gold} />
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:'.1em', color:C.gold, lineHeight:1 }}>FORGED</div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.gray, fontSize:22, padding:'0 4px', lineHeight:1 }}>×</button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:C.s2, borderRadius:10, padding:'9px 12px', border:`1px solid ${forgedMode?C.gold+'33':C.border}` }}>
            <span style={{ fontSize:16 }}>{forgedMode?'⚔️':'🔥'}</span>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono'", fontSize:15, fontWeight:700, color:C.gold, lineHeight:1 }}>{streak} day{streak!==1?'s':''}</div>
              {rank.name ? <div style={{ fontSize:10, fontWeight:700, color:rank.color, marginTop:2 }}>{rank.icon} {rank.name}</div>
                         : <div style={{ fontSize:10, color:C.gray, marginTop:2 }}>No rank yet</div>}
            </div>
          </div>
        </div>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={() => { setView(n.id); onClose(); }} className={`nav-item ${view===n.id?'active':''}`}
            style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 14px', background:'none', border:'none', color:view===n.id?C.gold:C.light, textAlign:'left', fontSize:14, fontWeight:view===n.id?700:400, width:'100%', marginBottom:2 }}>
            <span style={{ fontSize:17 }}>{n.icon}</span>
            <span>{n.label}</span>
            {view===n.id && <div style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:C.gold }} />}
          </button>
        ))}
        <div style={{ marginTop:'auto', padding:'16px 12px', borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.gray, lineHeight:1.7 }}>Data stored locally.<br/>AI powered by Claude.</div>
        </div>
      </aside>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function Forged() {
  const [view, setView]         = useState('dashboard');
  const [entries, setEntries]   = useState({});
  const [goals, setGoals]       = useState([]);
  const [reviews, setReviews]   = useState({});
  const [profile, setProfile]   = useState({ name:'User', role:'', avatar:'⚡', memberSince:'', tagline:'No Risk No Story' });
  const [theme, setTheme]       = useState('dark');
  const [ready, setReady]       = useState(false);
  const [reviewBanner, setReviewBanner] = useState(true);
  const [aiInitialTab, setAiInitialTab] = useState('chat');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Progression state
  const [progression, setProgression] = useState({ highestStreak:0, notifiedRank:null, forgedModeNotified:false });
  // Popups
  const [rankPopup, setRankPopup]         = useState(null); // rank object
  const [forgedPopup, setForgedPopup]     = useState(false);
  const [dayCompletePopup, setDayComplete] = useState(false);

  // Load
  useEffect(() => {
    (async () => {
      const e = await store.get('forged-entries');
      const g = await store.get('forged-goals');
      const p = await store.get('forged-profile');
      const r = await store.get('forged-reviews');
      const pr= await store.get('forged-progression');
      const th= await store.get('forged-theme');
      if(e) setEntries(e);
      if(g) setGoals(g);
      if(p) setProfile(p);
      if(r) setReviews(r);
      if(pr) setProgression(pr);
      if(th) setTheme(th);
      setReady(true);
    })();
  }, []);

  // Persist
  useEffect(()=>{ if(ready) store.set('forged-entries',entries); },[entries,ready]);
  useEffect(()=>{ if(ready) store.set('forged-goals',goals); },[goals,ready]);
  useEffect(()=>{ if(ready) store.set('forged-profile',profile); },[profile,ready]);
  useEffect(()=>{ if(ready) store.set('forged-reviews',reviews); },[reviews,ready]);
  useEffect(()=>{ if(ready) store.set('forged-progression',progression); },[progression,ready]);
  useEffect(()=>{ if(ready) store.set('forged-theme',theme); },[theme,ready]);

  // ── RANK / STREAK PROGRESSION LOGIC ──────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const streak = calcStreak(entries);
    const rank   = getRank(streak);

    setProgression(prev => {
      const newProg = { ...prev };
      // Update highest streak
      if (streak > prev.highestStreak) newProg.highestStreak = streak;

      // Check FORGED MODE (60+ days) — notify only once
      if (streak >= 60 && !prev.forgedModeNotified) {
        newProg.forgedModeNotified = true;
        setTimeout(() => setForgedPopup(true), 600);
      }

      // Check rank up — notify only when crossing a new threshold
      if (rank.name && rank.name !== prev.notifiedRank) {
        // Don't show rank popup if FORGED MODE popup will show (same threshold)
        if (!(streak >= 60 && !prev.forgedModeNotified)) {
          setTimeout(() => setRankPopup(rank), 600);
        }
        newProg.notifiedRank = rank.name;
      }

      return newProg;
    });
  }, [entries, ready]);

  const setEntriesP = useCallback(updater => setEntries(p => typeof updater==='function'?updater(p):updater), []);
  const setGoalsP   = useCallback(updater => setGoals(p => typeof updater==='function'?updater(p):updater), []);

  const streak = calcStreak(entries);

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <DashboardView entries={entries} goals={goals} profile={profile} progression={progression} onNav={v=>setView(v)} reviewBannerProps={reviewBanner?{onReview:()=>{setView('reviews');setReviewBanner(false);},onDismiss:()=>setReviewBanner(false)}:null} />;
      case 'log':              return <LogView entries={entries} setEntries={setEntriesP} onDayComplete={()=>setDayComplete(true)} />;
      case 'goals':            return <GoalsView goals={goals} setGoals={setGoalsP} />;
      case 'history':          return <HistoryView entries={entries} setEntries={setEntriesP} />;
      case 'progress-history': return <ProgressHistoryView entries={entries} />;
      case 'reviews':          return <ReviewsView entries={entries} goals={goals} reviews={reviews} setReviews={setReviews} />;
      case 'ai':               return <AIView entries={entries} goals={goals} initialTab={aiInitialTab} />;
      case 'profile':          return <ProfileView profile={profile} setProfile={setProfile} entries={entries} goals={goals} theme={theme} setTheme={setTheme} />;
      default:          return null;
    }
  };

  const C = theme === 'light' ? LIGHT : DARK;

  if (!ready) return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, gap:20 }}>
        <style>{makeG(theme)}</style>
        <ForgeLogo size={52} color={C.gold} />
        <div>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:42, color:C.gold, letterSpacing:'.1em', textAlign:'center', lineHeight:1 }}>FORGED</div>
          <div style={{ fontSize:11, color:C.gray, letterSpacing:'.14em', textTransform:'uppercase', textAlign:'center', marginTop:4 }}>No Risk No Story</div>
        </div>
        <Spinner size={24} />
      </div>
    </ThemeCtx.Provider>
  );

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:C.bg, overflow:'hidden' }}>
        <style>{makeG(theme)}</style>

        {/* ── POPUPS ── */}
        {forgedPopup && <RankPopup rank={RANKS[5]} isForgedMode={true} onClose={()=>setForgedPopup(false)} />}
        {rankPopup && !forgedPopup && <RankPopup rank={rankPopup} isForgedMode={false} onClose={()=>setRankPopup(null)} />}
        {dayCompletePopup && <DayCompleteOverlay onClose={()=>setDayComplete(false)} />}

        {/* Mobile sidebar drawer */}
        <MobileSideNav view={view} setView={v=>{setAiInitialTab('chat');setView(v);}} profile={profile} streak={streak} progression={progression} open={mobileNavOpen} onClose={()=>setMobileNavOpen(false)} />

        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          {/* Desktop Sidebar */}
          <div className="d-only" style={{ height:'100%', flexShrink:0 }}>
            <SideNav view={view} setView={v=>{setAiInitialTab('chat');setView(v);}} profile={profile} streak={streak} progression={progression} />
          </div>

          {/* Main scroll */}
          <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
            <div style={{ maxWidth:660, margin:'0 auto', padding:'0 14px 40px' }}>

              {/* Desktop top bar */}
              <div className="d-only" style={{ position:'sticky', top:0, zIndex:100, background:C.bg, paddingTop:18, paddingBottom:14, borderBottom:`1px solid ${C.border}`, marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-.02em', color:C.white }}>
                  {NAV_ITEMS.find(n=>n.id===view)?.icon} {view==='dashboard'?'Dashboard':NAV_ITEMS.find(n=>n.id===view)?.label}
                </div>
                <button onClick={()=>setView('profile')} style={{ display:'flex', alignItems:'center', gap:10, background:C.s2, border:`1px solid ${C.border}`, borderRadius:40, padding:'7px 14px 7px 9px', cursor:'pointer' }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{profile.avatar||'⚡'}</div>
                  <span style={{ fontSize:13, fontWeight:600, color:C.white }}>{profile.name||'User'}</span>
                </button>
              </div>

              {/* Mobile top bar — hamburger opens sidebar */}
              <div className="m-only" style={{ position:'sticky', top:0, zIndex:100, background:C.bg, paddingTop:14, paddingBottom:12, borderBottom:`1px solid ${C.border}`, marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <button onClick={()=>setMobileNavOpen(true)} style={{ display:'flex', alignItems:'center', gap:9, background:'none', border:'none', padding:0, cursor:'pointer' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:4.5, padding:'4px 2px' }}>
                    <div style={{ width:20, height:2, background:C.gold, borderRadius:2 }} />
                    <div style={{ width:14, height:2, background:C.gold, borderRadius:2 }} />
                    <div style={{ width:20, height:2, background:C.gold, borderRadius:2 }} />
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, color:C.gold, letterSpacing:'.08em', lineHeight:1 }}>FORGED</div>
                    <div style={{ fontSize:8, color:C.gray, letterSpacing:'.1em', textTransform:'uppercase' }}>No Risk No Story</div>
                  </div>
                </button>
                <button onClick={()=>setView('profile')} style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, border:'none', fontSize:16, cursor:'pointer' }}>
                  {profile.avatar||'⚡'}
                </button>
              </div>

              <div key={view}>{renderView()}</div>
            </div>
          </main>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
