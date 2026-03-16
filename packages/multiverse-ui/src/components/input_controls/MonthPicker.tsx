import { z } from "zod";
import dayjs from "dayjs";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";

import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";

import "./DatePicker.css";

const dateRangeSchema = z.object({
  from: z.date().nullable(),
  to: z.date().nullable(),
});

const DEFAULT_VALUE: DateRange = {
  from: new Date(),
  to: new Date(),
};

type DateRange = z.infer<typeof dateRangeSchema>;
type Props = {
  value?: DateRange | null;
  onChange: (value: DateRange) => void;
  type?: "single" | "span";
};

const MonthPicker = ({ type = "single", value, onChange }: Props) => {
  const [valuePlaceholder, setValuePlaceholder] = useState<DateRange>(
    value ?? DEFAULT_VALUE,
  );

  return (
    <ReactDatePicker
      inline
      showMonthYearPicker
      selectsRange={(type === "span") as true}
      selected={valuePlaceholder.from}
      startDate={
        dayjs(valuePlaceholder.from).isValid()
          ? dayjs(valuePlaceholder.from).toDate()
          : undefined
      }
      endDate={
        dayjs(valuePlaceholder.to).isValid()
          ? dayjs(valuePlaceholder.to).toDate()
          : undefined
      }
      onChange={(v: Array<Date | null> | Date | null) => {
        if (type === "single" && !Array.isArray(v) && v) {
          onChange({
            from: v,
            to: v,
          });
          return;
        }
        if (type === "span" && Array.isArray(v)) {
          const [from, to] = v;
          const toEndOfMonth = to ? dayjs(to).endOf("month").toDate() : null;
          setValuePlaceholder({ from: from!, to: toEndOfMonth });
          if (!from || !toEndOfMonth) return;
          onChange({ from, to: toEndOfMonth });
        }
      }}
      renderCustomHeader={({ date, decreaseYear, increaseYear }) => (
        <div className="flex justify-between">
          <p className="text-xs font-semibold leading-[0.875rem] text-brand">
            {dayjs(date).format("YYYY")}
          </p>
          <div className="flex space-x-1">
            <button type="button" onClick={decreaseYear}>
              <MdOutlineChevronLeft className="h-4 w-4 rounded text-brand hover:shadow" />
            </button>
            <button type="button" onClick={increaseYear}>
              <MdOutlineChevronRight className="h-4 w-4 rounded text-brand hover:shadow" />
            </button>
          </div>
        </div>
      )}
    />
  );
};

export default MonthPicker;
