// components/LocationSearchBox.tsx
"use client";

import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { useState } from 'react';

interface LocationSearchBoxProps {
  onLocationSelect: (position: { lat: number; lng: number }) => void;
}

export default function LocationSearchBox({ onLocationSelect }: LocationSearchBoxProps) {
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
      onLocationSelect({ lat, lng }); // 透過 props 將選定的經緯度傳回給父元件
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  return (
    <div className="relative w-full">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="搜尋地點..."
        className="w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        autoComplete="off"
      />
      {status === 'OK' && (
        <ul className="absolute z-10 w-full bg-white border mt-1 rounded-md shadow-lg">
          {suggestions.map(({ place_id, description }) => (
            <li key={place_id} onClick={() => handleSelect(description)} className="p-2 hover:bg-gray-100 cursor-pointer text-gray-800">
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}