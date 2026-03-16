import React, { type ComponentPropsWithoutRef } from "react";

import Text from "./../informationals/Text";
import Stack from "./../containers/Stack";
import Avatar from "./../informationals/Avatar";
import Pagination from "./Pagination";

import { cn } from "./../../utilities";

type NavlistProps = {
  children: React.ReactNode;
  width?: string | number;
  height?: string | number;
  rootClassName?: string;
  itemClassName?: string;
};

const Navlist = ({
  children,
  width,
  height,
  rootClassName,
  itemClassName,
}: NavlistProps) => {
  const childrenArray = React.Children.toArray(children);

  const header = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === Navlist.Header
  );
  const items = childrenArray.filter(
    (child) => React.isValidElement(child) && child.type === Navlist.Item
  );
  const footer = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === Navlist.Footer
  );

  if (items.length === 0) {
    throw new Error(
      "Navlist: At least one `Navlist.Item` is expected as a child."
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-clip rounded-mds-4 border bg-surface",
        rootClassName
      )}
      style={{ width, height }}
    >
      {header}
      <ul className={cn("h-full w-full overflow-y-auto", itemClassName)}>
        {items}
      </ul>
      {footer}
    </div>
  );
};

export type HeaderProps = {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
};

const Header = ({ children, title, subtitle, className }: HeaderProps) => {
  return (
    <div className={cn("flex flex-col gap-3 bg-surface p-4", className)}>
      {title && (
        <Stack gap={4}>
          <Text size="lead" weight="semibold" color="default">
            {title}
          </Text>
          {subtitle && (
            <Text size="body" weight="normal" className="text-subtle">
              {subtitle}
            </Text>
          )}
        </Stack>
      )}
      {children}
    </div>
  );
};

export type ItemProps = {
  children?: React.ReactNode;
  label?: string;
  avatar?: ComponentPropsWithoutRef<typeof Avatar>;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
};

const Item = ({
  children,
  label,
  avatar,
  isActive = false,
  onClick,
  className,
}: ItemProps) => {
  return (
    <li
      {...(onClick && { onClick })}
      className={cn(
        "flex cursor-pointer gap-2 bg-interface px-6 py-4",
        isActive && [
          "relative bg-brand-subtle",
          "before:absolute before:left-0 before:top-0 before:content-['']",
          "before:h-full before:w-[0.313rem] before:bg-icon-on-brand-subtle",
          "before:rounded-br-md before:rounded-tr-md",
        ],
        className
      )}
    >
      {avatar && <Avatar size={32} {...avatar} />}
      {label && (
        <Text
          weight={!isActive ? "medium" : "semibold"}
          className={cn("mb-1 text-subtle", isActive && "text-on-brand-subtle")}
        >
          {label}
        </Text>
      )}
      {children}
    </li>
  );
};

export type FooterProps = {
  children?: React.ReactNode;
  pagination?: ComponentPropsWithoutRef<typeof Pagination>;
  className?: string;
};

const Footer = ({ children, pagination, className }: FooterProps) => {
  return (
    <div
      className={cn(
        "space-y-3 bg-surface p-mds-16 shadow-[0_-4px_6px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      {children}
      {pagination && <Pagination variant="simple" {...pagination} />}
    </div>
  );
};

Navlist.Header = Header;
Navlist.Item = Item;
Navlist.Footer = Footer;

export default Navlist;
