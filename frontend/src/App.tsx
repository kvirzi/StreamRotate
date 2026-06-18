import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AppPage } from './pages/app/index';
import { Privacy } from './pages/Privacy';
import { Support } from './pages/Support';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
