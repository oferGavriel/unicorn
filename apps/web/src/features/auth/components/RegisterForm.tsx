import { FC, ReactElement } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { RegisterFormValues } from '../schemas/auth.schema';
import FormInput from '@/shared/components/FormInput';
import { FormValues } from '@/pages/AuthPage';

export type RegisterFormProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<RegisterFormValues>;
};

const RegisterForm: FC<RegisterFormProps> = ({ register, errors }): ReactElement => {
  return (
    <>
      <FormInput
        label="Name"
        autoComplete="name"
        registration={register('name')}
        error={errors.name}
      />
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
        autoComplete="new-password"
        registration={register('password')}
        error={errors.password}
      />
    </>
  );
};

export default RegisterForm;
