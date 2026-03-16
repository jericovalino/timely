import { type IconType } from "react-icons";
import React, { createContext, useContext } from "react";

import { cn } from "./../../utilities";

import Text from "./../informationals/Text";
import Badge from "./../informationals/Badge";

const TabContext = createContext<Pick<Required<GroupProps>, "variant"> | null>(
  null,
);
const useTabContext = () => {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("Invalid use.");
  return ctx;
};

const MAP_GROUP_VARIANT_CLASS = {
  default: "h-fit space-x-2 border-b px-2",
  pill: "w-min gap-mds-8",
};
type GroupProps = {
  variant?: keyof typeof MAP_GROUP_VARIANT_CLASS;
  children: React.ReactElement | React.ReactElement[];
  id?: string;
  className?: string;
};
const Group = ({
  variant = "default",
  children,
  id,
  className,
}: GroupProps) => {
  return (
    <TabContext.Provider value={{ variant }}>
      <ul
        id={id}
        className={cn(
          "flex h-fit",
          MAP_GROUP_VARIANT_CLASS[variant],
          className,
        )}
      >
        {children}
      </ul>
    </TabContext.Provider>
  );
};

const MAP_ITEM_VARIANT_CLASS = {
  default:
    "px-mds-8 h-fit text border-b-2 py-mds-12 border-transparent leading-4 hover:border-brand-subtle font-medium",
  pill: "rounded p-mds-8 leading-4 hover:bg-brand-subtle hover:text-on-brand-subtle font-semibold text-subtle",
};

const MAP_ACTIVE_ITEM_VARIANT_CLASS = {
  default: "border-brand",
  pill: "bg-brand-subtle text-on-brand-subtle",
};

type ItemProps = {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  icon?: IconType;
  iconPosition?: "start" | "end";
  badge?: Pick<
    React.ComponentProps<typeof Badge>,
    "label" | "variant" | "intent"
  >;
  className?: string;
};
const Item = ({
  label,
  onClick,
  badge,
  icon: Icon,
  iconPosition = "start",
  isActive,
  className,
}: ItemProps) => {
  const { variant } = useTabContext();
  return (
    <li
      className={cn(
        "relative flex cursor-pointer items-center gap-mds-8",
        MAP_ITEM_VARIANT_CLASS[variant],
        isActive && MAP_ACTIVE_ITEM_VARIANT_CLASS[variant],
        className,
      )}
    >
      {Icon && iconPosition === "start" && (
        <Icon
          className={`aspect-square h-[0.875rem] w-[0.875rem] text-inherit`}
        />
      )}
      <Text
        color="inherit"
        weight={variant === "pill" ? "semibold" : "medium"}
        className="overflow-ellipsis whitespace-nowrap text-sm leading-4"
      >
        {label}
      </Text>
      {Icon && iconPosition === "end" && (
        <Icon
          className={`aspect-square h-[0.875rem] w-[0.875rem] text-inherit`}
        />
      )}
      {badge && <Badge {...badge} />}
      {typeof onClick === "function" && (
        <button
          type="button"
          onClick={onClick}
          className="absolute inset-0 h-full w-full cursor-pointer"
        />
      )}
    </li>
  );
};

export const Tab = {
  Group,
  Item,
};
