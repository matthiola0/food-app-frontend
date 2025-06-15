// app/map/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useLoadScript } from '@react-google-maps/api';
import { gql, useLazyQuery } from '@apollo/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import * as ngeohash from 'ngeohash';
import Link from 'next/link';
import LocationSearchBox from '@/components/LocationSearchBox'; 

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

// 計算兩點間距離的輔助函式 (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon))/2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

function MapController({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && position) {
      map.panTo(position);
    }
  }, [map, position]);
  return null;
}


function MapView() {
  const { position: userGpsPosition, error: geoError } = useGeolocation();
  const [searchPosition, setSearchPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [getNearbyRestaurants, { loading, data }] = useLazyQuery(NEARBY_RESTAURANTS_QUERY);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isListOpen, setIsListOpen] = useState(true);

  useEffect(() => {
    if (userGpsPosition && !searchPosition) {
      setSearchPosition(userGpsPosition);
    }
  }, [userGpsPosition, searchPosition]);

  useEffect(() => {
    if (searchPosition) {
      const geohashPrefix = ngeohash.encode(searchPosition.lat, searchPosition.lng).substring(0, 7);
      getNearbyRestaurants({ variables: { geohashPrefix } });
    }
  }, [searchPosition, getNearbyRestaurants]);

  const sortedRestaurants = useMemo(() => {
    if (!searchPosition || !data?.nearbyRestaurants) return [];
    return data.nearbyRestaurants
      .map((res: any) => ({ ...res, distance: getDistance(searchPosition.lat, searchPosition.lng, res.lat, res.lng) }))
      .sort((a: any, b: any) => a.distance - b.distance);
  }, [data, searchPosition]);

  const handleBackToMyLocation = () => {
    if (userGpsPosition) {
      setSearchPosition(userGpsPosition);
      setSelectedRestaurant({ name: "我的位置", lat: userGpsPosition.lat, lng: userGpsPosition.lng, custom: true });
    } else {
      alert("無法取得您目前的位置資訊。");
    }
  };
  
  const defaultMapCenter = { lat: 25.0330, lng: 121.5654 };

  return (
    <div className="relative h-screen w-screen">
        {/* 全域控制項：搜尋框和按鈕 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-md">
            <LocationSearchBox onLocationSelect={(pos) => setSearchPosition(pos)} />
        </div>
        <button onClick={handleBackToMyLocation} className="absolute bottom-10 right-4 z-20 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100" title="回到我的位置">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600"><path d="M12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75z" /><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.093c-2.434.26-4.432 2.293-4.682 4.756a.75.75 0 00.743.837.75.75 0 00.84-.735A3.24 3.24 0 0112 8.25a3.25 3.25 0 013.25 3.25 3.24 3.24 0 01-.647 1.886.75.75 0 10-1.299.75a4.74 4.74 0 001.946-2.636.75.75 0 00-.84-.735.75.75 0 00-.743.837 3.24 3.24 0 01-4.682 2.56V15a.75.75 0 001.5 0v-.093a4.74 4.74 0 004.682-4.756A4.75 4.75 0 0012.75 6z" clipRule="evenodd" /></svg>
        </button>
        {/* 可收合的側邊欄 */}
        <div className={`absolute top-0 left-0 z-10 h-full w-full max-w-[320px] md:w-1/3 p-4 overflow-y-auto bg-white shadow-lg transition-transform duration-300 ease-in-out ${isListOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <h2 className="text-2xl font-bold mb-4 pt-12">附近的餐廳</h2>
            {loading && <p>正在尋找...</p>}
            {geoError && <p className="text-red-500">{geoError}</p>}
            <div className="space-y-3">
              {sortedRestaurants.map((res: any) => (<div key={res.restaurantId} onClick={() => { setSelectedRestaurant(res); setIsListOpen(false);}} className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer border"><h3 className="font-semibold text-lg">{res.name}</h3><p className="text-sm text-gray-500">{res.address}</p><p className="text-sm text-blue-600 font-bold mt-1">距離約 {res.distance < 1 ? (res.distance * 1000).toFixed(0) + ' 公尺' : res.distance.toFixed(1) + ' 公里'}</p></div>))}
            </div>
        </div>
        {/* 地圖 */}
        <div className="absolute inset-0 z-0">
          <Map defaultCenter={defaultMapCenter} defaultZoom={14} mapId="food-map-5" gestureHandling={'greedy'} disableDefaultUI={true} styles={mapStyles}>
            <MapController position={searchPosition} />
            {searchPosition && <AdvancedMarker position={searchPosition} />}
            {sortedRestaurants.map((res: any) => (<AdvancedMarker key={res.restaurantId} position={{ lat: res.lat, lng: res.lng }} onClick={() => setSelectedRestaurant(res)} title={res.name} />))}
            {selectedRestaurant && (<InfoWindow position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }} onCloseClick={() => setSelectedRestaurant(null)}><div><h3 className="font-bold">{selectedRestaurant.name}</h3>{!selectedRestaurant.custom && <Link href={`/restaurants/${selectedRestaurant.restaurantId}`} className="text-blue-500 hover:underline">查看詳情</Link>}</div></InfoWindow>)}
          </Map>
        </div>
      </div>
  );
}

// 真正導出的主頁面元件，它只負責載入 API
export default function MapPageWrapper() {
  const apiKey = process.env.NEXT_PUBLIC_Maps_API_KEY;
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey || "",
    libraries: ["places"],
  });

  if (!isLoaded) return <div className="flex justify-center items-center h-screen">正在載入地圖服務...</div>;

  // 只有在 API 載入完成後，才渲染我們真正的地圖頁面
  return (
    <APIProvider apiKey={apiKey!}>
      <MapView />
    </APIProvider>
  );
}