// app/login/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // 1. 引入 Google 登入相關工具
import { auth } from '@/lib/firebaseClient';
import { useMutation, gql } from '@apollo/client'; // 引入 useMutation 和 gql

// 2. 定義我們在後端新增的 Mutation
const ENSURE_USER_MUTATION = gql`
  mutation EnsureUser {
    ensureUser {
      uid
      email
      displayName
    }
  }
`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 3. 建立 mutation 的執行函式
  const [ensureUser] = useMutation(ENSURE_USER_MUTATION);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Email/密碼登入後，我們也應該呼叫 ensureUser，以防萬一
      await ensureUser();
      router.push('/');
    } catch (err: any) {
      setError('登入失敗，請檢查您的帳號或密碼。');
    } finally {
        setLoading(false);
    }
  };

  // 4. 這是 Google 登入的核心邏輯
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // 跳出 Google 登入視窗
      await signInWithPopup(auth, provider);
      // 登入成功後，呼叫後端 Mutation 來確保 Firestore 中有使用者資料
      await ensureUser();
      // 導向首頁
      router.push('/');
    } catch (err: any) {
      setError('Google 登入失敗，請稍後再試。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-sm mt-20">
      <h1 className="text-3xl font-bold text-center mb-6">登入</h1>
      {/* 5. Google 登入按鈕 */}
      <button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors mb-4 disabled:opacity-50"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#34A853" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FBBC05" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#E94235" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.22,0-9.651-3.355-11.127-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path><path fill="none" d="M0,0h48v48H0z"></path>
        </svg>
        使用 Google 帳號登入
      </button>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-sm">或使用 Email 登入</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4 mt-2">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded text-gray-900 bg-white" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded text-gray-900 bg-white" required />
        <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-2 rounded disabled:bg-green-300">
            {loading ? '登入中...' : '使用 Email 登入'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
      <p className="text-center mt-4">
          還沒有帳號？ <Link href="/register" className="text-green-500">點此註冊</Link>
      </p>
    </div>
  );
}