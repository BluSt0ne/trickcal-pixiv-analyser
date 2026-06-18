'use client';

import { useState } from 'react';
import styles from './page.module.css';

const BAR_COLORS = [
  'linear-gradient(90deg, #6366f1, #a855f7)',
  'linear-gradient(90deg, #3b82f6, #06b6d4)',
  'linear-gradient(90deg, #10b981, #34d399)',
  'linear-gradient(90deg, #f59e0b, #fbbf24)',
  'linear-gradient(90deg, #ef4444, #f97316)',
];

export default function ClassifyView() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const isPixivUrl = input.includes('pixiv.net/artworks/');
  const isDirectImage = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(input);

  async function handleClassify(e) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);
    setError('');

    const body = isPixivUrl
      ? { pixivUrl: input.trim() }
      : { imageUrl: input.trim() };

    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '알 수 없는 오류가 발생했습니다.');
      } else {
        setResult(data);
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const top = result?.predictions?.[0];
  const topPct = top ? Math.round(top.probability * 100) : 0;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1rem' }}>
      {/* Description */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '12px',
        padding: '1rem 1.2rem',
        marginBottom: '1.5rem',
        fontSize: '0.85rem',
        color: '#94a3b8',
        lineHeight: 1.6,
      }}>
        <strong style={{ color: '#a5b4fc' }}>AI 캐릭터 분류기</strong>
        &nbsp;— ResNet50을 트릭컬 리바이브 캐릭터 이미지로 파인튜닝한 모델입니다.
        픽시브 아트워크 URL 또는 이미지 직접 링크를 입력하면 어떤 캐릭터인지 확률과 함께 알려줍니다.
        <br />
        <span style={{ color: '#6366f1', fontSize: '0.78rem' }}>
          * 모델 학습 후 사용 가능합니다 (ml/train.py 실행 필요)
        </span>
      </div>

      {/* Input form */}
      <form onSubmit={handleClassify} style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="https://www.pixiv.net/artworks/12345678 또는 이미지 URL"
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: '#f1f5f9',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={styles.tabButton}
          style={{
            padding: '0.65rem 1.2rem',
            background: loading ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.7)',
            fontWeight: 700,
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '분석 중…' : '분류하기'}
        </button>
      </form>

      {/* URL type hint */}
      {input && (
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '-1rem', marginBottom: '1rem' }}>
          {isPixivUrl ? '✓ 픽시브 아트워크 URL' : isDirectImage ? '✓ 이미지 직접 URL' : '⚠ 픽시브 URL 또는 이미지 직접 URL을 입력해주세요'}
        </p>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          padding: '0.8rem 1rem',
          color: '#fca5a5',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ animation: 'fadeIn 0.35s ease-out' }}>
          {/* Preview image */}
          {result.imageUrl && (
            <div style={{ marginBottom: '1.2rem', textAlign: 'center' }}>
              <img
                src={result.imageUrl}
                alt="분류 대상 이미지"
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: '100%',
                  maxHeight: '260px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Top result headline */}
          {top && (
            <div style={{
              textAlign: 'center',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(99,102,241,0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '4px' }}>
                이 그림은
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a5b4fc' }}>
                {top.character}
              </div>
              <div style={{ fontSize: '1.1rem', color: '#e2e8f0', marginTop: '4px' }}>
                일 확률 <strong style={{ color: '#fbbf24' }}>{topPct}%</strong>
              </div>
            </div>
          )}

          {/* All predictions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {result.predictions.map((pred, i) => {
              const pct = Math.round(pred.probability * 100);
              return (
                <div key={pred.character}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: i === 0 ? 700 : 500, color: i === 0 ? '#e2e8f0' : '#94a3b8' }}>
                      {i + 1}. {pred.character}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: i === 0 ? '#fbbf24' : '#64748b' }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: BAR_COLORS[i % BAR_COLORS.length],
                      borderRadius: '4px',
                      transition: 'width 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
