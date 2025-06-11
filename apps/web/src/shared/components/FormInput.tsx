import React, { ReactElement } from 'react';
import { FieldError } from 'react-hook-form';

import { Input } from '@/components/ui/input';

type FormInputProps = {
  label: string;
  type?: string;
  autoComplete?: string;
  error?: FieldError;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: ReturnType<any>;
  'data-testid'?: string;
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  autoComplete,
  error,
  registration,
  'data-testid': dataTestId
}): ReactElement => {
  return (
    <div className="space-y-1">
      <Input
        type={type}
        placeholder={label}
        autoComplete={autoComplete}
        {...registration}
        data-testid={dataTestId}
      />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
};

export default FormInput;
