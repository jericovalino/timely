import { type ReactNode } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from './../../utilities';

type NonNullableProps<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

const StackStyles = cva('flex', {
  variants: {
    width: {
      auto: 'w-auto',
      full: 'w-full',
      fit: 'w-fit',
    },
    height: {
      auto: 'h-auto',
      full: 'h-full',
      fit: 'h-fit',
    },
    horizontal: {
      true: 'flex-row',
      false: 'flex-col',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
    align: {
      start: 'content-start items-start',
      center: 'content-center items-center',
      end: 'content-end items-end',
      baseline: 'items-baseline',
    },
    distribute: {
      between: 'justify-between content-between',
      around: 'justify-around content-around',
      evenly: 'justify-evenly content-evenly',
      stretch: '*:flex-grow justify-stretch content-stretch',
    },
    gap: {
      2: 'gap-mds-2',
      4: 'gap-mds-4',
      6: 'gap-mds-6',
      8: 'gap-mds-8',
      10: 'gap-mds-10',
      12: 'gap-mds-12',
      14: 'gap-mds-14',
      16: 'gap-mds-16',
      18: 'gap-mds-18',
      20: 'gap-mds-20',
      24: 'gap-mds-24',
      28: 'gap-mds-28',
      32: 'gap-mds-32',
      40: 'gap-mds-40',
      60: 'gap-mds-60',
    },
  },
});

type StackCVAProps = NonNullableProps<VariantProps<typeof StackStyles>>;

interface StackProps extends StackCVAProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main';
  horizontal?: boolean;
}

const Stack = ({
  as: Component = 'div',
  horizontal = false, //default direction is vertical
  width = 'auto',
  height,
  justify,
  align,
  gap,
  distribute,
  children,
  className,
  ...props
}: StackProps) => {
  const styles = cn(
    StackStyles({
      horizontal,
      width,
      height,
      justify,
      align,
      gap,
      distribute,
    }),
    className
  );

  return (
    <Component className={styles} {...props}>
      {children}
    </Component>
  );
};

export default Stack;
