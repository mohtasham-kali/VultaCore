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
var ForumSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("./entities/post.entity");
const forum_service_1 = require("./forum.service");
const bots_service_1 = require("../bots/bots.service");
const users_service_1 = require("../users/users.service");
let ForumSchedulerService = ForumSchedulerService_1 = class ForumSchedulerService {
    postRepository;
    usersService;
    forumService;
    botsService;
    logger = new common_1.Logger(ForumSchedulerService_1.name);
    constructor(postRepository, usersService, forumService, botsService) {
        this.postRepository = postRepository;
        this.usersService = usersService;
        this.forumService = forumService;
        this.botsService = botsService;
    }
    async handleUnansweredPosts() {
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
        const posts = await this.postRepository.find({
            where: {
                createdAt: (0, typeorm_2.LessThanOrEqual)(fifteenMinutesAgo),
                commentsCount: 0,
                aiResponded: false,
            },
        });
        if (posts.length > 0) {
            this.logger.log(`Found ${posts.length} unanswered posts older than 15 minutes. Generating AI responses...`);
            let systemUser = await this.usersService.findByUsername('System AI');
            if (!systemUser) {
                systemUser = await this.usersService.create({
                    username: 'System AI',
                    email: 'ai@vultacore.techprogression.com',
                    password: 'auto-generated',
                    isBot: true,
                    rank: 'AI Assistant',
                });
            }
            const bots = await this.botsService.findAll('general');
            const aiBot = bots.find((b) => b.name === 'Bug Scanner') || bots[0];
            if (!aiBot) {
                this.logger.error('No AI bots available to generate response.');
                return;
            }
            for (const post of posts) {
                try {
                    const prompt = `Please provide a helpful, detailed, and professional response to this forum post. Title: "${post.title}". Content: "${post.content}"`;
                    this.logger.log(`Generating AI response for post ID: ${post.id}`);
                    const aiResponse = await this.botsService.executeBot(aiBot.id, prompt, systemUser.id);
                    await this.forumService.createComment(post.id, { content: aiResponse.response }, systemUser);
                    post.aiResponded = true;
                    await this.postRepository.save(post);
                    this.logger.log(`Successfully replied to post ID: ${post.id}`);
                }
                catch (error) {
                    this.logger.error(`Failed to generate AI response for post ${post.id}:`, error);
                }
            }
        }
    }
};
exports.ForumSchedulerService = ForumSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ForumSchedulerService.prototype, "handleUnansweredPosts", null);
exports.ForumSchedulerService = ForumSchedulerService = ForumSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        forum_service_1.ForumService,
        bots_service_1.BotsService])
], ForumSchedulerService);
//# sourceMappingURL=forum.scheduler.js.map