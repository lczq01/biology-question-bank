// 知识点类型定义，与后端模型保持一致

export interface KnowledgePoint {
  _id: string;
  name: string;                 // 知识点名称
  description: string;          // 知识点描述
  chapter: string;              // 章节
  customId?: string;            // 自定义ID
  parentId?: string;            // 父知识点ID
  relatedIds: string[];         // 相关知识点ID数组
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgePointFormData {
  name: string;
  description: string;
  chapter: string;
  customId?: string;            // 自定义ID
  parentId: string;
  relatedIds: string[];
}

export interface FormErrors {
  name?: string;
  description?: string;
  chapter?: string;
  customId?: string;
}

export interface KnowledgePointFilters {
  search: string;
  chapter: string;
  customId: string;
}

export interface KnowledgePointPagination {
  page: number;
  limit: number;
  total: number;
}