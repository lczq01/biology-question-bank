// 增强版模拟题目数据服务 - 支持高级筛选功能
export interface EnhancedQuestion {
  id: string;
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  chapter: string;
  keywords: string[];
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: string;
  explanation: string;
  points: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  usageCount: number;
  image?: string;
}

// 增强版模拟题目数据
export const enhancedMockQuestions: EnhancedQuestion[] = [
  {
    id: '1',
    content: '<p><strong>细胞膜的主要成分是什么？</strong></p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '细胞的结构和功能',
    keywords: ['细胞膜', '磷脂双分子层', '膜结构'],
    options: [
      { id: 'A', text: '蛋白质', isCorrect: false },
      { id: 'B', text: '磷脂双分子层', isCorrect: true },
      { id: 'C', text: '糖类', isCorrect: false },
      { id: 'D', text: '核酸', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>细胞膜的主要成分是<strong>磷脂双分子层</strong>，它构成了细胞膜的基本骨架，具有流动性和选择透过性。</p>',
    points: 5,
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isActive: true,
    usageCount: 15,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    content: '<p>DNA的双螺旋结构是由哪两位科学家提出的？</p>',
    type: 'single_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '遗传的分子基础',
    keywords: ['DNA', '双螺旋', '沃森', '克里克'],
    options: [
      { id: 'A', text: '达尔文和孟德尔', isCorrect: false },
      { id: 'B', text: '沃森和克里克', isCorrect: true },
      { id: 'C', text: '巴斯德和科赫', isCorrect: false },
      { id: 'D', text: '施莱登和施旺', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p><strong>沃森和克里克</strong>在1953年提出了DNA的双螺旋结构模型，这是分子生物学的重要里程碑。</p>',
    points: 3,
    createdBy: 'admin',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    isActive: true,
    usageCount: 22
  },
  {
    id: '3',
    content: '<p>光合作用的光反应阶段主要发生在叶绿体的哪个部位？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '光合作用',
    keywords: ['光合作用', '光反应', '叶绿体', '类囊体膜'],
    options: [
      { id: 'A', text: '基质', isCorrect: false },
      { id: 'B', text: '类囊体膜', isCorrect: true },
      { id: 'C', text: '外膜', isCorrect: false },
      { id: 'D', text: '内膜', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>光合作用的光反应阶段发生在<strong>类囊体膜</strong>上，这里含有叶绿素和其他光合色素。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
    isActive: true,
    usageCount: 18,
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&h=300&fit=crop'
  },
  {
    id: '4',
    content: '<p>酶的催化特点不包括以下哪一项？</p>',
    type: 'single_choice',
    difficulty: 'hard',
    subject: '生物',
    chapter: '酶与ATP',
    keywords: ['酶', '催化', '特异性', '可逆性'],
    options: [
      { id: 'A', text: '高效性', isCorrect: false },
      { id: 'B', text: '专一性', isCorrect: false },
      { id: 'C', text: '不可逆性', isCorrect: true },
      { id: 'D', text: '受温度影响', isCorrect: false }
    ],
    correctAnswer: 'C',
    explanation: '<p>酶催化反应是<strong>可逆的</strong>，不可逆性不是酶的特点。酶具有高效性、专一性，并且受温度、pH等因素影响。</p>',
    points: 6,
    createdBy: 'admin',
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
    isActive: true,
    usageCount: 8
  },
  {
    id: '5',
    content: '<p>细胞呼吸的第三阶段是什么？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '细胞呼吸',
    keywords: ['细胞呼吸', '电子传递链', 'ATP合成'],
    options: [
      { id: 'A', text: '糖酵解', isCorrect: false },
      { id: 'B', text: '柠檬酸循环', isCorrect: false },
      { id: 'C', text: '电子传递链', isCorrect: true },
      { id: 'D', text: '乳酸发酵', isCorrect: false }
    ],
    correctAnswer: 'C',
    explanation: '<p>细胞呼吸的第三阶段是<strong>电子传递链</strong>，发生在线粒体内膜，产生大量ATP。</p>',
    points: 5,
    createdBy: 'admin',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
    isActive: true,
    usageCount: 12
  },
  {
    id: '6',
    content: '<p>下列哪些是植物细胞特有的结构？</p>',
    type: 'multiple_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '细胞的结构和功能',
    keywords: ['植物细胞', '细胞壁', '叶绿体', '液泡'],
    options: [
      { id: 'A', text: '细胞壁', isCorrect: true },
      { id: 'B', text: '叶绿体', isCorrect: true },
      { id: 'C', text: '大液泡', isCorrect: true },
      { id: 'D', text: '中心体', isCorrect: false }
    ],
    correctAnswer: 'A,B,C',
    explanation: '<p>植物细胞特有的结构包括<strong>细胞壁、叶绿体和大液泡</strong>。中心体是动物细胞特有的结构。</p>',
    points: 8,
    createdBy: 'admin',
    createdAt: '2024-01-06T00:00:00.000Z',
    updatedAt: '2024-01-06T00:00:00.000Z',
    isActive: true,
    usageCount: 10
  },
  {
    id: '7',
    content: '<p>关于生物呼吸作用的描述，正确的是？</p>',
    type: 'single_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '细胞呼吸',
    keywords: ['呼吸作用', '生物', '能量代谢'],
    options: [
      { id: 'A', text: '只有动物需要进行呼吸作用', isCorrect: false },
      { id: 'B', text: '所有活细胞都需要进行呼吸作用', isCorrect: true },
      { id: 'C', text: '只有植物需要进行呼吸作用', isCorrect: false },
      { id: 'D', text: '微生物不需要呼吸作用', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p><strong>正确答案是B</strong>。所有活细胞都需要进行呼吸作用来获取能量，包括植物、动物和微生物。</p>',
    points: 3,
    createdBy: 'admin',
    createdAt: '2024-01-07T00:00:00.000Z',
    updatedAt: '2024-01-07T00:00:00.000Z',
    isActive: true,
    usageCount: 25
  },
  {
    id: '8',
    content: '<p>光合作用的总反应式为：6CO₂ + 6H₂O → _______ + 6O₂</p>',
    type: 'fill_blank',
    difficulty: 'easy',
    subject: '生物',
    chapter: '光合作用',
    keywords: ['光合作用', '反应式', '葡萄糖'],
    correctAnswer: 'C₆H₁₂O₆',
    explanation: '<p>光合作用的总反应式为：6CO₂ + 6H₂O → <strong>C₆H₁₂O₆</strong> + 6O₂，产物是葡萄糖。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-08T00:00:00.000Z',
    updatedAt: '2024-01-08T00:00:00.000Z',
    isActive: true,
    usageCount: 16
  },
  {
    id: '9',
    content: '<p>酶的作用机理中，最重要的特点是什么？</p>',
    type: 'single_choice',
    difficulty: 'hard',
    subject: '生物',
    chapter: '酶与ATP',
    keywords: ['酶', '作用机理', '活化能', '酶-底物复合物'],
    options: [
      { id: 'A', text: '提高反应温度', isCorrect: false },
      { id: 'B', text: '降低反应活化能', isCorrect: true },
      { id: 'C', text: '增加反应物浓度', isCorrect: false },
      { id: 'D', text: '改变反应平衡', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>酶的作用机理中最重要的特点是<strong>降低反应活化能</strong>，使反应更容易进行，同时具有高效性和专一性。</p>',
    points: 6,
    createdBy: 'admin',
    createdAt: '2024-01-09T00:00:00.000Z',
    updatedAt: '2024-01-09T00:00:00.000Z',
    isActive: true,
    usageCount: 5
  },
  {
    id: '10',
    content: '<p>关于基因突变的影响，正确的是？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '基因突变和基因重组',
    keywords: ['基因突变', '有害', '有利', '中性'],
    options: [
      { id: 'A', text: '只会产生有害影响', isCorrect: false },
      { id: 'B', text: '只会产生有利影响', isCorrect: false },
      { id: 'C', text: '可能产生有害、有利或中性影响', isCorrect: true },
      { id: 'D', text: '不会产生任何影响', isCorrect: false }
    ],
    correctAnswer: 'C',
    explanation: '<p><strong>正确答案是C</strong>。基因突变可能产生有害、有利或中性的影响。有利突变是生物进化的重要动力。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-10T00:00:00.000Z',
    isActive: true,
    usageCount: 14
  },
  // 新增题目 11-30
  {
    id: '11',
    content: '<p>ATP分子中含有几个高能磷酸键？</p>',
    type: 'single_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '酶与ATP',
    keywords: ['ATP', '高能磷酸键', '能量'],
    options: [
      { id: 'A', text: '1个', isCorrect: false },
      { id: 'B', text: '2个', isCorrect: true },
      { id: 'C', text: '3个', isCorrect: false },
      { id: 'D', text: '4个', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>ATP分子含有<strong>2个高能磷酸键</strong>，水解时释放大量能量。</p>',
    points: 3,
    createdBy: 'admin',
    createdAt: '2024-01-11T00:00:00.000Z',
    updatedAt: '2024-01-11T00:00:00.000Z',
    isActive: true,
    usageCount: 20
  },
  {
    id: '12',
    content: '<p>孟德尔遗传定律中的分离定律是指什么？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '遗传的基本规律',
    keywords: ['孟德尔', '分离定律', '等位基因'],
    options: [
      { id: 'A', text: '等位基因在减数分裂时分离', isCorrect: true },
      { id: 'B', text: '非等位基因自由组合', isCorrect: false },
      { id: 'C', text: '基因连锁遗传', isCorrect: false },
      { id: 'D', text: '基因突变', isCorrect: false }
    ],
    correctAnswer: 'A',
    explanation: '<p>分离定律指<strong>等位基因在减数分裂时分离</strong>，分别进入不同的配子中。</p>',
    points: 5,
    createdBy: 'admin',
    createdAt: '2024-01-12T00:00:00.000Z',
    updatedAt: '2024-01-12T00:00:00.000Z',
    isActive: true,
    usageCount: 18
  },
  {
    id: '13',
    content: '<p>线粒体的主要功能是什么？</p>',
    type: 'single_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '细胞的结构和功能',
    keywords: ['线粒体', 'ATP合成', '细胞呼吸'],
    options: [
      { id: 'A', text: '蛋白质合成', isCorrect: false },
      { id: 'B', text: 'ATP合成', isCorrect: true },
      { id: 'C', text: '脂质合成', isCorrect: false },
      { id: 'D', text: '核酸合成', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>线粒体的主要功能是<strong>ATP合成</strong>，被称为细胞的"动力工厂"。</p>',
    points: 3,
    createdBy: 'admin',
    createdAt: '2024-01-13T00:00:00.000Z',
    updatedAt: '2024-01-13T00:00:00.000Z',
    isActive: true,
    usageCount: 25
  },
  {
    id: '14',
    content: '<p>植物激素中促进细胞分裂的是哪一种？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '植物的激素调节',
    keywords: ['植物激素', '细胞分裂素', '细胞分裂'],
    options: [
      { id: 'A', text: '生长素', isCorrect: false },
      { id: 'B', text: '细胞分裂素', isCorrect: true },
      { id: 'C', text: '赤霉素', isCorrect: false },
      { id: 'D', text: '脱落酸', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p><strong>细胞分裂素</strong>主要促进细胞分裂，延缓叶片衰老。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-14T00:00:00.000Z',
    updatedAt: '2024-01-14T00:00:00.000Z',
    isActive: true,
    usageCount: 12
  },
  {
    id: '15',
    content: '<p>DNA复制的特点是什么？</p>',
    type: 'single_choice',
    difficulty: 'hard',
    subject: '生物',
    chapter: '遗传的分子基础',
    keywords: ['DNA复制', '半保留复制', '双向复制'],
    options: [
      { id: 'A', text: '全保留复制', isCorrect: false },
      { id: 'B', text: '半保留复制', isCorrect: true },
      { id: 'C', text: '分散复制', isCorrect: false },
      { id: 'D', text: '随机复制', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>DNA复制是<strong>半保留复制</strong>，每个新DNA分子都含有一条原来的链和一条新合成的链。</p>',
    points: 6,
    createdBy: 'admin',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    isActive: true,
    usageCount: 8
  },
  {
    id: '16',
    content: '<p>光合作用中CO₂的固定发生在哪个阶段？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '光合作用',
    keywords: ['CO₂固定', '暗反应', '卡尔文循环'],
    options: [
      { id: 'A', text: '光反应阶段', isCorrect: false },
      { id: 'B', text: '暗反应阶段', isCorrect: true },
      { id: 'C', text: '光系统I', isCorrect: false },
      { id: 'D', text: '光系统II', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>CO₂的固定发生在<strong>暗反应阶段</strong>（卡尔文循环），不直接依赖光照。</p>',
    points: 5,
    createdBy: 'admin',
    createdAt: '2024-01-16T00:00:00.000Z',
    updatedAt: '2024-01-16T00:00:00.000Z',
    isActive: true,
    usageCount: 15
  },
  {
    id: '17',
    content: '<p>下列哪些属于原核细胞？</p>',
    type: 'multiple_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '细胞的结构和功能',
    keywords: ['原核细胞', '细菌', '蓝藻'],
    options: [
      { id: 'A', text: '细菌', isCorrect: true },
      { id: 'B', text: '蓝藻', isCorrect: true },
      { id: 'C', text: '酵母菌', isCorrect: false },
      { id: 'D', text: '病毒', isCorrect: false }
    ],
    correctAnswer: 'A,B',
    explanation: '<p><strong>细菌和蓝藻</strong>属于原核细胞，没有成形的细胞核。酵母菌是真核细胞，病毒没有细胞结构。</p>',
    points: 6,
    createdBy: 'admin',
    createdAt: '2024-01-17T00:00:00.000Z',
    updatedAt: '2024-01-17T00:00:00.000Z',
    isActive: true,
    usageCount: 22
  },
  {
    id: '18',
    content: '<p>蛋白质的基本组成单位是什么？</p>',
    type: 'single_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '蛋白质的结构和功能',
    keywords: ['蛋白质', '氨基酸', '基本单位'],
    options: [
      { id: 'A', text: '核苷酸', isCorrect: false },
      { id: 'B', text: '氨基酸', isCorrect: true },
      { id: 'C', text: '脂肪酸', isCorrect: false },
      { id: 'D', text: '单糖', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p><strong>正确答案是B</strong>。蛋白质是由氨基酸通过肽键连接形成的生物大分子。</p>',
    points: 2,
    createdBy: 'admin',
    createdAt: '2024-01-18T00:00:00.000Z',
    updatedAt: '2024-01-18T00:00:00.000Z',
    isActive: true,
    usageCount: 30
  },
  {
    id: '19',
    content: '<p>转录过程中，RNA聚合酶的作用是_______。</p>',
    type: 'fill_blank',
    difficulty: 'medium',
    subject: '生物',
    chapter: '遗传的分子基础',
    keywords: ['转录', 'RNA聚合酶', 'mRNA合成'],
    correctAnswer: '催化mRNA的合成',
    explanation: '<p>RNA聚合酶的作用是<strong>催化mRNA的合成</strong>，以DNA为模板合成RNA。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-19T00:00:00.000Z',
    updatedAt: '2024-01-19T00:00:00.000Z',
    isActive: true,
    usageCount: 16
  },
  {
    id: '20',
    content: '<p>细胞膜的流动镶嵌模型中，构成膜基本骨架的是什么？</p>',
    type: 'single_choice',
    difficulty: 'hard',
    subject: '生物',
    chapter: '细胞的结构和功能',
    keywords: ['细胞膜', '流动镶嵌模型', '磷脂双分子层'],
    options: [
      { id: 'A', text: '蛋白质', isCorrect: false },
      { id: 'B', text: '磷脂双分子层', isCorrect: true },
      { id: 'C', text: '糖类', isCorrect: false },
      { id: 'D', text: '胆固醇', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>在流动镶嵌模型中，<strong>磷脂双分子层</strong>构成膜的基本骨架，具有流动性，蛋白质以不同方式镶嵌其中。</p>',
    points: 6,
    createdBy: 'admin',
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z',
    isActive: true,
    usageCount: 6
  },
  {
    id: '21',
    content: '<p>减数分裂过程中同源染色体分离发生在哪个时期？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '减数分裂和受精作用',
    keywords: ['减数分裂', '同源染色体', '分离'],
    options: [
      { id: 'A', text: '减数分裂I前期', isCorrect: false },
      { id: 'B', text: '减数分裂I后期', isCorrect: true },
      { id: 'C', text: '减数分裂II前期', isCorrect: false },
      { id: 'D', text: '减数分裂II后期', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>同源染色体分离发生在<strong>减数分裂I后期</strong>，这是减数分裂的关键步骤。</p>',
    points: 5,
    createdBy: 'admin',
    createdAt: '2024-01-21T00:00:00.000Z',
    updatedAt: '2024-01-21T00:00:00.000Z',
    isActive: true,
    usageCount: 14
  },
  {
    id: '22',
    content: '<p>生态系统中能量流动的特点是什么？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '生态系统的能量流动',
    keywords: ['能量流动', '单向流动', '逐级递减'],
    options: [
      { id: 'A', text: '循环流动', isCorrect: false },
      { id: 'B', text: '单向流动，逐级递减', isCorrect: true },
      { id: 'C', text: '双向流动', isCorrect: false },
      { id: 'D', text: '随机流动', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>生态系统中能量流动的特点是<strong>单向流动，逐级递减</strong>，不能循环利用。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-22T00:00:00.000Z',
    updatedAt: '2024-01-22T00:00:00.000Z',
    isActive: true,
    usageCount: 11
  },
  {
    id: '23',
    content: '<p>神经调节的基本方式是什么？</p>',
    type: 'single_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '神经调节',
    keywords: ['神经调节', '反射', '反射弧'],
    options: [
      { id: 'A', text: '反射', isCorrect: true },
      { id: 'B', text: '激素调节', isCorrect: false },
      { id: 'C', text: '免疫调节', isCorrect: false },
      { id: 'D', text: '酶调节', isCorrect: false }
    ],
    correctAnswer: 'A',
    explanation: '<p>神经调节的基本方式是<strong>反射</strong>，通过反射弧实现。</p>',
    points: 3,
    createdBy: 'admin',
    createdAt: '2024-01-23T00:00:00.000Z',
    updatedAt: '2024-01-23T00:00:00.000Z',
    isActive: true,
    usageCount: 28
  },
  {
    id: '24',
    content: '<p>种群密度的调查方法中，样方法适用于哪类生物？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '种群的特征',
    keywords: ['种群密度', '样方法', '植物'],
    options: [
      { id: 'A', text: '活动能力强的动物', isCorrect: false },
      { id: 'B', text: '植物和活动能力弱的动物', isCorrect: true },
      { id: 'C', text: '鸟类', isCorrect: false },
      { id: 'D', text: '鱼类', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>样方法适用于<strong>植物和活动能力弱的动物</strong>的种群密度调查。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-24T00:00:00.000Z',
    updatedAt: '2024-01-24T00:00:00.000Z',
    isActive: true,
    usageCount: 13
  },
  {
    id: '25',
    content: '<p>下列哪些是人体的免疫器官？</p>',
    type: 'multiple_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '免疫调节',
    keywords: ['免疫器官', '胸腺', '脾脏', '淋巴结'],
    options: [
      { id: 'A', text: '胸腺', isCorrect: true },
      { id: 'B', text: '脾脏', isCorrect: true },
      { id: 'C', text: '淋巴结', isCorrect: true },
      { id: 'D', text: '肝脏', isCorrect: false }
    ],
    correctAnswer: 'A,B,C',
    explanation: '<p><strong>胸腺、脾脏、淋巴结</strong>都是人体的免疫器官，参与免疫反应。</p>',
    points: 6,
    createdBy: 'admin',
    createdAt: '2024-01-25T00:00:00.000Z',
    updatedAt: '2024-01-25T00:00:00.000Z',
    isActive: true,
    usageCount: 9
  },
  {
    id: '26',
    content: '<p>关于酶的化学本质，正确的是？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '酶与ATP',
    keywords: ['酶', '蛋白质', '核酶'],
    options: [
      { id: 'A', text: '所有酶都是蛋白质', isCorrect: false },
      { id: 'B', text: '大多数酶是蛋白质，少数是RNA', isCorrect: true },
      { id: 'C', text: '所有酶都是RNA', isCorrect: false },
      { id: 'D', text: '酶都是糖类', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p><strong>正确答案是B</strong>。大多数酶是蛋白质，但也有少数酶是RNA（核酶）。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-26T00:00:00.000Z',
    updatedAt: '2024-01-26T00:00:00.000Z',
    isActive: true,
    usageCount: 17
  },
  {
    id: '27',
    content: '<p>基因工程中常用的载体是_______。</p>',
    type: 'fill_blank',
    difficulty: 'hard',
    subject: '生物',
    chapter: '基因工程',
    keywords: ['基因工程', '载体', '质粒'],
    correctAnswer: '质粒',
    explanation: '<p>基因工程中常用的载体是<strong>质粒</strong>，它能够携带外源基因进入宿主细胞。</p>',
    points: 5,
    createdBy: 'admin',
    createdAt: '2024-01-27T00:00:00.000Z',
    updatedAt: '2024-01-27T00:00:00.000Z',
    isActive: true,
    usageCount: 7
  },
  {
    id: '28',
    content: '<p>光合作用和细胞呼吸在物质关系上的特点是？</p>',
    type: 'single_choice',
    difficulty: 'hard',
    subject: '生物',
    chapter: '光合作用',
    keywords: ['光合作用', '细胞呼吸', '物质循环', '能量转换'],
    options: [
      { id: 'A', text: '两者没有关系', isCorrect: false },
      { id: 'B', text: '光合作用的产物是细胞呼吸的原料', isCorrect: true },
      { id: 'C', text: '两者发生在同一场所', isCorrect: false },
      { id: 'D', text: '两者同时进行', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p><strong>正确答案是B</strong>。光合作用产生的葡萄糖和氧气是细胞呼吸的原料；细胞呼吸产生的CO₂和H₂O是光合作用的原料，形成物质循环。</p>',
    points: 8,
    createdBy: 'admin',
    createdAt: '2024-01-28T00:00:00.000Z',
    updatedAt: '2024-01-28T00:00:00.000Z',
    isActive: true,
    usageCount: 3
  },
  {
    id: '29',
    content: '<p>血糖调节的主要激素是什么？</p>',
    type: 'single_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '体液调节',
    keywords: ['血糖调节', '胰岛素', '胰高血糖素'],
    options: [
      { id: 'A', text: '生长激素', isCorrect: false },
      { id: 'B', text: '胰岛素和胰高血糖素', isCorrect: true },
      { id: 'C', text: '甲状腺激素', isCorrect: false },
      { id: 'D', text: '肾上腺素', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '<p>血糖调节的主要激素是<strong>胰岛素和胰高血糖素</strong>，它们相互拮抗调节血糖浓度。</p>',
    points: 3,
    createdBy: 'admin',
    createdAt: '2024-01-29T00:00:00.000Z',
    updatedAt: '2024-01-29T00:00:00.000Z',
    isActive: true,
    usageCount: 24
  },
  {
    id: '30',
    content: '<p>生物多样性包括哪三个层次？</p>',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '生物多样性的保护',
    keywords: ['生物多样性', '基因多样性', '物种多样性', '生态系统多样性'],
    options: [
      { id: 'A', text: '基因、物种、生态系统', isCorrect: true },
      { id: 'B', text: '个体、种群、群落', isCorrect: false },
      { id: 'C', text: '分子、细胞、个体', isCorrect: false },
      { id: 'D', text: '结构、功能、进化', isCorrect: false }
    ],
    correctAnswer: 'A',
    explanation: '<p>生物多样性包括<strong>基因多样性、物种多样性、生态系统多样性</strong>三个层次。</p>',
    points: 4,
    createdBy: 'admin',
    createdAt: '2024-01-30T00:00:00.000Z',
    updatedAt: '2024-01-30T00:00:00.000Z',
    isActive: true,
    usageCount: 19
  }
];

export class EnhancedMockQuestionService {
  private questions: EnhancedQuestion[] = [...enhancedMockQuestions];
  private nextId = 31;

  // 获取题目列表 - 增强版筛选功能
  async getQuestions(page: number = 1, limit: number = 10, filters: any = {}) {
    try {
      let filteredQuestions = [...this.questions];

      // 文本搜索 - 支持题目内容、解析、关键词、章节
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredQuestions = filteredQuestions.filter(q => 
          q.content.toLowerCase().includes(searchTerm) ||
          q.explanation.toLowerCase().includes(searchTerm) ||
          q.chapter.toLowerCase().includes(searchTerm) ||
          q.keywords.some(k => k.toLowerCase().includes(searchTerm))
        );
      }

      // 题型筛选 - 支持单个或多个题型
      if (filters.type) {
        filteredQuestions = filteredQuestions.filter(q => q.type === filters.type);
      } else if (filters.types) {
        const typeArray = filters.types.split(',').map((t: string) => t.trim());
        filteredQuestions = filteredQuestions.filter(q => typeArray.includes(q.type));
      }

      // 难度筛选 - 支持单个或多个难度
      if (filters.difficulty) {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
      } else if (filters.difficulties) {
        const difficultyArray = filters.difficulties.split(',').map((d: string) => d.trim());
        filteredQuestions = filteredQuestions.filter(q => difficultyArray.includes(q.difficulty));
      }

      // 章节筛选 - 支持单个或多个章节
      if (filters.chapter) {
        filteredQuestions = filteredQuestions.filter(q => 
          q.chapter.toLowerCase().includes(filters.chapter.toLowerCase())
        );
      } else if (filters.chapters) {
        const chapterArray = filters.chapters.split(',').map((c: string) => c.trim().toLowerCase());
        filteredQuestions = filteredQuestions.filter(q => 
          chapterArray.some((chapter: string) => q.chapter.toLowerCase().includes(chapter))
        );
      }

      // 关键词筛选
      if (filters.keywords) {
        const keywordArray = filters.keywords.split(',').map((k: string) => k.trim().toLowerCase());
        filteredQuestions = filteredQuestions.filter(q => 
          keywordArray.some((keyword: string) => 
            q.keywords.some(qk => qk.toLowerCase().includes(keyword))
          )
        );
      }

      // 分值范围筛选
      if (filters.pointsMin !== undefined && !isNaN(parseInt(filters.pointsMin))) {
        const minPoints = parseInt(filters.pointsMin);
        filteredQuestions = filteredQuestions.filter(q => q.points >= minPoints);
      }
      if (filters.pointsMax !== undefined && !isNaN(parseInt(filters.pointsMax))) {
        const maxPoints = parseInt(filters.pointsMax);
        filteredQuestions = filteredQuestions.filter(q => q.points <= maxPoints);
      }

      // 创建时间筛选
      if (filters.createdAfter) {
        const afterDate = new Date(filters.createdAfter);
        filteredQuestions = filteredQuestions.filter(q => new Date(q.createdAt) >= afterDate);
      }
      if (filters.createdBefore) {
        const beforeDate = new Date(filters.createdBefore);
        filteredQuestions = filteredQuestions.filter(q => new Date(q.createdAt) <= beforeDate);
      }

      // 排序功能
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      
      filteredQuestions.sort((a: any, b: any) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        // 处理日期字段
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        // 处理难度排序
        if (sortBy === 'difficulty') {
          const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
          aValue = difficultyOrder[aValue as keyof typeof difficultyOrder] || 0;
          bValue = difficultyOrder[bValue as keyof typeof difficultyOrder] || 0;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // 分页
      const total = filteredQuestions.length;
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;
      const questions = filteredQuestions.slice(skip, skip + limit);

      return {
        success: true,
        data: {
          questions,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          filters: {
            applied: Object.keys(filters).filter(key => filters[key] !== undefined && filters[key] !== ''),
            total: Object.keys(filters).length
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取题目列表失败'
      };
    }
  }

  // 根据ID获取题目
  async getQuestionById(id: string) {
    const question = this.questions.find(q => q.id === id);
    if (!question) {
      return {
        success: false,
        message: '题目不存在'
      };
    }
    return {
      success: true,
      data: question
    };
  }

  // 创建题目
  async createQuestion(questionData: any) {
    const newQuestion: EnhancedQuestion = {
      id: this.nextId.toString(),
      content: questionData.content,
      type: questionData.type,
      difficulty: questionData.difficulty,
      subject: questionData.subject || '生物',
      chapter: questionData.chapter,
      keywords: Array.isArray(questionData.keywords) ? questionData.keywords : [],
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      points: questionData.points,
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      usageCount: 0,
      image: questionData.image
    };
    
    this.questions.push(newQuestion);
    this.nextId++;
    
    return {
      success: true,
      data: newQuestion,
      message: '题目创建成功'
    };
  }

  // 更新题目
  async updateQuestion(id: string, updateData: any) {
    const questionIndex = this.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) {
      return {
        success: false,
        message: '题目不存在'
      };
    }

    this.questions[questionIndex] = {
      ...this.questions[questionIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      data: this.questions[questionIndex],
      message: '题目更新成功'
    };
  }

  // 删除题目
  async deleteQuestion(id: string) {
    const questionIndex = this.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) {
      return {
        success: false,
        message: '题目不存在'
      };
    }

    this.questions.splice(questionIndex, 1);
    return {
      success: true,
      message: '题目删除成功'
    };
  }

  // 获取统计信息
  async getStats() {
    const total = this.questions.length;
    const byDifficulty = {
      easy: this.questions.filter(q => q.difficulty === 'easy').length,
      medium: this.questions.filter(q => q.difficulty === 'medium').length,
      hard: this.questions.filter(q => q.difficulty === 'hard').length
    };
    const byType = {
      single_choice: this.questions.filter(q => q.type === 'single_choice').length,
      multiple_choice: this.questions.filter(q => q.type === 'multiple_choice').length,
      fill_blank: this.questions.filter(q => q.type === 'fill_blank').length
    };
    const byChapter = this.questions.reduce((acc, q) => {
      acc[q.chapter] = (acc[q.chapter] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      data: {
        total,
        byDifficulty,
        byType,
        byChapter
      }
    };
  }

  // 获取筛选选项
  async getFilterOptions() {
    const chapters = [...new Set(this.questions.map(q => q.chapter))];
    const keywords = [...new Set(this.questions.flatMap(q => q.keywords))];
    
    return {
      success: true,
      data: {
        chapters,
        keywords,
        types: ['single_choice', 'multiple_choice', 'fill_blank'],
        difficulties: ['easy', 'medium', 'hard'],
        pointsRange: {
          min: Math.min(...this.questions.map(q => q.points)),
          max: Math.max(...this.questions.map(q => q.points))
        }
      }
    };
  }
}

export const enhancedMockQuestionService = new EnhancedMockQuestionService();