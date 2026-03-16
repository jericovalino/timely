import { createContext, useContext, type ReactElement } from "react";

import FieldWrapper, {
  type Props as WrapperProps,
} from "../containers/FieldWrapper";
import Text from "../informationals/Text";
import Stack from "../containers/Stack";

import { cn } from "../../utilities";

const RadioGroupContext = createContext<Pick<
  Props<any>,
  "value" | "onChange"
> | null>(null);

const useRadioGroupContext = () => {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("Invalid use");
  return ctx;
};

type Props<TValue> = {
  label?: string;
  value: TValue;
  disabled?: boolean;
  onChange: (value: TValue) => void;
  children?: ReactElement<ItemProps> | ReactElement<ItemProps>[];
} & WrapperProps;

function RadioGroup<TValue>({
  onChange,
  value,
  children,
  ...rest
}: Props<TValue>) {
  return (
    <FieldWrapper {...rest}>
      <RadioGroupContext.Provider value={{ value, onChange }}>
        {children}
      </RadioGroupContext.Provider>
    </FieldWrapper>
  );
}

type ItemProps = {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  value: any;
  disabled?: boolean;
  contained?: boolean;
};

function RadioItem({
  id,
  name,
  label,
  value: checkedValue,
  description,
  disabled,
  contained,
}: ItemProps) {
  const { value, onChange } = useRadioGroupContext();

  return (
    <Text
      as="label"
      htmlFor={name ? `${name}-${checkedValue}` : id!}
      className={cn(
        "transition-colors duration-300",
        "flex cursor-pointer select-none flex-col",
        contained ? "p-4 rounded-lg border w-full bg-white" : "",
        disabled
          ? "cursor-not-allowed bg-interface-disabled text-disabled hover:bg-interface-disabled"
          : ""
      )}
    >
      <Stack
        horizontal
        gap={12}
        className={cn("group", description ? "items-start" : "items-center")}
      >
        <input
          id={name ? `${name}-${checkedValue}` : id!}
          name={name ?? id}
          disabled={disabled}
          type="radio"
          className={cn(
            "h-5 w-5 shrink-0",
            "border-subtle bg-interface",
            "disabled:cursor-not-allowed"
          )}
          checked={value === checkedValue}
          onChange={({ target: { checked } }) => {
            if (!checked) return;
            onChange(checkedValue);
          }}
        />
        <Stack gap={4} className="text-left">
          <Text
            size="body"
            color="default"
            className={cn("leading-none", {
              "mt-px": description,
            })}
          >
            {label}
          </Text>
          {description && (
            <Text size="caption" color="subtle" className="leading-normal">
              {description}
            </Text>
          )}
        </Stack>
      </Stack>
    </Text>
  );
}

RadioGroup.Item = RadioItem;

export default RadioGroup;
