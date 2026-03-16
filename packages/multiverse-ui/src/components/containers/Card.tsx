import type React from 'react';

import { cn } from './../../utilities';

import Text from './../informationals/Text';
import Button from './../input_controls/Button';
import Stack from './Stack';

const MAP_CARD_WIDTH_CLASS = {
  sm: 'max-w-sm',
  default: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
} as const;

type Size = keyof typeof MAP_CARD_WIDTH_CLASS;

type CardProps = {
  title?: string;
  subtitle?: string;
  size?: Size;
  headerAction?: {
    label: string;
    onClick: () => void;
  };
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  className?: string;
};

export default function Card({
  title,
  className,
  subtitle,
  size = 'default',
  headerAction,
  primaryAction,
  secondaryAction,
  children,
}: CardProps) {
  return (
    <Stack
      className={cn(
        'min-w-[25rem]',
        'rounded-mds-8 py-mds-20',
        'relative border',
        'justify-between',
        'overflow-x-clip',
        'bg-surface-raised ',
        MAP_CARD_WIDTH_CLASS[size],
        className
      )}
    >
      {(title || headerAction) && (
        <Stack
          horizontal
          gap={24}
          width="full"
          justify="start"
          align="center"
          distribute="between"
          className="z-10 border-b px-mds-20 pb-mds-16"
        >
          <Stack gap={4}>
            <Text size="lead" weight="semibold" color="default">
              {title}
            </Text>
            <Text size="caption" color="subtle">
              {subtitle}
            </Text>
          </Stack>
          {headerAction && (
            <Button
              variant="solid"
              className="capitalize"
              onClick={() => {
                headerAction.onClick();
              }}
            >
              {headerAction.label}
            </Button>
          )}
        </Stack>
      )}

      {children}

      {(primaryAction || secondaryAction) && (
        <Stack
          horizontal
          gap={4}
          className="z-10 flex w-full items-center border-t px-mds-20 pt-mds-16 "
        >
          {primaryAction && (
            <Button
              variant="solid"
              intent="primary"
              className="capitalize"
              onClick={() => {
                primaryAction.onClick();
              }}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              className="capitalize"
              onClick={() => {
                secondaryAction.onClick();
              }}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
