import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { MdClose as Close } from "react-icons/md";

import { cn } from "./../../utilities";

import Text from "./Text";
import Stack from "./Text";

const style = `
  [data-side="bottom"][data-align="end"] span,
  [data-side="top"][data-align="end"] span {
    right: 10% !important;
    left: unset !important;
  }
  [data-side="bottom"][data-align="start"] span,
  [data-side="top"][data-align="start"] span {
    left: 10% !important;
  }
`;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useLayoutEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <>
      {isMounted && <style>{style}</style>}
      <TooltipPrimitive.Content
        ref={ref}
        className={cn(
          "animate-in z-50 max-w-[18.75rem] overflow-hidden rounded",
          "fade-in zoom-in",
          "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-top data-[side=left]:slide-right",
          "data-[side=right]:slide-left data-[side=top]:slide-bottom",
          "border-transparent bg-inverse p-4 text-on-inverse transition-all",
          "data-[state=closed]:animate-out",
          className,
        )}
        sideOffset={10}
        arrowPadding={15}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className="visible border-none fill-black-500"
          width={15}
          height={7}
        />
      </TooltipPrimitive.Content>
    </>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

type TMainProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: "top" | "right" | "bottom" | "left";
  offset?: "center" | "end" | "start";
  title?: React.ReactNode;
  dismissible?: boolean;
} & Omit<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
  "content" | "title" | "asChild"
>;

const Tooltip = ({
  content,
  children,
  position = "bottom",
  offset = "center",
  title,
  dismissible,
  ...props
}: TMainProps) => {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root delayDuration={300} {...(dismissible && { open })}>
        <TooltipPrimitive.Trigger
          asChild
          {...(dismissible && { onClick: () => setOpen(!open) })}
        >
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipContent side={position} align={offset} {...props}>
          <Stack className="gap-1">
            <div className={cn(title ? "flex" : "absolute right-0 top-0")}>
              {title && (
                <Text
                  size="caption"
                  weight="semibold"
                  color="on-inverse"
                  className={cn(title && "flex-1")}
                >
                  {title}
                </Text>
              )}
              {dismissible && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-1.5 top-1.5 text-caption"
                >
                  <Close />
                </button>
              )}
            </div>
            <div className={cn("text-caption", dismissible && "mr-2")}>
              {content}
            </div>
          </Stack>
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export default Tooltip;
