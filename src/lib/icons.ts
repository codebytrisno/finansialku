import { createElement, type ComponentType } from "react";
import {
  LuWallet,
  LuLaptop,
  LuTrendingUp,
  LuGift,
  LuDownload,
  LuUtensilsCrossed,
  LuCar,
  LuShoppingBag,
  LuFileText,
  LuGamepad2,
  LuHospital,
  LuBookOpen,
  LuUpload,
  LuHouse,
  LuLightbulb,
  LuPill,
  LuShirt,
  LuPlane,
  LuFilm,
  LuPawPrint,
  LuBriefcase,
  LuGraduationCap,
  LuDumbbell,
  LuCoffee,
  LuMusic,
  LuSmartphone,
  LuFolder,
  LuBuilding2,
  LuPiggyBank,
  LuCreditCard,
  LuLandmark,
  LuBanknote,
  LuRepeat2,
  LuArrowRightLeft,
  LuTarget,
  LuCalendarClock,
  LuCircleDollarSign,
  LuBadgePercent,
  LuShield,
  LuHandCoins,
  LuScrollText,
} from "react-icons/lu";

type LucideIcon = ComponentType<{ className?: string; size?: number }>;

/**
 * Map of icon name → Lucide component for category icons.
 * Add new icons here when expanding the picker.
 */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  wallet: LuWallet,
  laptop: LuLaptop,
  "trending-up": LuTrendingUp,
  gift: LuGift,
  download: LuDownload,
  utensils: LuUtensilsCrossed,
  car: LuCar,
  "shopping-bag": LuShoppingBag,
  "file-text": LuFileText,
  gamepad: LuGamepad2,
  hospital: LuHospital,
  "book-open": LuBookOpen,
  upload: LuUpload,
  home: LuHouse,
  lightbulb: LuLightbulb,
  pill: LuPill,
  shirt: LuShirt,
  plane: LuPlane,
  film: LuFilm,
  "paw-print": LuPawPrint,
  briefcase: LuBriefcase,
  "graduation-cap": LuGraduationCap,
  dumbbell: LuDumbbell,
  coffee: LuCoffee,
  music: LuMusic,
  smartphone: LuSmartphone,
  bank: LuBuilding2,
  "piggy-bank": LuPiggyBank,
  "credit-card": LuCreditCard,
  landmark: LuLandmark,
  banknote: LuBanknote,
  repeat: LuRepeat2,
  transfer: LuArrowRightLeft,
  target: LuTarget,
  "calendar-clock": LuCalendarClock,
  "circle-dollar": LuCircleDollarSign,
  percent: LuBadgePercent,
  shield: LuShield,
  "hand-coins": LuHandCoins,
  "scroll-text": LuScrollText,
};

/** Ordered list of available category icon names for the icon picker */
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

/** Default fallback icon when a category has no recognized icon */
export const DEFAULT_CATEGORY_ICON = LuFolder;

/** Render a Lucide icon by its string name. Falls back to Folder icon. */
export function Icon({ name, className, size }: { name: string; className?: string; size?: number }) {
  const LucideIcon = CATEGORY_ICON_MAP[name] || DEFAULT_CATEGORY_ICON;
  return createElement(LucideIcon, { className, size });
}
