"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Loader2, Minus, Plus, X, Package, Tag } from "lucide-react";
import Image from "next/image";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const address = searchParams.get("shippingAddress") || searchParams.get("address") || "";
  const city = searchParams.get("shippingCity") || searchParams.get("city") || "";
  const state = searchParams.get("shippingState") || searchParams.get("state") || "";
  const zip = searchParams.get("shippingZip") || searchParams.get("zip") || "";
  const billingAddress = searchParams.get("billingAddress") || address;
  const billingCity = searchParams.get("billingCity") || city;
  const billingState = searchParams.get("billingState") || state;
  const billingZip = searchParams.get("billingZip") || zip;
  const cardLast4 = searchParams.get("cardLast4") || "";
  const totalPrice = parseFloat(searchParams.get("totalPrice") || "0");
  const selectedShipping = searchParams.get("shipping") || "standard";

  const [qty, setQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build a query string with all current data to preserve state when navigating back
  const allParams = new URLSearchParams();
  if (firstName) allParams.set("firstName", firstName);
  if (lastName) allParams.set("lastName", lastName);
  if (email) allParams.set("email", email);
  if (phone) allParams.set("phone", phone);
  if (address) allParams.set("address", address);
  if (city) allParams.set("city", city);
  if (state) allParams.set("state", state);
  if (zip) allParams.set("zip", zip);
  if (billingAddress) allParams.set("billingAddress", billingAddress);
  if (billingCity) allParams.set("billingCity", billingCity);
  if (billingState) allParams.set("billingState", billingState);
  if (billingZip) allParams.set("billingZip", billingZip);
  if (cardLast4) allParams.set("cardLast4", cardLast4);
  if (selectedShipping) allParams.set("shipping", selectedShipping);
  if (totalPrice) allParams.set("totalPrice", String(totalPrice));

  const shippingEditUrl = `/victoriasecret?${allParams.toString()}`;
  const paymentEditUrl = `/victoriasecret/payment?${allParams.toString()}`;

  const itemPrice = 79.95;
  const subtotal = itemPrice * qty;
  const shippingCost = 8.00;
  const salesTax = 8.58;
  const total = subtotal + shippingCost + salesTax;

  const handlePlaceOrder = () => {
    setIsSubmitting(true);
    // Forward all params to confirmation
    router.push(
      `/victoriasecret/payment/confirmation?` +
        `firstName=${encodeURIComponent(firstName)}&` +
        `lastName=${encodeURIComponent(lastName)}&` +
        `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
        `shippingAddress=${encodeURIComponent(address)}&` +
        `shippingCity=${encodeURIComponent(city)}&` +
        `shippingState=${encodeURIComponent(state)}&` +
        `shippingZip=${encodeURIComponent(zip)}&` +
        `billingAddress=${encodeURIComponent(billingAddress)}&` +
        `billingCity=${encodeURIComponent(billingCity)}&` +
        `billingState=${encodeURIComponent(billingState)}&` +
        `billingZip=${encodeURIComponent(billingZip)}&` +
        `shipping=${encodeURIComponent(selectedShipping)}&` +
        `cardLast4=${encodeURIComponent(cardLast4)}&` +
        `totalPrice=${encodeURIComponent(totalPrice || total)}`
    );
  };

  return (
    <div className="min-h-screen w-screen bg-white ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      {/* Top Promotional Banner */}
      <div className="bg-[#FCE4EC] text-center py-2.5 px-4 text-sm relative">
        <span className="text-black">
          Last Day. App Exclusive: Save $30 When You Spend $150+.{" "}
        </span>
        <a href="#" className="text-black underline font-medium">
          Details
        </a>
        <button className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Pause">
          <Play className="w-3 h-3 text-black fill-black" />
        </button>
      </div>

      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="border-r border-gray-300 pr-3">
              <span
                className="text-[11px] tracking-[0.15em] uppercase leading-tight block text-center text-black"
                style={{ fontFamily: "Georgia, Times New Roman, serif" }}
              >
                <span className="block">VICTORIA&apos;S</span>
                <span className="block">SECRET</span>
              </span>
            </div>
            <span
              className="text-sm font-bold tracking-[0.2em] uppercase text-black"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              PINK
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column - Review Details */}
          <div className="flex-1 min-w-0">
            {/* Payment Section */}
            <div className="pb-6 mb-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-base font-bold text-black">Payment</h2>
                <a href={paymentEditUrl} className="text-xs text-black underline">Edit</a>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Image src="/visa.svg" alt="Visa" width={30} height={19} />
                <span className="text-sm text-black">Visa</span>
              </div>
              <p className="text-sm text-black">ending in {cardLast4 || "8502"}</p>
            </div>

            {/* Billing Address Section */}
            <div className="pb-6 mb-6 border-b border-gray-200">
              <h2 className="text-base font-bold text-black mb-3">Billing Address</h2>
              <div className="text-sm text-black space-y-0.5">
                <p>{firstName} {lastName}</p>
                <p>{billingAddress}</p>
                <p>{billingCity}, {billingState} {billingZip}</p>
                {phone && <p>{phone}</p>}
                {email && <p>{email}</p>}
              </div>
            </div>

            {/* Ship To You */}
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-5 h-5 text-black" />
              <span className="text-base font-bold text-black">Ship To You</span>
            </div>

            {/* Shipping Address */}
            <div className="pb-6 mb-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-base font-bold text-black">Shipping Address</h2>
                <a href={shippingEditUrl} className="text-xs text-black underline">Edit</a>
              </div>
              <div className="text-sm text-black space-y-0.5">
                <p>{firstName} {lastName}</p>
                <p>{address}</p>
                <p>{city}, {state} {zip}</p>
                {phone && <p>{phone}</p>}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="pb-6 mb-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-base font-bold text-black">Shipping Method</h2>
                <a href={shippingEditUrl} className="text-xs text-black underline">Edit</a>
              </div>
              <div className="text-sm text-black space-y-0.5">
                <p>Est. Delivery Feb. 23 - Feb. 26</p>
                <p>Standard Delivery</p>
              </div>
            </div>

            {/* Gift Options */}
            <div className="pb-6 mb-6 border-b border-gray-200">
              <h2 className="text-base font-bold text-black mb-3">Gift options</h2>
              <p className="text-sm text-black">None</p>
            </div>

            {/* Product Item */}
            <div className="pb-6 mb-6 border-b border-gray-200">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-[120px] h-[160px] bg-gray-100 rounded flex-shrink-0 relative overflow-hidden">
                  <Image
                    src="/1127128301T8_OM_F.png"
                    alt="Satin Rose Lace-Trim Midi Robe"
                    fill
                    className="object-cover"
                  />
                  <button className="absolute top-1 right-1 text-gray-500 hover:text-black">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Victoria&apos;s Secret</p>
                  <p className="text-sm font-bold text-black mb-1">Satin Rose Lace-Trim Midi Robe</p>
                  <p className="text-xs text-gray-500 mb-2">27264038 | In Stock</p>

                  <div className="text-xs text-black space-y-0.5 mb-3">
                    <p>
                      <span className="text-gray-500 inline-block w-12">Color</span>
                      <span>Royal Pink (01T8)</span>
                    </p>
                    <p>
                      <span className="text-gray-500 inline-block w-12">Size</span>
                      <span>M</span>
                    </p>
                  </div>

                  <div className="flex gap-4 text-xs mb-3">
                    <a href="#" className="text-black underline">Edit</a>
                    <a href="#" className="text-black underline">Change Delivery Method</a>
                  </div>

                  <p className="text-sm font-bold text-black">${subtotal.toFixed(2)}</p>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-sm text-black">Qty</span>
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-2.5 py-1.5 text-black hover:bg-gray-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1.5 text-sm text-black border-x border-gray-300 min-w-[32px] text-center">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="px-2.5 py-1.5 text-black hover:bg-gray-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-[300px] flex-shrink-0 lg:sticky lg:top-8 h-fit">
            {/* Order Summary */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-black mb-4">Order Summary</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between font-bold">
                  <span className="text-black">Subtotal ({qty} Item{qty !== 1 ? "s" : ""})</span>
                  <span className="text-black">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Shipping</span>
                  <span className="text-black">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Sales Tax</span>
                  <span className="text-black">${salesTax.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                <span className="text-base font-bold text-black">Total</span>
                <span className="text-base font-bold text-black">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Free & easy returns */}
            <div className="border border-gray-200 rounded-sm p-4 mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Package className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-sm font-bold text-black">Free &amp; easy returns on all U.S. orders</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    In-store or by mail. Now with no printer needed!{" "}
                    <a href="#" className="underline text-black">Details</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Apply an Offer Code */}
            <div className="mb-6">
              <button className="flex items-center gap-2 text-sm text-black">
                <Tag className="w-4 h-4" />
                <span className="underline">Apply an Offer Code</span>
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-600 mb-6">
              By selecting &quot;Place Order&quot; you agree to{" "}
              <a href="#" className="underline text-black">Terms of Use</a>,{" "}
              <a href="#" className="underline text-black">Privacy Policy</a>{" "}
              &amp; <a href="#" className="underline text-black">Return Policy</a>.
              Not for resale, personal use only.
            </p>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full bg-[#F8C8D4] text-black font-bold py-4 text-sm tracking-[0.15em] uppercase hover:bg-[#F0B0C0] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "PLACE ORDER"
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 bg-white">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-5">
            <p className="text-xs font-bold text-black uppercase tracking-wider mb-1">
              Need Help?
            </p>
            <p className="text-xs text-gray-600">
              1.800.411.5116
              <span className="text-gray-300 mx-2">|</span>
              <a href="#" className="text-gray-600 hover:underline">
                Live Chat
              </a>
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            © 2026 Victoria&apos;s Secret. All Rights Reserved.
          </p>
          <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-[11px] text-gray-500">
            <a href="#" className="hover:underline">Terms of Use</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Privacy &amp; Security</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Report a Vulnerability</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">California Privacy Rights</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Do Not Sell or Share My Personal Information</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Modern Slavery Transparency Statement</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Ad Preferences</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Careers</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Product Catalog</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Site Map</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}
