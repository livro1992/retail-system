import { UserRole } from "../constants/user/user_roles";

export interface JwtPayload {
    id: number;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}