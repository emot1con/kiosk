import { IsString, IsUrl, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEndpointDto {
  @ApiPropertyOptional({ example: 'Updated Endpoint Name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'https://api.my-app.com/new-webhook' })
  @IsUrl({ require_tld: false })
  @IsOptional()
  destinationUrl?: string;

  @ApiPropertyOptional({ example: 'stripe', description: 'Provider of the webhook' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  provider?: string;

  @ApiPropertyOptional({ example: 'new_whsec_...' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  signingSecret?: string;

  @ApiPropertyOptional({ example: true, description: 'Toggle whether endpoint should receive webhooks' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
