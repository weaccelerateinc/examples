import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold mb-8">Accelerate + Stripe Merchant Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link 
          href="/integrated" 
          className="p-6 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Integrated Checkout</h2>
          <p className="text-gray-600">Original integrated payment flow</p>
        </Link>
        
        <Link 
          href="/integrated2" 
          className="p-6 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Integrated2 Checkout</h2>
          <p className="text-gray-600">Duplicate of integrated payment flow with speech-to-text</p>
        </Link>
        
        <Link 
          href="/integrated3" 
          className="p-6 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Integrated3 Checkout</h2>
          <p className="text-gray-600">Integrated payment flow with cookies to persist login</p>
        </Link>
      </div>
    </div>
  );
}
