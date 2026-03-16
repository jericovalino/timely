import React, { useMemo } from 'react';
import { cn } from '../../utilities';

type Height = 'tight' | 'relaxed' | 'loose';
type Size = keyof typeof MAP_FONT_SIZE_CLASS;
type Color = keyof typeof MAP_TEXT_COLOR_CLASS;
type Weight = keyof typeof MAP_FONT_WEIGHT_CLASS;
type AdjustableHeightSize = Extract<Size, 'body' | 'body-large' | 'caption'>;

const MAP_FONT_SIZE_CLASS = {
  display: 'text-display',
  title: 'text-title',
  heading: 'text-heading',
  subheading: 'text-subheading',
  lead: 'text-lead',
  'body-large': 'text-body-large',
  body: 'text-body',
  caption: 'text-caption',
  overline: 'text-caption font-bold uppercase tracking-[0.031rem]',
};

const MAP_FONT_WEIGHT_CLASS = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const MAP_LINE_HEIGHT_CLASS = {
  'body-tight': 'text-body-tight',
  'body-relaxed': 'text-body-relaxed',
  'body-loose': 'text-body-loose',
  'body-large-tight': 'text-body-large-tight',
  'body-large-relaxed': 'text-body-large-relaxed',
  'body-large-loose': 'text-body-large-loose',
  'caption-tight': 'text-caption-tight',
  'caption-relaxed': 'text-caption-relaxed',
  'caption-loose': 'text-caption-loose',
} satisfies Record<
  `${Extract<Size, 'body' | 'body-large' | 'caption'>}-${Height}`,
  string
>;

const MAP_TEXT_COLOR_CLASS = {
  default: 'text',
  inherit: 'text-inherit',
  inverse: 'text-inverse',
  subtle: 'text-subtle',
  placeholder: 'text-placeholder',
  disabled: 'text-disabled',
  brand: 'text-brand',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  light: 'text-light',
  dark: 'text-dark',
  'on-selected': 'text-on-selected',
  'on-selected-subtle': 'text-on-selected-subtle',
  'on-inverse': 'text-on-inverse',
  'on-brand': 'text-on-brand',
  'on-brand-subtle': 'text-on-brand-subtle',
  'on-info': 'text-on-info',
  'on-info-subtle': 'text-on-info-subtle',
  'on-success': 'text-success',
  'on-success-subtle': 'text-on-success-subtle',
  'on-warning': 'text-on-warning',
  'on-warning-subtle': 'text-on-warning-subtle',
  'on-danger': 'text-on-danger',
  'on-danger-subtle': 'text-on-danger-subtle',
};

type Props = {
  color?: Color;
  weight?: Weight;
  className?: string;
  children: React.ReactNode;
  size?: unknown;
} & (
  | {
      as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
    }
  | {
      as: 'label';
      htmlFor: string;
    }
) &
  (
    | {
        size?: AdjustableHeightSize;
        lineHeight?: Height;
      }
    | {
        size?: Exclude<Size, AdjustableHeightSize>;
      }
  );

// eslint-disable-next-line no-redeclare
const Text = ({
  children,
  className,
  color = 'default',
  weight = 'normal',
  ...rest
}: Props) => {
  const { as: Component = 'span', size = 'body' } = rest;
  const height = useMemo(() => {
    if (!('lineHeight' in rest)) return undefined;
    return `${rest.size as AdjustableHeightSize}-${rest.lineHeight as Height}` as const;
  }, [rest]);

  return (
    <Component
      className={cn(
        MAP_FONT_SIZE_CLASS[size],
        MAP_TEXT_COLOR_CLASS[color],
        size !== 'overline' && MAP_FONT_WEIGHT_CLASS[weight],
        height && MAP_LINE_HEIGHT_CLASS[height],
        className
      )}
      htmlFor={'htmlFor' in rest ? rest.htmlFor : undefined}
    >
      {children}
    </Component>
  );
};

export default Text;
