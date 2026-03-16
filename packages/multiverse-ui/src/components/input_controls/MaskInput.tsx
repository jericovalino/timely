import { useMemo } from "react";
import { PatternFormat, type PatternFormatProps } from "react-number-format";

import { cn } from "./../../utilities";

import FieldWrapper, {
  type Props as FormWrapperProps,
} from "./../containers/FieldWrapper";

const PRESET_MASKS = {
  mobile: "+63 ### ### ####",
  landline: "(##) ####-####",
  postal: "####",
  tin: "###-###-###",
  sss: "##-#######-#",
  philhealth: "##-#########-#",
  pagibig: "####-####-####",
  creditCard: "#### #### #### ####",
} as const;

type PresetMasks = keyof typeof PRESET_MASKS;

type BaseProps = {
  mask: string | string[];
  patternChar?: string;
  alwaysShowMask?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
} & Omit<PatternFormatProps, "format" | "allowEmptyFormatting" | "onChange"> &
  (WithPresetMask | WithoutPresetMask) &
  (WithPlaceholder | WithoutPlaceholder);

type WithPresetMask = { presetMask: PresetMasks; maskPattern?: string };
type WithoutPresetMask = { presetMask?: undefined; maskPattern: string };

type WithPlaceholder = { alwaysShowMask?: false; placeholder?: string };
type WithoutPlaceholder = { alwaysShowMask?: true; placeholder?: never };

type Props = BaseProps & FormWrapperProps;

const MaskInput = ({
  name,
  error,
  readOnly = false,
  mask = "_",
  presetMask,
  maskPattern,
  patternChar = "#",
  placeholder,
  alwaysShowMask = false,
  defaultValue,
  value,
  onChange,
  className,
  ...props
}: Props) => {
  const formWrapperProps = props.inline
    ? { name, error, readOnly, inline: props.inline }
    : {
        name,
        error,
        readOnly,
        label: props.label,
        optional: props.optional,
        helpText: props.helpText,
      };

  const getFormattedPattern = (presetMask: string, patternChar: string) => {
    const defaultPatternChar = "#";
    return presetMask.replace(new RegExp(defaultPatternChar, "g"), patternChar);
  };

  const resolvedPattern = useMemo(() => {
    return (
      (presetMask
        ? getFormattedPattern(PRESET_MASKS[presetMask], patternChar)
        : maskPattern) ?? ""
    );
  }, [presetMask, patternChar, maskPattern]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = e.target.value;
    const rawValue = maskedValue.replace(
      new RegExp(`[^${patternChar}a-zA-Z0-9]`, "g"),
      "",
    );
    if (onChange) onChange(rawValue);
  };

  return (
    <FieldWrapper {...formWrapperProps}>
      <PatternFormat
        id={name}
        mask={mask}
        format={resolvedPattern}
        patternChar={patternChar}
        placeholder={placeholder}
        allowEmptyFormatting={alwaysShowMask}
        defaultValue={defaultValue}
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        className={cn(
          "h-9 w-full rounded-mds-4 border bg-white px-mds-10 pb-[0.063rem] text-body text placeholder:text-placeholder",
          "focus:outline-none disabled:bg-interface-disabled ",
          "read-only:text-on-interface-subtle read-only:bg-interface-subtle",
          error
            ? "border-danger-subtle bg-danger-subtle text-on-danger-subtle"
            : "focus:border-selected",
          className,
        )}
        {...props}
      />
    </FieldWrapper>
  );
};

export default MaskInput;
