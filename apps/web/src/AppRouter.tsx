import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthPage from './features/auth/AuthPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}
