//testvercel
"use client";
import Image from "next/image";
import { useState } from "react";
import { AccelerateModal } from "./acceleratemodal";

export default function ProductDetailsPage() {
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("/shirt.avif");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizes = ["XS", "S", "M", "L", "XL"];
  const productImages = ["/shirt.avif", "/product-1.avif", "/product-2.avif", "/product-3.avif"];

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
            <Image
              src={mainImage}
              alt="Product Main Image"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {productImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImage(img)}
                className={`aspect-square relative rounded-lg overflow-hidden bg-gray-100 ${
                  mainImage === img ? 'ring-2 ring-sky-700' : ''
                }`}
              >
                <Image
                  src={img}
                  alt={`Product Image ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="md:w-1/3 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Los Angeles Rams Fanatics Unisex LA Strong T-Shirt - Black
            </h1>
            <p className="text-2xl font-semibold text-gray-900 mt-2">$34.99</p>
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
                    selectedSize === size
                      ? "border-sky-700 bg-sky-50 text-sky-700"
                      : "border-gray-200 hover:border-gray-300"
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
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 border-r border-gray-200"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center focus:outline-none"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 border-l border-gray-200"
              >
                +
              </button>
            </div>
          </div>

          <button
            className="w-full h-[56px] text-xl font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md"
          >
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
            subtotal={59.99}
            
          />

          <div className="prose prose-sm">
            <h2 className="text-sm font-medium text-gray-900">Product Description</h2>
            <p className="text-gray-600">
            Fanatics has collaborated with League partners and LA sports organizations to design merchandise which helps support those directly impacted by the devastating wildfires in the LA communities. Fanatics, Leagues, and the participating sports organizations will not profit from the sale of the LA Strong merchandise and will make a donation directly to the American Red Cross and the LA Fire Department Foundation. The American Red Cross provides assistance to those affected by these fires and the LA Fire Department Foundation provides much needed support and equipment to first responders. For more information on these charitable organizations, please visit redcross.org and supportlafd.org.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-900">Features</h2>
            <ul className="list-disc list-inside text-sm text-gray-600">
              <li>Product ID: 202756569</li>
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
