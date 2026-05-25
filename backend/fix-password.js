require('dotenv').config();
const db = require('./src/config/database');
const bcrypt = require('bcrypt');

// 检测密码是否为 bcrypt 哈希
function isBcryptHash(password) {
  // bcrypt 哈希以 $2b$、$2a$ 或 $2y$ 开头，长度约 60 字符
  return /^\$2[aby]\$10\$\$/.test(password) && password.length >= 60;
}

async function fixPasswords() {
  try {
    console.log('开始检查用户密码...');

    // 获取所有用户
    const [users] = await db.query('SELECT id, username, password FROM users');

    console.log(`共找到 ${users.length} 个用户`);

    let fixedCount = 0;
    let alreadyOkCount = 0;

    for (const user of users) {
      if (isBcryptHash(user.password)) {
        console.log(`✓ 用户 ${user.username} (ID: ${user.id}) 密码已经是 bcrypt 哈希`);
        alreadyOkCount++;
      } else {
        console.log(`✗ 用户 ${user.username} (ID: ${user.id}) 密码是明文，需要加密`);

        // 加密密码
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // 更新数据库
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

        console.log(`  → 已更新为 bcrypt 哈希`);
        fixedCount++;
      }
    }

    console.log('\n========== 修复完成 ==========');
    console.log(`已修复: ${fixedCount} 个用户`);
    console.log(`无需修复: ${alreadyOkCount} 个用户`);
    console.log(`总计: ${users.length} 个用户`);

  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    db.end();
  }
}

fixPasswords();
