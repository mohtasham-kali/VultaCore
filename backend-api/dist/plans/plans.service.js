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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plan_entity_1 = require("./entities/plan.entity");
let PlansService = class PlansService {
    plansRepository;
    constructor(plansRepository) {
        this.plansRepository = plansRepository;
    }
    findAll() {
        return this.plansRepository.find();
    }
    async findOne(id) {
        const plan = await this.plansRepository.findOneBy({ id });
        if (!plan)
            throw new common_1.NotFoundException(`Plan ${id} not found`);
        return plan;
    }
    async findByName(name) {
        const plans = await this.plansRepository.find();
        const plan = plans.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (plan)
            return plan;
        const defaultVariant = name.toLowerCase() === 'standard'
            ? process.env.LS_VARIANT_STANDARD || '1820715'
            : name.toLowerCase() === 'premium'
                ? process.env.LS_VARIANT_PREMIUM || '1820708'
                : name.toLowerCase() === 'enterprise'
                    ? process.env.LS_VARIANT_ENTERPRISE || '1860093'
                    : 'free-tier';
        const defaultPrice = name.toLowerCase() === 'standard'
            ? 29
            : name.toLowerCase() === 'premium'
                ? 99
                : name.toLowerCase() === 'enterprise'
                    ? 179
                    : 0;
        return this.create({
            name,
            price: defaultPrice,
            interval: 'monthly',
            features: [`${name} tier access`],
            variantId: defaultVariant,
        });
    }
    async findByVariantId(variantId) {
        return this.plansRepository.findOneBy({ variantId });
    }
    async create(dto) {
        const plan = this.plansRepository.create({
            name: dto.name,
            price: dto.price,
            interval: dto.interval,
            features: dto.features,
            variantId: dto.variantId,
        });
        return this.plansRepository.save(plan);
    }
    async update(id, dto) {
        const plan = await this.findOne(id);
        if (dto.name !== undefined)
            plan.name = dto.name;
        if (dto.price !== undefined)
            plan.price = dto.price;
        if (dto.interval !== undefined)
            plan.interval = dto.interval;
        if (dto.features !== undefined)
            plan.features = dto.features;
        if (dto.variantId !== undefined)
            plan.variantId = dto.variantId;
        return this.plansRepository.save(plan);
    }
    async remove(id) {
        const plan = await this.findOne(id);
        await this.plansRepository.remove(plan);
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlansService);
//# sourceMappingURL=plans.service.js.map