import { z } from "zod";
import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import weekDay from "dayjs/plugin/weekday";
import isBetween from "dayjs/plugin/isBetween";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";

import { cn } from "./../../utilities";

dayjs.extend(weekDay);
dayjs.extend(isBetween);
dayjs.extend(weekOfYear);

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

const WeekPicker = ({ type = "single", value: rawValue, onChange }: Props) => {
  const value = useMemo(() => rawValue ?? DEFAULT_VALUE, [rawValue]);
  const [selectedYear, setSelectedYear] = useState(
    dayjs(value.from).isValid()
      ? dayjs(value.from).format("YYYY")
      : dayjs().format("YYYY"),
  );

  const [selectedPlaceholder, setSelectedPlaceholder] = useState<Dayjs | null>(
    null,
  );
  const [hoveredPlaceholder, setHoveredPlaceholder] = useState<Dayjs | null>(
    null,
  );

  return (
    <div className="flex h-52 w-[11.75rem] flex-col rounded border bg-white">
      <div className="flex justify-between border-b p-3">
        <p className="text-xs font-semibold leading-[0.875rem] text-brand">
          {selectedYear}
        </p>
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => {
              setSelectedYear((prev) => (parseInt(prev) - 1).toString());
            }}
          >
            <MdOutlineChevronLeft className="h-4 w-4 rounded text-brand hover:shadow" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedYear((prev) => (parseInt(prev) + 1).toString());
            }}
          >
            <MdOutlineChevronRight className="h-4 w-4 rounded text-brand hover:shadow" />
          </button>
        </div>
      </div>
      <ul className="h-0 flex-grow divide-y overflow-auto">
        {[...Array(52)].map((_, i) => {
          const day = dayjs(selectedYear)
            .week(i + 1)
            .weekday(7); // every sunday of the selected year
          const isSelected = selectedPlaceholder
            ? dayjs(selectedPlaceholder).isSame(day, "day")
            : [value.from, value.to].some((d, i) => {
                if (i === 0) return dayjs(d).isSame(day, "day");
                return dayjs(d).isSame(day.add(6, "day"), "day");
              });

          const isCovered = selectedPlaceholder
            ? day.isBetween(selectedPlaceholder, hoveredPlaceholder)
            : day.isBetween(value.from, value.to, "day");
          return (
            <li
              key={day.format("YYYY-MM-DD")}
              className="group relative flex divide-x text-xs leading-[0.875rem]"
            >
              <button
                className="absolute inset-0 h-full w-full"
                onClick={() => {
                  if (type === "single") {
                    onChange({
                      from: day.toDate(),
                      to: day.add(6, "day").toDate(),
                    });
                    return;
                  }
                  if (!selectedPlaceholder) {
                    setSelectedPlaceholder(day);
                    return;
                  }
                  if (day.isAfter(selectedPlaceholder)) {
                    onChange({
                      from: selectedPlaceholder.toDate(),
                      to: day.add(6, "day").toDate(),
                    });
                    setSelectedPlaceholder(null);
                    setHoveredPlaceholder(null);
                    return;
                  }
                  onChange({
                    from: day.toDate(),
                    to: dayjs(selectedPlaceholder).add(6, "day").toDate(),
                  });
                  setSelectedPlaceholder(null);
                  setHoveredPlaceholder(null);
                }}
                onMouseEnter={() => {
                  setHoveredPlaceholder(day);
                }}
              />
              <div
                className={cn(
                  "w-[3.75rem] flex-shrink-0 bg-interface-hovered p-[0.625rem] text-center text",
                  "group-hover:bg-brand group-hover:text-on-brand",
                  isCovered ? "bg-brand-subtle-hovered text-on-brand" : "",
                  isSelected ? "bg-brand text-on-brand" : "",
                )}
              >
                Wk {i + 1}
              </div>
              <div
                className={cn(
                  "flex-grow p-[0.625rem] text-center text-subtle",
                  "group-hover:bg-brand-subtle group-hover:text-on-brand-subtle",
                  isSelected || isCovered
                    ? "bg-brand-subtle text-on-brand-subtle"
                    : "",
                )}
              >
                {day.format("MMM D")} to {day.add(6, "day").format("MMM D")}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WeekPicker;
