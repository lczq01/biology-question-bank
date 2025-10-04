import mongoose, { Schema, Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { IUser, UserRole, UserStatus } from '../types/user.types';

// 扩展Document接口
export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    grade?: string;
    class?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 用户Schema定义
const UserSchema = new Schema<IUserDocument>({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符'],
    match: [/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线']
  },
  
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false // 默认查询时不返回密码
  },
  
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT,
    required: true
  },
  
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    required: true
  },
  
  profile: {
    firstName: {
      type: String,
      required: [true, '姓名不能为空'],
      trim: true,
      maxlength: [10, '姓名最多10个字符']
    },
    lastName: {
      type: String,
      required: [true, '姓氏不能为空'],
      trim: true,
      maxlength: [10, '姓氏最多10个字符']
    },
    avatar: {
      type: String,
      default: null
    },
    grade: {
      type: String,
      trim: true,
      maxlength: [10, '年级最多10个字符']
    },
    class: {
      type: String,
      trim: true,
      maxlength: [10, '班级最多10个字符']
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      const { password, ...rest } = ret;
      return rest;
    }
  }
});

// 创建索引
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

// 密码加密中间件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 密码比较方法
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 创建模型
export const User = mongoose.model<IUserDocument>('User', UserSchema);