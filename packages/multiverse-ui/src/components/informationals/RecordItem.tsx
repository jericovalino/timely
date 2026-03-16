import { useState, type ReactNode } from "react";
import { RiArrowRightSLine } from "react-icons/ri";

import { cn } from "./../../utilities";
import Avatar, { type AvatarProps } from "./Avatar";
import Text from "./Text";
import Stack from "./../containers/Stack";

type RecordItemProps = {
  name: string;
  description: string;
  image?: AvatarProps;
  children?: ReactNode;
  rowContent?: ReactNode;
  className?: string;
  onClick?: () => void;
};

export default function RecordItem({
  name,
  description,
  image,
  children,
  rowContent,
  className,
  onClick,
  ...props
}: RecordItemProps) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Stack
      className={cn(
        "rounded-mds-4 border border-subtle bg-interface transition-shadow duration-300 ease-out hover:shadow-surface-raised relative",
        className,
      )}
      {...props}
    >
      {typeof onClick === "function" && (
        <button
          type="button"
          className="inset-0 absolute w-full h-full cursor-pointer"
          onClick={onClick}
        />
      )}
      <div
        className="flex cursor-pointer flex-row flex-wrap gap-5 p-4"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <Stack horizontal gap={12} align="center">
          {image && (
            <div className="flex flex-row items-center justify-center">
              <Avatar {...image} />
            </div>
          )}
          <Stack gap={2} justify="center" align="start" className="text-left">
            <Text weight="semibold" size="body" color="default">
              {name}
            </Text>
            <Text weight="normal" size="caption" color="subtle">
              {description}
            </Text>
          </Stack>
        </Stack>
        <div className="flex-auto">{rowContent}</div>
        <div className="flex items-center">
          <RiArrowRightSLine
            className={cn(
              "text-2xl text-brand transition-transform duration-300",
              open && "rotate-90",
            )}
          />
        </div>
      </div>
      {children && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            open ? "max-h-full opacity-100" : "max-h-0 opacity-0",
          )}
        >
          {children}
        </div>
      )}
    </Stack>
  );
}
