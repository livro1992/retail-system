import { SetMetadata } from "@nestjs/common";

export enum UserRole {
    admin = 'admin',
    user = 'user',
    operatore = 'operator'
} 
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);