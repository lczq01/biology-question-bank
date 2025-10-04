/**
 * 自定义ID工具函数单元测试
 */

import {
  MODULE_CODES,
  isValidModule,
  isValidChapterSection,
  generateCustomId,
  parseCustomId,
  validateCustomId,
  generateNextSequence,
  getModuleInfo,
  getAllModules,
  CustomIdComponents
} from '../customIdUtils';

describe('customIdUtils', () => {
  describe('isValidModule', () => {
    test('应该验证有效的模块编码', () => {
      expect(isValidModule('bx01')).toBe(true);
      expect(isValidModule('bx02')).toBe(true);
      expect(isValidModule('xz01')).toBe(true);
      expect(isValidModule('xz02')).toBe(true);
      expect(isValidModule('xz03')).toBe(true);
    });

    test('应该拒绝无效的模块编码', () => {
      expect(isValidModule('bx03')).toBe(false);
      expect(isValidModule('xz04')).toBe(false);
      expect(isValidModule('invalid')).toBe(false);
      expect(isValidModule('')).toBe(false);
    });
  });

  describe('isValidChapterSection', () => {
    test('应该验证有效的章节编号', () => {
      // 必修1第1章第1节 (有2节)
      expect(isValidChapterSection('bx01', 1, 1)).toBe(true);
      expect(isValidChapterSection('bx01', 1, 2)).toBe(true);
      
      // 必修2第2章第3节 (有3节)
      expect(isValidChapterSection('bx02', 2, 3)).toBe(true);
      
      // 选择性必修1第2章第5节 (有5节)
      expect(isValidChapterSection('xz01', 2, 5)).toBe(true);
    });

    test('应该拒绝无效的章节编号', () => {
      // 章号超出范围
      expect(isValidChapterSection('bx01', 7, 1)).toBe(false);
      expect(isValidChapterSection('bx01', 0, 1)).toBe(false);
      
      // 节号超出范围
      expect(isValidChapterSection('bx01', 1, 3)).toBe(false); // 第1章只有2节
      expect(isValidChapterSection('bx01', 1, 0)).toBe(false);
      
      // 无效模块
      expect(isValidChapterSection('invalid', 1, 1)).toBe(false);
    });
  });

  describe('generateCustomId', () => {
    test('应该生成正确格式的自定义ID', () => {
      const components: CustomIdComponents = {
        module: 'bx01',
        chapter: 1,
        section: 1,
        sequence: 1
      };
      expect(generateCustomId(components)).toBe('bx01-01-01-001');
    });

    test('应该正确填充零', () => {
      const components: CustomIdComponents = {
        module: 'xz03',
        chapter: 10,
        section: 5,
        sequence: 123
      };
      expect(generateCustomId(components)).toBe('xz03-1005-123');
    });
  });

  describe('parseCustomId', () => {
    test('应该正确解析有效的自定义ID', () => {
      const result = parseCustomId('bx01-01-01-001');
      expect(result).toEqual({
        module: 'bx01',
        chapter: 1,
        section: 1,
        sequence: 1
      });
    });

    test('应该正确解析复杂的自定义ID', () => {
      const result = parseCustomId('xz03-0405-123');
      expect(result).toEqual({
        module: 'xz03',
        chapter: 4,
        section: 5,
        sequence: 123
      });
    });

    test('应该拒绝无效格式的ID', () => {
      expect(parseCustomId('invalid-format')).toBeNull();
      expect(parseCustomId('bx01-01-001')).toBeNull();
      expect(parseCustomId('bx01-0101-01')).toBeNull();
      expect(parseCustomId('')).toBeNull();
    });
  });

  describe('validateCustomId', () => {
    test('应该验证有效的自定义ID', () => {
      const result = validateCustomId('bx01-01-01-001');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.components).toEqual({
        module: 'bx01',
        chapter: 1,
        section: 1,
        sequence: 1
      });
    });

    test('应该拒绝格式错误的ID', () => {
      const result = validateCustomId('invalid-format');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('ID格式不正确');
    });

    test('应该拒绝无效的模块编码', () => {
      const result = validateCustomId('bx99-01-01-001');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('无效的模块编码');
    });

    test('应该拒绝无效的章节编号', () => {
      const result = validateCustomId('bx01-0103-001'); // 第1章只有2节
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('无效的章节编号');
    });

    test('应该拒绝无效的序号', () => {
      const result1 = validateCustomId('bx01-0101-000');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('序号必须在1-999之间');

      const result2 = validateCustomId('bx01-0101-1000');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('序号必须在1-999之间');
    });
  });

  describe('generateNextSequence', () => {
    test('应该生成下一个可用序号', () => {
      const existingIds = [
        'bx01-01-01-001',
        'bx01-01-01-002',
        'bx01-0101-004',
        'bx01-0102-001' // 不同章节，不影响
      ];
      
      const nextSeq = generateNextSequence('bx01', 1, 1, existingIds);
      expect(nextSeq).toBe(3); // 001, 002已存在，004存在但003空缺
    });

    test('应该从1开始当没有现有ID时', () => {
      const nextSeq = generateNextSequence('bx01', 1, 1, []);
      expect(nextSeq).toBe(1);
    });

    test('应该正确处理连续序号', () => {
      const existingIds = [
        'bx01-01-01-001',
        'bx01-01-01-002',
        'bx01-0101-003'
      ];
      
      const nextSeq = generateNextSequence('bx01', 1, 1, existingIds);
      expect(nextSeq).toBe(4);
    });
  });

  describe('getModuleInfo', () => {
    test('应该返回有效模块的信息', () => {
      const info = getModuleInfo('bx01');
      expect(info).toEqual({
        name: '必修1《分子与细胞》',
        chapters: 6,
        sections: [2, 5, 3, 2, 4, 3]
      });
    });

    test('应该返回null对于无效模块', () => {
      const info = getModuleInfo('invalid');
      expect(info).toBeNull();
    });
  });

  describe('getAllModules', () => {
    test('应该返回所有模块的列表', () => {
      const modules = getAllModules();
      expect(modules).toHaveLength(5);
      expect(modules[0]).toEqual({
        code: 'bx01',
        name: '必修1《分子与细胞》',
        chapters: 6,
        sections: [2, 5, 3, 2, 4, 3]
      });
    });
  });
});