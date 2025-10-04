import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// 简化的知识点接口
export interface IKnowledgePoint extends Document {
  _id: Types.ObjectId;          // 明确声明_id类型
  name: string;                 // 知识点名称
  description: string;          // 知识点描述（支持富文本HTML）
  chapter: string;              // 章节
  customId?: string;            // 自定义ID（如：bx01-01-01-001）
  parentId?: string;            // 父知识点ID（字符串类型，用于构建知识树）
  relatedIds: string[];         // 相关知识点ID数组（字符串类型）
  createdAt: Date;
  updatedAt: Date;
}

// 知识点模型静态方法接口
interface IKnowledgePointModel extends Model<IKnowledgePoint> {
  findByFilters(filters: any): Promise<IKnowledgePoint[]>;
  findByCustomId(customId: string): Promise<IKnowledgePoint | null>;
}

// 简化的知识点Schema
const KnowledgePointSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, '知识点名称不能为空'],
    trim: true,
    maxlength: [200, '知识点名称不能超过200个字符']
  },
  description: {
    type: String,
    required: [true, '知识点描述不能为空'],
    trim: true,
    maxlength: [10000, '知识点描述不能超过10000个字符']
  },
  chapter: {
    type: String,
    required: [true, '章节不能为空'],
    trim: true,
    maxlength: [100, '章节名称不能超过100个字符']
  },
  customId: {
    type: String,
    trim: true,
    maxlength: [50, '自定义ID不能超过50个字符'],
    match: [/^[a-zA-Z0-9\-_]+$/, '自定义ID只能包含字母、数字、连字符和下划线']
  },
  parentId: {
    type: String,
    default: '',
    trim: true
  },
  relatedIds: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引优化
KnowledgePointSchema.index({ name: 1 });
KnowledgePointSchema.index({ chapter: 1 });
KnowledgePointSchema.index({ customId: 1 }, { unique: true, sparse: true });
KnowledgePointSchema.index({ parentId: 1 });
KnowledgePointSchema.index({ createdAt: -1 });

// 虚拟字段：格式化创建时间
KnowledgePointSchema.virtual('formattedCreatedAt').get(function(this: IKnowledgePoint & Document) {
  return this.createdAt ? this.createdAt.toLocaleDateString('zh-CN') : '';
});

// 虚拟字段：格式化更新时间
KnowledgePointSchema.virtual('formattedUpdatedAt').get(function(this: IKnowledgePoint & Document) {
  return this.updatedAt ? this.updatedAt.toLocaleDateString('zh-CN') : '';
});

// 静态方法：按条件查询知识点
KnowledgePointSchema.statics.findByFilters = function(filters: any) {
  const query: any = {};
  
  if (filters.chapter) {
    query.chapter = { $regex: filters.chapter, $options: 'i' };
  }
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { customId: { $regex: filters.search, $options: 'i' } }
    ];
  }
  if (filters.parentId) {
    query.parentId = filters.parentId;
  }
  if (filters.customId) {
    query.customId = filters.customId;
  }
  
  return this.find(query);
};

// 静态方法：通过自定义ID查找知识点
KnowledgePointSchema.statics.findByCustomId = function(customId: string) {
  return this.findOne({ customId: customId });
};

const KnowledgePoint = mongoose.model<IKnowledgePoint, IKnowledgePointModel>('KnowledgePoint', KnowledgePointSchema);

export default KnowledgePoint;
export { KnowledgePoint, IKnowledgePointModel };