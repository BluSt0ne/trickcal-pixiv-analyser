'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import TreemapView from './TreemapView';
import TimelineView from './TimelineView';
import ClassifyView from './ClassifyView';

export default function Home() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'treemap', 'timeline', 'classify'

  useEffect(() => {
    async function fetchRankings() {
      try {
        const res = await fetch('/api/rankings');
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setRankings(data.rankings);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>픽시브 데이터를 불러오는 중...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.container}>
        <div style={{ textAlign: 'center', color: '#f87171', padding: '2rem' }}>
          <h2>에러가 발생했습니다</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>트릭컬 리바이브 픽시브 랭킹</h1>
        <p className={styles.subtitle}>
          현재 픽시브(Pixiv)에 등록된 사도들의 팬아트 투고 수를 실시간으로 보여줍니다.
        </p>

        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tabButton} ${viewMode === 'list' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('list')}
          >
            리스트 뷰
          </button>
          <button 
            className={`${styles.tabButton} ${viewMode === 'treemap' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('treemap')}
          >
            인포그래픽 뷰
          </button>
          <button
            className={`${styles.tabButton} ${viewMode === 'timeline' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            타임라인 뷰
          </button>
          <button
            className={`${styles.tabButton} ${viewMode === 'classify' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('classify')}
          >
            AI 분류
          </button>
        </div>
      </header>

      {viewMode === 'list' && (
        <div className={styles.list}>
        {rankings.map((char, index) => {
          // Add staggered animation delay
          const animationDelay = `${index * 0.02}s`; // Faster stagger for list
          
          let rankClass = '';
          if (index === 0) rankClass = styles.rank1;
          else if (index === 1) rankClass = styles.rank2;
          else if (index === 2) rankClass = styles.rank3;

          return (
            <div 
              key={char.id} 
              className={styles.card}
              style={{ animationDelay }}
            >
              <div className={`${styles.rankBadge} ${rankClass}`}>
                {index + 1}
              </div>
              
              {char.icon ? (
                <img 
                  src={char.icon} 
                  alt={char.name} 
                  className={styles.avatar} 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className={styles.avatarPlaceholder} 
                  style={{ background: char.color }}
                />
              )}

              <div className={styles.characterName}>{char.name}</div>
              <div className={styles.postCount}>
                <span className={styles.countHighlight}>{char.count.toLocaleString()}</span>개
              </div>
            </div>
          );
        })}
        </div>
      )}

      {viewMode === 'treemap' && (
        <TreemapView data={rankings} />
      )}

      {viewMode === 'timeline' && (
        <TimelineView currentRankings={rankings} />
      )}

      {viewMode === 'classify' && (
        <ClassifyView />
      )}
    </main>
  );
}
