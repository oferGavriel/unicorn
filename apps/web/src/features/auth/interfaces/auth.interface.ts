export interface ISignUpPayload {
  email: string;
  password: string;
  name: string;
}

export interface ISignInPayload {
  email: string;
  password: string;
}

export interface IAuthUser {
  id: string | null;
  email: string | null;
  name: string | null;
}

export interface IResponse {
  user?: IAuthUser;
}
