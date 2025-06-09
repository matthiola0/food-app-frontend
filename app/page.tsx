// app/page.tsx
"use client";

import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';

const GET_ALL_RESTAURANTS = gql`
  query GetAllRestaurants {
    restaurants {
      restaurantId
      name
      address
    }
  }
`;

export default function HomePage() {
  const { data, loading, error } = useQuery(GET_ALL_RESTAURANTS);
  const [searchTerm, setSearchTerm] = useState('');

  // 客戶端簡易搜尋邏輯
  const filteredRestaurants = data?.restaurants.filter((restaurant: any) =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center my-8">
        <h1 className="text-4xl font-bold text-gray-800">探索美食，從這裡開始</h1>
        <p className="text-lg text-gray-500 mt-2">尋找您附近的下一頓美味</p>
      </div>

      {/* 功能按鈕區 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <Link href="/add-restaurant" className="block text-center bg-blue-500 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-600 transition-all text-lg">
          ＋ 新增餐廳
        </Link>
        <Link href="/map" className="block text-center bg-green-500 text-white font-bold py-4 px-6 rounded-lg hover:bg-green-600 transition-all text-lg">
          🗺️ 尋找附近餐廳
        </Link>
      </div>

      {/* 搜尋框 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="搜尋餐廳名稱或地址..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 餐廳列表 */}
      {loading && <p className="text-center">讀取中...</p>}
      {error && <p className="text-center text-red-500">讀取餐廳失敗: {error.message}</p>}
      <div className="space-y-4">
        {filteredRestaurants && filteredRestaurants.map((restaurant: any) => (
          <Link href={`/restaurants/${restaurant.restaurantId}`} key={restaurant.restaurantId} className="block bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-800">{restaurant.name}</h3>
            <p className="text-gray-600 mt-1">{restaurant.address}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}