const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/biology-question-bank', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const questionSchema = new mongoose.Schema({}, { collection: 'questions', strict: false });
const Question = mongoose.model('Question', questionSchema);

async function checkQuestions() {
    try {
        console.log('🔍 检查数据库中的题目...');
        
        const questions = await Question.find({}).limit(5);
        console.log(`📊 找到 ${questions.length} 个题目`);
        
        if (questions.length > 0) {
            console.log('\n📋 前5个题目的ID:');
            questions.forEach((q, index) => {
                console.log(`${index + 1}. ${q._id} - ${q.content?.substring(0, 50) || '无内容'}...`);
            });
        } else {
            console.log('❌ 数据库中没有找到题目');
        }
        
    } catch (error) {
        console.error('❌ 检查题目时发生错误:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkQuestions();