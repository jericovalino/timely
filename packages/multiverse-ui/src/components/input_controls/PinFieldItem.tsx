import {
  OTPInput,
  OTPInputContext,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
  type SlotProps,
} from "input-otp";
import * as React from "react";
import { BsDot as Dot } from "react-icons/bs";

import { cn } from "./../../utilities";
import Text from "./../informationals/Text";

import "./PinFieldItem.css";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-x-2", className)}
    {...props}
  />
));

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {
    index: number;
    validPin?: true;
    error?: true;
  }
>(({ index, className, validPin, error, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[
    index
  ] as SlotProps;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-[4.375rem] w-[3.75rem] items-center justify-center rounded-mds-8 transition-all focus:outline-none",
        isActive && "z-10 ring-2 ring-interface-focus",
        validPin || error
          ? validPin
            ? "bg-success-subtle"
            : error
              ? "bg-danger-subtle"
              : ""
          : char
            ? "bg-brand-subtle"
            : "bg-interface outline outline-subtle",
        className,
      )}
      {...props}
    >
      {!char && !isActive ? (
        <Text
          size="display"
          weight="medium"
          color={
            error
              ? "on-danger-subtle"
              : validPin
                ? "on-success-subtle"
                : "disabled"
          }
        >
          -
        </Text>
      ) : (
        <Text
          size="display"
          weight="medium"
          className="uppercase"
          color={
            error
              ? "on-danger-subtle"
              : validPin
                ? "on-success-subtle"
                : "brand"
          }
        >
          {char}
        </Text>
      )}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="caret-blinking h-8 w-px bg-interface-selected duration-1000" />
        </div>
      )}
    </div>
  );
});

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
));

type Props = {
  /** Length of pin. Defaults to 6 */
  length?: number;
  /** Type of allowed characters. Defaults to  'numeric' */
  type?: "numeric" | "alpha-numeric" | "alpha";
  /** Custom class for input component */
  inputClassName?: string;
  /** Custom class for the container of inputs */
  inputContainerClassName?: string;
  value?: string;
  onChange?: (v: string) => void;
  /** Custom function that will run when all inputs have been entered. */
  onComplete?: (v: string) => void;
  disabled?: boolean;
};

const regexMapper = {
  numeric: REGEXP_ONLY_DIGITS,
  alpha: REGEXP_ONLY_CHARS,
  "alpha-numeric": REGEXP_ONLY_DIGITS_AND_CHARS,
};

export default function PinInput({
  value,
  length = 6,
  type = "numeric",
  inputClassName,
  inputContainerClassName,
  onComplete,
  onChange,
  disabled = false,
  ...rest
}: Props) {
  const patern = regexMapper[type];
  return (
    <InputOTP
      {...(value ? { value: value } : {})}
      maxLength={length}
      pattern={patern}
      onComplete={onComplete}
      onChange={onChange}
      disabled={disabled}
      autoFocus
    >
      <InputOTPGroup className={inputContainerClassName}>
        {Array.from({ length }, (_, index) => (
          <InputOTPSlot
            index={index}
            key={index}
            className={inputClassName}
            {...rest}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
