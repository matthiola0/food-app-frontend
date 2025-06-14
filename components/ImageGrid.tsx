// components/ImageGrid.tsx
"use client";

import Image from 'next/image';

interface ImageGridProps {
  imageUrls: string[];
}

const ImageItem = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-full h-full aspect-square bg-gray-100">
    <Image 
      src={src} 
      alt={alt} 
      fill 
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="rounded-md transition-transform duration-300 hover:scale-105 object-cover"
    />
  </div>
);

export default function ImageGrid({ imageUrls }: ImageGridProps) {
  const validImageUrls = imageUrls.filter(url => url); 
  
  const imageCount = validImageUrls.length;

  if (imageCount === 0) return null;

  if (imageCount === 1) {
    return (
      <div className="w-full rounded-lg overflow-hidden">
        <ImageItem src={imageUrls[0]} alt="食記圖片 1" />
      </div>
    );
  }

  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
        <ImageItem src={imageUrls[0]} alt="食記圖片 1" />
        <ImageItem src={imageUrls[1]} alt="食記圖片 2" />
      </div>
    );
  }

  if (imageCount === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden h-96 md:h-[500px]">
        <div className="col-span-1 row-span-2">
          <ImageItem src={imageUrls[0]} alt="食記圖片 1" />
        </div>
        <div className="col-span-1 row-span-1">
          <ImageItem src={imageUrls[1]} alt="食記圖片 2" />
        </div>
        <div className="col-span-1 row-span-1">
          <ImageItem src={imageUrls[2]} alt="食記圖片 3" />
        </div>
      </div>
    );
  }

  if (imageCount === 4) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden">
        {imageUrls.map((url, index) => (
          <ImageItem key={index} src={url} alt={`食記圖片 ${index + 1}`} />
        ))}
      </div>
    );
  }

  if (imageCount >= 5) {
    const remainingImages = imageCount - 4;
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden">
        {imageUrls.slice(0, 3).map((url, index) => (
          <ImageItem key={index} src={url} alt={`食記圖片 ${index + 1}`} />
        ))}
        <div className="relative">
          <ImageItem src={imageUrls[3]} alt={`食記圖片 4`} />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer">
            <span className="text-white text-3xl font-bold">+{remainingImages}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}