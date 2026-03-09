import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "../database/entities/user";
import { JwtPayload } from "@retail-system/shared";

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    generateJwtToken(user: User) {
        const payload: JwtPayload = {
            id: user.userId,
            email: user.email,
            role: user.role
        }

        return {
            access_token: this.jwtService.sign(payload)
        }
    }
}