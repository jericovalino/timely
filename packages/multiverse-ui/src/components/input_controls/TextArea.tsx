import { cn } from "./../../utilities";

import FieldWrapper, {
  type Props as WrapperProps,
} from "./../containers/FieldWrapper";

type Props = {
  rows?: number;
  testId?: string;
  value: string;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  onChange: (value: string) => void;
} & WrapperProps;

function TextArea({
  name,
  value,
  error,
  rows = 3,
  disabled = false,
  readOnly = false,
  testId = undefined,
  maxLength = undefined,
  placeholder = undefined,
  onChange,
  ...rest
}: Props) {
  return (
    <FieldWrapper name={name} error={error} readOnly={readOnly} {...rest}>
      <textarea
        id={name}
        data-test-id={testId}
        value={value}
        rows={rows}
        className={cn(
          "min-h-9 w-full resize-y rounded-mds-4 border bg-white p-mds-10 text-body-tight text placeholder:text-placeholder",
          "focus:outline-none disabled:bg-interface-disabled",
          "read-only:text-on-interface-subtle read-only:bg-interface-subtle",
          error
            ? "border-danger-subtle bg-danger-subtle text-on-danger-subtle"
            : "focus:border-selected",
        )}
        onChange={(e) => {
          const { value } = e.target;
          if (typeof onChange === "function") onChange(value);
        }}
        placeholder={readOnly ? "" : placeholder}
        disabled={readOnly ? false : disabled}
        readOnly={readOnly}
        maxLength={maxLength}
      />
    </FieldWrapper>
  );
}

export default TextArea;
