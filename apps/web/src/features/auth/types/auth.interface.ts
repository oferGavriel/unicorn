export interface ISignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface ISignInPayload {
  email: string;
  password: string;
}

export interface IAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}
