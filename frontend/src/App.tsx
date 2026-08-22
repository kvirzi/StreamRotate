import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './lib/supabase';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AppPage } from './pages/app/index';
import { Privacy } from './pages/Privacy';
import { Support } from './pages/Support';
import { Terms } from './pages/Terms';

// Handles the OAuth deep-link redirect on native: after Google login lands on
// com.streamrotate.app://app, complete the session, close the in-app browser,
// and navigate into the native app (so users don't get stuck in Safari view).
function DeepLinkHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('com.streamrotate.app://')) return;
      try {
        // PKCE flow: ?code=... ; implicit flow: #access_token=...&refresh_token=...
        const query = url.split('?')[1]?.split('#')[0];
        const hash = url.split('#')[1];
        const code = query && new URLSearchParams(query).get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (hash) {
          const h = new URLSearchParams(hash);
          const access_token = h.get('access_token');
          const refresh_token = h.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      } catch { /* ignore — session may already be set */ }
      await Browser.close().catch(() => {});
      navigate('/app', { replace: true });
    });
    return () => { sub.then(s => s.remove()); };
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <DeepLinkHandler />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
