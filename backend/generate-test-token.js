const jwt = require('jsonwebtoken');

// 使用与服务器相同的JWT密钥
const JWT_SECRET = 'biology_question_bank_jwt_secret_2024';

// 生成学生用户的JWT令牌
const studentPayload = {
  userId: '67f8a1b2c3d4e5f6a7b8c9d0', // 模拟学生ID
  username: 'student1',
  role: 'student',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时后过期
};

const token = jwt.sign(studentPayload, JWT_SECRET);

console.log('生成的学生JWT令牌:');
console.log(token);
console.log('\n令牌载荷:');
console.log(JSON.stringify(studentPayload, null, 2));