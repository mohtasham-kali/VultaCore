"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const forum_service_1 = require("./forum.service");
const forum_controller_1 = require("./forum.controller");
const post_entity_1 = require("./entities/post.entity");
const comment_entity_1 = require("./entities/comment.entity");
const users_module_1 = require("../users/users.module");
const bots_module_1 = require("../bots/bots.module");
const forum_scheduler_1 = require("./forum.scheduler");
let ForumModule = class ForumModule {
};
exports.ForumModule = ForumModule;
exports.ForumModule = ForumModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([post_entity_1.Post, comment_entity_1.Comment]), users_module_1.UsersModule, bots_module_1.BotsModule],
        providers: [forum_service_1.ForumService, forum_scheduler_1.ForumSchedulerService],
        controllers: [forum_controller_1.ForumController],
        exports: [forum_service_1.ForumService],
    })
], ForumModule);
//# sourceMappingURL=forum.module.js.map