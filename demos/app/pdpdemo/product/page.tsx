"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProductByIdWithFallback } from "../products";
import type { Product } from "../products/types";

function ProductDetailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('product') || '1';
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const product = getProductByIdWithFallback(productId);
    setSelectedProduct(product);
    setSelectedImageIndex(0); // Reset to first image when product changes
  }, [productId]);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    const params = new URLSearchParams({
      productId: selectedProduct.id,
      quantity: "1",
    });
    router.push(`/pdpdemo?${params.toString()}`);
  };

  if (!selectedProduct) {
    return <div>Loading...</div>;
  }

  // Get all images for the product
  const allImages = selectedProduct.images || [selectedProduct.image];
  const currentImage = allImages[selectedImageIndex];

  return (
    <div className="flex overflow-hidden flex-col bg-white min-h-screen">
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex gap-3 items-center">
              <Link href="/pdpdemo" className="flex gap-3 items-center">
                <span className="text-3xl font-black text-black">
                  <Image src="/baggslogo.svg" alt="Baggs Logo" width={30} height={30} />
                </span>
                <span className="text-2xl font-bold tracking-tighter text-black">Accelerate Swag Store</span>
              </Link>
            </div>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" width={30} height={30} className="h-6 w-6" />
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/pdpdemo" className="text-blue-600 hover:underline flex items-center gap-2">
              ← Back to Catalog
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Product Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative h-96 lg:h-[500px]">
                  <Image
                    src={currentImage}
                    alt={`${selectedProduct.name} - Image ${selectedImageIndex + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                
                {/* Image Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index 
                            ? 'border-blue-600' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${selectedProduct.name} thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Product Information */}
              <div className="flex flex-col justify-center">
                <div className="mb-4">
                  <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                    {selectedProduct.category}
                  </span>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {selectedProduct.name}
                </h1>
                
                <p className="text-3xl font-bold text-gray-900 mb-6">
                  ${selectedProduct.price.toFixed(2)}
                </p>
                
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  {selectedProduct.description}
                </p>
                
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Key Features:</h3>
                  <ul className="space-y-3">
                    {selectedProduct.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors duration-200"
                >
                  Add to Cart - ${selectedProduct.price.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-3.5 justify-center text-sm text-sky-600">
            <a href="https://www.weaccelerate.com/privacy" className="hover:underline">
              Privacy policy
            </a>
            <a href="https://www.weaccelerate.com/terms" className="hover:underline">
              Terms of service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetailPageContent />
    </Suspense>
  );
}
