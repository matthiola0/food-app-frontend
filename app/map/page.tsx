// app/map/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { gql, useLazyQuery } from '@apollo/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import * as ngeohash from 'ngeohash';
import Link from 'next/link';

const NEARBY_RESTAURANTS_QUERY = gql`
  query NearbyRestaurants($geohashPrefix: String!) {
    nearbyRestaurants(geohashPrefix: $geohashPrefix) {
      restaurantId, name, address, lat, lng
    }
  }
`;

// 定義一個簡潔的地圖樣式
const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

// 一個內部元件，專門用來控制地圖
function MapController({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap(); // 取得地圖實例

  useEffect(() => {
    // 當 position 存在且 map 實例也存在時
    if (map && position) {
      // 手動將地圖中心移動到新位置
      map.setCenter(position);
    }
  }, [map, position]); // 監聽 map 和 position 的變化

  return null; // 這個元件不渲染任何東西
}

// 計算兩點間距離的輔助函式 (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon))/2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

export default function MapPage() {
  const { position, error: geoError } = useGeolocation();
  const [getNearbyRestaurants, { loading, data }] = useLazyQuery(NEARBY_RESTAURANTS_QUERY);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isListOpen, setIsListOpen] = useState(true); // 控制列表開合的 state

  // 用來存放加上距離並排序後的餐廳列表
  const sortedRestaurants = useMemo(() => {
    if (!position || !data?.nearbyRestaurants) return [];
    return data.nearbyRestaurants
      .map((res: any) => ({
        ...res,
        distance: getDistance(position.lat, position.lng, res.lat, res.lng),
      }))
      .sort((a: any, b: any) => a.distance - b.distance);
  }, [data, position]);

  useEffect(() => {
    if (position) {
      // Geohash 的精度，7 位約等於 150 公尺範圍
      const geohashPrefix = ngeohash.encode(position.lat, position.lng).substring(0, 7);
      getNearbyRestaurants({ variables: { geohashPrefix } });
    }
  }, [position, getNearbyRestaurants]);

  const apiKey = process.env.NEXT_PUBLIC_Maps_API_KEY;
  if (!apiKey) return <p>Google Maps API 金鑰未設定</p>;

  // 預設中心：新竹市政府
  const defaultMapCenter = position || { lat: 24.8047, lng: 120.9714 };

  return (
    <APIProvider apiKey={apiKey}>
      {/*使用相對定位，讓地圖和側邊欄可以疊放 */}
      <div className="relative h-screen w-screen">
        {/* 開合按鈕 */}
        <button 
          onClick={() => setIsListOpen(!isListOpen)}
          className="absolute top-4 left-4 z-20 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-transform"
          style={{ transform: isListOpen ? 'translateX(calc(min(33.333%, 320px) + 5px))' : 'translateX(0)' }} // 按鈕跟著移動
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transition-transform duration-300 ${isListOpen ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        
        {/* 可收合的左側列表欄 */}
        <div className={`absolute top-0 left-0 z-10 h-full w-full max-w-[320px] md:w-1/3 p-4 overflow-y-auto bg-white shadow-lg transition-transform duration-300 ease-in-out ${isListOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <h2 className="text-2xl font-bold mb-4 pt-12">附近的餐廳</h2>
          {loading && <p>正在尋找...</p>}
          {geoError && <p className="text-red-500">{geoError}</p>}
          <div className="space-y-3">
            {sortedRestaurants.map((res: any) => (
              <div 
                key={res.restaurantId} 
                onClick={() => {
                  setSelectedRestaurant(res);
                  setIsListOpen(false); // 手機版點擊後自動收合
                }}
                className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer border"
              >
                <h3 className="font-semibold text-lg">{res.name}</h3>
                <p className="text-sm text-gray-500">{res.address}</p>
                <p className="text-sm text-blue-600 font-bold mt-1">
                  距離約 {res.distance < 1 ? (res.distance * 1000).toFixed(0) + ' 公尺' : res.distance.toFixed(1) + ' 公里'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 地圖永遠在最底層 */}
        <div className="absolute inset-0 z-0">
          <Map
            defaultCenter={defaultMapCenter}
            defaultZoom={14}
            mapId="food-map-4"
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            styles={mapStyles}
          >
            <MapController position={position} />
            {position && <AdvancedMarker position={position} title="您的位置" />}
            {sortedRestaurants.map((res: any) => (
              <AdvancedMarker key={res.restaurantId} position={{ lat: res.lat, lng: res.lng }} onClick={() => setSelectedRestaurant(res)} title={res.name} />
            ))}
            {selectedRestaurant && (
              <InfoWindow position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }} onCloseClick={() => setSelectedRestaurant(null)}>
                <div>
                  <h3 className="font-bold">{selectedRestaurant.name}</h3>
                  <Link href={`/restaurants/${selectedRestaurant.restaurantId}`} className="text-blue-500 hover:underline">查看詳情</Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}