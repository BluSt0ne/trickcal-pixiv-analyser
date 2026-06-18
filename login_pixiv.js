const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("==========================================");
  console.log("브라우저 창이 열리면 구글 계정으로 로그인해주세요!");
  console.log("로그인이 성공적으로 완료되면 창은 자동으로 닫힙니다.");
  console.log("==========================================");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    await page.goto('https://accounts.pixiv.net/login', { waitUntil: 'networkidle2' });

    console.log("로그인 대기 중...");
    // Wait until the user successfully logs in and gets redirected to the main page
    await page.waitForFunction(
      'window.location.hostname === "www.pixiv.net" && (window.location.pathname === "/" || window.location.pathname.startsWith("/en"))',
      { timeout: 0 } // Wait indefinitely until the user finishes login
    );

    console.log("로그인 성공! 세션 쿠키를 추출합니다...");
    
    // Extract cookies
    const cookies = await page.cookies();
    const sessionCookie = cookies.find(c => c.name === 'PHPSESSID');

    if (sessionCookie) {
      const envContent = `PIXIV_COOKIE="PHPSESSID=${sessionCookie.value};"`;
      fs.writeFileSync('.env', envContent);
      console.log("✅ 성공적으로 로그인 정보(.env)가 저장되었습니다!");
    } else {
      console.log("❌ 오류: PHPSESSID 쿠키를 찾을 수 없습니다.");
    }

  } catch (error) {
    console.error("실행 중 오류 발생:", error);
  } finally {
    await browser.close();
  }
})();
