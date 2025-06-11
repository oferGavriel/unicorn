import React, { ReactElement } from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

import { FormValues } from '@/pages/auth-page/AuthPage';
import { UI_IDS } from '@/pages/auth-page/AuthPage.consts';
import FormInput from '@/shared/components/FormInput';

export type LoginFormProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

export const LoginForm: React.FC<LoginFormProps> = ({
  register,
  errors
}): ReactElement => {
  return (
    <>
      <FormInput
        label="Email"
        type="email"
        autoComplete="email"
        registration={register('email')}
        error={errors.email}
        data-testid={UI_IDS.LOGIN_EMAIL_INPUT}
      />
      <FormInput
        label="Password"
        type="password"
        autoComplete="current-password"
        registration={register('password')}
        error={errors.password}
        data-testid={UI_IDS.LOGIN_PASSWORD_INPUT}
      />
    </>
  );
};
