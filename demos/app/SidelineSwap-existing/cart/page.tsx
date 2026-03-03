"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Heart,
  Mail,
  ShoppingCart,
  User,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const BASE = "/SidelineSwap-existing";
const PRODUCT_TITLE = "Honolulu Company Sword and Shield j2k+Pickleball Paddle (Used)";
const PRICE = 109;

const CATEGORIES = [
  "Clearance", "All Categories", "Fanwear", "Hockey", "Baseball", "Softball",
  "Skiing", "Snowboarding", "Golf", "Lacrosse", "Football", "Racquet Sports",
];

export default function CartPage() {
  const router = useRouter();

  return (
    <div className="max-w-[1400px] m-auto">
      <div className="min-h-screen bg-white flex flex-col text-[14px]">

        {/* ───── HEADER ───── */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
            {/* Top Row */}
            <div className="flex items-center gap-4 h-16">
              <Link href={BASE}>
                <Image src="/sidelineswap.svg" alt="SidelineSwap" width={170} height={34} className="h-9 w-auto" priority />
              </Link>
              <div className="flex-1 max-w-xl relative">
                <input
                  placeholder="Search for new and used gear"
                  className="w-full h-10 pl-4 pr-12 rounded border border-gray-300 text-[13px] focus:outline-none focus:border-[#2DB87D]"
                />
                <button className="absolute right-0 top-0 h-10 w-10 bg-[#2DB87D] rounded-r flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </button>
              </div>
              <button className="border border-[#2DB87D] text-[#2DB87D] rounded-full px-4 h-8 text-[13px] font-semibold hover:bg-[#f0faf5] transition">
                Sell
              </button>
              <div className="flex items-center gap-5 text-gray-600">
                <button className="flex flex-col items-center gap-0.5">
                  <Heart className="w-5 h-5" />
                  <span className="text-[10px]">Favorites</span>
                </button>
                <button className="flex flex-col items-center gap-0.5">
                  <Mail className="w-5 h-5" />
                  <span className="text-[10px]">Inbox</span>
                </button>
                <button className="flex flex-col items-center gap-0.5 relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-2 bg-[#2DB87D] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">1</span>
                  <span className="text-[10px]">Cart</span>
                </button>
                <button className="flex flex-col items-center gap-0.5">
                  <User className="w-5 h-5" />
                  <span className="text-[10px]">Account</span>
                </button>
              </div>
            </div>

            {/* Category Nav */}
            <div className="flex items-center gap-1 h-10 overflow-x-auto text-[13px] -mx-1">
              {CATEGORIES.map((cat) => (
                <span key={cat} className="px-2.5 py-1 text-gray-600 hover:text-[#2DB87D] cursor-pointer whitespace-nowrap">
                  {cat}
                </span>
              ))}
              <span className="ml-auto flex items-center gap-4 text-gray-500 shrink-0">
                <span className="hover:text-[#2DB87D] cursor-pointer">Guides &amp; Reviews</span>
                <span className="hover:text-[#2DB87D] cursor-pointer">Value Guide</span>
              </span>
            </div>
          </div>
        </header>

        {/* ───── MAIN ───── */}
        <main className="flex-1 bg-gray-50">
          <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-8">
            {/* Cart Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[22px] font-bold text-gray-900">1 Item in your cart</h1>
              <Link href={BASE} className="text-[#2DB87D] text-[14px] font-medium hover:underline">
                Keep Shopping
              </Link>
            </div>

            {/* Cart Item */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-[13px] text-gray-600">
                Sold by <span className="font-semibold text-gray-900">ThePlayersCloset</span>
              </div>

              <div className="p-4 flex gap-4">
                <div className="w-[100px] h-[100px] rounded bg-gray-100 overflow-hidden relative shrink-0">
                  <Image src="/shirt.avif" alt={PRODUCT_TITLE} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-gray-900 font-medium leading-snug mb-1">{PRODUCT_TITLE}</p>
                  <p className="text-[16px] font-bold text-gray-900 mb-0.5">${PRICE.toFixed(2)}</p>
                  <p className="text-[12px] text-gray-500">+ Shipping + Tax</p>
                  <div className="flex items-center gap-4 mt-3">
                    <button className="text-[13px] text-[#2DB87D] font-medium hover:underline flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> Move to Favorites
                    </button>
                    <button className="text-[13px] text-red-500 font-medium hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer Protection */}
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5 text-[#2DB87D]" />
              <span className="text-[13px] text-gray-600">
                Shop Safely with <strong>SidelineSwap Buyer Protection</strong>
              </span>
            </div>

            {/* Subtotal + Checkout */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] text-gray-600">Subtotal</span>
                <span className="text-[18px] font-bold text-gray-900">${PRICE.toFixed(2)} <span className="text-[12px] font-normal text-gray-400">USD</span></span>
              </div>
              <button
                onClick={() => router.push(`${BASE}/checkout`)}
                className="w-full h-11 rounded bg-[#1d3d2e] text-white font-semibold text-[14px] hover:bg-[#162f23] transition flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Favorites Section */}
            <div className="mb-8">
              <h2 className="text-[18px] font-bold text-gray-900 mb-4">Your Favorites</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="relative aspect-square bg-gray-100">
                    <Image src="/shirt.avif" alt="Favorite product" fill className="object-cover" />
                    <div className="absolute top-2 right-2 bg-white/90 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 text-[11px] text-gray-600">
                      <Heart className="w-3 h-3 text-red-400 fill-red-400" /> 6
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      ThePlayersCloset <span className="text-[#2DB87D]">PRO+</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[12px] text-gray-700 leading-snug line-clamp-2 mb-1">{PRODUCT_TITLE}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-gray-900">${PRICE}</span>
                      <span className="text-[12px] text-gray-400 line-through">$155</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button className="px-4 h-8 border border-gray-300 rounded text-[13px] text-gray-500 hover:bg-gray-50 transition">
                  Prev
                </button>
                <button className="px-4 h-8 border border-gray-300 rounded text-[13px] text-gray-500 hover:bg-gray-50 transition">
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* ───── FOOTER ───── */}
        <footer className="bg-[#1a3a2a] text-white">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {/* Logo + Description */}
              <div className="col-span-2 md:col-span-1">
                <Image src="/sidelineswap.svg" alt="SidelineSwap" width={140} height={28} className="h-7 w-auto opacity-95" />
                <p className="text-white/60 text-[12px] mt-2 leading-relaxed">
                  Buy and sell new and used sports equipment and gear with confidence.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px]">f</span>
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px]">📷</span>
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px]">𝕏</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-[12px] uppercase tracking-wider mb-2 text-white/80">Company</h4>
                <ul className="space-y-1.5 text-[12px] text-white/60">
                  <li><Link href="#">About</Link></li>
                  <li><Link href="#">Careers</Link></li>
                  <li><Link href="#">Press</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[12px] uppercase tracking-wider mb-2 text-white/80">Policies &amp; Help</h4>
                <ul className="space-y-1.5 text-[12px] text-white/60">
                  <li><Link href="#">Privacy Policy</Link></li>
                  <li><Link href="#">Terms of Service</Link></li>
                  <li><Link href="#">Help Center</Link></li>
                  <li><Link href="#">Accessibility</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[12px] uppercase tracking-wider mb-2 text-white/80">Community</h4>
                <ul className="space-y-1.5 text-[12px] text-white/60">
                  <li><Link href="#">Brands</Link></li>
                  <li><Link href="#">Sitemap</Link></li>
                  <li><Link href="#">Blog</Link></li>
                </ul>
              </div>

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
      </div>
    </div>
  );
}
