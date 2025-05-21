import { FC, ReactElement } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import FormInput from '@/shared/components/FormInput';
import { FormValues } from '@/pages/AuthPage';

export type LoginFormProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

const LoginForm: FC<LoginFormProps> = ({ register, errors }): ReactElement => {
  return (
    <>
      <FormInput
        label="Email"
        type="email"
        autoComplete="email"
        registration={register('email')}
        error={errors.email}
      />
      <FormInput
        label="Password"
        type="password"
        autoComplete="current-password"
        registration={register('password')}
        error={errors.password}
      />
    </>
  );
};

export default LoginForm;
