"use client";
import { FormEvent, useState, useEffect } from "react";
import { CheckoutSummary } from "./payment/CheckoutSummary";
import { stripeOptions } from "../options";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import Image from "next/image";
import Link from "next/link";
import { products, getProductByIdWithFallback } from "./products";
import type { Product } from "./products/types";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

function tryFormatPhone(pn: string): string {
  const cleanedNumber = pn.replace(/\D/g, "");
  if (!cleanedNumber.match(/^(1?\d{10})$/)) {
    return pn;
  }
  const last10 = cleanedNumber.slice(-10);
  return `${last10.slice(0, 3)}-${last10.slice(3, 6)}-${last10.slice(6)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  
  const [phoneNumber, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [email, setEmail] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (productId) {
      const product = getProductByIdWithFallback(productId);
      setSelectedProduct(product);
    }
  }, [productId]);

  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user?.addresses[0]) {
      setAddrLine1(user.addresses[0].line1 || addrLine1);
      setAddrCity(user.addresses[0].city || addrCity);
      setAddrState(user.addresses[0].state || addrState);
      setAddrZip(user.addresses[0].postalCode || addrZip);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams({
      email: (document.querySelector('input[placeholder="Email"]') as HTMLInputElement)?.value || "",
      phone: phoneNumber,
      firstName,
      lastName,
      address: addrLine1,
      city: addrCity,
      state: addrState,
      zip: addrZip,
      productId: selectedProduct?.id || "",
      quantity: "1",
    });
    router.push(`/pdpdemo/payment?${params.toString()}`);
  };

  const maybeLogin = (phoneValue: string) => {
    if (firstName == "" || lastName == "") return;
    const cleanedPhone = phoneValue.replace(/\D/g, "");
    const phoneRegex = /^(1\d{10}|[2-9]\d{9})$/;
    if (!phoneRegex.test(cleanedPhone)) return;
    const finalPhone = cleanedPhone.slice(-10);
    window.accelerate.login({
      firstName,
      lastName,
      phoneNumber: finalPhone,
      email: email || "test.demo@weaccelerate.com",
    });
  };

  // If no product is selected, show the catalog
  if (!selectedProduct) {
    return (
      <div className="flex overflow-hidden flex-col bg-white min-h-screen">
        <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
          <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
            <div className="flex justify-between w-full items-center">
              <div className="flex gap-3 items-center">
                <span className="text-3xl font-black text-black">
                  <Image src="/baggslogo.svg" alt="Baggs Logo" width={30} height={30} />
                </span>
                <span className="text-2xl font-bold tracking-tighter text-black">Accelerate Swag Store</span>
              </div>
              <Image src="/checkoutbag.svg" alt="Checkout Bag" width={30} height={30} className="h-6 w-6" />
            </div>
          </div>
        </header>

        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover our premium selection of high-quality products designed to enhance your lifestyle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-64 w-full">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {product.description}
                    </p>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {product.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={`/pdpdemo/product?product=${product.id}`}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
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

  // Show checkout form with selected product
  return (
    <div className="flex overflow-hidden flex-col bg-white">
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

      <main className="flex flex-wrap md:flex-nowrap md:flex-row-reverse justify-center w-full max-w-7xl mx-auto">
        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[520px] md:border-l border-neutral-200">
          <div className="max-w-[444px] w-full mx-auto">
            <CheckoutSummary
              shippingCost={0}
              onTotalChange={(total) => {
                console.log("Total changed:", total);
                return true;
              }}
              product={selectedProduct ? {
                imageSrc: selectedProduct.image,
                name: selectedProduct.name,
                price: selectedProduct.price
              } : undefined}
            />
          </div>
        </section>

        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[659px]">
          {/* Product Information */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/pdpdemo" className="text-blue-600 hover:underline">
                ← Back to Catalog
              </Link>
            </div>
            
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="relative w-16 h-16">
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-gray-600 text-sm">{selectedProduct.category}</p>
                <p className="font-bold text-gray-900">${selectedProduct.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row gap-3.5">
                  <input
                    data-testid="first-name-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => {
                      maybeLogin(phoneNumber);
                    }}
                    placeholder="First name"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    data-testid="last-name-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => {
                      maybeLogin(phoneNumber);
                    }}
                    placeholder="Last name"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhone(tryFormatPhone(e.target.value));
                    maybeLogin(e?.target.value);
                  }}
                  placeholder="Phone number"
                  type="tel"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Billing Information</h3>
              <div className="space-y-3.5">
                <input
                  placeholder="Address"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  placeholder="Apartments, suite, etc (optional)"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                  <input
                    placeholder="City"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="State"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="Zip code"
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full h-[56px] text-xl font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-sky-700/50 rounded-md"
              >
                Continue to Payment
              </button>
            </div>
          </form>

          <footer className="flex flex-wrap gap-3.5 py-5 mt-8 text-sm text-sky-600 border-t border-neutral-200">
            <a href="https://www.weaccelerate.com/privacy" className="hover:underline">
              Privacy policy
            </a>
            <a href="https://www.weaccelerate.com/terms" className="hover:underline">
              Terms of service
            </a>
          </footer>
        </section>
      </main>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("p1.onReady");
          window.accelerate.init({
            amount: selectedProduct ? selectedProduct.price * 100 : stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
              maybeUseAccelUser(user);
            },
            onCardSelected: (cid) => {
              console.log(cid);
            },
          });
        }}
      />
    </div>
  );
}
