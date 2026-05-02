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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../forum/entities/post.entity");
const comment_entity_1 = require("../forum/entities/comment.entity");
let AnalyticsService = class AnalyticsService {
    httpService;
    postRepository;
    commentRepository;
    constructor(httpService, postRepository, commentRepository) {
        this.httpService = httpService;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
    }
    async getUserAnalytics(userId) {
        const recentPosts = await this.postRepository.find({
            where: { author: { id: userId } },
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const recentComments = await this.commentRepository.find({
            where: { author: { id: userId } },
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const postCount = await this.postRepository.count({ where: { author: { id: userId } } });
        const commentCount = await this.commentRepository.count({ where: { author: { id: userId } } });
        const activityLog = [
            ...recentPosts.map(p => ({ type: 'post', title: p.title, date: p.createdAt, points: 50 })),
            ...recentComments.map(c => ({ type: 'comment', title: 'Comented on a post', date: c.createdAt, points: 10 })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
        const actions = [
            ...Array(postCount).fill({ action_type: 'post_created', timestamp: Date.now(), points: 50 }),
            ...Array(commentCount).fill({ action_type: 'comment_created', timestamp: Date.now(), points: 10 }),
        ];
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post('http://localhost:5000/calculate', {
                user_id: userId,
                actions: actions.length > 0 ? actions : [{ action_type: 'session_start', timestamp: Date.now(), points: 5 }],
            }));
            return { ...response.data, activityLog };
        }
        catch (error) {
            return {
                user_id: userId,
                total_points: (postCount * 50) + (commentCount * 10),
                rank_estimate: 'Syncing...',
                engagement_score: 0,
                activityLog,
                error: 'Rust Analytics Engine Offline',
            };
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(2, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map