import { IPreviewAnswerRecord } from '../models/previewExamRecord';
import Question from '../models/Question';

/**
 * 预览考试评分服务
 */
export class PreviewGradingService {
  /**
   * 检查答案是否正确（与现有系统保持一致）
   */
  static checkAnswer(question: any, userAnswer: string | string[]): boolean {
    if (!question || !question.correctAnswer) {
      return false;
    }

    const correctAnswer = question.correctAnswer;
    
    switch (question.type) {
      case 'single_choice':
        return userAnswer === correctAnswer;
        
      case 'multiple_choice':
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
          return false;
        }
        // 多选题需要选项完全匹配
        const userSet = new Set(userAnswer.sort());
        const correctSet = new Set(correctAnswer.sort());
        return userSet.size === correctSet.size && 
               [...userSet].every(answer => correctSet.has(answer));
        
      case 'fill_blank':
        // 填空题支持多个正确答案，不区分大小写
        const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
        const userAnswerStr = Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer;
        
        return correctAnswers.some(correct => 
          userAnswerStr.toLowerCase().trim() === correct.toLowerCase().trim()
        );
        
      default:
        return false;
    }
  }

  /**
   * 计算题目得分（直接使用试卷设置的分数）
   */
  static calculateScore(question: any, isCorrect: boolean): number {
    if (!isCorrect) {
      return 0;
    }
    
    // 直接使用试卷中设置的分数，不进行难度系数调整
    return question.points || 5;
  }

  /**
   * 评分单个答案
   */
  static async gradeAnswer(
    questionId: string,
    userAnswer: string | string[],
    timeSpent: number = 0
  ): Promise<IPreviewAnswerRecord> {
    try {
      // 获取题目信息
      const question = await Question.findById(questionId);
      
      if (!question) {
        throw new Error(`题目不存在: ${questionId}`);
      }

      // 检查答案正确性
      const isCorrect = this.checkAnswer(question, userAnswer);
      
      // 计算分数
      const score = this.calculateScore(question, isCorrect);

      return {
        questionId: questionId as any,
        userAnswer,
        isCorrect,
        score,
        timeSpent,
        submittedAt: new Date()
      };
    } catch (error) {
      console.error('评分答案失败:', error);
      
      // 返回默认答案记录
      return {
        questionId: questionId as any,
        userAnswer,
        isCorrect: false,
        score: 0,
        timeSpent,
        submittedAt: new Date()
      };
    }
  }

  /**
   * 批量评分答案
   */
  static async gradeAnswers(answers: Array<{
    questionId: string;
    userAnswer: string | string[];
    timeSpent?: number;
  }>): Promise<IPreviewAnswerRecord[]> {
    const gradedAnswers: IPreviewAnswerRecord[] = [];
    
    for (const answer of answers) {
      const gradedAnswer = await this.gradeAnswer(
        answer.questionId,
        answer.userAnswer,
        answer.timeSpent || 0
      );
      gradedAnswers.push(gradedAnswer);
    }
    
    return gradedAnswers;
  }

  /**
   * 计算最终成绩等级
   */
  static calculateGrade(accuracy: number): string {
    if (accuracy >= 90) return 'A';
    if (accuracy >= 80) return 'B';
    if (accuracy >= 70) return 'C';
    if (accuracy >= 60) return 'D';
    return 'F';
  }

  /**
   * 计算考试统计信息
   */
  static calculateStatistics(answers: IPreviewAnswerRecord[], totalQuestions: number) {
    const answeredQuestions = answers.filter(a => a.userAnswer && a.userAnswer !== '').length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
    
    // 时间统计
    const answerTimes = answers.map(a => a.timeSpent || 0).filter(t => t > 0);
    const averageTimePerQuestion = answerTimes.length > 0 ?
      answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : 0;
    const fastestQuestion = answerTimes.length > 0 ? Math.min(...answerTimes) : 0;
    const slowestQuestion = answerTimes.length > 0 ? Math.max(...answerTimes) : 0;
    
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      totalScore,
      accuracy: Math.round(accuracy * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      grade: this.calculateGrade(accuracy),
      timeStatistics: {
        averageTimePerQuestion: Math.round(averageTimePerQuestion),
        fastestQuestion,
        slowestQuestion,
        skippedQuestions: totalQuestions - answeredQuestions
      }
    };
  }
}