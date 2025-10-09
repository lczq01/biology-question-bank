import mongoose from 'mongoose';
import { connectDatabase } from './utils/database';
import { config } from './utils/config';
import { Paper } from './models/Paper';

async function fixQuestionIds() {
  try {
    await connectDatabase(config.database);
    console.log('数据库连接成功');

    // 查找所有试卷
    const papers = await Paper.find({}).lean();
    console.log(`找到 ${papers.length} 份试卷`);

    for (const paper of papers) {
      console.log(`\n处理试卷: ${paper.title}`);
      
      if (paper.questions && Array.isArray(paper.questions)) {
        let needsUpdate = false;
        const updatedQuestions = paper.questions.map((q: any) => {
          if (q.questionId && typeof q.questionId === 'string') {
            console.log(`  修复题目ID: ${q.questionId} -> ObjectId`);
            needsUpdate = true;
            return {
              ...q,
              questionId: new mongoose.Types.ObjectId(q.questionId)
            };
          }
          return q;
        });

        if (needsUpdate) {
          await Paper.findByIdAndUpdate(paper._id, {
            questions: updatedQuestions
          });
          console.log(`  ✅ 试卷 ${paper.title} 已更新`);
        } else {
          console.log(`  ⭕ 试卷 ${paper.title} 无需更新`);
        }
      }
    }

    console.log('\n✅ 所有试卷处理完成');

  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已断开');
  }
}

fixQuestionIds();