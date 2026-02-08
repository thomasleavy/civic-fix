import { useState } from 'react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

const ImageCarousel = ({ images, alt, className = '' }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  // Construct proper image URL - handle both relative and absolute URLs
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverBaseUrl = apiBaseUrl.replace('/api', '');
  const currentImage = images[currentIndex];
  const imageUrl = currentImage.startsWith('http') 
    ? currentImage 
    : `${serverBaseUrl}${currentImage.startsWith('/') ? currentImage : '/' + currentImage}`;

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Display */}
      <div className="relative w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt={`${alt} - Image ${currentIndex + 1} of ${images.length}`}
          className="w-full h-96 object-contain"
          onError={(e) => {
            console.error('Image failed to load:', imageUrl, 'Original:', currentImage);
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Navigation Arrows - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              aria-label="Previous image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              aria-label="Next image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation - Only show if more than 1 image */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => {
            const thumbUrl = image.startsWith('http') 
              ? image 
              : `${serverBaseUrl}${image.startsWith('/') ? image : '/' + image}`;
            
            return (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'border-primary-500 ring-2 ring-primary-300 dark:ring-primary-700'
                    : 'border-gray-300 dark:border-gray-600 opacity-70 hover:opacity-100'
                }`}
                aria-label={`Go to image ${index + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt={`${alt} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
