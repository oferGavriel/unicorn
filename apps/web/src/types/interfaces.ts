export interface AuthRegisterRequest {
    email: string;
    name: string;
    password: string;
}

export interface AuthLoginRequest {
    email: string;
    password: string;
}