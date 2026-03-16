import React from "react";

import { cn } from "./../../utilities";

import Text from "./../informationals/Text";

type GroupProps = {
  children: React.ReactElement | React.ReactElement[];
  id?: string;
  className?: string;
};
const Group = ({ children, id, className }: GroupProps) => {
  return (
    <ul id={id} className={cn("flex w-full bg-brand-50", className)}>
      {children}
    </ul>
  );
};

type ItemProps = {
  step: number;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
};
const Item = ({ step, label, onClick, isActive, className }: ItemProps) => {
  return (
    <li
      className={cn(
        "relative flex flex-1 cursor-pointer items-center pl-mds-40 pr-mds-24 py-mds-20 gap-x-mds-14 rounded-r-full",
        isActive && "bg-brand-200",
        className,
      )}
    >
      <span
        className={cn(
          "w-5 h-5 rounded-full grid place-items-center bg-brand",
          !isActive && "opacity-60",
        )}
      >
        <Text size="caption" weight="bold" color="on-brand">
          {step}
        </Text>
      </span>
      <Text
        color="on-brand-subtle"
        size="body-large"
        weight="semibold"
        className={cn("whitespace-nowrap", !isActive && "opacity-60")}
      >
        {label}
      </Text>
      {typeof onClick === "function" && (
        <button
          type="button"
          onClick={onClick}
          className="absolute inset-0 h-full w-full"
        />
      )}
    </li>
  );
};

export const WizardTab = {
  Group,
  Item,
};
