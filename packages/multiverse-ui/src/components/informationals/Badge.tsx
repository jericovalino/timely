import { LuX } from 'react-icons/lu';
import { type IconType } from 'react-icons';
import { cva } from 'class-variance-authority';
import { isValidElement, type ReactElement } from 'react';

import Indicator from './Indicator';

import Text from './Text';
import Avatar, { type AvatarProps } from './Avatar';

import { cn } from '../../utilities';

const BaseStyle = cva(
  'flex gap-1 items-center px-[0.375rem] py-0.5 min-h-5 drop-shadow-sm w-max',
  {
    variants: {
      rounded: {
        true: 'rounded-3xl',
        false: 'rounded',
      },
      leadingItem: {
        icon: 'pl-1',
        avatar: 'pl-0.5',
        indicator: 'pl-[0.375rem]',
      },
      dismissible: {
        true: 'pr-1',
      },
    },
  }
);

const SolidBadgeStyle = cva('', {
  variants: {
    intent: {
      default: 'bg-interface text border border-subtle',
      primary: 'bg-brand text-on-brand',
      info: 'bg-info text-on-info',
      success: 'bg-success text-on-success',
      warning: 'bg-warning text-on-warning',
      danger: 'bg-danger text-on-danger',
    },
  },
});

const OutlineBadgeStyle = cva('border', {
  variants: {
    intent: {
      default: 'bg-interface text border-subtle',
      primary: 'bg-brand-subtle text-on-brand-subtle border-brand',
      info: 'bg-info-subtle text-on-info-subtle border-info',
      success: 'bg-success-subtle text-on-success-subtle border-success',
      warning: 'bg-warning-subtle text-on-warning-subtle border-warning',
      danger: 'bg-danger-subtle text-on-danger-subtle border-danger',
    },
  },
});

const GhostBadgeStyle = cva('', {
  variants: {
    intent: {
      default: 'bg-interface-subtle text',
      primary: 'bg-brand-subtle text-on-brand-subtle',
      info: 'bg-info-subtle text-on-info-subtle',
      success: 'bg-success-subtle text-on-success-subtle',
      warning: 'bg-warning-subtle text-on-warning-subtle',
      danger: 'bg-danger-subtle text-on-danger-subtle',
    },
  },
});

type BaseProps = {
  label: string;
  variant?: 'solid' | 'outline' | 'ghost';
  intent?: 'default' | 'primary' | 'info' | 'warning' | 'success' | 'danger';
  rounded?: boolean;
  className?: string;
};

type NoLeadingItem = {
  leadingItem?: never;
  config?: never;
  icon?: never;
  status?: never;
};

type NotDismissbileProps = {
  onDismiss?: never;
};

type DismissibleProps = {
  onDismiss: () => void;
};

type LeadingAvatar = {
  leadingItem: 'avatar';
  config: AvatarProps;
};

type Icon = IconType | ReactElement;
type LeadingIcon = {
  leadingItem: 'icon';
  icon: Icon;
};

type LeadingIndicator = {
  leadingItem: 'indicator';
  status: 'neutral' | 'success' | 'warning' | 'danger';
};

type BadgeProps = BaseProps &
  (DismissibleProps | NotDismissbileProps) &
  (NoLeadingItem | LeadingAvatar | LeadingIcon | LeadingIndicator);

const hasLeadingAvatar = (
  props: BadgeProps
): props is BaseProps & LeadingAvatar => {
  return props.leadingItem === 'avatar';
};

const hasLeadingIcon = (
  props: BadgeProps
): props is BaseProps & LeadingIcon => {
  return props.leadingItem === 'icon';
};

const hasLeadingIndicator = (
  props: BadgeProps
): props is BaseProps & LeadingIndicator => {
  return props.leadingItem === 'indicator';
};

const isDismissible = (
  props: BadgeProps
): props is BaseProps & DismissibleProps => {
  return props.onDismiss !== undefined;
};

const renderAvatar = (config: AvatarProps, rounded: boolean) => {
  const AvatarComponent =
    config.variant === 'image' ? (
      <Avatar
        variant="image"
        size={config.size}
        src={config.src}
        alt={config.alt}
        rounded={rounded}
      />
    ) : config.variant === 'initials' ? (
      <Avatar
        variant="initials"
        size={config.size}
        initials={config.initials}
        rounded={rounded}
      />
    ) : (
      <Avatar size={config.size} rounded={rounded} />
    );

  return AvatarComponent;
};

const renderIcon = (Icon: Icon) => {
  if (isValidElement(Icon)) {
    return Icon;
  }
  if (typeof Icon === 'function') {
    return <Icon size={12} />;
  }
  return null;
};

const renderIndicator = (status: LeadingIndicator['status']) => {
  return (
    <Indicator status={status} className="border-[0.063em] border-light" />
  );
};

const Badge = (props: BadgeProps) => {
  const {
    label = 'Badge',
    rounded = false,
    variant = 'solid',
    intent = 'default',
    leadingItem,
    onDismiss,
    className,
  } = props as BadgeProps;

  const baseStyle = BaseStyle({
    rounded,
    leadingItem: leadingItem ? leadingItem : null,
    dismissible: onDismiss !== undefined,
  });
  const solidStyle = SolidBadgeStyle({ intent });
  const outlineStyle = OutlineBadgeStyle({ intent });
  const ghostStyle = GhostBadgeStyle({ intent });

  const badgeStyle =
    variant === 'solid'
      ? solidStyle
      : variant === 'outline'
        ? outlineStyle
        : ghostStyle;

  return (
    <div className={cn(baseStyle, badgeStyle, className)}>
      {hasLeadingAvatar(props) ? renderAvatar(props.config, rounded) : null}
      {hasLeadingIcon(props) ? renderIcon(props.icon) : null}
      {hasLeadingIndicator(props) ? renderIndicator(props.status) : null}
      <Text size="overline" color="inherit">
        {label}
      </Text>
      {isDismissible(props) && (
        <LuX size={12} className="cursor-pointer" onClick={onDismiss} />
      )}
    </div>
  );
};

export default Badge;
