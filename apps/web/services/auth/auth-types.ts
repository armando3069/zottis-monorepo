export type AuthUser = {
    id: number;
    email: string;
    name: string;
    avatar?: string;
}

export type SignupPayload  ={
    email: string;
    password: string;
    name: string;
}

export type LoginPayload = {
    email: string;
    password: string;
}
