"use client";

import { gql, useQuery, useMutation } from '@apollo/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useState, ChangeEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import EditPostForm from '@/components/EditPostForm';
import ImageGrid from '@/components/ImageGrid';

// --- Type Definitions ---
type MenuItemType = {
  name: string;
  price: number;
  description: string;
  __typename?: string; // This property is added by Apollo Client for caching
};


// --- GraphQL Definitions ---

// This new query fetches the current user's role
const GET_CURRENT_USER_ROLE = gql`
  query GetCurrentUserRole {
    # We use the ensureUser mutation as a way to get the current user's profile
    # It's protected by AuthGuard and returns the user from the context
    ensureUser {
      uid
      role
    }
  }
`;

const GET_RESTAURANT_DETAILS = gql`
  query GetRestaurantDetails($id: String!) {
    restaurant(id: $id) {
      restaurantId
      name
      address
      info
      menu {
        name
        price
        description
      }
      topHashtags {
        tag
        count
      }
    }
    postsByRestaurant(restaurantId: $id) {
      postId
      title
      content
      rating
      hashtags
      imageUrls
      author {
        uid
        displayName
      }
    }
  }
`;

const UPDATE_RESTAURANT = gql`
  mutation UpdateRestaurant($id: String!, $input: UpdateRestaurantInput!) {
    updateRestaurant(id: $id, input: $input) {
      info
      menu {
        name
        price
        description
      }
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost(
      $title: String!, $content: String!, $rating: Float!, 
      $restaurantId: String!, $imageUrls: [String], $hashtags: [String]
  ) {
    createPost(
      title: $title, content: $content, rating: $rating, 
      restaurantId: $restaurantId, imageUrls: $imageUrls, hashtags: $hashtags
    )
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($postId: String!) {
    deletePost(postId: $postId)
  }
`;


export default function RestaurantPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth(); // We only need the basic user object now

  // --- State Management ---
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [files, setFiles] = useState<FileList | null>(null);
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [info, setInfo] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);

  // --- Data Fetching & Mutations ---

  // Fetches the main restaurant and post data
  const { data, loading, error, refetch } = useQuery(GET_RESTAURANT_DETAILS, {
    variables: { id },
    skip: !id,
    onCompleted: (d) => {
      if (d?.restaurant) {
        setInfo(d.restaurant.info || '');
        // Ensure menu items are clean objects before setting state
        setMenuItems(d.restaurant.menu?.map((item: MenuItemType) => ({...item})) || []);
      }
    }
  });
  
  // Fetches the current user's role to determine if they are an admin
  const { data: userData } = useQuery(GET_CURRENT_USER_ROLE, {
    skip: !user, // Only run this query if the user is logged in
  });
  const isAdmin = userData?.ensureUser?.role === 'ADMIN';

  const [createPost, { loading: creatingPost }] = useMutation(CREATE_POST, {
    onCompleted: () => {
      setTitle('');
      setContent('');
      setRating(5);
      setFiles(null);
      setTags('');
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      refetch();
      alert('食記發表成功！');
    },
    onError: (err) => { alert(`發表失敗: ${err.message}`); }
  });

  const [deletePost] = useMutation(DELETE_POST, {
    onCompleted: () => { refetch(); alert('食記已刪除！'); },
    onError: (err) => { alert(`刪除失敗: ${err.message}`); }
  });

  const [updateRestaurant, { loading: updatingRestaurant }] = useMutation(UPDATE_RESTAURANT, {
    onCompleted: () => {
        setIsEditingInfo(false);
        alert('餐廳資訊已更新！');
        refetch();
    },
    onError: (err) => { alert(`更新失敗: ${err.message}`); }
  });

  // --- Event Handlers ---

  const handleDeletePost = (postId: string) => {
    if (window.confirm('您確定要刪除這篇食記嗎？')) {
      deletePost({ variables: { postId } });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };
  
  const handleCreatePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) { alert('請先登入！'); return; }

    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      setIsUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('http://localhost:3000/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
        return response.json();
      });

      try {
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(result => result.imageUrl).filter(Boolean);
      } catch (uploadError) {
        console.error(uploadError);
        alert('部分或全部圖片上傳失敗！');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const hashtags = [...new Set(tags.split(/[\s,，]+/).filter(tag => tag.trim() !== ''))];
    
    await createPost({ 
      variables: { 
        title, 
        content, 
        rating: Number(rating), 
        restaurantId: id, 
        imageUrls, 
        hashtags
      } 
    });
  };

  const handleInfoSave = () => {
    const validMenuItems = menuItems.filter(item => item.name.trim() && item.price > 0);
    const input = { info, menu: validMenuItems.map(({ __typename, ...item }) => item) };
    updateRestaurant({ variables: { id, input } });
  };

  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { name: '', price: 0, description: '' }]);
  };

  // Add explicit types for parameters
  const handleMenuChange = (index: number, field: string, value: string | number) => {
    const updatedMenu = [...menuItems];
    const itemToUpdate = { ...updatedMenu[index], [field]: value };
    updatedMenu[index] = itemToUpdate;
    setMenuItems(updatedMenu);
  };

  const handleRemoveMenuItem = (index: number) => {
    const updatedMenu = menuItems.filter((_, i) => i !== index);
    setMenuItems(updatedMenu);
  };
  
  // --- Render Logic ---

  if (loading) return <p className="text-center mt-8 text-gray-500">讀取中...</p>;
  if (error) return <p className="text-center mt-8 text-red-500">錯誤: {error.message}</p>;

  const { restaurant, postsByRestaurant } = data || {};

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Link href="/" className="text-blue-500 hover:underline mb-8 inline-block">&larr; 返回首頁</Link>
      
      {restaurant && (
        <div className="my-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800">{restaurant.name}</h1>
            <p className="text-lg text-gray-600 mt-2">{restaurant.address}</p>
          </div>

          {restaurant.topHashtags?.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {restaurant.topHashtags.map((ht: any) => (
                <span key={ht.tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"># {ht.tag}</span>
              ))}
            </div>
          )}
          
          <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-inner">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-700">餐廳資訊</h3>
                {isAdmin && !isEditingInfo && (
                    <button onClick={() => setIsEditingInfo(true)} className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300">編輯</button>
                )}
            </div>

            {isEditingInfo ? (
              <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">簡介</label>
                    <textarea value={info} onChange={e => setInfo(e.target.value)} className="w-full h-24 p-2 border rounded-md bg-white text-gray-900"></textarea>
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-700 mb-2">菜單</h4>
                    <div className="space-y-4">
                        {menuItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <input type="text" placeholder="品項" value={item.name} onChange={e => handleMenuChange(index, 'name', e.target.value)} className="col-span-4 p-2 border rounded-md bg-white text-gray-900"/>
                                <input type="number" placeholder="價格" value={item.price} onChange={e => handleMenuChange(index, 'price', Number(e.target.value))} className="col-span-2 p-2 border rounded-md bg-white text-gray-900"/>
                                <input type="text" placeholder="描述(可選)" value={item.description} onChange={e => handleMenuChange(index, 'description', e.target.value)} className="col-span-5 p-2 border rounded-md bg-white text-gray-900"/>
                                <button onClick={() => handleRemoveMenuItem(index)} className="col-span-1 text-red-500 hover:text-red-700">✕</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddMenuItem} className="mt-4 text-sm text-blue-600 hover:underline">+ 新增菜單項目</button>
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsEditingInfo(false)} className="bg-gray-200 px-4 py-2 rounded-md">取消</button>
                    <button onClick={handleInfoSave} disabled={updatingRestaurant} className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-blue-300">
                        {updatingRestaurant ? '儲存中...' : '儲存資訊'}
                    </button>
                </div>
              </div>
            ) : (
                <>
                    <p className="text-gray-700 whitespace-pre-wrap">{restaurant.info || '店家尚未提供詳細資訊。'}</p>
                    {restaurant.menu?.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-bold text-gray-700 mb-2">菜單</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {restaurant.menu.map((item: MenuItemType, index: number) => (
                                    <li key={index} className="text-gray-800">
                                        <span className="font-semibold">{item.name}</span> - ${item.price}
                                        {item.description && <span className="text-sm text-gray-500 ml-2">({item.description})</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
          </div>
        </div>
      )}

      {user ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">發表您的食記</h2>
            <form onSubmit={handleCreatePostSubmit} className="space-y-4">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="食記標題" className="w-full px-3 py-2 border rounded-md bg-white text-gray-900" required />
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="食記內容..." className="w-full px-3 py-2 border rounded-md h-24 bg-white text-gray-900" required />
              <div>
                <label className="block mb-1">評分: <span className="font-bold">{rating}</span></label>
                <input type="range" min="1" max="5" step="0.5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium">#標籤 (用空格或逗號分隔)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="拉麵 宵夜 濃郁" className="mt-1 w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
              </div>
              <div>
                <label className="block text-sm font-medium">上傳圖片 (可多選)</label>
                <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} multiple className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
              <button type="submit" disabled={isUploading || creatingPost} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-green-300">
                {isUploading ? '圖片上傳中...' : (creatingPost ? '發表中...' : '發表')}
              </button>
            </form>
        </div>
      ) : (
        <div className="bg-yellow-100 text-center p-4 rounded-md">
          <p>請先<Link href="/login" className="font-bold underline">登入</Link>才能發表食記！</p>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-3xl font-bold border-b pb-2 text-gray-800">大家怎麼說</h2>
        {postsByRestaurant?.map((post: any) => (
          <div key={post.postId} className="bg-white p-6 rounded-lg shadow-md">
            {editingPostId === post.postId ? (
              <EditPostForm post={post} onCancel={() => setEditingPostId(null)} onSaved={() => { setEditingPostId(null); refetch(); }} />
            ) : (
              <>
                <div className="mb-4"><ImageGrid imageUrls={post.imageUrls || []} /></div>
                <div className="relative">
                  {user && user.uid === post.author.uid && (
                    <div className="absolute top-0 right-0 flex space-x-2">
                      <button onClick={() => setEditingPostId(post.postId)} className="text-sm text-gray-500 hover:text-blue-700">編輯</button>
                      <button onClick={() => handleDeletePost(post.postId)} className="text-sm text-gray-500 hover:text-red-700">刪除</button>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{post.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">由 {post.author.displayName || '匿名用戶'} 評論</p>
                    </div>
                    <p className="text-lg font-bold text-yellow-500 flex-shrink-0 ml-4">★ {post.rating}</p>
                  </div>
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{post.content}</p>
                  {post.hashtags?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                          {post.hashtags.map((tag:string) => (
                              <span key={tag} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">#{tag}</span>
                          ))}
                      </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
