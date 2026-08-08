import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

function generateNonce(length = 32): string {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values).map(v => charset[v % charset.length]).join('');
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Native Sign in with Apple via Supabase. Uses a hashed nonce (sent to Apple)
 * and the raw nonce (sent to Supabase) so the identity token verifies.
 * Returns null on success, an error message string on failure, or 'cancelled'.
 */
export async function signInWithApple(): Promise<string | null | 'cancelled'> {
  try {
    const rawNonce = generateNonce();
    const hashedNonce = await sha256(rawNonce);

    const result = await SignInWithApple.authorize({
      clientId: 'com.streamrotate.app',
      redirectURI: 'com.streamrotate.app://app',
      scopes: 'email name',
      nonce: hashedNonce,
    });
    const { identityToken } = result.response;
    if (!identityToken) return 'Apple sign in failed — no identity token';

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
      nonce: rawNonce,
    });
    if (error) return `Apple sign in failed: ${error.message}`;
    return null;
  } catch (e: any) {
    // User dismissed the native sheet — not an error worth showing.
    const code = String(e?.code ?? '');
    if (code === 'ASAuthorizationErrorCanceled' || code === '1001') return 'cancelled';
    // Surface the real native error code/message so failures are diagnosable
    // (App Review environments sometimes fail native Sign in with Apple).
    // eslint-disable-next-line no-console
    console.error('Apple sign in error', e);
    const detail = e?.message || code || 'unknown error';
    return `Apple sign in failed: ${detail}`;
  }
}

/**
 * Google OAuth that works both in the browser and inside the iOS app
 * (via the in-app browser). Returns null on success or an error message.
 */
export async function signInWithGoogle(): Promise<string | null> {
  const redirectTo = Capacitor.isNativePlatform()
    ? 'com.streamrotate.app://app'
    : `${window.location.origin}/app`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Capacitor.isNativePlatform(),
    },
  });
  if (error) return error.message;
  if (Capacitor.isNativePlatform() && data?.url) {
    await Browser.open({ url: data.url, windowName: '_self' });
  }
  return null;
}
