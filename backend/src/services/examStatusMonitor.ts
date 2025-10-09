// 考试状态监控服务
import { ExamSession } from '../models/ExamSession';
import { ExamSessionStatus } from '../types/exam-session.types';

class ExamStatusMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // 每分钟检查一次

  /**
   * 启动状态监控
   */
  start() {
    if (this.intervalId) {
      console.log('⚠️ 考试状态监控已在运行');
      return;
    }

    console.log('🔍 启动考试状态监控服务');
    this.intervalId = setInterval(async () => {
      await this.checkAndUpdateExamStatuses();
    }, this.CHECK_INTERVAL);

    // 立即执行一次检查
    this.checkAndUpdateExamStatuses();
  }

  /**
   * 停止状态监控
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ 考试状态监控服务已停止');
    }
  }

  /**
   * 检查并更新考试状态
   */
  private async checkAndUpdateExamStatuses() {
    try {
      const now = new Date();
      
      // 查找需要状态更新的随时考试
      // 1. 已发布的随时考试，且设置了特定开始时间，且时间已到
      const examsToActivate = await ExamSession.find({
        type: 'on_demand',
        status: ExamSessionStatus.PUBLISHED,
        availableFrom: { $lte: now },
        $or: [
          { availableUntil: { $exists: false } },
          { availableUntil: null },
          { availableUntil: { $gt: now } }
        ]
      });

      if (examsToActivate.length > 0) {
        console.log(`🔄 发现 ${examsToActivate.length} 个随时考试需要激活`);
        
        for (const exam of examsToActivate) {
          try {
            exam.status = ExamSessionStatus.ACTIVE;
            exam.updatedAt = now;
            await exam.save();
            
            console.log(`✅ 随时考试 "${exam.name}" 已自动激活`);
          } catch (error) {
            console.error(`❌ 激活考试 "${exam.name}" 失败:`, error);
          }
        }
      }

      // 2. 检查需要结束的考试（如果设置了结束时间）
      const examsToComplete = await ExamSession.find({
        status: ExamSessionStatus.ACTIVE,
        $or: [
          // 定时考试：检查endTime
          {
            type: 'scheduled',
            endTime: { $lte: now }
          },
          // 随时考试：检查availableUntil
          {
            type: 'on_demand',
            availableUntil: { $exists: true, $ne: null, $lte: now }
          }
        ]
      });

      if (examsToComplete.length > 0) {
        console.log(`🔄 发现 ${examsToComplete.length} 个考试需要结束`);
        
        for (const exam of examsToComplete) {
          try {
            exam.status = ExamSessionStatus.COMPLETED;
            exam.updatedAt = now;
            await exam.save();
            
            console.log(`✅ 考试 "${exam.name}" 已自动结束`);
          } catch (error) {
            console.error(`❌ 结束考试 "${exam.name}" 失败:`, error);
          }
        }
      }

    } catch (error) {
      console.error('❌ 考试状态监控检查失败:', error);
    }
  }

  /**
   * 手动触发状态检查
   */
  async triggerCheck() {
    console.log('🔄 手动触发考试状态检查');
    await this.checkAndUpdateExamStatuses();
  }
}

// 导出单例实例
export const examStatusMonitor = new ExamStatusMonitor();