"use client";
import Image from "next/image";
import { useState, useEffect, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

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

// Function to strip HTML tags for plain text display
const stripHtmlTags = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Function to get a valid image URL
const getValidImageUrl = (images: string[] | undefined): string => {
  if (!images || images.length === 0) {
    return "/shirt.avif";
  }

  // Find the first non-empty, non-undefined image URL
  const validImage = images.find((img) => img && img.trim() !== "");
  return validImage || "/shirt.avif";
};

// Function to get valid image URLs array
const getValidImageUrls = (images: string[] | undefined): string[] => {
  if (!images || images.length === 0) {
    return ["/shirt.avif", "/product-1.avif", "/product-2.avif", "/product-3.avif"];
  }

  // Filter out empty and undefined image URLs
  const validImages = images.filter((img) => img && img.trim() !== "");
  return validImages.length > 0 ? validImages : ["/shirt.avif", "/product-1.avif", "/product-2.avif", "/product-3.avif"];
};

// Fetch function for products
const fetchProducts = async (): Promise<ProductsResponse> => {
  const response = await fetch("/api/pdp/list-products");

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
};

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity] = useState(1); // Hardcode quantity to always be 1
  const [mainImage, setMainImage] = useState("/shirt.avif"); // Initialize with fallback image
  const router = useRouter();

  // QuickCard state
  const [defaultCard, setDefaultCard] = useState<{
    artUrl: string;
    cardId: string;
    cardName: string;
    cardType: string;
    last4: string;
  } | null>(null);
  const [userInfo, setUserInfo] = useState<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null>(null);

  // Function to populate user data from Accelerate
  const maybeUseAccelUser = (user: AccelerateUser) => {
    console.log("Product page received user:", { user });

    const info: typeof userInfo = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      email: user.emailAddress || "",
    };

    if (user?.addresses?.[0]) {
      info.address = user.addresses[0].line1 || "";
      info.city = user.addresses[0].city || "";
      info.state = user.addresses[0].state || "";
      info.zip = user.addresses[0].postalCode || "";
    }

    setUserInfo(info);

    if (user.quickCard) {
      setDefaultCard(user.quickCard);
    }
  };

  // Unwrap params using React.use()
  const { id } = use(params);

  // Fetch products using useQuery
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["printify-products"],
    queryFn: fetchProducts,
  });

  // Find the product based on the ID from the API response
  const currentProduct = productsData?.products?.find((p) => p.id === id);

  // Set initial main image when product is found
  useEffect(() => {
    if (currentProduct && currentProduct.images && currentProduct.images.length > 0) {
      const validImage = getValidImageUrl(currentProduct.images);
      setMainImage(validImage);
    }
    // If no product images, keep the fallback image that was set in initial state
  }, [currentProduct]);

  // Handle checkout navigation
  const handleCheckout = (useQuickCard?: boolean) => {
    if (!currentProduct) return;

    const selectedVariant =
      currentProduct.variants?.filter((variant) => variant.is_enabled)[selectedVariantIndex] ||
      currentProduct.variants?.filter((variant) => variant.is_enabled)[0];
    const productPriceValue = selectedVariant ? selectedVariant.price / 100 : 0;

    const urlParams = new URLSearchParams({
      productId: currentProduct.id,
      productTitle: stripHtmlTags(currentProduct.title),
      productPrice: productPriceValue.toString(),
      variantId: selectedVariant?.id?.toString() || "1",
      variantTitle: selectedVariant ? `Variant ${selectedVariant.id}` : "Standard",
      quantity: quantity.toString(),
      productImage: getValidImageUrl(currentProduct.images),
    });

    // If using quickCard and we have user info, go directly to payment
    if (useQuickCard && defaultCard && userInfo) {
      urlParams.set("email", userInfo.email || "");
      urlParams.set("phone", userInfo.phoneNumber || "");
      urlParams.set("firstName", userInfo.firstName || "");
      urlParams.set("lastName", userInfo.lastName || "");
      urlParams.set("address", userInfo.address || "");
      urlParams.set("city", userInfo.city || "");
      urlParams.set("state", userInfo.state || "");
      urlParams.set("zip", userInfo.zip || "");
      urlParams.set("defaultCardId", defaultCard.cardId);
      router.push(`/pdp2/payment?${urlParams.toString()}`);
    } else {
      router.push(`/pdp2/checkout?${urlParams.toString()}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-700"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load product</p>
          <p className="text-gray-600 mb-8">{error instanceof Error ? error.message : "Unknown error"}</p>
          <Link
            href="/pdp2"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Product not found state
  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/pdp2"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get product data
  const productTitle = stripHtmlTags(currentProduct.title);
  const productDescription = currentProduct.description; // Keep HTML for rendering
  const productImages = getValidImageUrls(currentProduct.images);
  const productTags = currentProduct.tags || [];

  // Filter enabled variants only
  const enabledVariants = currentProduct.variants?.filter((variant) => variant.is_enabled) || [];
  // Hardcode product price to $0.99
  const productPrice = 0.99;

  return (
    <div className="flex overflow-hidden flex-col bg-white min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <Link href="/pdp2" className="flex gap-3 items-center hover:opacity-80 transition-opacity">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Accelerate Swag Store Logo" width={30} height={30} />
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Accelerate Swag Store</span>
            </Link>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{productTitle}</h1>
            <p className="text-2xl font-semibold text-gray-900 mt-2">${productPrice.toFixed(2)}</p>
            {productTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {productTags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {enabledVariants.length > 1 && (
            <div>
              <h2 className="text-sm font-medium text-gray-900 mb-2">Product Variant</h2>
              <select
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {enabledVariants.map((variant, index) => (
                  <option key={variant.id} value={index}>
                    Variant {variant.id} - $0.99
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleCheckout(false)}
              className="w-full h-[56px] text-xl font-semibold text-white bg-green-700 hover:bg-green-800 rounded-md"
            >
              Continue to Checkout
            </button>
            {defaultCard && (
              <button
                onClick={() => handleCheckout(true)}
                className="w-full h-[56px] px-4 text-white bg-sky-700 hover:bg-sky-800 rounded-md flex items-center justify-center gap-3"
              >
                <img src={defaultCard.artUrl} alt={defaultCard.cardName} className="h-8 w-auto rounded" />
                <span className="text-lg font-semibold">Buy now ••••{defaultCard.last4}</span>
              </button>
            )}
          </div>

          <div className="prose prose-sm">
            <h2 className="text-sm font-medium text-gray-900">Product Description</h2>
            <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: productDescription }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-900">Features</h2>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {currentProduct.variants && <li>Available variants: {currentProduct.variants.length}</li>}
            </ul>
          </div>
        </div>
      </main>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("pdp2-product.onReady");
          // Hardcode the amount to $0.99 for testing
          const hardcodedAmount = 0.99;

          window.accelerate.init({
            amount: Math.round(hardcodedAmount * 100), // Convert to cents (99 cents)
            merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            universalAuth: true,
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in on product page", { user });
              maybeUseAccelUser(user);
            },
            onCardSelected: (cid) => {
              console.log("Card selected:", cid);
            },
          });
        }}
      />
    </div>
  );
}
