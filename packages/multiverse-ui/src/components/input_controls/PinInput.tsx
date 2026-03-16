import { type ComponentPropsWithoutRef } from "react";

import FieldWrapper, {
  type Props as WrapperProps,
} from "./../containers/FieldWrapper";

import PinFieldItem from "./PinFieldItem";

import { cn } from "./../../utilities";

type Props = {
  testId?: string;
  value: string;
  disabled?: boolean;
  validPin?: true;
  onChange: (_value: string) => void;
} & WrapperProps &
  ComponentPropsWithoutRef<typeof PinFieldItem>;

function PinInput({
  name,
  value,
  disabled = false,
  readOnly = false,
  onChange,
  ...props
}: Props) {
  return (
    <FieldWrapper name={name} readOnly={readOnly} gap={8} {...props}>
      <div className="relative w-full">
        <PinFieldItem
          value={value}
          disabled={disabled}
          onChange={(value) => {
            if (typeof onChange === "function") onChange(value);
          }}
          inputClassName={cn(
            props.error
              ? "border-danger-subtle bg-danger-subtle text-on-danger-subtle"
              : "focus:border-selected",
          )}
          {...props}
        />
      </div>
    </FieldWrapper>
  );
}

export default PinInput;
