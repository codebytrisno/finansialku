import { MaterialSymbol } from "@/components/MaterialSymbol";

const CATEGORY_ICON_MAP: Record<string, string> = {
  wallet: "account_balance_wallet",
  laptop: "laptop",
  "trending-up": "trending_up",
  gift: "card_giftcard",
  download: "download",
  utensils: "restaurant",
  car: "directions_car",
  "shopping-bag": "shopping_bag",
  "file-text": "description",
  gamepad: "videogame_asset",
  hospital: "local_hospital",
  "book-open": "book",
  upload: "upload",
  home: "home",
  lightbulb: "lightbulb",
  pill: "medication",
  shirt: "checkroom",
  plane: "flight",
  film: "movie",
  "paw-print": "pets",
  briefcase: "work",
  "graduation-cap": "school",
  dumbbell: "fitness_center",
  coffee: "coffee",
  music: "music_note",
  smartphone: "smartphone",
  bank: "account_balance",
  "piggy-bank": "savings",
  "credit-card": "credit_card",
  landmark: "landmark",
  banknote: "payments",
  repeat: "repeat",
  transfer: "swap_horiz",
  target: "track_changes",
  "calendar-clock": "calendar_clock",
  "circle-dollar": "attach_money",
  percent: "percent",
  shield: "shield",
  "hand-coins": "hand_coins",
  "scroll-text": "article",
};

export const CATEGORY_ICON_NAMES = [
  "wallet", "laptop", "trending-up", "gift", "download",
  "utensils", "car", "shopping-bag", "file-text", "gamepad",
  "hospital", "book-open", "upload", "home", "lightbulb",
  "pill", "shirt", "plane", "film", "paw-print",
  "briefcase", "graduation-cap", "dumbbell", "coffee", "music",
  "smartphone", "bank", "piggy-bank", "credit-card", "landmark",
  "banknote", "repeat", "transfer", "target", "calendar-clock",
  "circle-dollar", "percent", "shield", "hand-coins", "scroll-text",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

export const DEFAULT_CATEGORY_ICON = "add_circle";

export function Icon({ name, className, size }: { name: string; className?: string; size?: number }) {
  const iconName = CATEGORY_ICON_MAP[name] || DEFAULT_CATEGORY_ICON;
  return <MaterialSymbol icon={iconName} className={className} size={size} />;
}
