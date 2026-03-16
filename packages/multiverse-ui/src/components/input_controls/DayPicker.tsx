import { z } from "zod";
import dayjs from "dayjs";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

import {
  MdOutlineArrowDropDown,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
} from "react-icons/md";

import "./DatePicker.css";
import Button from "./Button";

const dateRangeSchema = z.object({
  from: z.date().nullable(),
  to: z.date().nullable(),
});

type DateRange = z.infer<typeof dateRangeSchema>;
type Props = {
  value: DateRange | null;
  onChange: (value: DateRange) => void;
  type?: "single" | "span";
};

type Nullable<TObj> = {
  [K in keyof TObj]: TObj[K] | null;
};

const DEFAULT_VALUE: DateRange = {
  from: new Date(),
  to: new Date(),
};

const DayPicker = ({ type = "single", value, onChange }: Props) => {
  const [valuePlaceholder, setValuePlaceholder] = useState<Nullable<DateRange>>(
    value ?? DEFAULT_VALUE
  );

  return (
    <ReactDatePicker
      inline
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
          setValuePlaceholder({ from: from!, to: to! });
          if (!from || !to) return;
          onChange({ from, to });
        }
      }}
      formatWeekDay={(weekDay) => weekDay.substring(0, 3)}
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        changeMonth,
        changeYear,
      }) => (
        <div className="flex justify-between px-2">
          <div className="flex -ml-2.5">
            <MonthButton date={date} changeMonth={changeMonth} />
            <YearButton date={date} changeYear={changeYear} />
          </div>
          {/* <p className="text-xs font-semibold leading-[0.875rem] text-brand">
            {dayjs(date).format("MMMM YYYY")}
          </p> */}
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={decreaseMonth}
              className="cursor-pointer"
            >
              <MdOutlineChevronLeft className="h-4 w-4 rounded text-brand hover:shadow" />
            </button>
            <button
              type="button"
              onClick={increaseMonth}
              className="cursor-pointer"
            >
              <MdOutlineChevronRight className="h-4 w-4 rounded text-brand hover:shadow" />
            </button>
          </div>
        </div>
      )}
    />
  );
};

const MonthButton = ({
  date,
  changeMonth,
}: {
  date: Date;
  changeMonth: (month: number) => void;
}) => {
  return (
    <Popover className="relative">
      <PopoverButton
        as={Button}
        variant="text"
        // @ts-expect-error
        style="bare"
        trailingIcon={MdOutlineArrowDropDown}
        intent="primary"
      >
        {dayjs(date).format("MMMM")}
      </PopoverButton>
      <PopoverPanel
        as="div"
        transition
        anchor="top end"
        className="top-0 z-[1050] transition duration-200 ease-in-out [--anchor-gap:var(--spacing-5)] data-[closed]:-translate-y-1 data-[closed]:opacity-0 overflow-visible!"
      >
        {({ close }) => (
          <div className="absolute right-0 top-full z-10 mt-4 bg-white rounded-lg shadow-lg p-2 border">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 12 }, (_, index) => (
                <Button
                  key={index}
                  variant="text"
                  style="bare"
                  intent="primary"
                  onClick={() => {
                    changeMonth(index);
                    close();
                  }}
                >
                  {dayjs(date).month(index).format("MMMM")}
                </Button>
              ))}
            </div>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
};

const getYearsPickerRangeStart = (date: Date) => {
  const parsed = new Date(date);
  const dateYear = parsed.getFullYear();
  let rangeStart = dateYear;
  let count = 0;
  while (!Number.isInteger((dateYear - count) / 12)) {
    count++;
  }
  rangeStart = dateYear - count + 1;
  return [rangeStart, rangeStart + 12];
};

const YearButton = ({
  date,
  changeYear,
}: {
  date: Date;
  changeYear: (year: number) => void;
}) => {
  return (
    <Popover className="relative">
      <PopoverButton
        as={Button}
        variant="text"
        // @ts-expect-error
        style="bare"
        trailingIcon={MdOutlineArrowDropDown}
        intent="primary"
      >
        {dayjs(date).format("YYYY")}
      </PopoverButton>
      <PopoverPanel
        as="div"
        transition
        anchor="top end"
        className="top-0 z-[1050] transition duration-200 ease-in-out [--anchor-gap:var(--spacing-5)] data-[closed]:-translate-y-1 data-[closed]:opacity-0 overflow-visible!"
      >
        {({ close }) => (
          <div className="absolute right-0 top-full z-10 mt-4 bg-white rounded-lg shadow-lg w-48">
            <div className="flex flex-col gap-2">
              <ReactDatePicker
                inline
                showYearPicker
                selected={date}
                onChange={(date) => {
                  changeYear(dayjs(date).year());
                  close();
                }}
                renderCustomHeader={({ date, decreaseYear, increaseYear }) => {
                  const [from, to] = getYearsPickerRangeStart(date);
                  return (
                    <div className="flex justify-between">
                      <p className="text-xs font-semibold leading-[0.875rem] text-brand">
                        {from} - {to}
                      </p>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={decreaseYear}
                          className="cursor-pointer"
                        >
                          <MdOutlineChevronLeft className="h-4 w-4 rounded text-brand hover:shadow" />
                        </button>
                        <button
                          type="button"
                          onClick={increaseYear}
                          className="cursor-pointer"
                        >
                          <MdOutlineChevronRight className="h-4 w-4 rounded text-brand hover:shadow" />
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
};

export default DayPicker;
