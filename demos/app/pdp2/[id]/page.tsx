"use client";
import Image from "next/image";
import { useState, useEffect, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import { Lock, Zap } from "lucide-react";

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
  if (typeof document === 'undefined') return html;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Function to remove specification lines (lines starting with ".:") from description
const stripSpecifications = (html: string): string => {
  if (typeof document === 'undefined') return html;
  // Create a temporary element to parse the HTML
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  
  // Find and remove paragraphs containing specification lines
  const paragraphs = tmp.querySelectorAll("p");
  paragraphs.forEach((p) => {
    const text = p.textContent || "";
    // Check if the paragraph contains specification lines (starting with ".: ")
    if (text.includes(".: ") || text.match(/^\s*\.:/) || text.includes("Fabric weight:") || text.includes("Dimensions:")) {
      p.remove();
    }
  });
  
  return tmp.innerHTML;
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
  const [isCardLoading, setIsCardLoading] = useState(false);

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
    
    // Card loading is complete (whether we got a card or not)
    setIsCardLoading(false);
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
      if (validImage && validImage.trim() !== "") {
        setMainImage(validImage);
      }
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
          <p className="mt-4 text-slate-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load product</p>
          <p className="text-slate-600 mb-8">{error instanceof Error ? error.message : "Unknown error"}</p>
          <Link
            href="/pdp2"
            className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors"
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
          <p className="text-slate-600 mb-8">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/pdp2"
            className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Get product data
  const productTitle = stripHtmlTags(currentProduct.title);
  const productDescription = stripSpecifications(currentProduct.description); // Remove specifications, keep HTML for rendering
  const productImages = getValidImageUrls(currentProduct.images);
  
  // Tags to filter out
  const excludedTags = [
    "Valentine's Day",
    "Valentine's Day Picks",
    "Valentine's Day promotion",
    "Spring Essentials",
    "US Elections Season",
    "Halloween",
    "TikTok",
    "Bestsellers",
    "Home & Living",
  ];
  const productTags = (currentProduct.tags || []).filter(
    (tag) => !excludedTags.some((excluded) => tag.toLowerCase() === excluded.toLowerCase())
  );

  // Filter enabled variants only
  const enabledVariants = currentProduct.variants?.filter((variant) => variant.is_enabled) || [];
  // Hardcode product price to $0.99
  const productPrice = 0.99;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          <Link href="/pdp2" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative bg-white rounded-xl p-1.5 sm:p-2 shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <Image 
                  src="/avatar-black.png" 
                  alt="Accelerate Logo" 
                  width={40} 
                  height={40} 
                  className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">Accelerate Store</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Powered by Accelerate Checkout
              </span>
            </div>
          </Link>
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </header>

      {/* Main Product Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {mainImage && mainImage.trim() !== "" && (
              <div className="aspect-square relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                <Image src={mainImage} alt="Product Main Image" fill className="object-cover" priority />
              </div>
            )}
            {productImages.length > 1 && !productTitle.toLowerCase().includes("airpods") && (
              <div className="grid grid-cols-4 gap-3">
                {productImages
                  .filter((img) => img && img.trim() !== "")
                  .map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img)}
                      className={`aspect-square relative rounded-lg overflow-hidden bg-slate-100 border-2 transition-all ${
                        mainImage === img 
                          ? "border-blue-600 ring-2 ring-blue-200" 
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Image src={img} alt={`Product Image ${i + 1}`} fill className="object-cover" />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">{productTitle}</h1>
              <div className="flex items-baseline gap-3 mb-4">
                <p className="text-3xl font-bold text-slate-900">${productPrice.toFixed(2)}</p>
              </div>
              {productTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {productTags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {enabledVariants.length > 1 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Product Variant</label>
                <select
                  value={selectedVariantIndex}
                  onChange={(e) => setSelectedVariantIndex(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-900"
                >
                  {enabledVariants.map((variant, index) => (
                    <option key={variant.id} value={index}>
                      Variant {variant.id} - $0.99
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleCheckout(false)}
                className="w-full h-14 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                Continue to Checkout
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              {isCardLoading ? (
                <div className="w-full h-14 px-4 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl shadow-lg shadow-slate-700/20 flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-lg font-semibold text-white">Loading payment method...</span>
                </div>
              ) : defaultCard ? (
                <button
                  onClick={() => handleCheckout(true)}
                  className="w-full h-14 px-4 text-white bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl hover:from-slate-700 hover:to-slate-600 transition shadow-lg shadow-slate-700/20 flex items-center justify-center gap-3"
                >
                  {defaultCard.artUrl && defaultCard.artUrl.trim() !== "" && (
                    <img src={defaultCard.artUrl} alt={defaultCard.cardName} className="h-8 w-auto rounded" />
                  )}
                  <span className="text-lg font-semibold">Buy now ••••{defaultCard.last4}</span>
                </button>
              ) : null}
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Product Description</h2>
              <div className="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: productDescription }} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-sm opacity-60"></div>
                <div className="relative bg-white rounded-xl p-1.5 shadow-md">
                  <Image 
                    src="/avatar-black.png" 
                    alt="Accelerate Logo" 
                    width={40} 
                    height={40} 
                    className="w-9 h-9 object-contain"
                  />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-white bg-clip-text text-transparent tracking-tight block">Accelerate Store</span>
                <p className="text-slate-400 text-xs mt-1">Powered by Accelerate Checkout</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-sm">
              <a href="https://weaccelerate.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                About Accelerate
              </a>
              <a href="https://www.weaccelerate.com/privacy" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="https://www.weaccelerate.com/terms" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6">
            <p className="text-center text-sm text-slate-500">
              © 2026 Accelerate Store. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("pdp2-product.onReady");
          // Hardcode the amount to $0.99 for testing
          const hardcodedAmount = 0.99;

          // Start loading state when script is ready
          setIsCardLoading(true);

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
