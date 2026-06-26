import { IsString, IsUrl, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEndpointDto {
  @ApiProperty({ example: 'My First Endpoint', description: 'Name of the endpoint' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'https://api.my-app.com/webhook', description: 'Destination URL where webhooks will be forwarded' })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  destinationUrl: string;

  @ApiPropertyOptional({ example: 'stripe', description: 'Provider of the webhook (e.g., stripe, github, shopify)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  provider?: string;

  @ApiPropertyOptional({ example: 'whsec_...', description: 'Optional signing secret to verify webhooks' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  signingSecret?: string;
}
