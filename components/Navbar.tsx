"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebaseClient";
import Link from "next/link";
import { signOut } from "firebase/auth";

export default function Navbar() {
  // 只從 useAuth 中取得最基礎的 user 物件。
  const { user } = useAuth(); 

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* 左側 Logo */}
        <Link href="/" className="font-bold text-xl text-blue-600">
          美食探索家
        </Link>

        {/* 右側所有項目的容器 */}
        <div className="flex items-center space-x-4">
          
          <Link href="/map" className="text-gray-600 hover:text-blue-600 transition-colors">
            地圖模式
          </Link>

          {user && (
            <Link href="/add-restaurant" className="text-gray-600 hover:text-blue-600 transition-colors">
              新增餐廳
            </Link>
          )}
          
          {/* 分隔線 */}
          <div className="border-l border-gray-300 h-6"></div>

          {user ? (
            // 優先顯示 displayName，如果沒有就顯示 email
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm hidden md:block">
                {user.displayName || user.email}
              </span>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                登出
              </button>
            </div>
          ) : (
            // 未登入狀態
            <div className="space-x-2">
              <Link href="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-semibold">登入</Link>
              <Link href="/register" className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-600 transition-colors">註冊</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
