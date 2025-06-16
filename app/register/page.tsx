"use client";

import { useState, FormEvent } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $displayName: String!) {
    register(email: $email, password: $password, displayName: $displayName) {
      uid
      email
      displayName
      role
    }
  }
`;

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 管理顯示名稱的輸入
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [register, { loading }] = useMutation(REGISTER_MUTATION);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ variables: { email, password, displayName } });
      alert('註冊成功！將為您導向登入頁面。');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto max-w-sm mt-20">
        <h1 className="text-3xl font-bold text-center mb-6">註冊帳號</h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-4">
            
            {/* 顯示名稱的輸入框 */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">顯示名稱</label>
              <input 
                id="displayName"
                type="text" 
                placeholder="您希望別人怎麼稱呼您" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                className="mt-1 w-full px-3 py-2 border rounded-md text-gray-900 bg-white" 
                required 
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">電子郵件</label>
              <input id="email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded text-gray-900 bg-white" required />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">密碼</label>
              <input id="password" type="password" placeholder="至少6位數" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded text-gray-900 bg-white" required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 rounded disabled:bg-blue-300">
                {loading ? '註冊中...' : '註冊'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
        <p className="text-center mt-4">
            已經有帳號了？ <Link href="/login" className="text-blue-500">點此登入</Link>
        </p>
    </div>
  );
}
