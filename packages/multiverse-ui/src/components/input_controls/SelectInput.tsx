import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxButton,
  ComboboxOptions,
} from "@headlessui/react";
import * as _ from "lodash";
import { MdCheck } from "react-icons/md";
import { CgSearch } from "react-icons/cg";
import { BiChevronDown } from "react-icons/bi";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "./../../utilities";

import FieldWrapper, {
  type Props as WrapperProps,
} from "./../containers/FieldWrapper";
import Badge from "../informationals/Badge";
import Button from "./Button";
import Stack from "./../containers/Stack";

type Option = {
  label: string;
  value: any;
};

type Props<
  TOptions extends
    | Option[]
    | ((keyword: string) => Promise<Array<{ label: string; value: any }>>),
  TValue = TOptions extends Option[]
    ? TOptions[number]["value"]
    : TOptions extends (
          keyword: string
        ) => Promise<Array<{ label: string; value: infer R }>>
      ? R
      : never,
> = {
  options: TOptions;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
} & (
  | {
      type?: "single";
      value: TValue;
      onChange: (value: TValue) => void;
    }
  | {
      type: "multiple";
      value: TValue;
      onChange: (value: TValue[]) => void;
      selectAllLabel?: string;
      showSelectAllButton?: boolean;
    }
) &
  WrapperProps;

function SelectInput<
  const TOptions extends Option[] | ((keyword: string) => Promise<Option[]>),
>({
  options,
  error,
  readOnly = false,
  disabled = false,
  placeholder = "Select an item",
  searchPlaceholder = "Type to search",
  ...rest
}: Props<TOptions>) {
  const [query, setQuery] = useState("");
  const [_resolvedOptions, _setResolvedOptions] = useState<Option[]>([]);

  const _options = useMemo(
    () => (Array.isArray(options) ? options : _resolvedOptions),
    [options, _resolvedOptions]
  );

  const fetchAsyncOptions = useCallback(
    _.debounce(async (keyword: string) => {
      if (Array.isArray(options)) return;
      options(keyword)
        .then(_setResolvedOptions)
        .catch(() => console.error("Unable to fetch options."));
    }, 500),
    [options, _setResolvedOptions]
  );

  const filteredStaticOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    if (!query) return options as Option[];
    return options.filter((option) =>
      option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())
    );
  }, [query, options]);

  const filteredOptions = useMemo(
    () => (Array.isArray(options) ? filteredStaticOptions : _resolvedOptions),
    [options, filteredStaticOptions, _resolvedOptions]
  );

  useEffect(() => {
    if (typeof options !== "function") return;
    fetchAsyncOptions("");
  }, []);

  function isEmpty(val: unknown) {
    return val === undefined || val === null || val === "";
  }

  return (
    <FieldWrapper readOnly={readOnly} error={error} {...rest}>
      <Combobox
        as="div"
        className="relative w-full"
        multiple={rest.type === "multiple"}
        value={
          rest.type === "multiple" && !Array.isArray(rest.value)
            ? []
            : rest.value
        }
        // @ts-expect-error
        onChange={rest.onChange}
        onClose={() => setQuery("")}
        disabled={disabled || readOnly}
      >
        {({ open }) => (
          <>
            <div
              className={cn(
                "flex h-9 w-full items-end justify-between rounded bg-white p-[0.5625rem] !text-sm !leading-4 text",
                isEmpty(rest.value) ? "text-placeholder" : "",
                error ? "bg-danger-subtle text-on-danger-subtle" : "",
                readOnly ? "bg-transparent px-0 pt-1.5" : "",
                disabled ? "bg-interface-disabled" : ""
              )}
            >
              <span>
                {isEmpty(rest.value)
                  ? placeholder
                  : rest.type === "multiple"
                    ? `${rest.value.length} item selected`
                    : (_options.find((option) => option.value === rest.value)
                        ?.label ?? placeholder)}
              </span>
            </div>
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-10 h-full w-full rounded border",
                error &&
                  "!border-danger-subtle bg-danger-subtle text-on-danger-subtle",
                open && "border-selected",
                !disabled && readOnly && "border-none bg-white px-0 pt-1.5"
              )}
            />

            {!readOnly && (
              <ComboboxButton as="div">
                <Button
                  variant="icon"
                  className={cn(
                    "absolute bottom-0 right-0 top-1/2 h-9 -translate-y-1/2 cursor-pointer focus:z-10",
                    error
                      ? "z-10 border-danger-subtle bg-danger-subtle text-on-danger-subtle"
                      : "focus:border-selected",
                    readOnly && "hidden",
                    disabled && "transition-none hover:shadow-none"
                  )}
                  icon={BiChevronDown}
                />
              </ComboboxButton>
            )}
            {open && (
              <div className="absolute left-0 right-0 top-full z-50 mt-mds-6 divide-y overflow-clip rounded bg-white shadow">
                <div className="relative isolate">
                  <ComboboxInput
                    value={query}
                    onChange={async (e) => {
                      setQuery(e.target.value);
                      if (Array.isArray(options)) return;
                      fetchAsyncOptions(e.target.value);
                    }}
                    className="w-full p-[0.625rem] pr-10 text-sm leading-4 focus:outline-none"
                    placeholder={searchPlaceholder}
                  />
                  <CgSearch className="pointer-events-none absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-icon-subtle" />
                </div>
                <ComboboxOptions
                  as="div"
                  className="max-h-80 divide-y overflow-auto"
                  static={rest.type === "multiple"}
                >
                  {filteredOptions.length ? (
                    filteredOptions.map((option) => {
                      const isSelected =
                        rest.type === "multiple"
                          ? rest.value.includes(option.value)
                          : rest.value === option.value;
                      return (
                        <ComboboxOption
                          key={option.label}
                          value={option.value}
                          className={cn(
                            "flex cursor-pointer items-center justify-between space-x-1 p-[0.625rem] text-sm leading-4 text hover:bg-interface-hovered",
                            isSelected && "bg-brand-subtle text-brand"
                          )}
                        >
                          <span>{option.label}</span>
                          {rest.type === "multiple" && isSelected && (
                            <MdCheck className="text-brand" />
                          )}
                        </ComboboxOption>
                      );
                    })
                  ) : (
                    <div
                      className={cn(
                        "cursor-not-allowed p-[0.625rem] text-sm leading-4 hover:bg-interface-hovered"
                      )}
                    >
                      No Items Found
                    </div>
                  )}
                  {rest.type === "multiple" && rest.showSelectAllButton && (
                    <button
                      type="button"
                      className={cn(
                        "sticky bottom-0 w-full bg-white p-[0.625rem] text-left text-sm font-medium leading-4 text-brand hover:bg-interface-hovered"
                      )}
                      onClick={() =>
                        rest.onChange(_options.map((option) => option.value))
                      }
                    >
                      {rest.selectAllLabel ?? "Select all"}
                    </button>
                  )}
                </ComboboxOptions>
              </div>
            )}
          </>
        )}
      </Combobox>
      {rest.type === "multiple" && Boolean(rest.value?.length) && (
        <Stack gap={4} className="flex-wrap">
          {rest.value?.map((val: Option["value"]) => (
            <Badge
              key={val}
              onDismiss={() =>
                rest.onChange(
                  rest.value?.filter(
                    (activeValue: Option["value"]) => activeValue !== val
                  )
                )
              }
              label={
                _options.find((option) => option.value === val)?.label ?? ""
              }
            />
          ))}
        </Stack>
      )}
    </FieldWrapper>
  );
}

export default SelectInput;
