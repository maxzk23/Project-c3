import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputDir = path.join(process.cwd(), 'screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const routes = [
  { name: '01_login_page', url: 'http://localhost:3000/login', role: null },
  
  // Student Module (Logged in as สมชาย ขยันเรียน)
  { name: '02_student_dashboard', url: 'http://localhost:3000/student/dashboard', role: 'STUDENT' },
  { name: '03_student_classrooms', url: 'http://localhost:3000/student/classrooms', role: 'STUDENT' },
  { name: '04_student_assignments', url: 'http://localhost:3000/student/assignments', role: 'STUDENT' },
  { name: '05_student_lessons', url: 'http://localhost:3000/student/lessons', role: 'STUDENT' },
  { name: '06_student_games', url: 'http://localhost:3000/student/games', role: 'STUDENT' },
  { name: '07_student_leaderboard', url: 'http://localhost:3000/student/leaderboard', role: 'STUDENT' },
  { name: '08_student_notifications', url: 'http://localhost:3000/student/notifications', role: 'STUDENT' },
  { name: '09_student_profile', url: 'http://localhost:3000/student/profile', role: 'STUDENT' },

  // Teacher Module (Logged in as คุณครูสมชาย รักเรียน)
  { name: '10_teacher_dashboard', url: 'http://localhost:3000/teacher/dashboard', role: 'TEACHER' },
  { name: '11_teacher_classrooms', url: 'http://localhost:3000/teacher/classrooms', role: 'TEACHER' },
  { name: '12_teacher_classroom_detail', url: 'http://localhost:3000/teacher/classrooms/1', role: 'TEACHER' },
  { name: '13_teacher_assignments', url: 'http://localhost:3000/teacher/assignments', role: 'TEACHER' },
  { name: '14_teacher_attendance', url: 'http://localhost:3000/teacher/attendance', role: 'TEACHER' },
  { name: '15_teacher_grading', url: 'http://localhost:3000/teacher/grading', role: 'TEACHER' },
  { name: '16_teacher_materials', url: 'http://localhost:3000/teacher/materials', role: 'TEACHER' },
  { name: '17_teacher_leaderboard', url: 'http://localhost:3000/teacher/leaderboard', role: 'TEACHER' },
  { name: '18_teacher_notifications', url: 'http://localhost:3000/teacher/notifications', role: 'TEACHER' },
  { name: '19_teacher_profile', url: 'http://localhost:3000/teacher/profile', role: 'TEACHER' },
  { name: '20_teacher_settings', url: 'http://localhost:3000/teacher/settings', role: 'TEACHER' }
];

async function removeDevIndicators(page) {
  await page.evaluate(() => {
    // Remove Next.js dev overlay web components and toasts
    document.querySelectorAll('nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay]').forEach(el => el.remove());
    
    const style = document.createElement('style');
    style.innerHTML = `
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      div[class*="nextjs"],
      div[style*="z-index: 99999"],
      div[style*="position: fixed"][style*="bottom"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  });
}

async function loginAs(browser, username, password) {
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#name');
  await page.type('#name', username);
  await page.type('#password', password);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
  ]);
  
  const cookies = await page.cookies();
  await page.close();
  return cookies;
}

async function captureAll() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('Logging in as Student (สมชาย ขยันเรียน)...');
  const studentCookies = await loginAs(browser, 'สมชาย ขยันเรียน', '1234');

  console.log('Logging in as Teacher (คุณครูสมชาย รักเรียน)...');
  const teacherCookies = await loginAs(browser, 'คุณครูสมชาย รักเรียน', 'teacher');

  const page = await browser.newPage();

  for (const route of routes) {
    console.log(`Capturing ${route.name} (${route.url})...`);
    try {
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');

      if (route.role === 'STUDENT') {
        await page.setCookie(...studentCookies);
      } else if (route.role === 'TEACHER') {
        await page.setCookie(...teacherCookies);
      }

      await page.goto(route.url, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1500));
      await removeDevIndicators(page);
      
      const filePath = path.join(outputDir, `${route.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Saved clean screenshot: ${filePath}`);
    } catch (err) {
      console.error(`Failed to capture ${route.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('Done capturing all clean screenshots!');
}

captureAll();
