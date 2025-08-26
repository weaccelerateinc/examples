//testvercel2
"use client";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AccelerateModal } from "./acceleratemodal";

// Types for Printify products
interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  blueprint_id: number;
  shop_id: number;
  images: string[];
  variants: Array<{ id: number; price: number; is_enabled: boolean }>;
}

interface ProductsResponse {
  success: boolean;
  products: PrintifyProduct[];
  total: number;
}

// Fetch function for products
const fetchProducts = async (): Promise<ProductsResponse> => {
  const response = await fetch("/api/pdp/list-products");

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
};

export default function ProductDetailsPage() {
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [mainImage, setMainImage] = useState("/shirt.avif");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch products using useQuery
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["printify-products"],
    queryFn: fetchProducts,
  });

  const sizes = ["XS", "S", "M", "L", "XL"];
  const fallbackImages = ["/shirt.avif", "/product-1.avif", "/product-2.avif", "/product-3.avif"];

  // Get current product or use fallback data
  const currentProduct = productsData?.products?.[selectedProductIndex];
  const productImages = currentProduct?.images && currentProduct.images.length > 0 ? currentProduct.images : fallbackImages;
  const productTitle = currentProduct?.title || "Los Angeles Rams Fanatics Unisex LA Strong T-Shirt - Black";
  const productDescription =
    currentProduct?.description ||
    "Fanatics has collaborated with League partners and LA sports organizations to design merchandise which helps support those directly impacted by the devastating wildfires in the LA communities.";

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-700"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load products</p>
          <p className="text-gray-600">{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden flex-col bg-white min-h-screen">
      {/* Header - kept the same as modalfull */}
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex gap-3 items-center">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Baggs Logo" width={30} height={30} />
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Baggs</span>
            </div>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" width={30} height={30} className="h-6 w-6" />
          </div>
        </div>
      </header>

      {/* Main Product Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Product Images */}
        <div className="md:w-2/3 space-y-4">
          <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
            <Image src={mainImage} alt="Product Main Image" fill className="object-cover" priority />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {productImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImage(img)}
                className={`aspect-square relative rounded-lg overflow-hidden bg-gray-100 ${
                  mainImage === img ? "ring-2 ring-sky-700" : ""
                }`}
              >
                <Image src={img} alt={`Product Image ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="md:w-1/3 space-y-6">
          {/* Product Selection */}
          {productsData && productsData.products.length > 1 && (
            <div>
              <h2 className="text-sm font-medium text-gray-900 mb-2">Select Product</h2>
              <select
                value={selectedProductIndex}
                onChange={(e) => {
                  setSelectedProductIndex(parseInt(e.target.value));
                  setMainImage(productsData.products[parseInt(e.target.value)]?.images?.[0] || fallbackImages[0]);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {productsData.products.map((product, index) => (
                  <option key={product.id} value={index}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{productTitle}</h1>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {currentProduct?.variants?.[0]?.price ? `$${(currentProduct.variants[0].price / 100).toFixed(2)}` : "$34.99"}
            </p>
            {currentProduct?.tags && currentProduct.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentProduct.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-900">Color</h2>
            <p className="text-gray-600">Black</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Size</h2>
            <div className="grid grid-cols-5 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 text-sm font-medium rounded-md border ${
                    selectedSize === size ? "border-sky-700 bg-sky-50 text-sky-700" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Quantity</h2>
            <div className="flex items-center border border-gray-200 rounded-md w-32">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 border-r border-gray-200">
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center focus:outline-none"
              />
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 border-l border-gray-200">
                +
              </button>
            </div>
          </div>

          <button className="w-full h-[56px] text-xl font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md">
            Add to Cart
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-[56px] text-xl font-semibold text-white bg-green-700 hover:bg-green-800 rounded-md"
          >
            Accelerate Buy Now
          </button>

          <AccelerateModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            subtotal={currentProduct?.variants?.[0]?.price ? currentProduct.variants[0].price / 100 : 34.99}
            selectedProduct={{
              id: currentProduct?.id || "fallback-product",
              title: productTitle,
              price: currentProduct?.variants?.[0]?.price ? currentProduct.variants[0].price / 100 : 34.99,
              selectedSize,
              quantity,
            }}
          />

          <div className="prose prose-sm">
            <h2 className="text-sm font-medium text-gray-900">Product Description</h2>
            <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: productDescription }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-900">Features</h2>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {currentProduct?.id && <li>Product ID: {currentProduct.id}</li>}
              {currentProduct?.blueprint_id && <li>Blueprint ID: {currentProduct.blueprint_id}</li>}
              {currentProduct?.shop_id && <li>Shop ID: {currentProduct.shop_id}</li>}
              {currentProduct?.variants && <li>Available variants: {currentProduct.variants.length}</li>}
              <li>Material: 100% Cotton</li>
              <li>Machine wash, tumble dry low</li>
              <li>Officially licensed</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
