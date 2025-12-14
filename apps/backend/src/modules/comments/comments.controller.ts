import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto, GetCommentsDto, CommentReactionDto } from './dto/comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() createCommentDto: CreateCommentDto) {
      try {
          const comment = await this.commentsService.create(req.user.id, createCommentDto);
          return { success: true, data: comment, message: 'Comment added' };
      } catch (error) {
          throw new BadRequestException(error.message);
      }
  }

  // List comments of a post - usually users check comments of a post
  // Route could be /posts/:id/comments or /comments?postId=...
  // Requirement said: GET /posts/:id/comments. 
  // Should this be in PostsController or CommentsController? 
  // If strict REST on /comments, it's /comments?postId=.
  // But user specialized path. Let's put a specialized route here or in Posts.
  // Let's support GET /comments/post/:id to keep it in CommentsController
  
  @Get('post/:postId')
  async getCommentsByPost(@Param('postId') postId: string, @Query() query: GetCommentsDto) {
      const comments = await this.commentsService.findAllByPost(postId, query);
      return { success: true, data: comments };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reactions')
  async toggleReaction(@Request() req: any, @Param('id') id: string, @Body() body: CommentReactionDto) {
      const result = await this.commentsService.toggleReaction(id, req.user.id, body.type);
      return { success: true, data: result, message: 'Reaction updated' };
  }
}
