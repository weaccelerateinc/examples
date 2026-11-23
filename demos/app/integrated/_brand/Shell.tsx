import Image from "next/image";
import { Check, Lock } from "lucide-react";

const STEPS = ["Details", "Payment", "Confirmation"] as const;

/** Progress through the three checkout screens. Done steps are volt, the current one carries the liquid ring. */
export function StepTrail({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="acc-steps" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "is-done" : n === current ? "is-current" : "";
        return (
          <li key={label} className="contents">
            {i > 0 && <span className={`acc-step-rail ${n <= current ? "is-done" : ""}`} aria-hidden />}
            <span className={`acc-step ${state}`} aria-current={n === current ? "step" : undefined}>
              <span className={`acc-step-dot ${n === current ? "acc-liquid" : ""}`} aria-hidden>
                {n < current ? <Check size={11} strokeWidth={3} /> : n === current ? <i /> : null}
              </span>
              <span className={n === current ? "" : "hidden sm:inline"}>{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Page chrome shared by the three screens: floating glass nav, title block, footer. */
export function Shell({
  step,
  title,
  lead,
  children,
}: {
  step: 1 | 2 | 3;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="acc-nav-wrap">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-8">
          <header className="acc-nav acc-shine">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Image
                src="/accelerate/wordmark-ink.svg"
                alt="Accelerate"
                width={560}
                height={87}
                priority
                className="h-[19px] sm:h-[22px] w-auto"
              />
              <span className="h-5 w-px bg-[var(--border-soft)]" aria-hidden />
              <span className="acc-tag">
                <span className="acc-tag-dot" aria-hidden />
                Demo store
              </span>
            </div>
            <div className="flex items-center gap-2 acc-small !text-[13.5px] !text-[var(--ink-3)]">
              <Lock size={15} strokeWidth={2} aria-hidden />
              <span className="hidden sm:inline font-medium">Secure checkout</span>
            </div>
          </header>
        </div>
      </div>

      <main className="max-w-[1080px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10 acc-reveal">
          <div>
            <h1 className="acc-h1">
              <span className="acc-pine-text">{title}</span>
            </h1>
            {lead && <p className="acc-lead mt-3 max-w-[520px]">{lead}</p>}
          </div>
          <StepTrail current={step} />
        </div>
        {children}
      </main>

      <footer className="max-w-[1080px] mx-auto px-4 sm:px-8 pb-10">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5 acc-caption">
            <span>Checkout powered by</span>
            <Image src="/accelerate/wordmark-ink.svg" alt="Accelerate" width={560} height={87} className="h-[13px] w-auto opacity-80" />
          </div>
          <nav className="flex gap-5 acc-caption">
            <a href="https://www.weaccelerate.com/privacy" className="hover:text-[var(--ink-1)] transition-colors">
              Privacy policy
            </a>
            <a href="https://www.weaccelerate.com/terms" className="hover:text-[var(--ink-1)] transition-colors">
              Terms of service
            </a>
            <a href="https://www.weaccelerate.com/help" className="hover:text-[var(--ink-1)] transition-colors">
              Help
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}

/** Text field whose label shows as grey text inside it. `prefix` renders a mono lead-in (e.g. +1). The focused field gets the liquid pine border (brand.css). */
export function Field({
  label,
  optional,
  prefix,
  filled,
  mono,
  className = "",
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
  prefix?: string;
  filled?: boolean;
  mono?: boolean;
}) {
  const id = input.id ?? `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className={className}>
      {/* The label is read by screen readers; sighted shoppers see it as the grey text inside the field. */}
      <label htmlFor={id} className="sr-only">
        {label}
        {optional && " (optional)"}
      </label>
      <div className={`acc-field ${filled ? "is-filled" : ""}`}>
        {prefix && <span className="acc-prefix">{prefix}</span>}
        <input
          id={id}
          placeholder={`${label}${optional ? " (optional)" : ""}`}
          {...input}
          className={mono ? "acc-num" : undefined}
        />
      </div>
    </div>
  );
}
