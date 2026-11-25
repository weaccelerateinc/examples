import {
  Archive,
  Brain,
  CircleDollarSign,
  Coins,
  Cookie,
  FileText,
  Handshake,
  Key,
  PaintBucket,
  SendToBack,
  ShoppingCart,
  SquareCode,
  Star,
  TestTube,
  User,
  type LucideIcon,
} from "lucide-react";

// GitBook frontmatter uses Font Awesome names. Map them to Lucide equivalents.
const ICONS: Record<string, LucideIcon> = {
  star: Star,
  "cabinet-filing": Archive,
  "cart-xmark": ShoppingCart,
  coin: Coins,
  "coin-front": CircleDollarSign,
  cookie: Cookie,
  "fill-drip": PaintBucket,
  "handshake-simple": Handshake,
  key: Key,
  "send-backward": SendToBack,
  "square-code": SquareCode,
  user: User,
  "vial-virus": TestTube,
  brain: Brain,
};

export function PageIcon({ name, size = 16, className }: { name?: string; size?: number; className?: string }) {
  if (!name) return null;
  if (name === "stripe") {
    return (
      <span className={`icon-stripe ${className ?? ""}`} style={{ fontSize: size * 0.62 }} aria-hidden>
        stripe
      </span>
    );
  }
  const Icon = ICONS[name] ?? FileText;
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden />;
}
