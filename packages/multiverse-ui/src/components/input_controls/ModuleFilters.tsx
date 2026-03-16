/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useRef,
  useMemo,
  Fragment,
  useEffect,
  useCallback,
} from "react";
import { z } from "zod";
import { TbFilterSearch } from "react-icons/tb";

import { createForm } from "@repo/utilities";

import { Button, Drawer, useCreateOverlay } from "@repo/multiverse-ui";
import { BiSearch } from "react-icons/bi";
import { isEmpty, omit } from "lodash";

const drawerFilterForm = createForm({
  zodSchema: z.record(z.any().optional().nullable()),
});

const drawerFilterFields = {
  TextInput: drawerFilterForm.TextInput,
  SelectInput: drawerFilterForm.SelectInput,
  DatePicker: drawerFilterForm.DatePicker,
};

type DrawerRenderFormatProps = typeof drawerFilterFields;

type FilterDrawerProps = {
  renderFormat?: (filterFields: DrawerRenderFormatProps) => Array<{
    element: React.ReactNode;
  }>;
  filter: Filter;
  onCloseClicked: () => void;
  onApplyFilter: (filter: Filter) => void;
  onClearFilter: (filter: Filter) => void;
};

const FilterDrawer = drawerFilterForm.forwardFormContext(
  (
    {
      filter,
      renderFormat,
      onClearFilter,
      onApplyFilter,
      onCloseClicked,
    }: FilterDrawerProps,
    ctx,
  ) => {
    const watchValues = drawerFilterForm.useWatch();

    const valuesAreEmpty = useMemo(
      () =>
        Object.values(watchValues).every(
          (value) => typeof value !== "number" && isEmpty(value),
        ),
      [watchValues],
    );

    useEffect(() => {
      ctx.reset(omit(filter, ["search"]));
    }, [ctx, filter]);

    return (
      <Drawer
        size="narrow"
        title="Advanced Filters"
        onCloseDrawer={onCloseClicked}
        primaryAction={{
          label: "Apply Filter",
          onClick: () => ctx.handleSubmit(onApplyFilter)(),
          variant: "solid",
          disabled: valuesAreEmpty,
        }}
        secondaryAction={{
          label: valuesAreEmpty ? "Close" : "Clear Filters",
          onClick: () => {
            if (valuesAreEmpty) {
              onCloseClicked();
              return;
            }
            Object.keys(watchValues).forEach((key) => {
              ctx.setValue(key, "");
            });
            onClearFilter(filter);
          },
          variant: "ghost",
        }}
      >
        <div>
          {renderFormat?.({
            TextInput: drawerFilterForm.TextInput,
            SelectInput: drawerFilterForm.SelectInput,
            DatePicker: drawerFilterForm.DatePicker,
          }).map((f, i) => (
            <Fragment key={i}>{f.element}</Fragment>
          ))}
        </div>
      </Drawer>
    );
  },
);

const { TextInput, SelectInput, DatePicker, forwardFormContext, useWatch } =
  createForm({
    zodSchema: z.record(z.any()),
  });

const filterFields = {
  TextInput,
  SelectInput,
  DatePicker,
};

type RenderFormatProps = typeof filterFields;

type Filter = Record<string, any>;
type SetFilter = React.Dispatch<React.SetStateAction<any>>;
type ModuleFiltersProps = {
  filter: Filter;
  searchName?: string;
  searchPlaceholder?: string;
  hideActiveFilterKeys?: string[];
  setFilter: SetFilter;
  renderFormat?: (filterFields: RenderFormatProps) => {
    key?: string;
    element: React.ReactNode;
    activeLabel?: string;
    renderActiveValue?: (value: any) => React.ReactNode;
  }[];
  actionElements?: React.ReactNode[];
  hideSearch?: boolean;
};

const ModuleFilters = forwardFormContext(
  (
    {
      searchName = "search",
      filter,
      setFilter,
      actionElements,
      renderFormat: rF,
      searchPlaceholder = "Search",
      hideActiveFilterKeys = [],
      hideSearch,
    }: ModuleFiltersProps,
    ctx,
  ) => {
    const searchOnLoadRef = useRef<{ setWatchValue: (value: string) => void }>(
      null,
    );
    const isFirstRenderRef = useRef(true);
    const setFilterRef = useRef(setFilter);

    /* -------------------------------------------------------------------------- */
    const watchFilterValues = useWatch();
    useEffect(() => {
      if (isFirstRenderRef.current) {
        isFirstRenderRef.current = false;
        return;
      }
      setFilterRef.current(watchFilterValues);
    }, [watchFilterValues]);
    /* -------------------------------------------------------------------------- */

    const createOverlay = useCreateOverlay(null);
    const showDrawerFilter = useCallback(() => {
      createOverlay({
        position: "right",
        component: ({ close }) => (
          <FilterDrawer
            filter={filter}
            onCloseClicked={close}
            renderFormat={rF}
            onClearFilter={(f) => {
              Object.keys(f).forEach((key: any) => {
                if (key != "search") {
                  ctx.setValue(key, "" as any);
                }
              });
            }}
            onApplyFilter={(f) => {
              close();
              Object.keys(f).forEach((key: any) => {
                ctx.setValue(key, f[key]);
              });
            }}
          />
        ),
      });
    }, [createOverlay, ctx, rF, filter]);

    const activeFiltersMeta = useMemo(() => {
      const value = Object.keys(filter).reduce(
        (acc, cur) => {
          const currentKeyValue = filter[cur];
          if (!currentKeyValue) return acc;
          if (hideActiveFilterKeys.includes(cur)) return acc;
          acc[cur] = currentKeyValue;
          return acc;
        },
        {} as Record<string, any>,
      );
      return {
        count: Object.keys(value).length,
        value,
      };
    }, [filter, hideActiveFilterKeys]);

    const clearAllFilters = useCallback(() => {
      Object.keys(filter).forEach((key: any) => {
        ctx.setValue(key, "" as any);
      });
      if (!searchOnLoadRef.current) return;
      searchOnLoadRef.current.setWatchValue("");
    }, [filter, ctx]);

    const renderFormat = rF?.({ SelectInput, TextInput, DatePicker }) ?? [];

    return (
      <section>
        <div className="flex space-x-2 @container">
          {!hideSearch && (
            <TextInput
              inline
              onLoad={({ setWatchValue }) => {
                searchOnLoadRef.current = { setWatchValue };
              }}
              debounced
              name={searchName}
              icon={BiSearch}
              placeholder={searchPlaceholder}
              className="max-w-96"
            />
          )}

          {/* <div className="hidden flex-grow space-x-2 @2xl:flex"> */}
          {/*   {renderFormat.map((f, i) => ( */}
          {/*     <Fragment key={i}>{f.element}</Fragment> */}
          {/*   ))} */}
          {/* </div> */}
          {typeof rF !== "undefined" && (
            <Button
              variant="icon"
              intent="primary"
              className="@2xl:hidden"
              icon={TbFilterSearch}
              onClick={showDrawerFilter}
            />
          )}
          {Boolean(actionElements) && (
            <div className="ml-auto flex space-x-1">
              {actionElements!.map((el, i) => (
                <Fragment key={i}>{el}</Fragment>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between rounded-[0.38rem] border p-3">
          <div className="flex flex-grow space-x-1">
            {!activeFiltersMeta.count ? (
              <p className="text-xs leading-[0.875rem] text-subtle">
                No filters added
              </p>
            ) : (
              <>
                {Object.keys(activeFiltersMeta.value).map((key) => {
                  const renderFormatItem = renderFormat.find(
                    (formatItem) => formatItem?.key === key,
                  );

                  return (
                    <p
                      key={key}
                      className="text-xs leading-[0.875rem] text-subtle [&:not(:last-of-type)]:mr-1 [&:not(:last-of-type)]:border-r-2 [&:not(:last-of-type)]:pr-2"
                    >
                      {key === searchName
                        ? "Keyword"
                        : (renderFormatItem?.activeLabel ?? key)}{" "}
                      is{" "}
                      <span className="font-medium">
                        {renderFormatItem?.renderActiveValue?.(
                          activeFiltersMeta.value[key],
                        ) ?? activeFiltersMeta.value[key]}
                      </span>
                    </p>
                  );
                })}
              </>
            )}
          </div>
          <Button variant="text" intent="primary" onClick={clearAllFilters}>
            Clear Filters
          </Button>
        </div>
      </section>
    );
  },
);

export default ModuleFilters;
