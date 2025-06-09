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
      restaurantId
      name
      address
      lat
      lng
    }
  }
`;

// 定義一個簡潔的地圖樣式
const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

// 計算兩點間距離的輔助函式 (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // 地球半徑 (公里)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    0.5 - Math.cos(dLat)/2 + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function MapPage() {
  const { position, error: geoError } = useGeolocation();
  const [getNearbyRestaurants, { loading, data }] = useLazyQuery(NEARBY_RESTAURANTS_QUERY);
  
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  
  // 用來存放加上距離並排序後的餐廳列表
  const sortedRestaurants = useMemo(() => {
    if (!position || !data?.nearbyRestaurants) return [];
    
    return data.nearbyRestaurants
      .map((res: any) => ({
        ...res,
        // 計算並加上距離屬性
        distance: getDistance(position.lat, position.lng, res.lat, res.lng),
      }))
      .sort((a: any, b: any) => a.distance - b.distance); // 根據距離排序
  }, [data, position]);

  useEffect(() => {
    if (position) {
      const geohashPrefix = ngeohash.encode(position.lat, position.lng);
      getNearbyRestaurants({ variables: { geohashPrefix } });
    }
  }, [position, getNearbyRestaurants]);

  const apiKey = process.env.NEXT_PUBLIC_Maps_API_KEY;
  if (!apiKey) return <p>Google Maps API 金鑰未設定</p>;

  return (
    <APIProvider apiKey={apiKey}>
      {/*建立兩欄式排版 */}
      <div className="flex h-screen">
        {/* 左側列表欄 */}
        <div className="w-full md:w-1/3 lg:w-1/4 p-4 overflow-y-auto bg-white shadow-lg">
          <h2 className="text-2xl font-bold mb-4">附近的餐廳</h2>
          {loading && <p>正在尋找...</p>}
          {geoError && <p className="text-red-500">{geoError}</p>}
          <div className="space-y-3">
            {sortedRestaurants.map((res: any) => (
              <div 
                key={res.restaurantId} 
                onClick={() => setSelectedRestaurant(res)}
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

        {/* 右側地圖欄 */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          <Map
            center={position || { lat: 24.8047, lng: 120.9714 }}
            zoom={15}
            mapId="food-map-2"
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            styles={mapStyles} // 套用樣式
          >
            {position && <AdvancedMarker position={position} title="您的位置" />}
            {sortedRestaurants.map((res: any) => (
              <AdvancedMarker
                key={res.restaurantId}
                position={{ lat: res.lat, lng: res.lng }}
                onClick={() => setSelectedRestaurant(res)}
                title={res.name}
              />
            ))}
            {selectedRestaurant && (
              <InfoWindow
                position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
                onCloseClick={() => setSelectedRestaurant(null)}
              >
                <div>
                  <h3 className="font-bold">{selectedRestaurant.name}</h3>
                  <Link href={`/restaurants/${selectedRestaurant.restaurantId}`} className="text-blue-500 hover:underline">
                    查看詳情
                  </Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}