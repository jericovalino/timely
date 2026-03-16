import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
  override: {
    classGroups: {
      'text-color': [
        'text',
        'text-inverse',
        'text-subtle',
        'text-placeholder',
        'text-disabled',
        'text-brand',
        'text-info',
        'text-success',
        'text-warning',
        'text-danger',
        'text-light',
        'text-dark',
        'text-on-selected',
        'text-on-selected-subtle',
        'text-on-inverse',
        'text-on-brand',
        'text-on-brand-subtle',
        'text-on-info',
        'text-on-info-subtle',
        'text-success',
        'text-on-success-subtle',
        'text-on-warning',
        'text-on-warning-subtle',
        'text-on-danger',
        'text-on-danger-subtle',
      ],
      'font-size': [
        'text-display',
        'text-title',
        'text-heading',
        'text-subheading',
        'text-lead',
        'text-body',
        'text-body-tight',
        'text-body-relaxed',
        'text-body-loose',
        'text-body-large',
        'text-body-large-tight',
        'text-body-large-relaxed',
        'text-body-large-loose',
        'text-caption',
        'text-caption-tight',
        'text-caption-relaxed',
        'text-caption-loose',
      ],
    },

    conflictingClassGroups: {},
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}