import { UserRole } from "../constants/user_roles";

export interface JwtPayload {
    id: number;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}