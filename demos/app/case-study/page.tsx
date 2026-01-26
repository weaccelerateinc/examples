"use client";
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Users, Settings, BarChart3, ShieldCheck, FileText, Target, FlaskConical, Sparkles } from 'lucide-react';


export default function CaseStudyPage() {
  const [traffic, setTraffic] = useState<number>(1000000);
  const [aov, setAov] = useState<number>(300);

  // Constants from study
  const RATE_ORIG = 0.0462;
  const RATE_OPT = 0.0462 * 1.059; // 5.9% relative lift

  // Simulator calculations
  const simResults = useMemo(() => {
    const convOrig = Math.round(traffic * RATE_ORIG);
    const convOpt = Math.round(traffic * RATE_OPT);
    const revOrig = convOrig * aov;
    const revOpt = convOpt * aov;
    return {
      convOrig,
      convOpt,
      convDiff: convOpt - convOrig,
      revOrig,
      revOpt,
      revDiff: revOpt - revOrig
    };
  }, [traffic, aov, RATE_OPT]);

  return (
    <div className="min-h-screen w-screen bg-stone-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-800 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      {/* Navigation - Branded Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">Accelerate Case Study</span>
              <span className="text-xs text-slate-500">Identity-Powered Commerce</span>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-500">
              <a href="#simulator" className="hover:text-emerald-600 transition-colors">Simulator</a>
              <a href="#solution" className="hover:text-emerald-600 transition-colors">The Solution</a>
            </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 uppercase tracking-widest">
            Identity-Powered Commerce
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            87% Shopper Recognition.
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-600">
            How one merchant used Accelerate Checkout to turn identity into their most powerful growth engine.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">CVR Lift</span>
              <span className="text-4xl font-bold text-emerald-600 mt-2">+5.9%</span>
              <span className="text-sm text-slate-500 mt-1">Relative Efficiency</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Shopper Recognition</span>
              <span className="text-4xl font-bold text-slate-700 mt-2">87%+</span>
              <span className="text-sm text-slate-500 mt-1">US Coverage</span>
            </div>
          </div>
        </section>

        {/* Study Overview Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overview Card */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Overview & Implementation</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              A leading e-commerce ticketing merchant using <span className="font-semibold">Braintree</span> integrated Accelerate&apos;s <span className="font-semibold">modal implementation</span> in just <span className="font-semibold">2 weeks</span> across two flows: <span className="font-semibold">guest checkout</span> and <span className="font-semibold">logged-in users</span>. The control was already hyper-optimized—returning customers had vaulted cards via tokenization.
            </p>
          </div>

          {/* Objective Card */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Objective</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Inflect conversion rate (CVR) by expanding access to an accelerated checkout experience for customers beyond the client&apos;s tokenization and existing wallet options. A large portion of customers required card credential updates despite having past payment details tokenized.
            </p>
          </div>

          {/* Method Card */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Test Method</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              The merchant ran a controlled A/B comparison between their original checkout experience and an Accelerate-powered flow, measuring performance across identical purchase events. Accelerate was activated only when the &apos;add card&apos; radio button was selected given PayPal default selection.
            </p>
          </div>

          {/* Conclusion Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold">Conclusion</h3>
            </div>
            <p className="text-emerald-50 text-sm leading-relaxed">
              The improved checkout journey enabled by Accelerate - faster and less data entry - delivered meaningful conversion lift and revenue efficiency, without requiring changes to the payment stack. Even modest improvements in checkout flow translated into measurable gains at scale.
            </p>
          </div>
        </section>

        {/* Impact Simulator */}
        <section id="simulator" className="bg-white rounded-3xl border border-stone-200 p-8 md:p-12 shadow-sm scroll-mt-20">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900">Revenue Impact Calculator</h2>
            <p className="text-slate-500">See how Accelerate&apos;s conversion lift translates to your bottom line.</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700">Based on +5.9% CVR Lift</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-slate-600">Monthly Traffic</label>
                  <span className="text-2xl font-bold text-emerald-600">{traffic.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="1000000" 
                  max="30000000" 
                  step="100000" 
                  value={traffic} 
                  onChange={(e) => setTraffic(parseInt(e.target.value))}
                  className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Average Order Value ($)</label>
                <input 
                  type="number" 
                  value={aov} 
                  onChange={(e) => setAov(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
            </div>

            <div className="bg-emerald-600 rounded-2xl p-8 text-white shadow-xl">
              <h4 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-6">Projected Revenue Lift</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/20 pb-4">
                  <div>
                    <p className="text-xs opacity-70 mb-1">Without Accelerate</p>
                    <p className="text-xl font-medium">${Math.round(simResults.revOrig).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-70 mb-1">With Accelerate</p>
                    <p className="text-3xl font-bold">${Math.round(simResults.revOpt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold">Monthly Gain</p>
                  <p className="text-2xl font-bold">+${Math.round(simResults.revDiff).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Checkout Flow Section */}
        <section className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Expedited Checkout Flow</h2>
              <p className="text-slate-500 mt-2">From cart to confirmation in seconds—powered by identity recognition.</p>
            </div>
            <div className="relative w-full">
              <Image 
                src="/Acrobat_RGXByfR9zp.png" 
                alt="Accelerate Expedited Checkout Flow" 
                width={1200} 
                height={600} 
                className="w-full h-auto rounded-xl"
                priority
              />
            </div>
          </div>
        </section>

        {/* The Solution Section */}
        <section id="solution" className="space-y-12 scroll-mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">The Accelerate Solution</h2>
            <p className="text-slate-500 mt-2">Magic auto-fill meets intelligent card management.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SolutionCard 
              icon={<Users className="w-5 h-5 text-emerald-600" />} 
              title="87% Recognition" 
              text="Recognizes shoppers across the network, auto-filling payment/shipping info from just a name and phone number." 
            />
            <SolutionCard 
              icon={<Settings className="w-5 h-5 text-emerald-600" />} 
              title="Full Control" 
              text="Merchants remain the 'Merchant of Record.' No changes to payment processing or downstream workflows." 
            />
            <SolutionCard 
              icon={<BarChart3 className="w-5 h-5 text-emerald-600" />} 
              title="Stack-Ranked Cards" 
              text="Prioritizes customer cards based on usage frequency and balance depth to maximize success rates." 
            />
            <SolutionCard 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />} 
              title="Tokenized Security" 
              text="Uses secure tokens for credential transmission and updates card access to reduce failed transactions." 
            />
          </div>

          <div className="bg-stone-900 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold mb-6">Why Accelerate Outperforms</h3>
                <div className="space-y-6">
                  <AdvantageItem title="Merchant of Record" text="Retain full control over funds and processing with no downstream changes." />
                  <AdvantageItem title="Universal Card Coverage" text="Access to all major networks—Amex, Visa, and Mastercard—for every user." />
                  <AdvantageItem title="Network Recognition" text="Identify 87% of shoppers even if they've never visited your store before." />
                </div>
              </div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="text-center mb-6">
                  <span className="text-xs uppercase font-bold text-slate-500">Marketing Partnership Insight</span>
                </div>
                <p className="text-slate-300 text-sm italic leading-relaxed">
                  &quot;Merchants can prioritize certain cards based on partnerships. For example, Amex-heavy campaigns on ticketing platforms can ensure Amex cards are surfaced first to the relevant audience.&quot;
                </p>
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                  <Image src="/visa.svg" alt="Visa" width={48} height={32} className="h-6 w-auto opacity-70" />
                  <Image src="/mastercard.svg" alt="Mastercard" width={48} height={32} className="h-6 w-auto opacity-70" />
                  <Image src="/amex.svg" alt="Amex" width={48} height={32} className="h-6 w-auto opacity-70" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center text-slate-400 text-sm py-10">
          Accelerate Checkout® is a registered trademark. Case study data is based on controlled A/B testing results.
        </footer>
      </main>
    </div>
  );
}

const SolutionCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-200 hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h4 className="font-bold text-slate-900 mb-2">{title}</h4>
    <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
  </div>
);

const AdvantageItem: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="flex items-start">
    <span className="bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs font-bold mr-4 mt-1">✓</span>
    <div>
      <h5 className="font-semibold text-emerald-400">{title}</h5>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  </div>
);
