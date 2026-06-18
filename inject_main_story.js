const fs = require('fs');

const eventsPath = 'public/events.json';
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

// Main Story Season 2 Chapter Dates
const storyChapters = [
  { date: '2024-12-19', title: '메인 스토리 시즌 2 챕터 1 전편' },
  { date: '2025-01-02', title: '메인 스토리 시즌 2 챕터 1 후편' },
  { date: '2025-02-06', title: '메인 스토리 시즌 2 챕터 2 전편' },
  { date: '2025-02-20', title: '메인 스토리 시즌 2 챕터 2 후편' },
  { date: '2025-03-06', title: '메인 스토리 시즌 2 챕터 3 전편' },
  { date: '2025-03-20', title: '메인 스토리 시즌 2 챕터 3 후편' },
  { date: '2025-04-05', title: '메인 스토리 시즌 2 챕터 4 전편' },
  { date: '2025-04-17', title: '메인 스토리 시즌 2 챕터 4 후편' },
  { date: '2025-05-01', title: '메인 스토리 시즌 2 챕터 5 전편' },
  { date: '2025-05-15', title: '메인 스토리 시즌 2 챕터 5 후편' },
  { date: '2025-05-29', title: '메인 스토리 시즌 2 챕터 6 전편' },
  { date: '2025-06-12', title: '메인 스토리 시즌 2 챕터 6 후편' },
  { date: '2025-07-10', title: '메인 스토리 시즌 2 챕터 7 전편' },
  { date: '2025-07-24', title: '메인 스토리 시즌 2 챕터 7 후편' },
  { date: '2025-08-21', title: '메인 스토리 시즌 2 챕터 8 전편' },
  { date: '2025-09-04', title: '메인 스토리 시즌 2 챕터 8 후편' }
];

storyChapters.forEach(chap => {
  // Check if it already exists to avoid duplicates
  const exists = events.some(e => e.date === chap.date && e.title === chap.title);
  if (!exists) {
    events.push({
      date: chap.date,
      type: '메인스토리',
      title: chap.title,
      server: 'KR'
    });
  }
});

// Sort events chronologically
events.sort((a, b) => new Date(a.date) - new Date(b.date));

fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2));
console.log(`Successfully injected ${storyChapters.length} Main Story events into public/events.json!`);
