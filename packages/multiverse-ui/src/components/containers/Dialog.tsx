import type React from "react";
import type { ComponentProps } from "react";
import type { IconType } from "react-icons";
import { RiInformationFill } from "react-icons/ri";

import { cn } from "./../../utilities";
import Button from "./../input_controls/Button";
import Stack from "./Stack";
import Text from "./../informationals/Text";

type Intent = Exclude<
  ComponentProps<typeof Button>["intent"],
  "inverse" | "primary" | undefined
>;

const MAP_TEXT_COLOR_CLASS = {
  default: "",
  primary: "text-on-brand-subtle",
  info: "text-on-info-subtle",
  success: "text-on-success-subtle",
  warning: "text-on-warning-subtle",
  danger: "text-on-danger-subtle",
  inverse: "text-on-inverse-subtle",
};

const MAP_BG_COLOR_CLASS = {
  default: "",
  primary: "bg-brand-subtle",
  info: "bg-info-subtle",
  success: "bg-success-subtle",
  warning: "bg-warning-subtle",
  danger: "bg-danger-subtle",
  inverse: "bg-inverse-subtle",
};

const MAP_TITLE_COLOR = {
  default: "default",
  info: "info",
  warning: "warning",
  danger: "danger",
  success: "success",
};

const MAP_BUTTON_INTENT = {
  default: "primary",
  info: "info",
  warning: "warning",
  danger: "danger",
  success: "success",
};

const MAP_MODAL_WIDTH_CLASS = {
  sm: "max-w-sm",
  default: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

type BtnAction = { label: string; onClick: () => void };

type DialogProps = {
  title: string;
  message: React.ReactNode | string;
  primaryAction?: BtnAction;
  secondaryAction?: BtnAction;
  intent: Intent;
  size?: keyof typeof MAP_MODAL_WIDTH_CLASS;
  icon?: IconType;
  noIcon?: boolean;
  className?: string;
  isLoading?: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

const Dialog: React.FC<DialogProps> = ({
  title,
  message,
  primaryAction,
  secondaryAction,
  intent = "default",
  size = "default",
  icon: Icon,
  noIcon = false,
  onClose,
  isLoading,
  className,
  children,
}) => {
  return (
    <Stack
      gap={16}
      className={cn(
        "relative h-fit w-screen items-center rounded-lg border border-subtle bg-interface p-mds-24 text shadow-lg",
        MAP_MODAL_WIDTH_CLASS[size],
        className
      )}
    >
      {!noIcon && (
        <Stack
          className={cn(
            "padding rounded-md p-3.5 text-xl",
            MAP_TEXT_COLOR_CLASS[intent],
            MAP_BG_COLOR_CLASS[intent]
          )}
        >
          {Icon ? <Icon /> : <RiInformationFill />}
        </Stack>
      )}

      <Stack gap={16} align="center">
        <Text
          size="lead"
          weight="semibold"
          color={MAP_TITLE_COLOR[intent] as Intent}
        >
          {title}
        </Text>
        <Text as="p" className="text-center leading-none text-subtle">
          <span className="font-default text-[0.80rem] font-[200]">
            {message}
          </span>
        </Text>
        {children}
        <Stack horizontal distribute="between" gap={8} className="w-full">
          {secondaryAction && (
            <Button
              onClick={() => {
                secondaryAction.onClick();
                onClose();
              }}
              variant="solid"
              size="default"
              className="w-full text-body capitalize"
              intent="default"
              loading={isLoading}
              disabled={isLoading}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant="solid"
              size="default"
              className="w-full text-body font-semibold capitalize text-white"
              intent={MAP_BUTTON_INTENT[intent] as Intent}
              loading={isLoading}
              disabled={isLoading}
            >
              {primaryAction.label}
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Dialog;
