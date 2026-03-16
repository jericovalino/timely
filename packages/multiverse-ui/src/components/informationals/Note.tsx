import { type IconType } from "react-icons";
import { isValidElement, type ComponentProps, type ReactElement } from "react";

import { cn } from "./../../utilities";

import Text from "./Text";
import Stack from "./../containers/Stack";
import Button from "./../input_controls/Button";

type Icon = IconType | ReactElement;
type Intent = Exclude<
  ComponentProps<typeof Button>["intent"],
  "inverse" | "primary" | undefined
>;

const MAP_TEXT_COLOR_CLASS = {
  default: "",
  info: "text-on-info-subtle",
  success: "text-on-success-subtle",
  warning: "text-on-warning-subtle",
  danger: "text-on-danger-subtle",
  inverse: "text-on-inverse-subtle",
} as const;

const MAP_ICON_COLOR_CLASS = {
  default: "text-brand",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  inverse: "text-inverse",
} as const;

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

type NoteProps = {
  message: string;
  title?: string;
  icon?: Icon;
  intent?: Intent;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function Note({
  message,
  title,
  icon,
  action,
  intent = "default",
}: NoteProps) {
  const renderIcon = (Icon: Icon) => {
    if (isValidElement(Icon)) return Icon;
    if (typeof Icon === "function") return <Icon />;
    return null;
  };

  return (
    <Stack
      horizontal
      gap={16}
      className={cn(
        "border border-white-400 bg-white",
        "rounded py-mds-10 pl-mds-14 pr-mds-10",
        MAP_TEXT_COLOR_CLASS[intent]
      )}
      align="center"
    >
      <Stack horizontal gap={14} align="center" className="relative flex-grow">
        <Stack horizontal gap={4} align="center">
          {icon && (
            <span
              className={cn(
                "grid place-items-center",
                MAP_ICON_COLOR_CLASS[intent]
              )}
            >
              {renderIcon(icon)}
            </span>
          )}

          {title && (
            <Text size="overline" color={MAP_TITLE_COLOR[intent] as Intent}>
              {title}
            </Text>
          )}
        </Stack>
        {message && (
          <Text size="caption" weight="medium">
            {message}
          </Text>
        )}
      </Stack>
      {action && (
        <Button
          size="sm"
          variant="solid"
          onClick={action.onClick}
          intent={MAP_BUTTON_INTENT[intent] as Intent}
        >
          {action.label}
        </Button>
      )}
    </Stack>
  );
}
