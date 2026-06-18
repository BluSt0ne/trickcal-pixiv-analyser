import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getColorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 80%, 75%), hsl(${h2}, 80%, 65%))`;
}

export async function GET() {
  try {
    const historyPath = path.join(process.cwd(), 'public', 'historical_data.json');
    const metaPath = path.join(process.cwd(), 'public', 'char_meta.json');
    
    if (!fs.existsSync(historyPath)) {
      return NextResponse.json({ rankings: [], error: 'Historical data not found' });
    }
    
    const timeline = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    if (!timeline || timeline.length === 0) {
      return NextResponse.json({ rankings: [] });
    }
    
    let iconMap = {};
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      iconMap = meta.iconMap || {};
    }
    
    const latestEntry = timeline[timeline.length - 1];
    const results = Object.entries(latestEntry.data).map(([name, count]) => ({
      id: name,
      name,
      color: getColorFromName(name),
      count,
      icon: iconMap[name] || null
    }));
    
    // Sort descending by count, then by name if counts are equal
    results.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ rankings: results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

