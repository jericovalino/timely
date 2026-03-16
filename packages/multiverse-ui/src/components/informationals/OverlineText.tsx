import type React from "react";
import type { ComponentProps } from "react";

import { cn } from "./../../utilities";

import Text from "./Text";
import Stack from "./../containers/Stack";
import Tooltip from "./Tooltip";
import { RiInformationFill } from "react-icons/ri";

type TooltipProps = Omit<ComponentProps<typeof Tooltip>, "children">;

type OverlineTextProps = {
  children: React.ReactNode;
  title: string;
  tooltip?: TooltipProps;
  className?: string;
};

export default function OverlineText({
  children,
  title,
  tooltip,
  className,
}: OverlineTextProps) {
  return (
    <Stack gap={4} className={cn("inline-flex", className)}>
      <Stack
        horizontal
        align="center"
        justify="start"
        gap={4}
        className=" text-left"
      >
        <Text size="overline" color="subtle">
          {title}
        </Text>
        {tooltip && (
          <Tooltip {...tooltip}>
            <RiInformationFill className="h-4 w-4 text-subtle" />
          </Tooltip>
        )}
      </Stack>
      {typeof children === "string" ? (
        <Text size="body" weight="medium">
          {children}
        </Text>
      ) : (
        children
      )}
    </Stack>
  );
}
