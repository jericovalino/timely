import { cn } from "./../../utilities";

import Text from "./../informationals/Text";
import Stack from "./../containers/Stack";

import "./ToggleSwitch.css";
import FieldWrapper, {
  type Props as WrapperProps,
} from "../containers/FieldWrapper";

type DiscriminatedTitleProps<
  TOnValue = true,
  TOffValue = false,
  TValue = TOnValue | TOffValue,
> =
  | {
      title: string | ((value: NoInfer<TValue>) => string);
      description?: string | ((value: NoInfer<TValue>) => string);
      contained?: boolean;
      switchPosition?: "trailing" | "leading";
    }
  | {
      title?: never;
      description?: never;
      contained?: never;
      switchPosition?: never;
    };

type Props<
  TOnValue = true,
  TOffValue = false,
  TValue = TOnValue | TOffValue,
> = {
  id: string;
  name?: string;
  value: TValue;
  onChange: (value: NoInfer<TValue>) => void;
  testId?: string;
  onValue?: TOnValue;
  offValue?: TOffValue;
  readOnly?: boolean;
  disabled?: boolean;
} & DiscriminatedTitleProps<TOnValue, TOffValue, TValue> &
  WrapperProps;

function FormSwitch<const TOnValue, const TOffValue>({
  id,
  name,
  value,
  onChange,
  onValue: onV,
  offValue: offV,
  readOnly,
  disabled,
  testId,
  title,
  description,
  contained = false,
  switchPosition = "leading",
  ...rest
}: Props<TOnValue, TOffValue>) {
  const onValue = onV ?? true;
  const offValue = offV ?? false;
  const isLeading = switchPosition === "leading";

  return (
    <FieldWrapper {...rest}>
      <Stack
        horizontal
        gap={switchPosition === "leading" ? 12 : 24}
        className={cn(
          "w-full items-center",
          contained && "rounded-mds-4 border bg-interface px-mds-16 py-mds-12",
          isLeading ? "" : "flex-row-reverse justify-between"
        )}
      >
        <div className={cn("toggle-switch")}>
          <input
            id={id}
            name={name}
            data-test-id={testId}
            type="checkbox"
            checked={value === onValue}
            readOnly={readOnly}
            disabled={disabled}
            // @ts-expect-error dynamic value
            onChange={(e) => onChange(e.target.checked ? onValue : offValue)}
          />
          <label htmlFor={id ? id : `id-${name}`} />
        </div>
        {title ? (
          <Stack gap={4}>
            <Text
              size="overline"
              color="subtle"
              htmlFor={id ? id : `id-${name}`}
            >
              {typeof title === "function" ? title(value) : title}
            </Text>
            {description && (
              <Text
                weight="normal"
                size="caption"
                lineHeight="tight"
                className="text-subtle"
              >
                {typeof description === "function"
                  ? description(value)
                  : description}
              </Text>
            )}
          </Stack>
        ) : null}
      </Stack>
    </FieldWrapper>
  );
}

export default FormSwitch;
