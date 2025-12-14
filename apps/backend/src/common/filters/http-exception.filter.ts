import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal Server Error' };

    let message = 'Internal Server Error';
    let errorCode = 'INTERNAL_ERROR';

    if (typeof errorResponse === 'string') {
      message = errorResponse;
    } else if (typeof errorResponse === 'object' && errorResponse !== null) {
      if ('message' in errorResponse) {
        message = (errorResponse as any).message;
        if (Array.isArray(message)) {
            message = message.join(', ');
        }
      }
      if ('error' in errorResponse) {
          errorCode = (errorResponse as any).error; // Start with HTTP Error Name
      }
      // If we have specific errorCode field in exception response
      if ('errorCode' in errorResponse) {
          errorCode = (errorResponse as any).errorCode;
      }
    }

    response.status(status).json({
      success: false,
      data: null,
      message: message,
      errorCode: errorCode,
    });
  }
}
