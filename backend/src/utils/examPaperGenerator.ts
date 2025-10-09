// 通用题目接口（兼容模拟数据和MongoDB数据）
export interface BaseQuestion {
  id?: string;
  _id?: string;
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay';
  difficulty: string;
  subject: string;
  chapter: string;
  section?: string;
  points: number;
  options?: any;
  answer?: any;
  correctAnswer?: string;
  explanation?: string;
  keywords?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  image?: string;
  createdBy?: string;
  updatedBy?: string;
  isActive?: boolean;
  usageCount?: number;
}

// 组卷配置接口
export interface ExamPaperConfig {
  totalQuestions: number;          // 总题目数量
  totalPoints: number;             // 总分值
  difficultyDistribution: {        // 难度分布
    简单: number;                  // 百分比 (0-1)
    中等: number;
    困难: number;
  };
  typeDistribution: {              // 题型分布
    single_choice: number;         // 百分比 (0-1)
    fill_blank: number;
    true_false: number;
    essay: number;
  };
  chapterCoverage?: string[];      // 可选：指定章节范围
  allowDuplicates?: boolean;       // 是否允许重复题目（默认false）
}

// 组卷结果接口
export interface ExamPaper {
  id: string;
  title: string;
  questions: BaseQuestion[];
  totalQuestions: number;
  totalPoints: number;
  difficultyBreakdown: {
    简单: number;
    中等: number;
    困难: number;
  };
  typeBreakdown: {
    single_choice: number;
    fill_blank: number;
    true_false: number;
    essay: number;
  };
  createdAt: string;
  createdBy: string;
  config: ExamPaperConfig;
}

// 组卷错误类型
export class ExamPaperGenerationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ExamPaperGenerationError';
  }
}

// 自动组卷算法类
export class ExamPaperGenerator {
  private questions: BaseQuestion[];

  constructor(questions: BaseQuestion[]) {
    this.questions = questions;
  }

  // 主要组卷方法
  public generateExamPaper(config: ExamPaperConfig, createdBy: string, title?: string): ExamPaper {
    // 验证配置
    this.validateConfig(config);

    // 按配置筛选可用题目
    const availableQuestions = this.filterAvailableQuestions(config);

    // 检查题目数量是否足够
    this.checkQuestionAvailability(availableQuestions, config);

    // 按难度和题型分组
    const groupedQuestions = this.groupQuestionsByDifficultyAndType(availableQuestions);

    // 计算每个分组需要的题目数量
    const requiredCounts = this.calculateRequiredCounts(config);

    // 选择题目
    const selectedQuestions = this.selectQuestions(groupedQuestions, requiredCounts, config);

    // 调整分值以达到目标总分
    const adjustedQuestions = this.adjustPointsToTarget(selectedQuestions, config.totalPoints);

    // 随机打乱题目顺序
    const shuffledQuestions = this.shuffleQuestions(adjustedQuestions);

    // 生成试卷
    const examPaper: ExamPaper = {
      id: this.generateId(),
      title: title || `自动生成试卷_${new Date().toLocaleString()}`,
      questions: shuffledQuestions,
      totalQuestions: shuffledQuestions.length,
      totalPoints: shuffledQuestions.reduce((sum, q) => sum + q.points, 0),
      difficultyBreakdown: this.calculateDifficultyBreakdown(shuffledQuestions),
      typeBreakdown: this.calculateTypeBreakdown(shuffledQuestions),
      createdAt: new Date().toISOString(),
      createdBy,
      config
    };

    return examPaper;
  }

  // 验证配置
  private validateConfig(config: ExamPaperConfig): void {
    // 检查基本参数
    if (config.totalQuestions <= 0) {
      throw new ExamPaperGenerationError('总题目数量必须大于0', 'INVALID_TOTAL_QUESTIONS');
    }

    if (config.totalPoints <= 0) {
      throw new ExamPaperGenerationError('总分值必须大于0', 'INVALID_TOTAL_POINTS');
    }
  }

  // 筛选可用题目
  private filterAvailableQuestions(config: ExamPaperConfig): BaseQuestion[] {
    let filtered = [...this.questions];

    // 如果指定了章节范围，则筛选章节
    if (config.chapterCoverage && config.chapterCoverage.length > 0) {
      filtered = filtered.filter(q => config.chapterCoverage!.includes(q.chapter));
    }

    return filtered;
  }

  // 检查题目可用性
  private checkQuestionAvailability(questions: BaseQuestion[], config: ExamPaperConfig): void {
    if (questions.length < config.totalQuestions) {
      throw new ExamPaperGenerationError(
        `可用题目数量不足。需要${config.totalQuestions}道题目，但只有${questions.length}道可用题目`,
        'INSUFFICIENT_QUESTIONS'
      );
    }

    // 检查每个难度和题型的题目数量
    const grouped = this.groupQuestionsByDifficultyAndType(questions);
    const requiredCounts = this.calculateRequiredCounts(config);

    for (const [difficulty, typeGroups] of Object.entries(grouped)) {
      for (const [type, questionList] of Object.entries(typeGroups)) {
        const required = requiredCounts[difficulty as keyof typeof requiredCounts]?.[type as keyof typeof requiredCounts.简单] || 0;
        if (questionList.length < required) {
          throw new ExamPaperGenerationError(
            `${difficulty}难度的${this.getTypeLabel(type)}题目数量不足。需要${required}道，但只有${questionList.length}道`,
            'INSUFFICIENT_QUESTIONS_BY_TYPE'
          );
        }
      }
    }
  }

  // 按难度和题型分组
  private groupQuestionsByDifficultyAndType(questions: BaseQuestion[]): Record<string, Record<string, BaseQuestion[]>> {
    const grouped: Record<string, Record<string, BaseQuestion[]>> = {
      简单: { single_choice: [], fill_blank: [], true_false: [], essay: [] },
      中等: { single_choice: [], fill_blank: [], true_false: [], essay: [] },
      困难: { single_choice: [], fill_blank: [], true_false: [], essay: [] }
    };

    questions.forEach(question => {
      const difficulty = question.difficulty;
      const type = question.type;
      
      if (grouped[difficulty] && grouped[difficulty][type]) {
        grouped[difficulty][type].push(question);
      }
    });

    return grouped;
  }

  // 计算每个分组需要的题目数量
  private calculateRequiredCounts(config: ExamPaperConfig) {
    const counts = {
      简单: { single_choice: 0, fill_blank: 0, true_false: 0, essay: 0 },
      中等: { single_choice: 0, fill_blank: 0, true_false: 0, essay: 0 },
      困难: { single_choice: 0, fill_blank: 0, true_false: 0, essay: 0 }
    };

    // 计算每个难度级别的题目数量
    const difficultyQuestions = {
      简单: Math.round(config.totalQuestions * config.difficultyDistribution.简单),
      中等: Math.round(config.totalQuestions * config.difficultyDistribution.中等),
      困难: Math.round(config.totalQuestions * config.difficultyDistribution.困难)
    };

    // 调整以确保总数正确
    const totalCalculated = difficultyQuestions.简单 + difficultyQuestions.中等 + difficultyQuestions.困难;
    const difference = config.totalQuestions - totalCalculated;
    if (difference !== 0) {
      // 将差值分配给中等难度
      difficultyQuestions.中等 += difference;
    }

    // 为每个难度级别分配题型
    Object.keys(difficultyQuestions).forEach(difficulty => {
      const difficultyTotal = difficultyQuestions[difficulty as keyof typeof difficultyQuestions];
      
      counts[difficulty as keyof typeof counts].single_choice = Math.round(difficultyTotal * config.typeDistribution.single_choice);
      counts[difficulty as keyof typeof counts].fill_blank = Math.round(difficultyTotal * config.typeDistribution.fill_blank);
      counts[difficulty as keyof typeof counts].true_false = Math.round(difficultyTotal * config.typeDistribution.true_false);
      counts[difficulty as keyof typeof counts].essay = Math.round(difficultyTotal * config.typeDistribution.essay);

      // 调整以确保每个难度级别的总数正确
      const typeTotal = Object.values(counts[difficulty as keyof typeof counts]).reduce((sum, val) => sum + val, 0);
      const typeDifference = difficultyTotal - typeTotal;
      if (typeDifference !== 0) {
        // 将差值分配给单选题
        counts[difficulty as keyof typeof counts].single_choice += typeDifference;
      }
    });

    return counts;
  }

  // 选择题目
  private selectQuestions(
    groupedQuestions: Record<string, Record<string, BaseQuestion[]>>,
    requiredCounts: ReturnType<typeof this.calculateRequiredCounts>,
    config: ExamPaperConfig
  ): BaseQuestion[] {
    const selectedQuestions: BaseQuestion[] = [];

    for (const [difficulty, typeGroups] of Object.entries(groupedQuestions)) {
      for (const [type, questionList] of Object.entries(typeGroups)) {
        const required = requiredCounts[difficulty as keyof typeof requiredCounts]?.[type as keyof typeof requiredCounts.简单] || 0;
        
        if (required > 0) {
          // 随机选择题目
          const shuffled = [...questionList].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, required);
          selectedQuestions.push(...selected);
        }
      }
    }

    return selectedQuestions;
  }

  // 调整分值以达到目标总分
  private adjustPointsToTarget(questions: BaseQuestion[], targetPoints: number): BaseQuestion[] {
    const currentTotal = questions.reduce((sum, q) => sum + q.points, 0);
    
    if (currentTotal === targetPoints) {
      return questions;
    }

    // 计算调整比例
    const ratio = targetPoints / currentTotal;
    
    // 调整每道题的分值
    const adjustedQuestions = questions.map(question => ({
      ...question,
      points: Math.round(question.points * ratio)
    }));

    // 微调以确保总分准确
    const newTotal = adjustedQuestions.reduce((sum, q) => sum + q.points, 0);
    const difference = targetPoints - newTotal;
    
    if (difference !== 0 && adjustedQuestions.length > 0) {
      // 将差值分配给第一道题
      adjustedQuestions[0].points += difference;
    }

    return adjustedQuestions;
  }

  // 随机打乱题目顺序
  private shuffleQuestions(questions: BaseQuestion[]): BaseQuestion[] {
    return [...questions].sort(() => Math.random() - 0.5);
  }

  // 计算难度分布统计
  private calculateDifficultyBreakdown(questions: BaseQuestion[]) {
    const breakdown = { 简单: 0, 中等: 0, 困难: 0 };
    questions.forEach(q => {
      if (breakdown.hasOwnProperty(q.difficulty)) {
        breakdown[q.difficulty as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  }

  // 计算题型分布统计
  private calculateTypeBreakdown(questions: BaseQuestion[]) {
    const breakdown = { single_choice: 0, fill_blank: 0, true_false: 0, essay: 0 };
    questions.forEach(q => {
      if (breakdown.hasOwnProperty(q.type)) {
        breakdown[q.type as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  }

  // 获取题型标签
  private getTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      single_choice: '单选题',
      fill_blank: '填空题',
      true_false: '判断题',
      essay: '简答题'
    };
    return typeMap[type] || type;
  }

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 预设组卷配置
export const presetConfigs = {
  // 标准考试配置
  standardExam: {
    totalQuestions: 30,
    totalPoints: 100,
    difficultyDistribution: {
      简单: 0.3,
      中等: 0.5,
      困难: 0.2
    },
    typeDistribution: {
      single_choice: 0.6,
      fill_blank: 0.2,
      true_false: 0.1,
      essay: 0.1
    }
  } as ExamPaperConfig,

  // 基础练习配置
  basicPractice: {
    totalQuestions: 20,
    totalPoints: 60,
    difficultyDistribution: {
      简单: 0.5,
      中等: 0.4,
      困难: 0.1
    },
    typeDistribution: {
      single_choice: 0.7,
      fill_blank: 0.2,
      true_false: 0.1,
      essay: 0.0
    }
  } as ExamPaperConfig,

  // 高难度测试配置
  advancedTest: {
    totalQuestions: 25,
    totalPoints: 120,
    difficultyDistribution: {
      简单: 0.2,
      中等: 0.4,
      困难: 0.4
    },
    typeDistribution: {
      single_choice: 0.4,
      fill_blank: 0.3,
      true_false: 0.1,
      essay: 0.2
    }
  } as ExamPaperConfig
};

// 组卷服务类
export class ExamPaperService {
  private generator: ExamPaperGenerator;

  constructor(questions: BaseQuestion[]) {
    this.generator = new ExamPaperGenerator(questions);
  }

  // 使用预设配置生成试卷
  public generateWithPreset(presetName: keyof typeof presetConfigs, createdBy: string, title?: string): ExamPaper {
    const config = presetConfigs[presetName];
    if (!config) {
      throw new ExamPaperGenerationError(`未找到预设配置: ${presetName}`, 'PRESET_NOT_FOUND');
    }
    return this.generator.generateExamPaper(config, createdBy, title);
  }

  // 使用自定义配置生成试卷
  public generateWithCustomConfig(config: ExamPaperConfig, createdBy: string, title?: string): ExamPaper {
    return this.generator.generateExamPaper(config, createdBy, title);
  }

  // 获取可用的预设配置列表
  public getPresetConfigs() {
    return Object.keys(presetConfigs).map(key => ({
      name: key,
      config: presetConfigs[key as keyof typeof presetConfigs],
      description: this.getPresetDescription(key)
    }));
  }

  // 获取预设配置描述
  private getPresetDescription(presetName: string): string {
    const descriptions: { [key: string]: string } = {
      standardExam: '标准考试 - 30题100分，难度均衡分布',
      basicPractice: '基础练习 - 20题60分，以简单题为主',
      advancedTest: '高难度测试 - 25题120分，偏重难题'
    };
    return descriptions[presetName] || '自定义配置';
  }
}