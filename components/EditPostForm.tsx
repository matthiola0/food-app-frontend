// components/EditPostForm.tsx
"use client";

import { gql, useMutation } from '@apollo/client';
import { useState, FormEvent } from 'react';

const UPDATE_POST = gql`
  mutation UpdatePost($postId: String!, $updatePostInput: UpdatePostInput!) {
    updatePost(postId: $postId, updatePostInput: $updatePostInput) {
      postId
      title
      content
      rating
    }
  }
`;

// 定義這個元件需要接收的 props (屬性)
interface EditPostFormProps {
  post: {
    postId: string;
    title: string;
    content: string;
    rating: number;
  };
  onCancel: () => void; // 當使用者點擊 "取消" 時要執行的函式
  onSaved: () => void;  // 當成功 "儲存" 後要執行的函式
}

export default function EditPostForm({ post, onCancel, onSaved }: EditPostFormProps) {
  // 使用 post 的現有資料來當作表單的初始值
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [rating, setRating] = useState(post.rating);

  const [updatePost, { loading }] = useMutation(UPDATE_POST, {
    onCompleted: () => {
      onSaved(); // 通知父元件（page.tsx）儲存成功
    },
    onError: (error) => {
      alert(`更新失敗: ${error.message}`);
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const updatePostInput = { title, content, rating: Number(rating) };
    updatePost({ variables: { postId: post.postId, updatePostInput } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md bg-gray-50 animate-in fade-in duration-300">
      <div>
        <label className="block text-sm font-medium text-gray-700">標題</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">內容</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white h-24" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">評分: <span className="font-bold">{rating}</span></label>
        <input type="range" min="1" max="5" step="0.5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">取消</button>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-blue-300">
          {loading ? '儲存中...' : '儲存'}
        </button>
      </div>
    </form>
  );
}