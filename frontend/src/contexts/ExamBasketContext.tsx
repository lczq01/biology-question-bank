import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Question {
  id: string;
  _id?: string; // 支持MongoDB的_id字段
  content: string;
  type: string;
  difficulty: string;
  chapter: string;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  answer: string | string[];
  explanation?: string;
  image?: string;
  createdAt: string;
}

interface BasketItem {
  question: Question;
  points: number;
}

interface BasketState {
  examBasket: BasketItem[];
}

interface ExamBasketContextType {
  basketState: BasketState;
  addToBasket: (question: Question) => void;
  removeFromBasket: (questionId: string) => void;
  updatePoints: (questionId: string, points: number) => void;
  clearBasket: () => void;
  getTotalPoints: () => number;
  getItemCount: () => number;
  isInBasket: (questionId: string) => boolean;
}

const ExamBasketContext = createContext<ExamBasketContextType | undefined>(undefined);

export const useExamBasket = () => {
  const context = useContext(ExamBasketContext);
  if (!context) {
    throw new Error('useExamBasket must be used within an ExamBasketProvider');
  }
  return context;
};

interface ExamBasketProviderProps {
  children: ReactNode;
}

export const ExamBasketProvider: React.FC<ExamBasketProviderProps> = ({ children }) => {
  const [basketState, setBasketState] = useState<BasketState>({
    examBasket: []
  });

  // 获取当前活动的试题篮
  const getCurrentBasket = () => {
    return basketState.examBasket;
  };

  const addToBasket = (question: Question) => {
    setBasketState(prev => {
      // 检查是否已存在
      if (prev.examBasket.some(item => item.question.id === question.id)) {
        return prev;
      }
      
      // 根据题型设置默认分值
      const defaultPoints = getDefaultPoints(question.type);
      const newItem = { question, points: defaultPoints };
      
      return {
        ...prev,
        examBasket: [...prev.examBasket, newItem]
      };
    });
  };

  const removeFromBasket = (questionId: string) => {
    setBasketState(prev => ({
      ...prev,
      examBasket: getCurrentBasket().filter(item => item.question.id !== questionId)
    }));
  };

  const updatePoints = (questionId: string, points: number) => {
    setBasketState(prev => ({
      ...prev,
      examBasket: getCurrentBasket().map(item => 
        item.question.id === questionId 
          ? { ...item, points } 
          : item
      )
    }));
  };

  const clearBasket = () => {
    setBasketState(prev => ({
      ...prev,
      examBasket: []
    }));
  };

  const getTotalPoints = () => {
    const basket = getCurrentBasket();
    return basket.reduce((total, item) => total + item.points, 0);
  };

  const getItemCount = () => {
    const basket = getCurrentBasket();
    return basket.length;
  };

  const isInBasket = (questionId: string) => {
    const basket = getCurrentBasket();
    return basket.some(item => item.question.id === questionId);
  };

  const getDefaultPoints = (type: string) => {
    const pointsMap: { [key: string]: number } = {
      'single_choice': 2,
      'multiple_choice': 3,
      'true_false': 1,
      'fill_blank': 2,
      'essay': 5
    };
    return pointsMap[type] || 2;
  };

  const value: ExamBasketContextType = {
    basketState,
    addToBasket,
    removeFromBasket,
    updatePoints,
    clearBasket,
    getTotalPoints,
    getItemCount,
    isInBasket
  };

  return (
    <ExamBasketContext.Provider value={value}>
      {children}
    </ExamBasketContext.Provider>
  );
};