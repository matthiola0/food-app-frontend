// app/register/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      uid
      email
    }
  }
`;

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [register, { loading }] = useMutation(REGISTER_MUTATION);
  const router = useRouter();
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ variables: { email, password } });
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
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded text-gray-900" required />
            <input type="password" placeholder="Password (至少6位數)" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded text-gray-900" required />
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