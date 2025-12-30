import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { Request, Response } from "express";

export interface HttpErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | object;
  error?: string;
}

/**
 * Global HTTP exception filter
 * Handles all HTTP exceptions and provides consistent error response format
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract message and error details
    let message: string | object = exception.message;
    let error: string | undefined;

    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, string | object>;
      message = responseObj.message || message;
      error = responseObj.error as string | undefined;
    }

    const errorResponse: HttpErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(error && { error }),
    };

    // Log the error
    this.logger.error(
      `[${request.method}] ${request.url} - ${status} ${typeof message === "string" ? message : JSON.stringify(message)}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
