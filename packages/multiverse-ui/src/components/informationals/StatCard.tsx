import React, {
  type ReactNode,
  type ComponentProps,
  type ReactElement,
} from "react";
import type { IconType } from "react-icons";
import { HiTrendingDown, HiTrendingUp } from "react-icons/hi";

import { cn } from "./../../utilities";

import Text from "./Text";
import Badge from "./Badge";
import Button from "./../input_controls/Button";

type Icon = IconType | ReactElement;
type Intent = Exclude<ComponentProps<typeof Badge>["intent"], undefined>;
type Size = keyof typeof MAP_CARD_WIDTH_CLASS;
type Trend = keyof typeof MAP_TREND_ICON;

type StatCardProps = {
  icon?: Icon;
  title: string;
  data: string;
  size?: Size;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  badge?: {
    label: string;
    trend: Trend;
    intent: Intent;
  };
};

const MAP_CARD_WIDTH_CLASS = {
  xs: "max-w-xs",
  default: "max-w-sm",
  md: "max-w-md",
} as const;
const MAP_TREND_ICON = {
  up: HiTrendingUp,
  down: HiTrendingDown,
} as const;

export default function StatCard({
  icon,
  title,
  data,
  action,
  badge,
  children,
}: StatCardProps) {
  const renderIcon = (Icon: Icon) => {
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === "function") return <Icon />;
    return null;
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border bg-surface-raised p-4"
        // MAP_CARD_WIDTH_CLASS[size]
      )}
    >
      <div className="flex w-full items-center gap-2">
        {icon && (
          <div
            className={cn(
              "grid size-10 place-items-center",
              "rounded-lg bg-brand-subtle text-2xl text-brand"
            )}
          >
            {renderIcon(icon)}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-0.5">
          <Text size="caption" className="leading-none text-subtle">
            {title}
          </Text>
          <div className="flex items-center gap-2">
            <Text size="subheading" weight="semibold">
              {data}
            </Text>
            {badge && (
              <Badge
                label={badge.label}
                intent={badge.intent}
                variant="ghost"
                icon={MAP_TREND_ICON[badge.trend]}
                leadingItem="icon"
              />
            )}
          </div>
        </div>
        {action && (
          <Button variant="ghost" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
      {children && (
        <div className="relative grid w-full place-items-center overflow-clip">
          {children}
        </div>
      )}
    </div>
  );
}
