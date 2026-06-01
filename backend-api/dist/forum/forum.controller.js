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
exports.ForumController = void 0;
const common_1 = require("@nestjs/common");
const forum_service_1 = require("./forum.service");
const users_service_1 = require("../users/users.service");
let ForumController = class ForumController {
    forumService;
    usersService;
    constructor(forumService, usersService) {
        this.forumService = forumService;
        this.usersService = usersService;
    }
    async create(createPostDto) {
        const { userId, email, ...dto } = createPostDto;
        const author = await this.usersService.findOrCreateUser(userId, email);
        return this.forumService.createPost(dto, author);
    }
    findAll(type) {
        return this.forumService.findAllPosts(type);
    }
    findOne(id) {
        return this.forumService.findOnePost(id);
    }
    like(id) {
        return this.forumService.likePost(id);
    }
    async createComment(id, createCommentDto) {
        const { userId, email, ...dto } = createCommentDto;
        const author = await this.usersService.findOrCreateUser(userId, email);
        return this.forumService.createComment(id, dto, author);
    }
    likeComment(commentId) {
        return this.forumService.likeComment(commentId);
    }
};
exports.ForumController = ForumController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ForumController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ForumController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/like'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ForumController.prototype, "like", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "createComment", null);
__decorate([
    (0, common_1.Post)('comments/:commentId/like'),
    __param(0, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ForumController.prototype, "likeComment", null);
exports.ForumController = ForumController = __decorate([
    (0, common_1.Controller)('forum'),
    __metadata("design:paramtypes", [forum_service_1.ForumService,
        users_service_1.UsersService])
], ForumController);
//# sourceMappingURL=forum.controller.js.map