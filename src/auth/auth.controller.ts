import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  Get,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthUserDto } from './dto/auth-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorator/get-user.decorator';
import { Cookie } from './decorator/cookie.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signin')
  async signIn(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
    @Cookie() cookie,
  ): Promise<AuthUserDto> {
    return await this.authService.signIn(authCredentialsDto, cookie);
  }

  @Post('/signup')
  async signUp(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<AuthUserDto> {
    return await this.authService.signUp(authCredentialsDto);
  }

  @Get('/refresh')
  async refreshAccessToken(@Headers('authorization') headers) {
    const refreshToken = headers.split(' ')[1];
    return await this.authService.refreshAccessToken(refreshToken);
  }

  @Post('/hello')
  @UseGuards(AuthGuard())
  async getHello(@Req() req, @GetUser() user) {
    console.log('!!!!!!!!!!', req, user);
  }
}
