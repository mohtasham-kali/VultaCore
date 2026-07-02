"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findOne(id) {
        return this.usersRepository.findOneBy({ id });
    }
    async findOrCreateUser(id, email) {
        let user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            user = this.usersRepository.create({
                id,
                username: email ? email.split('@')[0] : `user_${id.slice(0, 4)}`,
                email: email || `${id}@vultacore.app`,
                password: 'sso_user_no_password',
            });
            return this.usersRepository.save(user);
        }
        return user;
    }
    findAll() {
        return this.usersRepository.find();
    }
    findByUsername(username) {
        return this.usersRepository.findOneBy({ username });
    }
    create(userData) {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }
    async updatePlan(userId, planName) {
        let user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            console.log(`User ${userId} not found. Creating new record...`);
            user = this.usersRepository.create({
                id: userId,
                username: `user_${userId.slice(0, 4)}`,
                email: `${userId}@vultacore.app`,
                password: 'demo_password_placeholder',
                rank: planName,
            });
        }
        else {
            user.rank = planName;
        }
        return this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map