// app/add-restaurant/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { APIProvider } from '@vis.gl/react-google-maps';
import Script from 'next/script';

const CREATE_RESTAURANT = gql`
  mutation CreateRestaurant($name: String!, $address: String!, $lat: Float!, $lng: Float!) {
    createRestaurant(name: $name, address: $address, lat: $lat, lng: $lng)
  }
`;

function AddRestaurantForm() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  const [createRestaurant, { loading, error }] = useMutation(CREATE_RESTAURANT, {
    onCompleted: (data) => {
      alert('餐廳已成功新增！');
      router.push(`/restaurants/${data.createRestaurant}`);
    },
    onError: (err) => { alert(`新增失敗: ${err.message}`); }
  });

  const {
    ready,
    value,
    suggestions: { status, data: suggestions },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'tw' } },
    debounce: 300,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setAddress(address);
      setCoordinates({ lat, lng });
    } catch (error) { console.error('Error: ', error); }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!coordinates) { alert('請從建議列表中選擇一個有效的地址'); return; }
    createRestaurant({ variables: { name, address, lat: coordinates.lat, lng: coordinates.lng } });
  };

  return (
    <div className="container mx-auto max-w-lg p-4 mt-10">
      <h1 className="text-3xl font-bold text-center mb-6">新增您的餐廳</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">餐廳名稱</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
            required
          />
        </div>

        <div className="relative">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">餐廳地址</label>
          <input
            id="address"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!ready}
            placeholder="輸入地址並從下方選擇..."
            className="mt-1 w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
            required
          />
          {status === 'OK' && (
            <ul className="absolute z-10 w-full bg-white border mt-1 rounded-md shadow-lg">
              {suggestions.map(({ place_id, description }) => (
                <li key={place_id} onClick={() => handleSelect(description)} className="p-2 hover:bg-gray-100 cursor-pointer">
                  {description}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 rounded-md disabled:bg-blue-300">
          {loading ? '新增中...' : '確認新增'}
        </button>
        {error && <p className="text-red-500 text-center">{error.message}</p>}
      </form>
    </div>
  );
}

export default function AddRestaurantPage() {
  const apiKey = process.env.NEXT_PUBLIC_Maps_API_KEY;
  // 建立一個狀態來追蹤 API 是否已載入
  const [isMapsApiLoaded, setMapsApiLoaded] = useState(false);

  if (!apiKey) {
    return <p className="text-center text-red-500 mt-10">Google Maps API 金鑰未設定</p>;
  }

  return (
    <>
      {/* 載入腳本，並在載入完成後更新狀態 */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsApiLoaded(true)}
        async
      />
      
      {/* 只有在 API 載入完成後，才渲染表單元件 */}
      {isMapsApiLoaded ? (
        <AddRestaurantForm />
      ) : (
        <p className="text-center text-gray-500 mt-10">正在載入地圖資源...</p>
      )}
    </>
  );
}