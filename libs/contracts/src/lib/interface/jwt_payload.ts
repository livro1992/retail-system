import { UserRole } from "../constants/user/user_roles";

export interface JwtPayload {
    id: string;
    email: string;
    role: UserRole;
    /** Magazzino assegnato (operatore magazzino); presente se valorizzato sul profilo utente. */
    warehouseId?: string;
    iat?: number;
    exp?: number;
}