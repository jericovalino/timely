import "timepicker-ui/index.css";

import { useRef, useEffect } from "react";
import { FaRegClock } from "react-icons/fa";
import { BiChevronDown } from "react-icons/bi";
import { PatternFormat } from "react-number-format";
import { TimepickerUI } from "timepicker-ui";

import FieldWrapper, {
  type Props as WrapperProps,
} from "../containers/FieldWrapper";
import Button from "./Button";
import { cn } from "../../utilities";

// "HH:mm" (24h) → "H:mm AM/PM" (12h) for setValue
const to12hStr = (value: string): string => {
  const [hStr = "", mStr = ""] = value.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return "";
  const period = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${period}`;
};

// onConfirm payload → "HH:mm" (24h)
const to24hStr = (hour: string, minutes: string, type?: string): string => {
  let h = parseInt(hour, 10);
  if (type === "AM") h = h === 12 ? 0 : h;
  else if (type === "PM") h = h === 12 ? 12 : h + 12;
  return `${String(h).padStart(2, "0")}:${minutes}`;
};

const isValidTime = (hh: string, mm: string) =>
  Number(hh) < 24 && Number(mm) < 60;

type Props = {
  testId?: string;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
} & WrapperProps;

function TimeInput({
  name,
  error,
  disabled = false,
  readOnly = false,
  testId = undefined,
  placeholder = "hh:mm",
  value,
  onChange,
  ...rest
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<TimepickerUI | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Init timepicker-ui once on mount
  useEffect(() => {
    if (!hiddenRef.current) return;

    const picker = new TimepickerUI(hiddenRef.current, {
      clock: { type: "12h", autoSwitchToMinutes: true },
      ui: { theme: "basic", backdrop: true, animation: true },
      labels: { time: "Select Time", ok: "OK", cancel: "Cancel" },
      callbacks: {
        onConfirm: ({ hour, minutes, type }) => {
          if (!hour || !minutes) return;
          onChangeRef.current(to24hStr(hour, minutes, type));
        },
      },
    });

    picker.create();
    pickerRef.current = picker;

    return () => picker.destroy();
  }, []);

  // Sync external value → picker internal state
  useEffect(() => {
    if (!pickerRef.current || !value) return;
    pickerRef.current.setValue(to12hStr(value));
  }, [value]);

  return (
    <FieldWrapper name={name} error={error} readOnly={readOnly} {...rest}>
      <div className="relative isolate flex h-9 w-full rounded bg-interface text-sm leading-4 text">
        <FaRegClock
          className={cn(
            "absolute left-[0.5625rem] top-1/2 h-3 w-3 -translate-y-1/2 text-subtle",
            disabled ? "text-disabled" : "",
            error ? "z-20 text-on-danger-subtle" : ""
          )}
        />

        {/* Hidden input that timepicker-ui attaches to */}
        <input ref={hiddenRef} type="text" className="sr-only" tabIndex={-1} readOnly />

        <PatternFormat
          getInputRef={(el: HTMLInputElement) => {
            inputRef.current = el;
          }}
          format="##:##"
          placeholder={placeholder}
          data-test-id={testId}
          value={value}
          className={cn(
            "w-full bg-transparent pb-[0.5625rem] pl-[1.8rem] pr-9 pt-[0.5625rem] placeholder:text-placeholder focus:outline-none [&:focus~div]:border-selected",
            error ? "z-20" : ""
          )}
          readOnly={readOnly}
          disabled={disabled}
          onValueChange={({ formattedValue }) => {
            const [fHh = "", fMm = ""] = formattedValue.split(":");
            if (fHh.includes(" ") || fMm.includes(" ")) return;
            if (!isValidTime(fHh, fMm)) return;
            onChange(formattedValue);
          }}
        />

        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 h-full w-full rounded border",
            error &&
              "!border-danger-subtle bg-danger-subtle text-on-danger-subtle",
            disabled && "bg-interface-disabled",
            !disabled && readOnly && "border-none bg-white px-0 pt-1.5"
          )}
        />

        {!readOnly && (
          <Button
            type="button"
            variant="icon"
            disabled={disabled}
            className={cn(
              "absolute bottom-0 right-0 top-1/2 h-9 -translate-y-1/2 focus:z-10",
              error
                ? "z-20 border-danger-subtle bg-danger-subtle text-on-danger-subtle"
                : "focus:border-selected",
              disabled && "transition-none hover:shadow-none"
            )}
            icon={BiChevronDown}
            onClick={() => pickerRef.current?.open()}
          />
        )}
      </div>
    </FieldWrapper>
  );
}

export default TimeInput;
