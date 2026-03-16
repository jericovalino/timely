import { useMemo } from "react";
import type { IconType } from "react-icons";
import { NumericFormat } from "react-number-format";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";

import { cn } from "./../../utilities";

import FieldWrapper, {
  type Props as WrapperProps,
} from "../containers/FieldWrapper";

type Props = {
  testId?: string;
  icon?: IconType;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  min?: number;
  max?: number;
  allowNegative?: boolean;
} & (
  | {
      allowLeadingZeros?: false;
      onChange: (value: number) => void;
      value: number;
      showControls?: boolean;
    }
  | {
      allowLeadingZeros: true;
      onChange: (value: string) => void;
      value: string;
      showControls: never;
    }
) &
  WrapperProps;

function FormNumber({
  name,
  error,
  icon: Icon,
  disabled = false,
  readOnly = false,
  testId = undefined,
  maxLength = undefined,
  placeholder = undefined,
  allowNegative = false,
  min = 0,
  max,
  ...rest
}: Props) {
  const hasIcon = useMemo(() => Boolean(Icon), [Icon]);

  const Component = useMemo(
    () => (readOnly ? "input" : NumericFormat),
    [readOnly],
  );

  return (
    <FieldWrapper name={name} error={error} readOnly={readOnly} {...rest}>
      <div className="relative w-full">
        {Icon ? (
          <Icon
            className={cn(
              "absolute left-[0.5625rem] top-1/2 h-[0.875rem] w-[0.875rem] -translate-y-1/2 text-subtle",
              disabled ? "text-disabled" : "",
              error ? "text-on-danger-subtle" : "",
            )}
          />
        ) : null}
        <Component
          id={name}
          decimalScale={2}
          allowLeadingZeros={rest.allowLeadingZeros}
          allowNegative={allowNegative}
          data-test-id={testId}
          value={rest.value}
          className={cn(
            "h-9 w-full rounded border bg-white p-[0.5625rem] text-sm leading-4 text placeholder:text-placeholder",
            "focus:outline-none disabled:bg-interface-disabled ",
            "[&:not(:disabled)]:read-only:border-none [&:not(:disabled)]:read-only:bg-white [&:not(:disabled)]:read-only:px-0 [&:not(:disabled)]:read-only:pt-1.5 ",
            rest.showControls ? "pr-[1.875rem]" : "",
            hasIcon ? "pl-[1.6rem]" : "",
            error
              ? "border-danger-subtle bg-danger-subtle text-on-danger-subtle"
              : "focus:border-selected",
          )}
          onChange={(e) => {
            const { value } = e.target;
            if (!rest.allowLeadingZeros) {
              rest.onChange(value as unknown as number);
              return;
            }
            rest.onChange(value);
          }}
          placeholder={readOnly ? "-" : placeholder}
          disabled={readOnly ? false : disabled}
          readOnly={readOnly}
          maxLength={maxLength}
        />

        {rest.showControls && (
          <div
            className={cn(
              "absolute right-0 top-0 z-10 flex h-9 w-8 flex-col divide-y overflow-clip rounded-r",
              "border-b border-l border-r border-t border-b-transparent border-r-transparent border-t-transparent",
            )}
          >
            <button
              type="button"
              className={cn(
                "grid h-full w-full place-items-center text-subtle",
                "hover:bg-interface-hovered active:bg-interface disabled:cursor-not-allowed",
              )}
              onClick={() =>
                rest.onChange(
                  max !== undefined
                    ? Math.min((rest.value as number) + 1, max)
                    : (rest.value as number) + 1,
                )
              }
              disabled={rest.value >= (max ?? Infinity)}
            >
              <HiChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "grid h-full w-full place-items-center text-subtle",
                "hover:bg-interface-hovered active:bg-interface disabled:cursor-not-allowed",
              )}
              onClick={() => rest.onChange(Math.max(rest.value - 1, min))}
              disabled={rest.value <= min}
            >
              <HiChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

export default FormNumber;
