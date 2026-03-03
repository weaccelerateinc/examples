"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  ChevronDown,
  Star,
  Share2,
  Flag,
  Truck,
  Shield,
} from "lucide-react";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

const BASE = "/SidelineSwap-existing";
const PRODUCT_ID = "paddle-1";
const PRODUCT_TITLE = "Humboldt Company Sword and Shield (Aka Pickleball Paddle) (Used)";
const LISTING_ID = "LI20860-28517";
const PRICE = 109;
const RETAIL = 199;

const SPECS_LEFT = [
  { label: "Color", value: "Black" },
  { label: "Brand", value: "Humboldt" },
  { label: "Face Material", value: "Graphite" },
  { label: "Core Material", value: "Polymer" },
  { label: "Face Profile", value: "Standard" },
  { label: "Weight", value: "7.7-8.0 oz" },
  { label: "Handle Length", value: "5.5''" },
  { label: "Width", value: "7.5''" },
];

const SPECS_RIGHT = [
  { label: "Model Number", value: "Sword & Shield (Aka Pickleball Paddle)" },
  { label: "Series", value: "N/A" },
  { label: "Condition", value: "Used - Excellent" },
  { label: "Grip Size", value: "4.25''" },
  { label: "Paddle Shape", value: "Standard" },
  { label: "Length", value: "16.5''" },
  { label: "Overall", value: "Standard (15.75'' - 17'')" },
  { label: "", value: "", link: "Confirm" },
];

const POPULAR_PADDLES = [
  { name: "Joola Solaire", price: 85, img: "/shirt.avif" },
  { name: "Selkirk Amped", price: 95, img: "/shirt.avif" },
  { name: "CRBN 1x Power", price: 110, img: "/shirt.avif" },
  { name: "Selkirk Vanguard", price: 120, img: "/shirt.avif" },
  { name: "HEAD Extreme", price: 75, img: "/shirt.avif" },
  { name: "Engage Pursuit", price: 130, img: "/shirt.avif" },
  { name: "Paddletek Tempest", price: 90, img: "/shirt.avif" },
];

const LISTING_PADDLES = [
  { title: "Selkirk Vanguard Power Air Invikta", price: 109.99, retail: 259.99, img: "/shirt.avif" },
  { title: "ProKennex Ovation Speed II", price: 72.0, retail: 179.99, img: "/shirt.avif" },
  { title: "CRBN 1x Power Series", price: 71.99, retail: 199.99, img: "/shirt.avif" },
  { title: "Joola Ben Johns Hyperion CAS", price: 112.0, retail: 249.99, img: "/shirt.avif" },
  { title: "HEAD Radical Elite Composite", price: 79.99, retail: 149.99, img: "/shirt.avif" },
];

const YOU_MIGHT_LIKE = [
  { title: "Gamma Compass Graphite", price: 120, img: "/shirt.avif" },
  { title: "ProKennex Pro Speed", price: 85, img: "/shirt.avif" },
  { title: "Adidas Metalbone HRD", price: 250, img: "/shirt.avif" },
  { title: "HEAD Extreme Pro", price: 95, img: "/shirt.avif" },
];

export default function SidelineSwapProductPage() {
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [seeMoreDesc, setSeeMoreDesc] = useState(false);

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
  const [, setIsCardLoading] = useState(false);

  const router = useRouter();
  const productImages = ["/shirt.avif", "/shirt.avif", "/shirt.avif", "/shirt.avif", "/shirt.avif", "/shirt.avif", "/shirt.avif", "/shirt.avif"];

  const maybeUseAccelUser = (user: AccelerateUser) => {
    const info: NonNullable<typeof userInfo> = {
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
    if (user.quickCard) setDefaultCard(user.quickCard);
    setIsCardLoading(false);
  };

  const handleCheckout = (useQuickCard?: boolean) => {
    const urlParams = new URLSearchParams({
      productId: PRODUCT_ID,
      productTitle: PRODUCT_TITLE,
      productPrice: PRICE.toString(),
      variantId: "1",
      variantTitle: "Standard",
      quantity: "1",
      productImage: productImages[0],
    });
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
      router.push(`${BASE}/payment?${urlParams.toString()}`);
    } else {
      router.push(`${BASE}/checkout?${urlParams.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-[14px]">
      {/* ───── HEADER ───── */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 h-14 flex items-center gap-4">
          <Link href={BASE} className="shrink-0">
            <Image src="/sidelineswap.svg" alt="SidelineSwap" width={170} height={34} className="h-9 w-auto" priority />
          </Link>

          <div className="flex-1 max-w-[520px] mx-auto">
            <div className="relative">
              <input
                type="search"
                placeholder="Search for products, brands..."
                className="w-full h-9 pl-4 pr-10 border border-gray-300 rounded text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#2DB87D]"
              />
              <button type="button" className="absolute right-0 top-0 h-9 w-9 bg-[#2DB87D] rounded-r flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
            <Link href="#" className="hidden sm:inline text-[13px] font-medium hover:text-[#2DB87D]">Sell</Link>
            <button type="button" className="p-1.5 hover:text-[#2DB87D]"><Heart className="w-[18px] h-[18px]" /></button>
            <button type="button" className="p-1.5 hover:text-[#2DB87D]"><ShoppingCart className="w-[18px] h-[18px]" /></button>
            <button type="button" className="p-1.5 hover:text-[#2DB87D]"><User className="w-[18px] h-[18px]" /></button>
          </div>
        </div>

        {/* Category nav */}
        <nav className="border-t border-gray-100 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6 h-9 flex items-center gap-5 overflow-x-auto text-[13px] text-gray-600 font-medium whitespace-nowrap">
            {["Lacrosse", "All Sports", "Deals", "Footwear", "Apparel", "Equipment", "Bats", "Shop by Sport", "Gift Cards", "Playbook"].map((c) => (
              <Link key={c} href="#" className="hover:text-gray-900 shrink-0">{c}</Link>
            ))}
          </div>
        </nav>
      </header>

      {/* ───── BREADCRUMBS ───── */}
      <div className="border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-2 text-[12px] text-gray-500 flex items-center gap-1 flex-wrap">
          <Link href="#" className="hover:text-[#2DB87D]">Home</Link><span className="text-gray-300">&gt;</span>
          <Link href="#" className="hover:text-[#2DB87D]">Used and New SidelineSwap</Link><span className="text-gray-300">&gt;</span>
          <Link href="#" className="hover:text-[#2DB87D]">Racquet Sports</Link><span className="text-gray-300">&gt;</span>
          <Link href="#" className="hover:text-[#2DB87D]">Pickleball</Link><span className="text-gray-300">&gt;</span>
          <span className="text-gray-700 font-medium">Pickleball Paddles</span>
        </div>
      </div>

      {/* ───── MAIN PRODUCT ───── */}
      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-10">

            {/* ── LEFT: Gallery ── */}
            <div className="space-y-3">
              <div className="aspect-square relative rounded overflow-hidden bg-gray-100 border border-gray-200">
                <Image src={productImages[mainImageIndex]} alt={PRODUCT_TITLE} fill className="object-cover" priority />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white"
                  onClick={() => setMainImageIndex((i) => (i - 1 + productImages.length) % productImages.length)}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white"
                  onClick={() => setMainImageIndex((i) => (i + 1) % productImages.length)}
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              {/* Found for less bar */}
              <div className="flex items-center justify-between gap-3 py-2.5 px-3 bg-[#e6f7ef] border border-[#b8e6d0] rounded text-[13px]">
                <span className="font-semibold text-[#1a5c3a] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#2DB87D]" />
                  Found this item for less?
                </span>
                <div className="flex gap-2">
                  <button type="button" className="px-3 py-1.5 bg-[#2DB87D] text-white font-medium rounded text-[12px] hover:bg-[#269e6c]">Just Did</button>
                  <button type="button" className="px-3 py-1.5 bg-white text-[#2DB87D] border border-[#2DB87D] font-medium rounded text-[12px] hover:bg-[#f0faf5]">Nah, Haven&apos;t</button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Details ── */}
            <div className="space-y-5">
              {/* Title */}
              <h1 className="text-[20px] font-bold text-gray-900 leading-snug">{PRODUCT_TITLE}</h1>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-bold text-[#2DB87D]">${PRICE.toFixed(2)}</span>
                  <span className="text-[11px] text-gray-400 font-medium tracking-wide">{LISTING_ID}</span>
                </div>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Retail: <span className="line-through">${RETAIL.toFixed(2)}</span>{" "}
                  <span className="text-[#2DB87D] font-semibold">Save ${(RETAIL - PRICE).toFixed(2)}</span>
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleCheckout(false)}
                  className="w-full h-11 bg-[#1d1d1d] text-white font-semibold rounded text-[15px] hover:bg-black transition"
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`${BASE}/cart`)}
                  className="w-full h-11 bg-white text-[#2DB87D] border-2 border-[#2DB87D] font-semibold rounded text-[15px] hover:bg-[#f0faf5] transition"
                >
                  Add to Cart
                </button>
              </div>

              {/* Watch / Like */}
              <div className="flex items-center gap-5 text-[13px] text-gray-500">
                <button type="button" className="flex items-center gap-1 hover:text-[#2DB87D]">
                  <Heart className="w-4 h-4" /> Watch · 1 saved
                </button>
                <button type="button" className="flex items-center gap-1 hover:text-[#2DB87D]">
                  <Star className="w-4 h-4" /> Like Now
                </button>
              </div>

              {/* Trust badges */}
              <ul className="space-y-2 text-[13px] text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-[18px] h-[18px] text-[#2DB87D] shrink-0 mt-0.5" />
                  <span>Purchase Protection with <strong>SidelineSwap Guarantee</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-[18px] h-[18px] text-[#2DB87D] shrink-0 mt-0.5" />
                  <span>Free Returns and Refund Policy</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-[18px] h-[18px] text-[#2DB87D] shrink-0 mt-0.5" />
                  <span>Estimated Delivery 30&#8209;day <strong>(FREE)</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-[18px] h-[18px] text-[#2DB87D] shrink-0 mt-0.5" />
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Buy now and pay later with
                    <Image src="/afterpay.svg" alt="Afterpay" width={56} height={18} className="inline-block" />
                  </span>
                </li>
              </ul>

              {/* Seller */}
              <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 text-[14px]">YourNameGoesHere!</span>
                    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-amber-100 text-amber-600 text-[10px]">★</span>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-0.5">99.7% Positive Feedback (1,000+)</p>
                  <div className="flex gap-3 mt-1 text-[12px]">
                    <Link href="#" className="text-[#2DB87D] hover:underline font-medium">View Store</Link>
                    <Link href="#" className="text-[#2DB87D] hover:underline font-medium">Send Message</Link>
                    <Link href="#" className="text-[#2DB87D] hover:underline font-medium">Follow</Link>
                  </div>
                </div>
              </div>

              {/* You Might Also Like */}
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 mb-2.5">You Might Also Like</h2>
                <div className="grid grid-cols-4 gap-2.5">
                  {YOU_MIGHT_LIKE.map((item, i) => (
                    <Link key={i} href="#" className="group block">
                      <div className="aspect-square relative rounded bg-gray-100 overflow-hidden mb-1">
                        <Image src={item.img} alt="" fill className="object-cover group-hover:scale-105 transition" />
                      </div>
                      <p className="text-[12px] text-gray-600 truncate">{item.title}</p>
                      <p className="text-[13px] font-semibold text-gray-900">${item.price.toFixed(2)}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Specifications (two-column layout) */}
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 mb-2.5">Specifications</h2>
                <div className="grid grid-cols-2 border border-gray-200 rounded overflow-hidden text-[12px]">
                  {/* Left column */}
                  <div className="border-r border-gray-200">
                    {SPECS_LEFT.map(({ label, value }, i) => (
                      <div key={label} className={`flex justify-between gap-2 px-3 py-2 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                        <span className="text-gray-500 flex items-center gap-0.5 shrink-0">
                          {label} <Info className="w-3 h-3 text-gray-300" />
                        </span>
                        <span className="text-gray-900 font-medium text-right truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Right column */}
                  <div>
                    {SPECS_RIGHT.map(({ label, value, link }, i) => (
                      <div key={label || `r-${i}`} className={`flex justify-between gap-2 px-3 py-2 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                        {label ? (
                          <>
                            <span className="text-gray-500 flex items-center gap-0.5 shrink-0">
                              {label} <Info className="w-3 h-3 text-gray-300" />
                            </span>
                            <span className="text-gray-900 font-medium text-right truncate">{value}</span>
                          </>
                        ) : (
                          <span className="text-[#2DB87D] font-medium ml-auto cursor-pointer hover:underline">{link}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seller Description */}
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 mb-1.5">Seller Description</h2>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {seeMoreDesc
                    ? "I am offering this pre-owned/used pickleball paddle that is in excellent condition. I bought it from a sports retailer. Paddle was used less than a dozen times. No signs of scratches, scuffs, or edge damage. Grip is in great condition. Comes from a smoke-free, pet-free home."
                    : "I am offering this pre-owned/used pickleball paddle that is in excellent condition. I bought it from a sports retailer. Paddle was used less than a dozen times..."}
                </p>
                <button
                  type="button"
                  onClick={() => setSeeMoreDesc(!seeMoreDesc)}
                  className="mt-0.5 text-[12px] font-medium text-[#2DB87D] hover:underline"
                >
                  {seeMoreDesc ? "See Less" : "... Continue"}
                </button>
              </div>

              {/* My Right Paddle */}
              <div>
                <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wider mb-2">My Right Paddle</p>
                <div className="flex gap-2">
                  <button type="button" className="px-4 py-2 border border-[#2DB87D] text-[#2DB87D] text-[13px] font-medium rounded hover:bg-[#f0faf5]">
                    List for sale
                  </button>
                  <button type="button" className="px-4 py-2 border border-[#2DB87D] text-[#2DB87D] text-[13px] font-medium rounded hover:bg-[#f0faf5]">
                    List for Trade
                  </button>
                </div>
              </div>

              {/* Shipping & Returns */}
              <div className="border border-gray-200 rounded divide-y divide-gray-200">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left text-gray-900 text-[13px] font-medium"
                  onClick={() => setShippingOpen(!shippingOpen)}
                >
                  Shipping or Returns Policies
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition ${shippingOpen ? "rotate-180" : ""}`} />
                </button>
                {shippingOpen && (
                  <div className="px-3 py-2.5 text-[12px] text-gray-600 space-y-1.5">
                    <p className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-gray-400" /> Standard shipping 4–10 business days. Free on this item.</p>
                    <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-gray-400" /> Free returns within 30 days of delivery.</p>
                  </div>
                )}
              </div>

              {/* Share / Report */}
              <div className="flex items-center gap-3 text-[12px] text-gray-400">
                <button type="button" className="flex items-center gap-1 hover:text-gray-600"><Share2 className="w-3.5 h-3.5" /> Share Listing</button>
                <span className="text-gray-200">|</span>
                <button type="button" className="flex items-center gap-1 hover:text-gray-600"><Flag className="w-3.5 h-3.5" /> Report this Listing</button>
              </div>
            </div>
          </div>
        </div>

        {/* ───── SHOP OUR MOST POPULAR PADDLES ───── */}
        <section className="border-t border-gray-100">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
            <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Shop our most popular Paddles
            </h2>
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                {POPULAR_PADDLES.map((p, i) => (
                  <Link key={i} href="#" className="shrink-0 flex flex-col items-center group w-[90px]">
                    <div className="w-[72px] h-[72px] rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden relative group-hover:border-[#2DB87D] transition">
                      <Image src={p.img} alt="" fill className="object-cover" />
                    </div>
                    <span className="mt-1.5 text-[11px] text-gray-700 text-center leading-tight truncate w-full">{p.name}</span>
                    <span className="text-[11px] text-[#2DB87D] font-semibold">${p.price}</span>
                  </Link>
                ))}
              </div>
              <button type="button" className="absolute -right-1 top-6 w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </section>

        {/* ───── 1,228 PICKLEBALL PADDLES ───── */}
        <section className="border-t border-gray-100 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4">
              1,228 Pickleball Paddles on SidelineSwap
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {LISTING_PADDLES.map((item, i) => (
                <Link key={i} href="#" className="group border border-gray-200 rounded overflow-hidden hover:shadow-md transition bg-white">
                  <div className="aspect-square relative bg-gray-100 overflow-hidden">
                    <Image src={item.img} alt="" fill className="object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-[12px] text-gray-700 leading-tight line-clamp-2 mb-1">{item.title}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[14px] font-bold text-gray-900">${item.price.toFixed(2)}</span>
                      <span className="text-[11px] text-gray-400 line-through">${item.retail.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
              {["Pickleball Paddles", "Tennis Rackets", "Blue Pickleball Paddles", "Used Pickleball Paddles"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="shrink-0 px-4 py-2 rounded-full border border-[#2DB87D] text-[#2DB87D] text-[12px] font-medium hover:bg-[#f0faf5] transition"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ───── SEARCH / TRENDING ───── */}
        <section className="bg-[#1a5c3a]">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-white/70" />
              <span className="text-white/80 text-[13px] font-medium">Search all listings</span>
            </div>
            <div className="border-t border-white/15 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Recent Searches</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Pickleball Paddle", "Humboldt Paddle", "Men Pickleball Paddle"].map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded border border-white/20 text-white text-[12px]">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Trending Searches</p>
                <div className="flex flex-wrap gap-1.5">
                  {["tennis racket", "pickleball paddles", "new pickleball paddles", "used pickleball paddles", "pickleball paddle grips", "pickleball paddle bags"].map((s) => (
                    <button key={s} type="button" className="px-2.5 py-1 rounded border border-white/20 text-white text-[12px] hover:bg-white/10 transition">{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───── FOOTER ───── */}
      <footer className="bg-[#143d28] text-white">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Logo / Tagline */}
            <div className="col-span-2 md:col-span-1">
              <Image src="/sidelineswap.svg" alt="SidelineSwap" width={140} height={28} className="h-7 w-auto opacity-90" />
              <p className="text-[#6dd4a8] text-[11px] font-semibold mt-1">Powering the Team</p>
              <p className="text-white/60 text-[12px] mt-2 leading-relaxed">
                Buy and sell new and used sports equipment and gear with confidence.
              </p>
              <div className="flex gap-2 mt-3">
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px]">f</span>
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px]">📷</span>
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px]">𝕏</span>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-[12px] uppercase tracking-wider mb-2 text-white/80">Company</h4>
              <ul className="space-y-1.5 text-[12px] text-white/60">
                <li><Link href="#">About</Link></li>
                <li><Link href="#">Careers</Link></li>
                <li><Link href="#">Press</Link></li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="font-semibold text-[12px] uppercase tracking-wider mb-2 text-white/80">Policies &amp; Help</h4>
              <ul className="space-y-1.5 text-[12px] text-white/60">
                <li><Link href="#">Privacy Policy</Link></li>
                <li><Link href="#">Terms of Service</Link></li>
                <li><Link href="#">Help Center</Link></li>
                <li><Link href="#">Accessibility</Link></li>
              </ul>
            </div>

            {/* More Links */}
            <div>
              <h4 className="font-semibold text-[12px] uppercase tracking-wider mb-2 text-white/80">Community</h4>
              <ul className="space-y-1.5 text-[12px] text-white/60">
                <li><Link href="#">Brands</Link></li>
                <li><Link href="#">Sitemap</Link></li>
                <li><Link href="#">Blog</Link></li>
              </ul>
            </div>

            {/* Apps */}
            <div>
              <h4 className="font-semibold text-[12px] uppercase tracking-wider mb-2 text-white/80">Get the App</h4>
              <div className="flex flex-col gap-2">
                <div className="h-9 w-28 bg-white/10 rounded flex items-center justify-center text-[11px] text-white/70">App Store</div>
                <div className="h-9 w-28 bg-white/10 rounded flex items-center justify-center text-[11px] text-white/70">Google Play</div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-5 text-center text-[11px] text-white/40">
            © 2026 SidelineSwap, Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Accelerate Script */}
      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          setIsCardLoading(true);
          window.accelerate.init({
            amount: PRICE * 100,
            merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            universalAuth: true,
            onLoginSuccess: (user) => maybeUseAccelUser(user),
            onCardSelected: (cid) => console.log("Card selected:", cid),
          });
        }}
      />
    </div>
  );
}
