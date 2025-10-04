import { FC } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ExamBasketProvider } from './contexts/ExamBasketContext';
import AppRoutes from './components/AppRoutes';

const App: FC = () => {
  return (
    <AuthProvider>
      <ExamBasketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ExamBasketProvider>
    </AuthProvider>
  );
};

export default App;