import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../database/entities/user";
import { ApiResponse, SignInDto, UserDto, UserRole } from "@retail-system/shared";
import { HttpStatusCode } from "axios";
import * as bcrypt from 'bcrypt';
import { AuthService } from "../auth/auth_service";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly authService: AuthService
    ) {}

    async signIn(credentials: SignInDto): Promise<ApiResponse<{ access_token: string }>> {
        const user = await this.userRepository.findOne({
            where: {
                email: credentials.email
            },
            select: ["userId", "email", "password", "role"]
        });
        
        if(user == null) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.Unauthorized,
                    description: 'Utente inesistente'
                }
            }
        }
        const hashedPassword = await bcrypt.compare(credentials.password, user.password);

        if(hashedPassword == true) {
            const token = this.authService.generateJwtToken(user);

            return {
                success: true,
                data: token
            }
        } else {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.Unauthorized,
                    description: "Password errata"
                }
            }
        }
    }

    async createUser(userDto: UserDto): Promise<ApiResponse<User>> {
        try {
            const salt = await bcrypt.genSalt(10);
            const passwordHashed = await bcrypt.hash(userDto.password, salt);

            const newUser = await this.userRepository.create({
                email: userDto.email,
                password: passwordHashed,
                role: userDto.role ?? UserRole.user
            });
            const savedUser = await this.userRepository.save(newUser);
            delete savedUser.password;
        
            return {
                success: true,
                data: savedUser
            };
        } catch (error) {
            console.error('Errore durante il salvataggio:', error);
            return {
                success: false,
                error: {
                    code: HttpStatusCode.InternalServerError,
                    description: error
                }
            };
        }
    }

    async getUser(id: User['userId']): Promise<ApiResponse<User>> {
        const user = await this.userRepository.findOne({
            where: {
                userId: id
            }
        });
        const success = user != null ? true : false;
        let error = null;

        if(user == null) {
            error = {
                code: HttpStatusCode.NotFound,
                description: 'Utente non trovato'
            }
        }

        return {
            success: success,
            data: user,
            error: error
        }
    }

    async getAllUsers(): Promise<ApiResponse<User[]>> {
        try {
            const userList = await this.userRepository.find();

            return {
                success: true,
                data: userList
            }
        } catch (e) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.BadRequest,
                    description: e
                }
            }
        }
    }

    async updateUser(id: User['userId'], updateDto: Partial<UserDto>): Promise<ApiResponse<User>> {
        try {
            if(updateDto.password != null) {
                const salt = await bcrypt.genSalt(10);
                updateDto.password = await bcrypt.hash(updateDto.password, salt);
            }
            const updateUser = await this.userRepository.preload({
                userId: id,
                ...updateDto
            });

            if(updateUser == null) {
                return {
                    success: false,
                    error: {
                        code: HttpStatusCode.NotFound,
                        description: 'L\'elemento cercato non è presente'
                    }
                }
            }
            const res = await this.userRepository.save(updateUser);
            delete res.password;

            return {
                success: true,
                data: res
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.InternalServerError,
                    description: error
                }
            };
        }
    }
}