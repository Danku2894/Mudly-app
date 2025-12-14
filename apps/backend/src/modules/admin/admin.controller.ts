import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { AdminCommentDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('violations')
  async getViolations(@Query('level') level: 'low' | 'high') {
      const data = await this.adminService.getViolations(level);
      return { success: true, data };
  }

  @Get('users/warning')
  async getUsersWarning() {
      const data = await this.adminService.getUsersWarning();
      return { success: true, data };
  }

  @Patch('users/:id/ban')
  async banUser(@Param('id') id: string) {
      const data = await this.adminService.banUser(id);
      return { success: true, data, message: 'User banned' };
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
      await this.adminService.deletePost(id);
      return { success: true, message: 'Post deleted' };
  }

  @Post('posts/:id/comment')
  async adminComment(@Request() req: any, @Param('id') id: string, @Body() body: AdminCommentDto) {
      const data = await this.adminService.adminComment(req.user.id, id, body.content);
      return { success: true, data, message: 'Admin comment added' };
  }

  @Get('stats/toxic-level')
  async getToxicStats() {
      const stats = await this.adminService.getStats();
      return { success: true, data: stats.toxicLevel };
  }

  @Get('stats/trending')
  async getTrendingStats() {
      const stats = await this.adminService.getStats();
      return { success: true, data: stats.trending };
  }

  @Get('stats/spam')
  async getSpamStats() {
      const stats = await this.adminService.getStats();
      return { success: true, data: stats.spam };
  }
}
