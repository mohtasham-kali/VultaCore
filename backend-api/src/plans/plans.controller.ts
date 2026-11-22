import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { FeaturesService } from './features.service';
import { SubscriptionsService } from './subscriptions.service';
import { EntitlementsService } from './entitlements.service';
import { EnterpriseService } from './enterprise.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  CreateFeatureDto,
  UpdateFeatureDto,
  EnterpriseInquiryDto,
  CustomizeEnterpriseDto,
  CalculateEnterprisePriceDto,
} from './dto/plans.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller()
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly featuresService: FeaturesService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly entitlementsService: EntitlementsService,
    private readonly enterpriseService: EnterpriseService,
  ) {}

  // ==========================================
  // PUBLIC PLAN & PRICING ENDPOINTS
  // ==========================================

  @Get('plans/published')
  getPublishedPlans() {
    return this.plansService.findPublished();
  }

  @Get('plans/slug/:slug')
  getPlanBySlug(@Param('slug') slug: string) {
    return this.plansService.findOne(slug);
  }

  @Post('enterprise/inquiry')
  submitEnterpriseInquiry(@Body() dto: EnterpriseInquiryDto) {
    return this.enterpriseService.createInquiry(dto);
  }

  // ==========================================
  // USER ENTITLEMENTS (AUTHENTICATED)
  // ==========================================

  @Get('users/:userId/entitlements')
  @UseGuards(SupabaseAuthGuard)
  getUserEntitlements(@Param('userId') userId: string) {
    return this.entitlementsService.getUserEntitlements(userId);
  }

  // ==========================================
  // ADMIN PLAN MANAGEMENT
  // ==========================================

  @Get('plans')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getAllPlans() {
    return this.plansService.findAll(true);
  }

  @Post('plans')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  createPlan(@Body() dto: CreatePlanDto, @Req() req: any) {
    const adminEmail = req.user?.email || 'admin';
    return this.plansService.create(dto, adminEmail);
  }

  @Get('plans/:id')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getPlanById(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch('plans/:id')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @Req() req: any,
  ) {
    const adminEmail = req.user?.email || 'admin';
    return this.plansService.update(id, dto, adminEmail);
  }

  @Post('plans/:id/duplicate')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  duplicatePlan(@Param('id') id: string, @Req() req: any) {
    const adminEmail = req.user?.email || 'admin';
    return this.plansService.duplicate(id, adminEmail);
  }

  @Post('plans/:id/archive')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  archivePlan(@Param('id') id: string, @Req() req: any) {
    const adminEmail = req.user?.email || 'admin';
    return this.plansService.archive(id, adminEmail);
  }

  // ==========================================
  // ADMIN FEATURE REGISTRY
  // ==========================================

  @Get('features')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getAllFeatures() {
    return this.featuresService.findAll();
  }

  @Post('features')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  createFeature(@Body() dto: CreateFeatureDto) {
    return this.featuresService.create(dto);
  }

  @Patch('features/:id')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  updateFeature(@Param('id') id: string, @Body() dto: UpdateFeatureDto) {
    return this.featuresService.update(id, dto);
  }

  // ==========================================
  // ADMIN SUBSCRIPTION MANAGEMENT
  // ==========================================

  @Get('subscriptions/overview')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getSubscriptionOverview() {
    return this.subscriptionsService.getOverview();
  }

  @Get('subscriptions/users')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getAllSubscribers(@Query('plan') plan?: string) {
    return this.subscriptionsService.getAllUserSubscriptions(plan);
  }

  @Get('subscriptions/user/:userId')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getUserSubscription(@Param('userId') userId: string) {
    return this.subscriptionsService.getUserSubscription(userId);
  }

  @Post('subscriptions/user/:userId/assign')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  assignUserPlan(
    @Param('userId') userId: string,
    @Body('plan') plan: string,
    @Req() req: any,
  ) {
    const adminEmail = req.user?.email || 'admin';
    return this.subscriptionsService.assignPlan(userId, plan, adminEmail);
  }

  @Post('subscriptions/calculate-enterprise-price')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  calculateEnterprisePrice(@Body() dto: CalculateEnterprisePriceDto) {
    return this.subscriptionsService.calculateEnterprisePrice(dto);
  }

  @Post('subscriptions/user/:userId/enterprise')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  customizeEnterprise(
    @Param('userId') userId: string,
    @Body() dto: CustomizeEnterpriseDto,
    @Req() req: any,
  ) {
    const adminEmail = req.user?.email || 'admin';
    return this.subscriptionsService.customizeEnterprise(userId, dto, adminEmail);
  }

  @Patch('subscriptions/user/:userId/status')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  updateSubscriptionStatus(
    @Param('userId') userId: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    const adminEmail = req.user?.email || 'admin';
    return this.subscriptionsService.updateStatus(userId, status, adminEmail);
  }

  // ==========================================
  // ADMIN ENTERPRISE INQUIRIES
  // ==========================================

  @Get('enterprise/inquiries')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getEnterpriseInquiries(@Query('status') status?: string) {
    return this.enterpriseService.findAll(status);
  }

  @Get('enterprise/inquiries/user')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getInquiryByUserOrEmail(
    @Query('email') email: string,
    @Query('userId') userId?: string,
  ) {
    return this.enterpriseService.findByEmailOrUser(email, userId);
  }

  @Patch('enterprise/inquiries/:id')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  updateInquiryStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.enterpriseService.updateStatus(id, status, notes);
  }
}

