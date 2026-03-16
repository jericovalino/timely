import type { ComponentProps, JSX, ReactNode } from "react";
import { IoClose } from "react-icons/io5";

import Text from "./../informationals/Text";
import Button from "./../input_controls/Button";
import Stack from "./Stack";
import { cn } from "./../../utilities";

const MAP_DRAWER_WIDTH_SIZE = {
  narrow: "w-[25vw]",
  medium: "w-[30vw]",
  wide: "w-[35vw]",
  extended: "w-[40vw]",
  fullWidth: "w-[85vw]",
};

type BtnAction = Pick<
  ComponentProps<typeof Button>,
  "onClick" | "intent" | "disabled" | "variant"
> & {
  label: string;
};

type DrawerProps = {
  children: ReactNode;
  className?: string;
  secondaryAction?: BtnAction;
  primaryAction?: Omit<BtnAction, "intent">;
  title?: string;
  subtitle?: string;
  size?: keyof typeof MAP_DRAWER_WIDTH_SIZE;
  onCloseDrawer: () => void;
} & JSX.IntrinsicElements["div"];

const Drawer = ({
  children,
  title,
  subtitle,
  className,
  secondaryAction,
  primaryAction,
  size = "wide",
  onCloseDrawer,
  ...props
}: DrawerProps) => {
  return (
    <Stack
      gap={16}
      className={cn(
        "h-screen max-h-screen bg-surface-overlay p-mds-24 shadow-lg",
        MAP_DRAWER_WIDTH_SIZE[size],
        className,
      )}
      {...props}
    >
      <Stack horizontal distribute="between">
        <Stack gap={4}>
          {title && (
            <Text size="heading" weight="bold">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text size="caption" className="text-wrap text-xs text-subtle">
              {subtitle.charAt(0).toUpperCase() +
                subtitle.slice(1).toLowerCase()}
            </Text>
          )}
        </Stack>
        <Stack>
          <button
            type="button"
            onClick={onCloseDrawer}
            className="focus:outline-none cursor-pointer"
          >
            <IoClose />
          </button>
        </Stack>
      </Stack>
      <Stack className="flex-1 overflow-y-auto">{children}</Stack>
      <Stack gap={8} horizontal distribute="between" className="flex-wrap">
        <Stack width="auto">
          {secondaryAction && (
            <Button
              intent="default"
              className="w-auto capitalize"
              {...secondaryAction}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Stack>
        <Stack className="flex-1">
          {primaryAction && (
            <Button
              className="w-full font-semibold capitalize"
              {...primaryAction}
              intent="primary"
            >
              {primaryAction.label}
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Drawer;
