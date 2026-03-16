import React, {
  forwardRef,
  useCallback,
  type ReactNode,
  type ComponentProps,
} from "react";
import type { IconBaseProps, IconType } from "react-icons";

import { cn } from "./../../utilities";

// eslint-disable-next-line no-redeclare
import Text from "../informationals/Text";

type Size = keyof typeof MAP_SIZE_CLASS;
type Intent = keyof typeof MAP_SOLID_INTENT_CLASS;
type Variant = "solid" | "ghost" | "text" | "icon";

const MAP_SOLID_INTENT_CLASS = {
  default:
    "bg-interface-subtle text active:bg-interface-active hover:bg-interface-hovered drop-shadow-sm hover:shadow-button-hover",
  primary:
    "bg-brand text-on-brand hover:bg-brand-hovered active:bg-brand-active hover:shadow-button-hover",
  info: "bg-info text-on-info hover:bg-info-hovered active:bg-info-active hover:shadow-button-hover",
  success:
    "bg-success text-on-success hover:bg-success-hovered active:bg-success-active hover:shadow-button-hover",
  warning:
    "bg-warning text-on-warning hover:bg-warning-hovered active:bg-warning-active hover:shadow-button-hover",
  danger:
    "bg-danger text-on-danger hover:bg-danger-hovered active:bg-danger-active hover:shadow-button-hover",
  inverse:
    "bg-inverse text-on-inverse hover:bg-inverse-hovered active:bg-inverse-active hover:shadow-button-hover",
};

const MAP_GHOST_INTENT_CLASS = {
  default:
    "text bg-interface-subtle hover:bg-interface-subtle-hovered active:bg-interface-subtle-active hover:shadow-button-hover",
  primary:
    "text-on-brand-subtle bg-brand-subtle hover:bg-brand-subtle-hovered active:bg-brand-subtle-active hover:shadow-button-hover",
  info: "text-on-info-subtle bg-info-subtle hover:bg-info-subtle-hovered active:bg-info-subtle-active hover:shadow-button-hover",
  success:
    "text-on-success-subtle bg-success-subtle hover:bg-success-subtle-hovered active:bg-success-subtle-active hover:shadow-button-hover",
  warning:
    "text-on-warning-subtle bg-warning-subtle hover:bg-warning-subtle-hovered active:bg-warning-subtle-active hover:shadow-button-hover",
  danger:
    "text-on-danger-subtle bg-danger-subtle hover:bg-danger-subtle-hovered active:bg-danger-subtle-active hover:shadow-button-hover",
  inverse: "", //we don't have this yet.
};

const MAP_TEXT_INTENT_CLASS = {
  default:
    "text hover:bg-interface-subtle h-auto gap-1 active:bg-interface-selected-subtle",
  primary:
    "text-brand hover:bg-brand-subtle h-auto gap-1 active:bg-interface-selected-subtle",
  info: "text-info hover:bg-info-subtle h-auto gap-1 active:bg-interface-selected-subtle",
  success:
    "text-success hover:bg-success-subtle h-auto gap-1 active:bg-interface-selected-subtle",
  warning:
    "text-warning hover:bg-warning-subtle h-auto gap-1 active:bg-interface-selected-subtle",
  danger:
    "text-danger hover:bg-warning-subtle h-auto gap-1 active:bg-interface-selected-subtle",
  inverse: "", //we don't have this yet.
};

const MAP_ICON_INTENT_CLASS = {
  default:
    "text border bg-interface-subtle hover:bg-interface-hovered active:bg-interface-active hover:shadow-button-hover aspect-square",
  primary:
    "bg-brand text-on-brand hover:bg-brand-hovered active:bg-brand-active hover:shadow-button-hover aspect-square",
  info: "bg-info text-on-info hover:bg-info-hovered active:bg-info-active hover:shadow-button-hover aspect-square",
  success:
    "bg-success text-on-success hover:bg-success-hovered active:bg-success-active hover:shadow-button-hover aspect-square",
  warning:
    "bg-warning text-on-warning hover:bg-warning-hovered active:bg-warning-active hover:shadow-button-hover aspect-square",
  danger:
    "bg-danger text-on-danger hover:bg-danger-hovered active:bg-danger-active hover:shadow-button-hover aspect-square",
  inverse:
    "bg-inverse text-on-inverse hover:bg-inverse-hovered active:bg-inverse-active hover:shadow-button-hover aspect-square",
};

const MAP_SIZE_CLASS = {
  sm: "px-1 py-[0.375rem] h-[1.625rem]",
  default: "px-2 py-[0.625rem] h-9",
  lg: "px-[0.875rem] py-4 h-[3.125rem]",
};

const MAP_LABEL_SIZE = {
  sm: "caption",
  default: "body",
  lg: "body-large",
} as const satisfies Record<keyof typeof MAP_SIZE_CLASS, string>;

const MAP_ICON_SIZE_CLASS = {
  sm: "text-caption",
  default: "text-body",
  lg: "text-body-large",
} as const satisfies Record<keyof typeof MAP_SIZE_CLASS, string>;

type IconMiscProps = {
  icon: IconType;
  rounded?: boolean;
  children?: string;
};

type TextMiscProps = {
  style?: "default" | "bare";
};

type OtherMiscProps = {
  leadingIcon?: IconType;
  trailingIcon?: IconType;
  children: ReactNode;
};

type Props<TVariant extends Variant> = {
  intent?: Intent;
  type?: "button" | "submit";
  size?: Size;
  className?: string;
  disabled?: boolean;
  onClick?: ComponentProps<"button">["onClick"];
  fullWidth?: boolean;
  loading?: boolean;
  variant?: TVariant;
} & (TVariant extends "icon"
  ? IconMiscProps
  : TVariant extends "text"
    ? OtherMiscProps & TextMiscProps
    : OtherMiscProps);

function variantIsIcon(
  rest: { variant?: Variant } & (IconBaseProps | OtherMiscProps),
): rest is IconMiscProps {
  return rest.variant === "icon";
}

function variantIsNotIcon(
  rest: { variant?: Variant } & (IconBaseProps | OtherMiscProps),
): rest is OtherMiscProps {
  return rest.variant !== "icon";
}

function variantIsText(
  rest: { variant?: Variant } & (
    | IconBaseProps
    | OtherMiscProps
    | TextMiscProps
  ),
): rest is OtherMiscProps & TextMiscProps {
  return rest.variant === "text";
}

function removeAttributes<T extends Record<string, any>>(
  obj: T,
  keysToRemove: string[], // no strict here
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysToRemove.includes(key)),
  ) as Partial<T>;
}

const style = `svg#mds-button-spinner { width: 3.25rem; transform-origin: center; animation: rotate 2s linear infinite;}circle { fill: none; stroke: var(--brand-50); stroke-opacity: 0.5; stroke-width: 8; stroke-dasharray: 1, 200; stroke-dashoffset: 0; stroke-linecap: round; animation: dash 1.5s ease-in-out infinite;}@keyframes rotate { 100% {  transform: rotate(360deg); }}@keyframes dash { 0% {  stroke-dasharray: 1, 200;  stroke-dashoffset: 0; } 50% {  stroke-dasharray: 90, 200;  stroke-dashoffset: -35px; } 100% {  stroke-dashoffset: -125px; }}`;

const Button = forwardRef(
  <TVariant extends Variant = "solid">(
    {
      onClick,
      className,
      type = "button",
      size = "default",
      loading = false,
      disabled = false,
      intent = "default",
      fullWidth = false,
      children,
      ...rest
    }: Props<TVariant>,
    ref: React.LegacyRef<HTMLButtonElement>,
  ) => {
    const Icon = useCallback(
      (props: IconBaseProps) => {
        if (!variantIsIcon(rest)) return null;
        return <rest.icon {...props} />;
      },
      [rest],
    );
    const LeadingIcon = useCallback(
      (props: IconBaseProps) => {
        if (!variantIsNotIcon(rest)) return null;
        if (!rest.leadingIcon) return null;
        return <rest.leadingIcon {...props} />;
      },
      [rest],
    );
    const TrailingIcon = useCallback(
      (props: IconBaseProps) => {
        if (!variantIsNotIcon(rest)) return null;
        if (!rest.trailingIcon) return null;
        return <rest.trailingIcon {...props} />;
      },
      [rest],
    );

    return (
      <button
        ref={ref}
        type={type}
        aria-label={children?.toString()}
        className={cn(
          {
            solid: MAP_SOLID_INTENT_CLASS[intent],
            ghost: MAP_GHOST_INTENT_CLASS[intent],
            text: MAP_TEXT_INTENT_CLASS[intent],
            icon: MAP_ICON_INTENT_CLASS[intent],
          }[rest.variant ?? "solid"],
          variantIsText(rest) && rest.style === "bare"
            ? "px-0.5 py-0 hover:underline"
            : MAP_SIZE_CLASS[size],
          "relative transition-colors ease-in-out cursor-pointer",
          "flex items-center justify-center rounded",
          "ring-0 transition-shadow ease-in-out focus:outline-none focus:ring-4 focus:ring-interface-focus",
          "disabled:cursor-not-allowed disabled:border disabled:border-subtle disabled:bg-interface-disabled disabled:text-disabled",
          loading ? "pointer-events-none" : "",
          rest.variant === "icon" && variantIsIcon(rest) && rest.rounded
            ? "rounded-full"
            : "",
          fullWidth ? "w-full" : "",
          className,
        )}
        onClick={onClick}
        disabled={disabled}
        {...removeAttributes(rest, [
          "icon",
          "style",
          "variant",
          "leadingIcon",
          "trailingIcon",
          "rounded",
        ])}
      >
        <style>{style}</style>
        <Icon
          className={cn(MAP_ICON_SIZE_CLASS[size], loading && "opacity-25")}
        />
        <LeadingIcon
          className={cn(
            "ml-0.5",
            MAP_ICON_SIZE_CLASS[size],
            loading && "opacity-25",
          )}
        />
        {loading && (
          <svg
            className="absolute mx-auto h-[1.125rem] w-[1.125rem]"
            id="mds-button-spinner"
            viewBox="25 25 50 50"
          >
            <circle r="20" cy="50" cx="50" />
          </svg>
        )}

        {rest.variant !== "icon" && (
          <Text
            as="span"
            color="inherit"
            weight="semibold"
            size={MAP_LABEL_SIZE[size]}
            className={cn("mx-1 text-nowrap", loading && "opacity-25")}
          >
            {children}
          </Text>
        )}
        <TrailingIcon
          className={cn(
            "mr-0.5",
            MAP_ICON_SIZE_CLASS[size],
            loading && "opacity-25",
          )}
        />
      </button>
    );
  },
);

export default Button;
