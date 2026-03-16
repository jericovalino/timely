import { useRef } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import { NumericFormat } from "react-number-format";

import FieldWrapper, {
  type Props as WrapperProps,
} from "../containers/FieldWrapper";
import { cn } from "../../utilities";

type Props = {
  name: string;
  testId?: string;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  errorDescription?: string;
  squaredEdges?: boolean;
  value: number;
  onChange: (value: number) => void;
} & WrapperProps;

const FormInput = ({
  name,
  min = 1,
  max,
  disabled = false,
  readOnly = false,
  testId = undefined,
  squaredEdges = false,
  value = 0,
  onChange,
  ...rest
}: Props) => {
  const inlineRef = useRef<HTMLInputElement | null>(null);

  return (
    <FieldWrapper {...rest}>
      <div className="relative">
        <div
          className={cn(
            "flex h-11 w-full overflow-clip border border-gray-400 bg-white",
            squaredEdges ? "rounded" : "rounded-full",
          )}
        >
          <button
            type="button"
            className="grid h-full w-11 place-items-center bg-gray-100/80 disabled:cursor-not-allowed cursor-pointer"
            onClick={() => onChange(Math.max(value - 1, min))}
            disabled={value <= min}
          >
            <FaMinus className="h-4 w-4 text-primary-800" />
          </button>
          <div className="relative isolate grid w-min min-w-[4.2rem] flex-grow place-items-center border-x border-gray-400">
            <button
              className="absolute inset-0 z-0 h-full w-full"
              type="button"
              onClick={() => inlineRef.current?.focus()}
            />
            <NumericFormat
              getInputRef={inlineRef}
              isAllowed={({ floatValue }) => {
                const value = floatValue ?? min;
                const isAllowed = value >= min && value <= (max ?? Infinity);
                return isAllowed;
              }}
              value={value}
              decimalScale={0}
              onChange={(e) => {
                const posibleValue = parseInt(e.target.value);
                const nextValue = isNaN(posibleValue) ? value : posibleValue;
                onChange(nextValue);
              }}
              allowNegative={false}
              className="mx-4 text-center text-base font-semibold leading-[1.125rem] focus:outline-none"
              style={{
                width: `${((value as number).toString().length * 1.25) / 2}rem`,
              }}
              onBlur={() => {
                if (inlineRef.current)
                  inlineRef.current.value = value.toString();
              }}
            />
          </div>
          <button
            type="button"
            className="grid h-full w-11 place-items-center bg-gray-100/80 disabled:cursor-not-allowed cursor-pointer"
            onClick={() =>
              onChange(
                max !== undefined
                  ? Math.min((value as number) + 1, max)
                  : (value as number) + 1,
              )
            }
            disabled={value >= (max ?? Infinity)}
          >
            <FaPlus className="h-4 w-4 text-primary-800" />
          </button>
        </div>
        <input
          id={name}
          type="range"
          data-test-id={testId}
          value={value}
          className={cn(
            "w-full bg-white p-3 pt-1.5 text-sm leading-4 text-gray-900",
            !readOnly ? "hidden" : "",
          )}
          onChange={() => {}}
          placeholder={readOnly ? "-" : undefined}
          disabled={readOnly ? false : disabled}
          readOnly={readOnly}
          min={min}
          max={max}
        />
      </div>
    </FieldWrapper>
  );
};

export default FormInput;
