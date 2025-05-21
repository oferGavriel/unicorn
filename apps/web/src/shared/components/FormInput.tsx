import { Input } from '@/components/ui/input';
import { FieldError } from 'react-hook-form';
import { FC } from 'react';

type FormInputProps = {
  label: string;
  type?: string;
  autoComplete?: string;
  error?: FieldError;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: ReturnType<any>;
};

const FormInput: FC<FormInputProps> = ({
  label,
  type = 'text',
  autoComplete,
  error,
  registration,
}) => {
  return (
    <div className="space-y-1">
      <Input type={type} placeholder={label} autoComplete={autoComplete} {...registration} />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
};

export default FormInput;
