import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { cn } from "./../../utilities";

type PrevButtonProps = {
  disabled?: boolean;
  onClick: () => void;
  variant: "truncated" | "simple";
};
const PrevButton = ({ onClick, disabled, variant }: PrevButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        "grid h-8 w-8 place-items-center rounded bg-interface",
        "hover:bg-brand-subtle active:bg-brand active:text-on-brand disabled:cursor-not-allowed",
        variant === "simple" && "bg-brand-subtle",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <HiChevronLeft />
    </button>
  );
};

type NextButtonProps = {
  disabled?: boolean;
  onClick: () => void;
  variant: "truncated" | "simple";
};
const NextButton = ({ onClick, disabled, variant }: NextButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        "grid h-8 w-8 place-items-center rounded bg-interface",
        "hover:bg-brand-subtle active:bg-brand active:text-on-brand disabled:cursor-not-allowed",
        variant === "simple" && "bg-brand-subtle",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <HiChevronRight />
    </button>
  );
};

type PageButtonProps = {
  disabled?: boolean;
  onClick: () => void;
  active?: boolean;
  page: number;
};
const PageButton = ({ onClick, disabled, page, active }: PageButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded text-xs font-semibold leading-[0.875rem] disabled:cursor-not-allowed",
        active
          ? "bg-brand text-on-brand"
          : " bg-interface hover:bg-brand-subtle active:bg-brand active:text-on-brand",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <span>{page.toString().padStart(2, "0")}</span>
    </button>
  );
};

type EllipsisButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};
const EllipsisButton = ({ onClick, disabled }: EllipsisButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded bg-interface text-xs font-semibold leading-[0.875rem]",
        "hover:bg-brand-subtle active:bg-brand active:text-on-brand disabled:cursor-not-allowed",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <span>...</span>
    </button>
  );
};

type Props = {
  data?: {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
  };
  onChange: (val: number) => void;
  disabled?: boolean;
  variant?: "truncated" | "simple";
};

const Pagination = ({
  data = {
    from: 0,
    to: 0,
    total: 0,
    current_page: 0,
    last_page: 0,
  },
  onChange,
  disabled = false,
  variant = "truncated",
}: Props) => {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const prevPage = useCallback(() => {
    if (disabled) return;
    const newPage = Math.max(data.current_page - 1, 1);
    onChangeRef.current(newPage);
  }, [data, disabled]);
  const nextPage = useCallback(() => {
    if (disabled) return;
    const newPage = Math.min(data.current_page + 1, data.last_page);
    onChangeRef.current(newPage);
  }, [data, disabled]);
  const handleSetPage = useCallback(
    (newPage: number) => () => {
      if (disabled) return;
      onChangeRef.current(newPage);
    },
    [disabled],
  );

  const SimplePages = () => {
    return (
      <div
        className="grid h-8 min-w-12 place-items-center rounded text-xs font-semibold leading-[0.875rem] text-subtle 
      disabled:cursor-not-allowed"
      >
        {data.current_page} / {data.last_page}
      </div>
    );
  };

  const pages = useMemo(() => {
    if (variant === "simple") {
      return <SimplePages />;
    }
    if (variant === "truncated") {
      if (data.last_page <= 7) {
        // [1][2][3][4][5][6][7]
        return Array(data.last_page)
          .fill("")
          .map((_, i) => (
            <PageButton
              key={i + 1}
              page={i + 1}
              onClick={handleSetPage(i + 1)}
              active={data.current_page === i + 1}
            />
          ));
      }
      if (data.current_page <= 4) {
        // [1][2][3][4][...][8][9]
        return (
          <>
            {Array(4)
              .fill("")
              .map((_, i) => (
                <PageButton
                  key={i + 1}
                  page={i + 1}
                  onClick={handleSetPage(i + 1)}
                  active={data.current_page === i + 1}
                />
              ))}
            <EllipsisButton
              onClick={() => {
                // Note: Implement PageDialogSelector
              }}
            />
            <PageButton
              page={data.last_page - 1}
              onClick={handleSetPage(data.last_page - 1)}
            />
            <PageButton
              page={data.last_page}
              onClick={handleSetPage(data.last_page)}
            />
          </>
        );
      }
      if (data.current_page >= data.last_page - 3) {
        // [1][2][...][6][7][8][9]
        return (
          <>
            <PageButton
              page={1}
              active={data.current_page === 1}
              onClick={handleSetPage(1)}
            />
            <PageButton
              page={2}
              active={data.current_page === 2}
              onClick={handleSetPage(2)}
            />
            <EllipsisButton
              onClick={() => {
                // Note: Implement PageDialogSelector
              }}
            />
            {Array(4)
              .fill("")
              .map((_, i) => (
                <PageButton
                  key={data.last_page - i}
                  page={data.last_page - i}
                  active={data.current_page === data.last_page - i}
                  onClick={handleSetPage(data.last_page - i)}
                />
              ))
              .reverse()}
          </>
        );
      }
    }

    return (
      // [1][...][4][5][6][...][9]
      <>
        <PageButton
          page={1}
          active={data.current_page === 1}
          onClick={handleSetPage(1)}
        />
        <EllipsisButton
          onClick={() => {
            // Note: Implement PageDialogSelector
          }}
        />
        {Array(3)
          .fill("")
          .map((_, i) => (
            <PageButton
              key={data.current_page + 1 - i}
              page={data.current_page + 1 - i}
              active={i === 1}
              onClick={handleSetPage(data.current_page + 1 - i)}
            />
          ))
          .reverse()}
        <EllipsisButton
          onClick={() => {
            // Note: Implement PageDialogSelector
          }}
        />
        <PageButton
          page={data.last_page}
          onClick={handleSetPage(data.last_page)}
        />
      </>
    );
  }, [data, handleSetPage, variant]);

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs leading-[0.875rem] text-subtle">
        {data.from} - {data.to} of {data.total} items
      </p>
      <div
        className={cn(
          "flex items-center",
          variant === "truncated" && "space-x-0.5",
          variant === "simple" && "rounded border",
        )}
      >
        <PrevButton
          disabled={data.current_page === 1 || disabled}
          onClick={prevPage}
          variant={variant}
        />
        {pages}
        <NextButton
          disabled={data.current_page === data.last_page || disabled}
          onClick={nextPage}
          variant={variant}
        />
      </div>
    </div>
  );
};

export default Pagination;
