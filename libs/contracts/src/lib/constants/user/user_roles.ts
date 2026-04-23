import { SetMetadata } from "@nestjs/common";

export enum UserRole {
    superadmin = 'superadmin',
    admin = 'admin',
    user = 'user',
    store_operator = 'store_operator',
    cashier = 'cashier',
    warehouse_operator = 'warehouse_operator',
    /** Legacy value stored as `operator` in DB; prefer {@link UserRole.warehouse_operator}. */
    operatore = 'operator',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

/** Super-admin and admin (user management and admin-only gateway routes). */
export function isPrivilegedAdmin(role: UserRole | string | undefined): boolean {
    return role === UserRole.superadmin || role === UserRole.admin;
}

/** Roles allowed on routes that any signed-in application user may call. */
export const ALL_APP_ROLES: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.user,
    UserRole.store_operator,
    UserRole.cashier,
    UserRole.warehouse_operator,
    UserRole.operatore,
];

/** Aligned with {@link ORDER_WRITE_ROLES}: same app users may add suborders to their order flow. */
export const SUBORDER_CREATE_ROLES: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.store_operator,
    UserRole.cashier,
    UserRole.user,
];

export const SUBORDER_UPDATE_ROLES: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.warehouse_operator,
    UserRole.operatore,
];

export const ORDER_WRITE_ROLES: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.store_operator,
    UserRole.cashier,
    UserRole.user,
];

export const SUBORDER_MATERIALIZE_ROLES: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.warehouse_operator,
    UserRole.operatore,
];

export const SUBORDER_ALL_PENDING: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.warehouse_operator,
    UserRole.cashier,
];

export const INVENTORY_READ_ROLES: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.user,
    UserRole.store_operator,
    UserRole.cashier,
    UserRole.warehouse_operator,
    UserRole.operatore,
];

export const INVENTORY_MUTATE_ROLES: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.warehouse_operator,
    UserRole.operatore,
];

export const PAYMENT_ROLES: UserRole[] = [
    UserRole.superadmin,
    UserRole.admin,
    UserRole.store_operator,
    UserRole.cashier,
    UserRole.user,
];
