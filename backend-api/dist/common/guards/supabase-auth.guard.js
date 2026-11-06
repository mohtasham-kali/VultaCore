"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SupabaseAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const tokenCache = new Map();
let SupabaseAuthGuard = SupabaseAuthGuard_1 = class SupabaseAuthGuard {
    logger = new common_1.Logger(SupabaseAuthGuard_1.name);
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing or malformed Authorization header');
        }
        const token = authHeader.substring(7).trim();
        if (!token) {
            throw new common_1.UnauthorizedException('Empty bearer token provided');
        }
        const cached = tokenCache.get(token);
        const now = Date.now();
        if (cached && cached.expiresAt > now) {
            request.user = cached.user;
            return true;
        }
        const supabaseUrl = process.env.SUPABASE_URL ||
            process.env.NEXT_PUBLIC_SUPABASE_URL ||
            'https://izimqwjupqzcogrtyuik.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SUPABASE_ANON_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            '';
        try {
            const response = await axios_1.default.get(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apikey: supabaseKey,
                },
                timeout: 5000,
            });
            if (!response.data || !response.data.id) {
                throw new common_1.UnauthorizedException('Invalid user token from Supabase');
            }
            const user = response.data;
            request.user = user;
            tokenCache.set(token, { user, expiresAt: now + 60000 });
            if (tokenCache.size > 2000) {
                for (const [k, v] of tokenCache.entries()) {
                    if (v.expiresAt <= now)
                        tokenCache.delete(k);
                }
            }
            return true;
        }
        catch (err) {
            if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                this.logger.warn(`Supabase network unreachable (${err.code}). Falling back to local token verification.`);
                try {
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                        if (payload.exp && payload.exp * 1000 > now) {
                            request.user = { id: payload.sub, email: payload.email, ...payload };
                            return true;
                        }
                    }
                }
                catch (_) { }
            }
            this.logger.error(`Token authentication failed: ${err.message}`);
            throw new common_1.UnauthorizedException('Invalid or expired authentication token');
        }
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard;
exports.SupabaseAuthGuard = SupabaseAuthGuard = SupabaseAuthGuard_1 = __decorate([
    (0, common_1.Injectable)()
], SupabaseAuthGuard);
//# sourceMappingURL=supabase-auth.guard.js.map