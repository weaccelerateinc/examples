export interface DemoProduct {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  images: string[];
  variants: Array<{ id: number; price: number; is_enabled: boolean }>;
}

export const rememberMeProducts: DemoProduct[] = [
  {
    id: "airpods",
    title: "AirPods",
    summary: "Experience the magic of wireless audio with Apple AirPods. They deliver an unparalleled listening experience with all your devices.",
    description: `<p>Experience the magic of wireless audio with Apple AirPods. They deliver an unparalleled listening experience with all your devices.</p>
      <ul>
        <li>Rich, high-quality audio and voice</li>
        <li>Seamless switching between devices</li>
        <li>Listen and talk all day with multiple charges from the Charging Case</li>
      </ul>`,
    tags: ["electronics", "audio"],
    images: ["/airpods.jpg"],
    variants: [{ id: 1, price: 99, is_enabled: true }],
  },
];
