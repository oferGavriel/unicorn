import React, { ReactElement } from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

import { FormValues } from '@/pages/auth-page/AuthPage';
import { UI_IDS } from '@/pages/auth-page/AuthPage.consts';
import FormInput from '@/shared/components/FormInput';

import { RegisterFormValues } from '../schemas/auth.schema';

export type RegisterFormProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<RegisterFormValues>;
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  register,
  errors
}): ReactElement => {
  return (
    <>
      <FormInput
        label="Name"
        autoComplete="name"
        registration={register('name')}
        error={errors.name}
        data-testid={UI_IDS.REGISTER_NAME_INPUT}
      />
      <FormInput
        label="Email"
        type="email"
        autoComplete="email"
        registration={register('email')}
        error={errors.email}
        data-testid={UI_IDS.REGISTER_EMAIL_INPUT}
      />
      <FormInput
        label="Password"
        type="password"
        autoComplete="new-password"
        registration={register('password')}
        error={errors.password}
        data-testid={UI_IDS.REGISTER_PASSWORD_INPUT}
      />
    </>
  );
};
