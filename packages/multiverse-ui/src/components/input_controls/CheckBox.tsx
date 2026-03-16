// eslint-disable-next-line no-redeclare
import Text from "../informationals/Text";
import Stack from "../containers/Stack";

import { cn } from "../../utilities";

type CheckboxProps<
  TCheckedValue = true,
  TUncheckedValue = false,
  TValue = TCheckedValue | TUncheckedValue,
> = {
  id?: string;
  name?: string;
  label?: string;
  checkedValue?: TCheckedValue;
  uncheckedValue?: TUncheckedValue;
  value: NoInfer<TValue>;
  onChange: (value: TValue) => void;
  description?: string;
  disabled?: boolean;
  contained?: boolean;
  indeterminate?: boolean;
};

const INDETERMINATE = `checked:border-blue-600 checked:bg-blue-600 checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22white%22%3E%3Crect%20x%3D%223%22%20y%3D%227%22%20width%3D%2210%22%20height%3D%222%22%20rx%3D%221%22%20ry%3D%221%22%20%2F%3E%3C%2Fsvg%3E')]`;

/**
 * CheckBox component for form inputs
 *
 * @component
 * @description A customizable CheckBox control that supports both boolean and string values
 *
 * @param {object} props - Component props
 * @param {string} props.name - Form name for the CheckBox
 * @param {string} props.label - Text label for the CheckBox
 * @param {function} props.onChange - Change handler that receives either a boolean or string value
 * @param {string} [props.description] - Additional descriptive text
 * @param {string} [props.id='CheckBox'] - Unique identifier for the CheckBox
 * @param {boolean} [props.indeterminate=false] - Whether to show indeterminate state (partially checked)
 * @param {boolean} [props.contained=false] - Whether to apply container styling
 * @param {boolean} [props.disabled] - Whether the CheckBox is disabled
 * @param {string} [props.value] - Value of the CheckBox (when used with string change handler)
 *
 * @example
 * ```tsx
 * const [checked, setChecked] = useState(false);
 *
 * <CheckBox
 *   name="accept-terms"
 *   label="I accept the terms and conditions"
 *   value={checked}
 *   onChange={setChecked}
 *   description="By checking this box, you agree to our terms of service"
 * />
 *
 * @returns {JSX.Element} CheckBox component
 */
function CheckBox<const TCheckedValue = true, const TUncheckedValue = false>({
  id,
  name,
  label,
  value,
  checkedValue: cV,
  uncheckedValue: uV,
  onChange,
  description,
  disabled = false,
  contained = false,
  indeterminate,
}: CheckboxProps<TCheckedValue, TUncheckedValue>) {
  const checkedValue = (cV ?? true) as TCheckedValue;
  const uncheckedValue = (uV ?? false) as TUncheckedValue;

  return (
    <Text
      as="label"
      htmlFor={name! ?? id}
      className={cn(
        "transition-colors duration-300",
        "flex cursor-pointer select-none flex-col",
        contained
          ? "rounded-mds-8 border border-subtle bg-interface p-mds-16"
          : "p-0",
        contained && checkedValue === value ? "border-brand" : ""
      )}
    >
      <Stack
        horizontal
        gap={12}
        className={cn("group", description ? "items-start" : "items-center")}
      >
        <input
          id={name ?? id}
          name={name ?? id}
          disabled={disabled}
          type="CheckBox"
          className={cn(
            "h-4 w-4",
            "border-subtle bg-interface cursor-pointer",
            "form-CheckBox rounded-mds-4 checked:!bg-brand checked:!ring-brand focus:!ring-brand",
            "disabled:cursor-not-allowed disabled:bg-interface-disabled disabled:text-disabled disabled:hover:bg-interface-disabled",
            indeterminate && INDETERMINATE
          )}
          checked={value === checkedValue}
          onChange={({ target: { checked } }) =>
            onChange(checked ? checkedValue : uncheckedValue)
          }
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

export default CheckBox;
