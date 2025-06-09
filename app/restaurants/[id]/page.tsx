// app/restaurants/[id]/page.tsx
"use client";

import { gql, useQuery, useMutation } from '@apollo/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useState, ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import EditPostForm from '@/components/EditPostForm';
import ImageGrid from '@/components/ImageGrid';

const GET_RESTAURANT_DETAILS = gql`
  query GetRestaurantDetails($id: String!) {
    restaurant(id: $id) {
      restaurantId
      name
      address
    }
    postsByRestaurant(restaurantId: $id) {
      postId
      title
      content
      rating
      authorId
      imageUrls
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($postId: String!) {
    deletePost(postId: $postId)
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!, $rating: Float!, $restaurantId: String!, $imageUrls: [String]) {
    createPost(title: $title, content: $content, rating: $rating, restaurantId: $restaurantId, imageUrls: $imageUrls)
  }
`;

export default function RestaurantPage() {
  const params = useParams();
  const id = params.id;
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(GET_RESTAURANT_DETAILS, {
    variables: { id: String(id) },
    skip: typeof id !== 'string',
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [files, setFiles] = useState<FileList | null>(null); //【修改】
  const [isUploading, setIsUploading] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [createPost, { loading: creatingPost }] = useMutation(CREATE_POST, {
    onCompleted: () => {
      setTitle('');
      setContent('');
      setRating(5);
      setFiles(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      refetch();
      alert('食記發表成功！');
    },
    onError: (err) => { alert(`發表失敗: ${err.message}`); }
  });

  const [deletePost] = useMutation(DELETE_POST, {
    onCompleted: () => {
      refetch();
      alert('食記已刪除！');
    },
    onError: (error) => {
      alert(`刪除失敗: ${error.message}`);
    }
  });

  const handleDelete = (postId: string) => {
    if (window.confirm('您確定要刪除這篇食記嗎？')) {
      deletePost({ variables: { postId } });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files); //【修改】
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) { alert('請先登入！'); return; }

    let imageUrls: string[] = [];

    //【修改】上傳多個檔案的邏輯
    if (files && files.length > 0) {
      setIsUploading(true);

      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('http://localhost:3000/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
        return response.json();
      });

      try {
        const uploadResults = await Promise.all(uploadPromises);
        console.log('從 /upload API 收到的原始結果:', uploadResults); 

        imageUrls = uploadResults.map(result => result.imageUrls);
        console.log('準備要傳給 GraphQL 的 URL 陣列:', imageUrls);

      } catch (uploadError) {
        console.error(uploadError);
        alert('部分或全部圖片上傳失敗！');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    await createPost({ variables: { title, content, rating: Number(rating), restaurantId: String(id), imageUrls } });
  };

  if (loading) return <p className="text-center mt-8 text-gray-500">讀取中...</p>;
  if (error) return <p className="text-center mt-8 text-red-500">錯誤: {error.message}</p>;
  const { restaurant, postsByRestaurant } = data || {};

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Link href="/" className="text-blue-500 hover:underline mb-8 inline-block">
        &larr; 返回首頁
      </Link>
      
      {restaurant && (
        <div className="my-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800">{restaurant.name}</h1>
          <p className="text-lg text-gray-600 mt-2">{restaurant.address}</p>
        </div>
      )}

      {user ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">發表您的食記</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="食記標題" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white" required />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="食記內容..." className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white" required />
            <div>
              <label className="block mb-1 text-gray-600">評分: <span className="font-bold text-green-600">{rating}</span></label>
              <input type="range" min="1" max="5" step="0.5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">上傳圖片 (可多選)</label>
              <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} multiple className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            <button type="submit" disabled={isUploading || creatingPost} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-green-300">
              {isUploading ? '圖片上傳中...' : (creatingPost ? '發表中...' : '發表')}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-8 text-center">
          <p>請先<Link href="/login" className="font-bold underline mx-1">登入</Link>才能發表食記！</p>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-3xl font-bold border-b pb-2 text-gray-800">大家怎麼說</h2>
        {postsByRestaurant && postsByRestaurant.map((post: any) => (
          <div key={post.postId} className="bg-white p-6 rounded-lg shadow-md">
            {editingPostId === post.postId ? (
              <EditPostForm post={post} onCancel={() => setEditingPostId(null)} onSaved={() => { setEditingPostId(null); refetch(); }} />
            ) : (
              <>
                <div className="mb-4">
                  <ImageGrid imageUrls={post.imageUrls || []} />
                </div>
                <div className="relative">
                  {user && user.uid === post.authorId && (
                    <div className="absolute top-0 right-0 flex space-x-2">
                      <button onClick={() => setEditingPostId(post.postId)} className="text-gray-500 hover:text-blue-700">編輯</button>
                      <button onClick={() => handleDelete(post.postId)} className="text-gray-500 hover:text-red-700">刪除</button>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 pr-20">{post.title}</h3>
                    <p className="text-lg font-bold text-yellow-500">★ {post.rating}</p>
                  </div>
                  <p className="text-gray-700 mt-2">{post.content}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}