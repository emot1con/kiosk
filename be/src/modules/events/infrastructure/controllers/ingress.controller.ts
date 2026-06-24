import { Controller, Post, Param, Headers, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IngressService } from '../../application/ingress.service';

@ApiTags('Webhook Ingress')
@Controller('incoming')
export class IngressController {
  constructor(private readonly ingressService: IngressService) {}

  @Post(':incoming_key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive third-party webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  @ApiResponse({ status: 400, description: 'Endpoint is paused' })
  async handleWebhook(
    @Param('incoming_key') incomingKey: string,
    @Headers() headers: Record<string, any>,
    @Body() body: any,
  ) {
    return this.ingressService.handleIncomingWebhook(incomingKey, headers, body);
  }
}
