import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, UserRole } from "@retail-system/shared";
import { Observable } from "rxjs";

@Injectable()
export class RolesAuthGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
    
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        // Se ruoli non richiesti
        if(!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        const userRole = user?.role as UserRole | string | undefined;

        if (userRole === UserRole.superadmin) {
            return true;
        }
        if (requiredRoles.some((role) => userRole === role)) {
            return true;
        }
        throw new ForbiddenException('Non hai i permessi per questa operazione');
    }
}