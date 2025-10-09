const mongoose = require('mongoose');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

async function debugFadashuiTime() {
  console.log('🔍 调试"发大水发大水"考试的时间验证...\n');
  
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    // 查找"发大水发大水"考试
    const fadashuiSession = await db.collection('examsessions').findOne({
      name: '发大水发大水'
    });
    
    if (!fadashuiSession) {
      console.log('❌ 没有找到"发大水发大水"考试');
      return;
    }
    
    console.log('📋 "发大水发大水"考试详细信息:');
    console.log('  ID:', fadashuiSession._id.toString());
    console.log('  名称:', fadashuiSession.name);
    console.log('  类型字段 (type):', fadashuiSession.type);
    console.log('  类型字段 (examType):', fadashuiSession.examType);
    console.log('  开始时间 (startTime):', fadashuiSession.startTime);
    console.log('  结束时间 (endTime):', fadashuiSession.endTime);
    console.log('  可用开始时间 (availableFrom):', fadashuiSession.availableFrom);
    console.log('  可用结束时间 (availableUntil):', fadashuiSession.availableUntil);
    console.log('');
    
    // 当前时间
    const now = new Date();
    console.log('⏰ 时间比较:');
    console.log('  当前时间 (UTC):', now.toISOString());
    console.log('  当前时间 (北京):', now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    console.log('');
    
    // 时间验证逻辑模拟
    console.log('🔍 时间验证逻辑检查:');
    
    const examType = fadashuiSession.type || fadashuiSession.examType;
    console.log('  使用的考试类型:', examType);
    
    if (examType === 'on_demand') {
      console.log('  ✅ 识别为随时考试类型');
      
      if (fadashuiSession.availableFrom) {
        const availableFromCheck = now >= new Date(fadashuiSession.availableFrom);
        console.log('  availableFrom检查:', availableFromCheck ? '✅ 通过' : '❌ 未到开放时间');
        console.log('    开放时间:', new Date(fadashuiSession.availableFrom).toISOString());
        console.log('    当前时间:', now.toISOString());
      } else {
        console.log('  availableFrom: 未设置，跳过检查');
      }
      
      if (fadashuiSession.availableUntil) {
        const availableUntilCheck = now <= new Date(fadashuiSession.availableUntil);
        console.log('  availableUntil检查:', availableUntilCheck ? '✅ 通过' : '❌ 已过期');
        console.log('    过期时间:', new Date(fadashuiSession.availableUntil).toISOString());
        console.log('    当前时间:', now.toISOString());
      } else {
        console.log('  availableUntil: 未设置，跳过检查');
      }
    } else {
      console.log('  ❌ 未识别为随时考试类型，使用定时考试逻辑');
      
      const startTimeCheck = now >= new Date(fadashuiSession.startTime);
      const endTimeCheck = now <= new Date(fadashuiSession.endTime);
      
      console.log('  startTime检查:', startTimeCheck ? '✅ 通过' : '❌ 未到开始时间');
      console.log('    开始时间:', new Date(fadashuiSession.startTime).toISOString());
      
      console.log('  endTime检查:', endTimeCheck ? '✅ 通过' : '❌ 已过结束时间');
      console.log('    结束时间:', new Date(fadashuiSession.endTime).toISOString());
      
      console.log('  整体时间范围检查:', (startTimeCheck && endTimeCheck) ? '✅ 通过' : '❌ 不在时间范围内');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 数据库连接已关闭');
  }
}

debugFadashuiTime();