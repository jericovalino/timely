import { z } from "zod";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Transition } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa6";

import { cn } from "../../utilities";
import { useOnClickOutside } from "../../hooks";

import WeekPicker from "./WeekPicker";
import MonthPicker from "./MonthPicker";
import YearPicker from "./YearPicker";
import DayPicker from "./DayPicker";

const DATE_HUMAN_FORMAT = "MMM D, YYYY";
const formatDateHuman = (date: Date | null) =>
  date ? dayjs(date, "YYYY-MM-DD").format(DATE_HUMAN_FORMAT) : "-";

const dateRangeSchema = z.object({
  from: z.date().nullable(),
  to: z.date().nullable(),
});

type DateRange = z.infer<typeof dateRangeSchema>;

type Props = {
  value: DateRange;
  onChange: (value: DateRange) => void;
  precision?: "day" | "week" | "month" | "year";
};
const FilterDate = ({ value, onChange, precision = "day" }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const range = useMemo(() => {
    const result = dateRangeSchema.safeParse(value);
    if (!result.success) return null;
    return result.data;
  }, [value]);

  const { ref } = useOnClickOutside(() => {
    setIsOpen(false);
  });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex flex-nowrap items-center space-x-3 rounded-lg border p-[0.625rem]"
        onClick={() => setIsOpen(true)}
      >
        <span className="whitespace-nowrap text-xs font-semibold text-brand">
          {range
            ? `${formatDateHuman(range.from)} to ${formatDateHuman(range.to)}`
            : "Select Range"}
        </span>
        <FaChevronDown className="h-4 w-4 text-brand" />
      </button>
      <Transition
        show={isOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div className={cn("absolute right-0 top-full z-10 mt-2")}>
          {precision === "day" && (
            <DayPicker type="span" value={value} onChange={onChange} />
          )}
          {precision === "week" && (
            <WeekPicker type="span" value={value} onChange={onChange} />
          )}
          {precision === "month" && (
            <MonthPicker type="span" value={value} onChange={onChange} />
          )}
          {precision === "year" && (
            <YearPicker type="span" value={value} onChange={onChange} />
          )}
        </div>
      </Transition>
    </div>
  );
};

export default FilterDate;
