import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactElement,
} from "react";
import { BiSortAlt2, BiSortDown, BiSortUp } from "react-icons/bi";

import { cn } from "./../../utilities";

import Text from "./Text";
import Button from "./../input_controls/Button";
import Checkbox from "../input_controls/CheckBox";

type ArrayKey = number;
type BrowserNativeObject = Date | FileList | File;
type Primitive = null | undefined | string | number | boolean | symbol | bigint;
type IsEqual<T1, T2> = T1 extends T2
  ? (<G>() => G extends T1 ? 1 : 2) extends <G>() => G extends T2 ? 1 : 2
    ? true
    : false
  : false;
type AnyIsEqual<T1, T2> = T1 extends T2
  ? IsEqual<T1, T2> extends true
    ? true
    : never
  : never;
type IsTuple<T extends ReadonlyArray<any>> = number extends T["length"]
  ? false
  : true;
type TupleKeys<T extends ReadonlyArray<any>> = Exclude<keyof T, keyof any[]>;
type PathImpl<K extends string | number, V, TraversedTypes> = V extends
  | Primitive
  | BrowserNativeObject
  ? `${K}`
  : true extends AnyIsEqual<TraversedTypes, V>
    ? `${K}`
    : `${K}` | `${K}.${PathInternal<V, TraversedTypes | V>}`;

type PathInternal<T, TraversedTypes = T> =
  T extends ReadonlyArray<infer V>
    ? IsTuple<T> extends true
      ? {
          [K in TupleKeys<T>]-?: PathImpl<K & string, T[K], TraversedTypes>;
        }[TupleKeys<T>]
      : PathImpl<ArrayKey, V, TraversedTypes>
    : {
        [K in keyof T]-?: PathImpl<K & string, T[K], TraversedTypes>;
      }[keyof T];
type Path<T> = T extends any ? PathInternal<T> : never;
type FieldValues = Record<string, any>;
type FieldPath<TFieldValues extends FieldValues> = Path<TFieldValues>;

const getByStringyfiedNestedAttribute = <
  TObj extends FieldValues,
  TReturn extends any = any,
>(
  obj: TObj,
  getterString: FieldPath<TObj>,
) => {
  const attributesArray = getterString.split(".");

  const getter = (inner: unknown, pathAttributes: string[]): any => {
    if (!pathAttributes.length) return inner;
    if (typeof inner !== "object" || inner === null) return undefined;
    const nextPath = pathAttributes.shift() ?? "";
    if (!(nextPath in inner)) return undefined;
    // @ts-expect-error generic return
    return getter(inner[nextPath], pathAttributes);
  };

  return getter(obj, attributesArray) as TReturn;
};

type Column<TData extends FieldValues> = {
  label: string;
  name: FieldPath<TData>;
  render?: (value: TData, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

type GetPotentialPrimaryKeys<TObj> = {
  [K in keyof TObj]: TObj[K] extends string | number | symbol ? K : never;
}[keyof TObj];

type SortData<TData> = {
  name: keyof TData;
  direction: "asc" | "desc";
};

type Prettify<T> = {
  [K in keyof T]: T[K];
} & unknown;

type TableProps<
  TData extends {
    [x: string | number]: any;
  },
> = {
  children: (_args: {
    Column: (_props: Column<TData>) => any;
  }) => React.ReactNode | React.ReactNode[];
  data: TData[];
  hideHead?: boolean;
  isLoading?: boolean;
  emptyListLabel?: string;
  tableTitle?: string;
  isFetching?: boolean;
  hasLoadMoreBtn?: boolean;
  onLoadMoreClicked?: () => void;
  onSortChange?: (data: Prettify<SortData<TData>> | null) => void;
  hasSelectableRows?: boolean;
} & (
  | {
      hasSelectableRows: true;
      primaryKey: GetPotentialPrimaryKeys<TData>;
      onSelectedRowsChange: (selectedRows: TData[]) => void;
    }
  | {
      hasSelectableRows?: false;
    }
);

const cssStyles = `
  .table-container {
    table {
      @apply w-full table-auto caption-bottom border-gray-100;
    }
  
    tr:not(:last-child) {
      td {
        @apply border-b;
      }
    }
  
    @media (max-width: 650px) {
      th {
        @apply hidden;
      }
      tr {
        @apply border-b;
      }
      td {
        @apply grid grid-cols-2 border-b-0 py-2 font-light;
      }
      td:first-child {
        @apply pt-4;
      }
      td:last-child {
        @apply pb-4;
      }
      td::before {
        content: attr(data-cell);
        @apply flex items-center text-body font-bold uppercase text-subtle;
      }
    }
  }
`;

/**
 * @example
 * const sampleData: {
 *   name: string;
 *   age: number;
 *   address: string;
 *   hobby: string;
 *   status: string;
 * }[]
 *
 * <Table data={sampleData}>
 *   {({ Column }) => (
 *     <>
 *       <Column label="Full Name" name="name" />
 *       <Column label="Age" name="age" sortable />
 *       <Column label="Hobby" name="hobby" />
 *       <Column label="Address" name="address" />
 *       <Column label="Status" name="statuss" /> // Will Error
 *     </>
 *   )}
 * </Table>
 */
const Table = <
  TData extends {
    [x: string | number]: any;
  },
>({
  data,
  children,
  hideHead = false,
  isLoading = false,
  emptyListLabel = "No Data Found",
  tableTitle,
  isFetching = false,
  hasLoadMoreBtn = false,
  onSortChange,
  onLoadMoreClicked,
  ...rest
}: TableProps<TData>) => {
  const restRef = useRef(rest);
  const onSortChangeRef = useRef(onSortChange);
  const [columns, setColumns] = useState<Column<TData>[]>([]);
  const [sortData, setSortData] = useState<SortData<TData> | null>(null);
  const [selectedPrimaryKeys, setSelectedPrimaryKeys] = useState<
    GetPotentialPrimaryKeys<TData>[]
  >([]);

  const Column = useCallback(
    // eslint-disable-next-line
    (_props: Column<TData>) => null,
    [],
  );

  useEffect(() => {
    // @ts-expect-error element
    const childColumns = (children({ Column }) as ReactElement).props
      .children as ReactElement<Column<TData>> | ReactElement<Column<TData>>[];
    const columns = (
      Array.isArray(childColumns) ? childColumns : [childColumns]
    ).reduce<Column<TData>[]>((acc, cur) => {
      if (cur && "props" in cur) {
        acc.push(cur.props);
      }
      return acc;
    }, []);
    setColumns(columns);
    return () => {
      setColumns([]);
    };
  }, [setColumns, children, Column]);

  useEffect(() => {
    if (!restRef.current.hasSelectableRows) return;
    const { onSelectedRowsChange, primaryKey } = restRef.current;
    onSelectedRowsChange(
      data.filter((row) => selectedPrimaryKeys.includes(row[primaryKey])),
    );
  }, [selectedPrimaryKeys, data]);

  useEffect(() => {
    if (!onSortChangeRef.current) return;
    onSortChangeRef.current(sortData);
  }, [sortData]);

  return (
    <div className="hide-scrollbar relative h-full max-h-full w-full overflow-auto rounded-[0.25rem] border bg-interface">
      <style>{cssStyles}</style>
      <div className="table-container">
        {tableTitle && <caption>{tableTitle}</caption>}
        <table className="w-full">
          {!hideHead && (
            <thead className="sticky top-0 z-[1] ">
              <tr>
                {rest.hasSelectableRows && (
                  <th className={"w-8 bg-interface-subtle py-mds-14 pl-mds-16"}>
                    <Checkbox
                      value={
                        Boolean(data.length) &&
                        selectedPrimaryKeys.length === data.length
                      }
                      onChange={(checked) => {
                        if (checked) {
                          setSelectedPrimaryKeys(
                            data.map((row) => row[rest.primaryKey]),
                          );
                          return;
                        }
                        setSelectedPrimaryKeys([]);
                      }}
                    />
                  </th>
                )}
                {columns?.map((col, i) => {
                  const key = i;
                  return (
                    <th
                      className={cn(
                        "bg-interface-subtle px-mds-16 py-mds-14",
                        col.className,
                      )}
                      key={key}
                    >
                      <div className="flex items-center ">
                        <Text
                          size="caption"
                          weight="bold"
                          color="subtle"
                          className="whitespace-nowrap uppercase"
                        >
                          {col.label}
                        </Text>
                        {col.sortable && (
                          <button
                            type="button"
                            className={cn(
                              "ml-mds-8 h-[0.875rem] w-[0.875rem] rounded text-icon-subtle hover:text-icon-brand",
                              sortData?.name === col.name
                                ? "text-icon-brand"
                                : "",
                            )}
                            onClick={() => {
                              if (sortData?.name !== col.name) {
                                setSortData({
                                  name: col.name,
                                  direction: "asc",
                                });
                                return;
                              }
                              if (sortData.direction === "asc") {
                                setSortData((prev) => ({
                                  ...prev!,
                                  direction: "desc",
                                }));
                                return;
                              }
                              setSortData(null);
                            }}
                          >
                            {(() => {
                              if (sortData?.name !== col.name)
                                return <BiSortAlt2 size={14} />;
                              switch (sortData.direction) {
                                case "asc":
                                  return <BiSortUp size={14} />;
                                case "desc":
                                  return <BiSortDown size={14} />;
                                default:
                                  return <BiSortAlt2 size={14} />;
                              }
                            })()}
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}
          <tbody>
            {isLoading &&
              data.length === 0 &&
              [0, 1, 2].map((x) => (
                <tr
                  key={x}
                  className="hover:bg-interface-hovered focus:bg-interface-active"
                >
                  {rest.hasSelectableRows && (
                    <td className="px-mds-16 py-[0.625rem]">
                      <span className="inline-block h-4 w-full animate-pulse rounded-md bg-gray-300" />
                    </td>
                  )}
                  {columns?.map((_, i) => {
                    return (
                      <td key={i} className={"px-mds-16 py-[0.625rem]"}>
                        <span className="inline-block h-4 w-full animate-pulse rounded-md bg-gray-300" />
                      </td>
                    );
                  })}
                </tr>
              ))}
            {!isLoading && data.length === 0 && (
              <tr className="text-center">
                <td
                  className="py-mds-12"
                  colSpan={columns.length + (rest.hasSelectableRows ? 1 : 0)}
                >
                  <Text size="body" weight="semibold">
                    {emptyListLabel}
                  </Text>
                </td>
              </tr>
            )}
            {data.length >= 1 &&
              data.map((row, i) => {
                const rowKey = i;
                const isSelected =
                  rest.hasSelectableRows &&
                  selectedPrimaryKeys.includes(row[rest.primaryKey]);
                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      "hover:bg-interface-hovered focus:bg-interface-active",
                      isSelected ? "bg-interface-selected-subtle" : "",
                    )}
                  >
                    {rest.hasSelectableRows && (
                      <td data-cell="Select:" className="py-mds-10 pl-mds-16">
                        <Checkbox
                          value={isSelected!}
                          onChange={(checked) => {
                            const selectedPrimaryKeysSet = new Set(
                              selectedPrimaryKeys,
                            );
                            switch (checked) {
                              case true:
                                selectedPrimaryKeysSet.add(
                                  row[rest.primaryKey],
                                );
                                break;
                              default:
                                selectedPrimaryKeysSet.delete(
                                  row[rest.primaryKey],
                                );
                                break;
                            }
                            setSelectedPrimaryKeys([...selectedPrimaryKeysSet]);
                          }}
                        />
                      </td>
                    )}
                    {columns?.map((col, j) => {
                      const colKey = j;
                      return (
                        <td
                          data-cell={col.label + ":"}
                          key={`${rowKey}-${colKey}`}
                          className={cn("px-mds-16 py-mds-10", col.className)}
                        >
                          <div className="flex h-full w-full flex-col justify-center text-body leading-loose">
                            {typeof col.render === "function" ? (
                              col.render(row, i)
                            ) : (
                              <Text
                                size="body"
                                color="default"
                                lineHeight="loose"
                              >
                                {getByStringyfiedNestedAttribute(row, col.name)}
                              </Text>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
          {hasLoadMoreBtn && (
            <caption className="border-t p-1">
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  if (typeof onLoadMoreClicked === "function")
                    onLoadMoreClicked();
                }}
                disabled={isFetching}
              >
                Load More...
              </Button>
            </caption>
          )}
        </table>
      </div>
    </div>
  );
};

export default Table;
