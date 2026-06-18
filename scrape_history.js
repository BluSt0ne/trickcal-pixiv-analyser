require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CHARACTER_NAMES = [
  "가비아", "겨우살이", "골디", "교주", "그윈", "나이아", "냉장고", "네르", "네티", "니펠",
  "다야", "델리아", "디아나", "라이카", "란", "레비", "레이지", "레테", "로네", "롤렛",
  "루드", "루포", "리뉴아", "리스티", "리온", "리츠", "리코타", "림", "마고", "마리",
  "마에스트로 2호", "마요", "마카샤", "메죵", "멜루나", "모모", "뮤트", "미로", "밍스", "바나",
  "바롱", "바리에", "버터", "베니", "베루", "벨라", "벨리타", "벨벳", "블랑셰", "비비",
  "빅우드", "사리", "샤샤", "셀리네", "셰럼", "셰이디", "슈로", "슈팡", "스노키", "스피키",
  "시스트", "시온", "시저", "실라", "실피르", "아네트", "아라그니아", "아르코", "아멜리아", "아사나",
  "아야", "아이시아", "아일라", "알레트", "앨리스", "에르핀", "에슈르", "에스피", "에피카", "엘레나",
  "영춘", "오르", "오팔", "요미", "우로스", "우이", "유미미", "이드", "이프리트", "잉클",
  "제이드", "죠안", "쥬비", "쵸피", "카렌", "칸나", "칸타", "캐시", "캬롯", "코미",
  "큐이", "클로에", "키디언", "키샤", "타이다", "티그", "파트라", "페스타", "포셔", "폴랑",
  "프리클", "피라", "피코라", "하이디", "헤일리", "힐데"
];

// Helper for delay
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log("시계열 데이터 수집을 시작합니다. 픽시브 밴 방지를 위해 약 10~20분 정도 소요됩니다...");
  if (process.env.PIXIV_COOKIE) {
    console.log("✅ 로그인 쿠키(PIXIV_COOKIE)가 확인되었습니다. 로그인 모드로 수집합니다.");
  } else {
    console.log("⚠️ 로그인 쿠키가 없습니다. 비로그인 모드로 수집되며, 결과가 누락될 수 있습니다.");
  }
  
  const dailyDeltas = {};
  const jNamesMapPath = path.join(__dirname, 'public', 'japanese_names.json');
  const jNamesMap = JSON.parse(fs.readFileSync(jNamesMapPath, 'utf8'));
  
  for (const name of CHARACTER_NAMES) {
    console.log(`[${name}] 수집 중...`);
    const jNames = jNamesMap[name] || [];
    const searchTerms = [name, ...jNames];
    const seenArtworks = new Set();
    
    for (const term of searchTerms) {
      console.log(`  - [${name}] 하위 태그 "${term}" 수집 시작...`);
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const query = encodeURIComponent(`트릭컬 ${term}`);
        const url = `https://www.pixiv.net/ajax/search/artworks/${query}?word=${query}&s_mode=s_tag_full&p=${page}`;
        
        try {
          console.log(`    - [${name}] 페이지 ${page} 요청 중...`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': process.env.PIXIV_COOKIE || ''
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!res.ok) {
            console.error(`에러 발생: ${res.status} - 픽시브에서 잠시 차단했을 수 있습니다. 1분 대기합니다.`);
            await sleep(60000);
            continue;
          }
          
          const data = await res.json();
          if (data?.error || !data?.body) {
            console.error(`에러 발생 (Pixiv API 에러): ${data?.message || 'body가 없습니다.'} - 1분 대기 후 재시도합니다.`);
            await sleep(60000);
            continue;
          }
          
          const artworks = data.body.illustManga.data || [];
          const total = data.body.illustManga.total || 0;
          const maxPage = Math.ceil(total / 60);
          
          if (artworks.length === 0 || page >= maxPage) {
            hasMore = false;
          }
          
          for (const art of artworks) {
            if (seenArtworks.has(art.id)) continue;
            seenArtworks.add(art.id);
            
            const createDate = art.createDate;
            if (createDate) {
              const day = createDate.substring(0, 10); // YYYY-MM-DD
              if (!dailyDeltas[day]) dailyDeltas[day] = {};
              if (!dailyDeltas[day][name]) dailyDeltas[day][name] = 0;
              dailyDeltas[day][name]++;
            }
          }
          
          page++;
          
        } catch (err) {
          console.error(`요청 실패 (${name}, 태그: ${term}, 페이지 ${page}):`, err);
          await sleep(5000);
        }
        
        await sleep(1000);
      }
    }
  }
  
  console.log("모든 데이터 추출 완료. 일별 누적 데이터 생성 중...");
  
  const days = Object.keys(dailyDeltas).sort();
  
  const timeline = [];
  const cumulativeCounts = {};
  for (const name of CHARACTER_NAMES) cumulativeCounts[name] = 0;
  
  for (const day of days) {
    const deltas = dailyDeltas[day];
    for (const name in deltas) {
      cumulativeCounts[name] += deltas[name];
    }
    
    timeline.push({
      date: day,
      data: { ...cumulativeCounts }
    });
  }
  
  const outputPath = path.join(__dirname, 'public', 'historical_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(timeline, null, 2));
  
  console.log(`성공적으로 저장되었습니다: ${outputPath}`);
}

main();
