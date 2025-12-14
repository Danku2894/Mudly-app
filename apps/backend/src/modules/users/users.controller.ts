import { Controller, Get, Param, UseGuards, Request, Patch, Body, Post, BadRequestException, NotFoundException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto, BehaviorUpdateDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async search(@Query('q') q: string) {
      if (!q) return { success: true, data: [] };
      const users = await this.usersService.search(q);
      return { success: true, data: users };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
      const user = await this.usersService.getProfile(req.user.id);
      return { success: true, data: user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
      const user = await this.usersService.update(req.user.id, updateUserDto);
      // Remove password from response
      const { password, ...result } = user;
      return { success: true, data: result, message: 'Profile updated successfully' };
  }

  @Get(':id')
  async getProfile(@Param('id') id: string) {
      const user = await this.usersService.getProfile(id);
      if (!user) throw new NotFoundException('User not found');
      return { success: true, data: user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/settings')
  async updateSettings(@Request() req: any, @Body() settings: any) {
      const user = await this.usersService.update(req.user.id, {
          settings
      });
      return { success: true, data: user };
  }
}
