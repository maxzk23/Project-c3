require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 กำลังตรวจสอบและทำความสะอาดรูปโปรไฟล์ในฐานข้อมูล...");
  const users = await prisma.user.findMany({
    where: {
      avatarUrl: {
        startsWith: "http"
      }
    }
  });

  console.log(`พบผู้ใช้ที่ใช้รูปโปรไฟล์ภายนอกจำนวน: ${users.length} คน`);

  let count = 0;
  for (const user of users) {
    // กำหนด preset แบบสุ่ม 1-6
    const randomPreset = `preset-${Math.floor(Math.random() * 6) + 1}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: randomPreset }
    });
    count++;
  }

  console.log(`✅ ทำความสะอาดสำเร็จ! อัปเดตผู้ใช้เป็น Preset ในระบบแล้วจำนวน ${count} คน`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
