import dayjs from "dayjs";
import { FaRegCalendar } from "react-icons/fa";
import { BiChevronDown } from "react-icons/bi";
import { useEffect, useMemo, useRef } from "react";
import { PatternFormat } from "react-number-format";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

import FieldWrapper, {
  type Props as WrapperProps,
} from "./../containers/FieldWrapper";
import DayPicker from "./DayPicker";
import WeekPicker from "./WeekPicker";
import MonthPicker from "./MonthPicker";
import YearPicker from "./YearPicker";
import Button from "./Button";

import { cn } from "./../../utilities";

const formatDate = (date: Date, specificity?: string | undefined) => {
  if (specificity === "year") return dayjs(date).format("YYYY");

  return dayjs(date).format("DD/MM/YYYY");
};
const validateFormattedDate = (formattedValue: string) => {
  const value = formattedValue
    .split("/")
    .reverse()
    .join("-")
    .replace(/ /g, "#");
  const isValueValid = dayjs(value).isValid();
  return { value, isValueValid };
};

type DateRange = {
  from: Date | null;
  to: Date | null;
};

const MAP_SPECIFICITY_COMPONENT = {
  day: DayPicker,
  week: WeekPicker,
  month: MonthPicker,
  year: YearPicker,
} as const;

type Props = {
  testId?: string;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  dateFormat?: string;
  specificity?: keyof typeof MAP_SPECIFICITY_COMPONENT;
} & WrapperProps &
  (
    | {
        mode?: "pick";
        value: Date | null;
        onChange: (value: Date) => void;
      }
    | {
        mode: "range";
        value: DateRange | null;
        onChange: (value: DateRange) => void;
      }
  );

const DatePicker = ({
  name,
  error,
  disabled = false,
  readOnly = false,
  testId = undefined,
  placeholder = undefined,
  specificity = "day",
  dateFormat = "DD/MM/YYYY",
  ...rest
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const PickerComponent = useMemo(
    () => MAP_SPECIFICITY_COMPONENT[specificity],
    [specificity]
  );

  const { value, onChange } = useMemo(() => {
    if (rest.mode === "range") return rest;
    return {
      value: {
        from: rest.value,
        to: rest.value,
      } as DateRange,
      onChange: (value: DateRange) => rest.onChange(value.from!),
    };
  }, [rest]);

  useEffect(() => {
    if (!value || !inputRef.current) return;
    if (rest.mode === "range") {
      if (!dayjs(value.from).isValid() || !dayjs(value.to).isValid()) return;
      inputRef.current.value = `${formatDate(value.from!, specificity)} - ${formatDate(
        value.to!,
        specificity
      )}`;
      return;
    }
    if (!dayjs(value.from).isValid()) return;
    inputRef.current.value = formatDate(value.from!, specificity);
  }, [value]);

  const getFormat = () => {
    if (specificity === "year" && rest.mode === "range") return "#### - ####";
    if (specificity === "year") return "####";
    return rest.mode === "range" ? "##/##/#### - ##/##/####" : "##/##/####";
  };

  const getPlaceholder = () => {
    if (specificity === "year" && rest.mode === "range") return "YYYY - YYYY";
    if (specificity === "year") return "YYYY";
    return rest.mode === "range" ? "DD/MM/YYYY - DD/MM/YYYY" : "DD/MM/YYYY";
  };

  return (
    <FieldWrapper name={name} error={error} readOnly={readOnly} {...rest}>
      <Popover className="relative isolate flex h-9 w-full rounded bg-interface text-sm leading-4 text">
        <FaRegCalendar
          className={cn(
            "absolute left-[0.5625rem] top-1/2 h-3 w-3 -translate-y-1/2 text-subtle",
            disabled ? "text-disabled" : "",
            error ? "z-20 text-on-danger-subtle" : ""
          )}
        />
        <PatternFormat
          getInputRef={(el: HTMLInputElement) => {
            inputRef.current = el;
          }}
          format={getFormat()}
          placeholder={getPlaceholder()}
          className={cn(
            "w-full bg-transparent pb-[0.5625rem] pl-[1.8rem] pr-9 pt-[0.5625rem] placeholder:text-placeholder focus:outline-none [&:focus~div]:border-selected",
            error ? "z-20" : ""
          )}
          readOnly={readOnly}
          disabled={disabled}
          onValueChange={({ formattedValue }) => {
            if (rest.mode === "range") {
              const [formattedFrom = "", formattedTo = ""] =
                formattedValue.split(" - ");
              const { value: from, isValueValid: isFromValid } =
                validateFormattedDate(formattedFrom);
              const { value: to, isValueValid: isToValid } =
                validateFormattedDate(formattedTo);
              const isValuesValid = isFromValid && isToValid;
              if (!isValuesValid) return;
              rest.onChange({
                from: dayjs(from).toDate(),
                to: dayjs(to).toDate(),
              });
              return;
            }
            const { value, isValueValid } =
              validateFormattedDate(formattedValue);
            if (!isValueValid) return;
            rest.onChange(dayjs(value).toDate());
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
        <PopoverButton as="div" tabIndex={-1}>
          <Button
            variant="icon"
            className={cn(
              "absolute bottom-0 right-0 top-1/2 h-9 -translate-y-1/2 focus:z-10",
              error
                ? "z-20 border-danger-subtle bg-danger-subtle text-on-danger-subtle"
                : "focus:border-selected",
              readOnly && "hidden",
              disabled && "transition-none hover:shadow-none"
            )}
            icon={BiChevronDown}
          />
        </PopoverButton>

        <PopoverPanel
          as="div"
          transition
          anchor="top end"
          className="top-0 z-[1050] transition duration-200 ease-in-out [--anchor-gap:var(--spacing-5)] data-[closed]:-translate-y-1 data-[closed]:opacity-0 overflow-visible!"
        >
          <PickerComponent
            type={rest.mode === "range" ? "span" : "single"}
            value={
              rest.mode === "range"
                ? value
                : { from: value?.from || null, to: null }
            }
            onChange={(selectedDate) => {
              if (rest.mode === "range") {
                return onChange({
                  from: selectedDate.from,
                  to: selectedDate.to,
                });
              }
              onChange(selectedDate || null);
            }}
          />
        </PopoverPanel>
      </Popover>
    </FieldWrapper>
  );
};

export default DatePicker;
