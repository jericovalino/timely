import { useMemo, useState } from 'react';
import { type IconType } from 'react-icons';
import { RiEyeFill, RiEyeCloseFill } from 'react-icons/ri';

import { cn } from './../../utilities';

import FieldWrapper, {
  type Props as WrapperProps,
} from '../containers/FieldWrapper';

type Props = {
  testId?: string;
  value: string;
  icon?: IconType;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  onChange: (value: string) => void;
} & WrapperProps;

function PasswordInput({
  name,
  value,
  error,
  icon: Icon,
  disabled = false,
  readOnly = false,
  testId = undefined,
  maxLength = undefined,
  placeholder = undefined,
  onChange,
  ...rest
}: Props) {
  const [inputType, setInputType] = useState('password');

  const hasIcon = useMemo(() => Boolean(Icon), [Icon]);

  const toggleHideUnhidePassword = () => {
    if (inputType === 'password') setInputType('text');
    else setInputType('password');
  };

  return (
    <FieldWrapper name={name} error={error} readOnly={readOnly} {...rest}>
      <div className="relative w-full">
        {Icon ? (
          <Icon
            className={cn(
              'absolute left-[0.625rem] top-1/2 h-[0.875rem] w-[0.875rem] -translate-y-1/2 text-subtle',
              disabled ? 'text-disabled' : '',
              error ? 'text-on-danger-subtle' : ''
            )}
          />
        ) : null}
        <input
          id={name}
          type={inputType}
          data-test-id={testId}
          value={value}
          className={cn(
            'h-9 w-full rounded-mds-4 border bg-white pb-[0.063rem] pr-mds-32 text-body text placeholder:text-placeholder',
            'focus:outline-none',
            'disabled:bg-interface-disabled disabled:text-disabled',
            'read-only:text-on-interface-subtle read-only:bg-interface-subtle',
            hasIcon ? 'pl-mds-32' : 'pl-mds-10',
            error
              ? 'border-danger-subtle bg-danger-subtle text-on-danger-subtle'
              : 'focus:border-selected'
          )}
          onChange={(e) => {
            const { value } = e.target;
            if (typeof onChange === 'function') onChange(value);
          }}
          placeholder={readOnly ? '' : placeholder}
          disabled={readOnly ? false : disabled}
          readOnly={readOnly}
          maxLength={maxLength}
        />
        <button
          tabIndex={-1}
          type="button"
          className={cn(
            'absolute right-[0.625rem] top-1/2 -translate-y-1/2 text-icon-subtle',
            error
              ? 'text-on-danger-subtle'
              : 'text-subtle hover:text-on-brand-subtle'
          )}
          onClick={toggleHideUnhidePassword}
        >
          {inputType === 'password' ? (
            <RiEyeCloseFill className="h-[0.875rem] w-[0.875rem]" />
          ) : (
            <RiEyeFill className="h-[0.875rem] w-[0.875rem]" />
          )}
        </button>
      </div>
    </FieldWrapper>
  );
}

export default PasswordInput;
