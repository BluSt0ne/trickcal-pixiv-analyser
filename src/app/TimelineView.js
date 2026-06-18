'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './page.module.css';

function AnimatedNumber({ value, duration = 400 }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current, end = value, t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / duration, 1);
      setDisplay(Math.floor(start + (end - start) * p));
      if (p < 1) requestAnimationFrame(tick); else prev.current = end;
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

const TRANSITION = 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';

export default function TimelineView({ currentRankings }) {
  const [timeline, setTimeline] = useState([]);
  const [events, setEvents] = useState([]);
  const [charMeta, setCharMeta] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('cumulative');
  const [speed, setSpeed] = useState(133); // Playback interval in ms: 133ms (3x, default) or 400ms (1x)

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch('/historical_data.json?v=' + Date.now()),
          fetch('/events.json?v=' + Date.now()),
          fetch('/char_meta.json?v=' + Date.now()),
        ]);
        if (r1.ok) setTimeline(await r1.json());
        if (r2.ok) setEvents(await r2.json());
        if (r3.ok) setCharMeta(await r3.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Monthly (Rolling 30-day window): counts submitted in the last 30 days
  const monthlyTimeline = useMemo(() => {
    if (!timeline.length) return [];
    return timeline.map((day, idx) => {
      const baseline = idx >= 30 ? timeline[idx - 30] : timeline[0];
      const delta = {};
      for (const [name, count] of Object.entries(day.data)) {
        const baseCount = baseline.data[name] || 0;
        delta[name] = Math.max(0, count - baseCount);
      }
      return { date: day.date, data: delta };
    });
  }, [timeline]);

  const activeTimeline = mode === 'monthly' ? monthlyTimeline : timeline;
  const transitionStyle = `all ${speed}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;

  useEffect(() => {
    let timer;
    if (isPlaying && activeTimeline.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= activeTimeline.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, speed); // Match transition speed
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeTimeline.length, speed]);

  const handleModeChange = (newMode) => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setMode(newMode);
    setSpeed(newMode === 'monthly' ? 300 : 133);
  };

  if (loading) return <div className={styles.loadingContainer}>데이터 불러오는 중...</div>;
  if (!timeline?.length) return (
    <div className={styles.loadingContainer}>
      <h3>시계열 데이터가 없습니다.</h3>
      <p>터미널에서 <code>node scrape_history.js</code>를 실행해주세요.</p>
    </div>
  );

  const personalityOf = {};
  const colorOf = {};
  if (charMeta?.personalities) {
    for (const [pName, pData] of Object.entries(charMeta.personalities)) {
      for (const m of pData.members) {
        personalityOf[m] = pName;
        colorOf[m] = pData.color;
      }
    }
  }
  const iconMap = charMeta?.iconMap || {};

  const safeIndex = Math.min(currentIndex, activeTimeline.length - 1);
  const currentData = activeTimeline[safeIndex];
  if (!currentData) return null;

  const TOP_N = 15;
  const allChars = Object.entries(currentData.data)
    .map(([name, count]) => ({ name, count, color: colorOf[name] || '#555' }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);

  const maxCount = allChars.length > 0 ? allChars[0].count : 1;
  const ROW_H = 100 / TOP_N; // percentage height per row

  const curDate = new Date(currentData.date + (currentData.date.length === 7 ? '-15' : ''));
  const pastEvents = events.filter(e => new Date(e.date) <= curDate);

  let activeEvents = [];
  if (pastEvents.length > 0) {
    const latestEventDateStr = pastEvents[pastEvents.length - 1].date;
    const latestReleaseDate = new Date(latestEventDateStr);
    const diff = Math.ceil(Math.abs(curDate - latestReleaseDate) / 86400000);
    if (diff <= 14) {
      activeEvents = events.filter(e => e.date === latestEventDateStr);
    }
  }


  const progress = activeTimeline.length > 1 ? (safeIndex / (activeTimeline.length - 1)) * 100 : 0;
  const personalities = charMeta?.personalities ? Object.entries(charMeta.personalities) : [];

  // Build position map: each character gets a Y position based on current rank
  const positionMap = {};
  allChars.forEach((char, idx) => { positionMap[char.name] = idx; });

  return (
    <div className={styles.chartContainer} style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#0c1222' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexShrink: 0, flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className={styles.tabButton} onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '6px 14px', background: isPlaying ? '#ef4444' : '#22c55e', color: 'white', fontSize: '0.85rem', fontWeight: 700 }}>
            {isPlaying ? '일시정지' : '재생'}
          </button>
          <button className={styles.tabButton} onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}>처음부터</button>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
            <button onClick={() => handleModeChange('cumulative')}
              style={{ padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                background: mode === 'cumulative' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
              누적
            </button>
            <button onClick={() => handleModeChange('monthly')}
              style={{ padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                background: mode === 'monthly' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
              월별
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {personalities.map(([name, data]) => (
            <span key={name} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#94a3b8' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: data.color, display: 'inline-block' }} />
              {name}
            </span>
          ))}
        </div>
        <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, color: '#f8fafc', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {currentData.date}
        </h2>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: '4px', flexShrink: 0 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius: 2, transition: `width ${speed}ms linear` }} />
      </div>

      {/* Chart area - using absolute positioning for smooth rank transitions */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {allChars.map((char, idx) => {
          const pct = maxCount > 0 ? (char.count / maxCount) * 55 : 0;
          const icon = iconMap[char.name];
          const rank = idx + 1;
          const yPos = idx * ROW_H; // percentage from top

          return (
            <div key={char.name} style={{
              position: 'absolute',
              top: `${yPos}%`,
              left: 0, right: 0,
              height: `${ROW_H}%`,
              display: 'flex', alignItems: 'center',
              transition: transitionStyle,
              padding: '1px 0',
            }}>
              {/* Rank number */}
              <span style={{
                width: '28px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 800,
                color: rank === 1 ? '#fbbf24' : rank === 2 ? '#d1d5db' : rank === 3 ? '#cd7f32' : '#4b5563',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginRight: '6px',
              }}>{rank}</span>

              {/* Name */}
              <span style={{
                width: '56px', fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flexShrink: 0, marginRight: '6px',
              }}>{char.name}</span>

              {/* Bar + Icon + Count */}
              <div style={{ flex: 1, position: 'relative', height: '70%', display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: `${Math.max(pct, 0.8)}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${char.color}cc, ${char.color})`,
                  borderRadius: '3px',
                  transition: transitionStyle,
                  position: 'relative',
                  boxShadow: `0 0 8px ${char.color}40`,
                }}>
                  {/* Icon at end of bar */}
                  {icon && (
                    <img src={icon} alt="" referrerPolicy="no-referrer" style={{
                      position: 'absolute', right: '-16px', top: '50%',
                      transform: 'translateY(-50%)',
                      width: '28px', height: '28px',
                      borderRadius: '50%', border: `2px solid ${char.color}`,
                      objectFit: 'cover', background: '#1a1a2e',
                      transition: transitionStyle,
                    }} onError={e => { e.target.style.display = 'none'; }} />
                  )}
                </div>
                {/* Count - floats dynamically with the end of the bar */}
                <span style={{
                  marginLeft: '24px',
                  fontSize: '0.85rem', fontWeight: 800,
                  color: '#cbd5e1', fontVariantNumeric: 'tabular-nums',
                }}>
                  <AnimatedNumber value={char.count} duration={speed} />
                </span>
              </div>
            </div>
          );
        })}

      {/* Event Banner Cards Container */}
      {activeEvents.length > 0 && (
        <div className={styles.eventCardsContainer} style={{ gap: activeEvents.length > 1 ? '6px' : '10px' }}>
          {activeEvents.map(ev => {
            const isMultiple = activeEvents.length > 1;
            return (
              <div key={`${ev.title}-${ev.date}`} style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: isMultiple ? '6px 10px' : '10px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                gap: isMultiple ? '4px' : '8px',
                transition: 'opacity 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                animation: 'fadeIn 0.3s ease-out forwards',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: ev.server === 'GL' ? '#3b82f6' : '#ef4444',
                    color: 'white',
                    padding: isMultiple ? '1px 4px' : '2px 6px',
                    borderRadius: '4px',
                    fontSize: isMultiple ? '0.6rem' : '0.65rem',
                    fontWeight: 'bold'
                  }}>
                    {ev.server === 'GL' ? 'Global Server' : 'KR Server'}
                  </span>
                  <span style={{ fontSize: isMultiple ? '0.65rem' : '0.7rem', color: '#a78bfa', fontWeight: 'bold' }}>
                    {ev.type}
                  </span>
                </div>
                
                {ev.banner ? (
                  <img
                    src={ev.banner}
                    alt={ev.title}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: isMultiple ? '65px' : 'auto',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: isMultiple ? '50px' : '100px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}>
                    <span style={{ fontSize: isMultiple ? '0.75rem' : '0.9rem', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {ev.title}
                    </span>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: isMultiple ? '0.75rem' : '0.85rem', fontWeight: '800', color: '#f8fafc' }}>
                    {ev.title}
                  </span>
                  <span style={{ fontSize: isMultiple ? '0.6rem' : '0.65rem', color: '#94a3b8' }}>
                    출시일: {ev.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      `}} />
    </div>
  );
}
