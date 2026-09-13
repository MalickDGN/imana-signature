import { Body, Controller, Get, Headers, Ip, Post } from '@nestjs/common';
import { LoginDto } from './admin-auth.dto';
import { AdminAuthService } from './admin-auth.service';

@Controller('auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Ip() clientAddress: string) {
    return this.auth.login(dto.email, dto.password, clientAddress);
  }

  @Post('logout')
  logout(@Headers('x-admin-session') token?: string) {
    return this.auth.logout(token);
  }

  @Get('me')
  async me(
    @Headers('x-admin-import-token') importToken?: string,
    @Headers('x-admin-session') session?: string,
  ) {
    this.auth.assertImportToken(importToken);
    return this.auth.resolveSession(session);
  }
}
