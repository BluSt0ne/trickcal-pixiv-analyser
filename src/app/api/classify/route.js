import { NextResponse } from 'next/server';

const ML_SERVER = process.env.ML_SERVER_URL || 'http://localhost:8000';

/**
 * POST /api/classify
 * Body: { imageUrl: string }   – direct image URL
 *    or { pixivUrl: string }   – Pixiv artwork page URL (extracts image URL server-side)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { imageUrl, pixivUrl } = body;

    if (!imageUrl && !pixivUrl) {
      return NextResponse.json({ error: '이미지 URL 또는 픽시브 URL을 입력해주세요.' }, { status: 400 });
    }

    let targetImageUrl = imageUrl;

    // If given a Pixiv artwork page, resolve the direct image URL via Pixiv's ajax API
    if (pixivUrl && !imageUrl) {
      const artworkId = extractPixivId(pixivUrl);
      if (!artworkId) {
        return NextResponse.json({ error: '유효한 픽시브 URL이 아닙니다. (예: https://www.pixiv.net/artworks/12345678)' }, { status: 400 });
      }

      const fetchHeaders = {
        'Referer': 'https://www.pixiv.net/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
      if (process.env.PIXIV_COOKIE) {
        fetchHeaders['Cookie'] = process.env.PIXIV_COOKIE;
      }

      const metaRes = await fetch(`https://www.pixiv.net/ajax/illust/${artworkId}`, {
        headers: fetchHeaders,
      });
      if (!metaRes.ok) {
        return NextResponse.json({ error: '픽시브에서 작품 정보를 가져오지 못했습니다.' }, { status: 502 });
      }
      const meta = await metaRes.json();
      if (meta.error) {
        return NextResponse.json({ error: `픽시브 오류: ${meta.message}` }, { status: 502 });
      }
      targetImageUrl = meta.body?.urls?.regular || meta.body?.urls?.original;
      if (!targetImageUrl) {
        return NextResponse.json({ error: '이미지 URL을 추출하지 못했습니다.' }, { status: 502 });
      }
    }

    // Call the Python ML server
    const mlRes = await fetch(`${ML_SERVER}/classify/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: targetImageUrl }),
      signal: AbortSignal.timeout(30000),
    });

    if (!mlRes.ok) {
      const err = await mlRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || `ML 서버 오류 (${mlRes.status})` },
        { status: 502 }
      );
    }

    const result = await mlRes.json();
    return NextResponse.json({ predictions: result.predictions, imageUrl: targetImageUrl });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'ML 서버 응답 시간 초과 (30초)' }, { status: 504 });
    }
    if (err.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'ML 서버가 실행중이지 않습니다. uvicorn ml.server:app 으로 서버를 시작해주세요.' },
        { status: 503 }
      );
    }
    console.error('[classify] error:', err);
    return NextResponse.json({ error: '서버 내부 오류' }, { status: 500 });
  }
}

function extractPixivId(url) {
  const m = url.match(/artworks\/(\d+)/);
  return m ? m[1] : null;
}
