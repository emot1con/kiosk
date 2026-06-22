import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../../application/auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new developer account' })
  @ApiResponse({ status: 201, description: 'User successfully created, returns one-time apiKey' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login to dashboard' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('regenerate-key')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate API Key' })
  @ApiResponse({ status: 200, description: 'Returns new one-time apiKey' })
  async regenerateKey(@Request() req) {
    const userId = req.user.id;
    return this.authService.regenerateApiKey(userId);
  }
}
