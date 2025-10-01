import { Response } from 'express';
import { IApiResponse, IPaginationResponse } from '../types/common.types';

// 成功响应
export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = '操作成功',
  statusCode: number = 200
): Response => {
  const response: IApiResponse<T> = {
    success: true,
    message,
    data
  };
  return res.status(statusCode).json(response);
};

// 错误响应
export const errorResponse = (
  res: Response,
  message: string = '操作失败',
  statusCode: number = 400,
  error?: string
): Response => {
  const response: IApiResponse = {
    success: false,
    message,
    error
  };
  return res.status(statusCode).json(response);
};

// 分页响应
export const paginationResponse = <T>(
  res: Response,
  items: T[],
  currentPage: number,
  totalItems: number,
  itemsPerPage: number,
  message: string = '查询成功'
): Response => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginationData: IPaginationResponse<T> = {
    items,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    }
  };
  
  return successResponse(res, paginationData, message);
};