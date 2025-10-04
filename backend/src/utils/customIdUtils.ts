/**
 * 知识点自定义ID生成和验证工具
 * 编码格式：模块-章-节-序号 (例如：bx01-01-01-001)
 */

// 模块编码映射（拼音首字母）
export const MODULE_CODES = {
  'bx01': {
    name: '必修1《分子与细胞》',
    chapters: 6,
    sections: [2, 5, 3, 2, 4, 3] // 每章的节数
  },
  'bx02': {
    name: '必修2《遗传与进化》',
    chapters: 6,
    sections: [2, 3, 4, 2, 3, 4] // 每章的节数
  },
  'xz01': {
    name: '选择性必修1《稳态与调节》',
    chapters: 5,
    sections: [2, 5, 3, 4, 4] // 每章的节数
  },
  'xz02': {
    name: '选择性必修2《生物与环境》',
    chapters: 4,
    sections: [3, 3, 5, 3] // 每章的节数
  },
  'xz03': {
    name: '选择性必修3《生物技术与工程》',
    chapters: 4,
    sections: [3, 3, 4, 3] // 每章的节数
  }
} as const;

// 自定义ID接口
export interface CustomIdComponents {
  module: string;      // 模块编码 (bx01, bx02, xz01, xz02, xz03)
  chapter: number;     // 章号 (1-6)
  section: number;     // 节号 (1-5)
  sequence: number;    // 序号 (1-999)
}

/**
 * 验证模块编码是否有效
 */
export function isValidModule(module: string): boolean {
  return module in MODULE_CODES;
}

/**
 * 验证章节编号是否有效
 */
export function isValidChapterSection(module: string, chapter: number, section: number): boolean {
  if (!isValidModule(module)) return false;
  
  const moduleInfo = MODULE_CODES[module as keyof typeof MODULE_CODES];
  
  // 检查章号是否在有效范围内
  if (chapter < 1 || chapter > moduleInfo.chapters) return false;
  
  // 检查节号是否在有效范围内
  const maxSections = moduleInfo.sections[chapter - 1];
  if (section < 1 || section > maxSections) return false;
  
  return true;
}

/**
 * 生成完整的自定义ID
 */
export function generateCustomId(components: CustomIdComponents): string {
  const { module, chapter, section, sequence } = components;
  
  // 格式化章节编号 (01-06)
  const chapterStr = chapter.toString().padStart(2, '0');
  const sectionStr = section.toString().padStart(2, '0');
  
  // 格式化序号 (001-999)
  const sequenceStr = sequence.toString().padStart(3, '0');
  
  return `${module}-${chapterStr}-${sectionStr}-${sequenceStr}`;
}

/**
 * 解析自定义ID
 */
export function parseCustomId(customId: string): CustomIdComponents | null {
  const regex = /^([a-z]{2}\d{2})-(\d{2})-(\d{2})-(\d{3,})$/;
  const match = customId.match(regex);
  
  if (!match) return null;
  
  const [, module, chapterStr, sectionStr, sequenceStr] = match;
  const chapter = parseInt(chapterStr, 10);
  const section = parseInt(sectionStr, 10);
  const sequence = parseInt(sequenceStr, 10);
  
  return {
    module,
    chapter,
    section,
    sequence
  };
}

/**
 * 验证自定义ID格式和内容
 */
export function validateCustomId(customId: string): {
  isValid: boolean;
  error?: string;
  components?: CustomIdComponents;
} {
  // 检查格式
  const components = parseCustomId(customId);
  if (!components) {
    return {
      isValid: false,
      error: 'ID格式不正确，应为：模块-章-节-序号 (例如：bx01-01-01-001)'
    };
  }
  
  const { module, chapter, section, sequence } = components;
  
  // 检查模块是否有效
  if (!isValidModule(module)) {
    return {
      isValid: false,
      error: `无效的模块编码：${module}，支持的模块：${Object.keys(MODULE_CODES).join(', ')}`
    };
  }
  
  // 检查章节是否有效
  if (!isValidChapterSection(module, chapter, section)) {
    const moduleInfo = MODULE_CODES[module as keyof typeof MODULE_CODES];
    const maxSections = moduleInfo.sections[chapter - 1] || 0;
    return {
      isValid: false,
      error: `无效的章节编号：第${chapter}章第${section}节，${moduleInfo.name}第${chapter}章最多有${maxSections}节`
    };
  }
  
  // 检查序号范围
  if (sequence < 1 || sequence > 999) {
    return {
      isValid: false,
      error: '序号必须在1-999之间'
    };
  }
  
  return {
    isValid: true,
    components
  };
}

/**
 * 生成下一个可用序号
 */
export function generateNextSequence(module: string, chapter: number, section: number, existingIds: string[]): number {
  const chapterStr = chapter.toString().padStart(2, '0');
  const sectionStr = section.toString().padStart(2, '0');
  const prefix = `${module}-${chapterStr}-${sectionStr}-`;
  
  // 找出当前章节下所有已存在的序号
  const existingSequences = existingIds
    .filter(id => id.startsWith(prefix))
    .map(id => {
      const components = parseCustomId(id);
      return components ? components.sequence : 0;
    })
    .filter(seq => seq > 0)
    .sort((a, b) => a - b);
  
  // 找出下一个可用序号
  let nextSequence = 1;
  for (const seq of existingSequences) {
    if (seq === nextSequence) {
      nextSequence++;
    } else {
      break;
    }
  }
  
  return nextSequence;
}

/**
 * 获取模块信息
 */
export function getModuleInfo(module: string) {
  if (!isValidModule(module)) return null;
  return MODULE_CODES[module as keyof typeof MODULE_CODES];
}

/**
 * 获取所有支持的模块列表
 */
export function getAllModules() {
  return Object.entries(MODULE_CODES).map(([code, info]) => ({
    code,
    name: info.name,
    chapters: info.chapters,
    sections: info.sections
  }));
}