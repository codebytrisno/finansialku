import * as MdIcons from "react-icons/md";
import type { IconType } from "react-icons";

function toPascalCase(str: string): string {
  return str
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

const FALLBACK_MAP: Record<string, string> = {
  calendar_clock: "CalendarMonth",
  finance: "AccountBalance",
  target: "CenterFocusStrong",
  landmark: "AccountBalance",
  hand_coins: "MonetizationOn",
};

interface MaterialSymbolProps {
  icon: string;
  className?: string;
  fill?: boolean;
  size?: number;
}

export function MaterialSymbol({
  icon,
  className = "",
  fill = false,
  size,
}: MaterialSymbolProps) {
  const resolvedName = FALLBACK_MAP[icon] || icon;
  const baseName = toPascalCase(resolvedName);
  const componentName = fill ? `Md${baseName}` : `MdOutline${baseName}`;
  const icons = MdIcons as unknown as Record<string, IconType>;
  const IconComponent =
    icons[componentName] || icons[`Md${baseName}`] || MdIcons.MdOutlineStar;

  return (
    <IconComponent
      className={`select-none ${className}`}
      size={size}
      aria-hidden
    />
  );
}
