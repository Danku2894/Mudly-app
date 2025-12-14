import { Controller, Get, Post, Body, Query, UseGuards, Request, ValidationPipe, UsePipes, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto, GetFeedDto, CreateCommentDto, UpdatePostDto, ReactionDto } from './dto/post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() createPostDto: CreatePostDto) {
      const post = await this.postsService.create(req.user.id, createPostDto);
      return { success: true, data: post, message: 'Post created successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments')
  async createComment(@Request() req: any, @Body() createCommentDto: CreateCommentDto) {
      const comment = await this.postsService.createComment(req.user.id, createCommentDto);
      return { success: true, data: comment, message: 'Comment added' };
  }

  // Feed is public or private? Usually public but personalized. Let's keep it public for now, or auth optional?
  // User asked for "Feed cá nhân" -> implies personalization but filter/sort is generic.
  // For now let's optional auth or just public. Let's make it public for simplicity.
  @Get('feed')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFeed(@Query() query: GetFeedDto) {
      const result = await this.postsService.getFeed(query);
      return { success: true, data: result.data, pagination: { nextCursor: result.nextCursor } };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
      const post = await this.postsService.findOne(id);
      if (!post) throw new BadRequestException('Post not found');
      return { success: true, data: post };
  }

  @Get('user/:id') 
  async getUserPosts(@Param('id') userId: string) {
      const posts = await this.postsService.getUserPosts(userId);
      return { success: true, data: posts };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
      try {
          const post = await this.postsService.update(id, req.user.id, updatePostDto);
          return { success: true, data: post, message: 'Post updated' };
      } catch (error) {
          throw new BadRequestException(error.message);
      }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
      try {
          await this.postsService.delete(id, req.user.id);
          return { success: true, message: 'Post deleted' };
      } catch (error) {
           throw new BadRequestException(error.message);
      }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reactions')
  async toggleReaction(@Request() req: any, @Param('id') id: string, @Body() body: ReactionDto) {
      const result = await this.postsService.toggleReaction(id, req.user.id, body.type);
      return { success: true, data: result, message: 'Reaction updated' };
  }

}
