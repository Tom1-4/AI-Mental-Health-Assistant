require('dotenv').config();
const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  try {
    // 为 admin 用户重置密码为 '123456'
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );

    if (result.affectedRows > 0) {
      console.log('✓ Admin 密码已重置为: 123456');
    } else {
      console.log('✗ 未找到 admin 用户');
    }

    // 验证新密码
    const [users] = await db.query('SELECT username, password FROM users WHERE username = ?', ['admin']);
    if (users.length > 0) {
      const isValid = await bcrypt.compare(defaultPassword, users[0].password);
      console.log(`✓ 密码验证: ${isValid ? '成功' : '失败'}`);
    }

  } catch (error) {
    console.error('重置失败:', error);
  } finally {
    db.end();
  }
}

resetAdminPassword();
