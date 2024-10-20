import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthUserDto, TokenValid } from './dto/auth-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import * as moment from 'moment';

@Injectable()
export class AuthService {
  private logger = new Logger('Auth Service');
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  private genAccessToken(user: User): string {
    const payload = { id: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: 60 * 60,
      secret: 'nest_tutorial',
    });
    return accessToken;
  }
  private genRefreshToken(user: User): {
    refreshToken: string;
    refreshTokenIat: Date;
  } {
    const payload = { id: user.id };
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: 60 * 60 * 5,
      secret: 'nest_tutorial',
    });

    return {
      refreshToken,
      refreshTokenIat: moment().toDate(),
    };
  }

  private async createUser(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<User> {
    const { username, password } = authCredentialsDto;
    try {
      const user = this.userRepository.create({ username, password });

      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(password, salt);

      user.password = hash;
      return user;
    } catch (error) {
      if (error.code === '23505') {
        console.log('error', error);
        throw new ConflictException('Existing username');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<AuthUserDto> {
    const user = await this.createUser(authCredentialsDto);
    if (user) {
      const accessToken = this.genAccessToken(user);
      const refreshData = this.genRefreshToken(user);
      await this.userRepository.updateRefreshToken(user, refreshData);
      return {
        accessToken,
        refreshToken: refreshData.refreshToken,
        tokenStatus: TokenValid.VALID,
      };
    } else {
      throw new InternalServerErrorException();
    }
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
    cookie,
  ): Promise<AuthUserDto> {
    const { password, username } = authCredentialsDto;
    const user = await this.userRepository.getUserByUsername(username);

    if (cookie && cookie.access_token) {
      const isValidToken = this.isValidAccessToken(cookie.access_token);
      if (isValidToken === TokenValid.VALID) {
        return {
          tokenStatus: TokenValid.VALID,
          accessToken: cookie.access_token,
          refreshToken: user.currentRefreshToken,
        };
      } else if (isValidToken === TokenValid.DIFF) {
        return {
          tokenStatus: TokenValid.DIFF,
          accessToken: cookie.access_token,
          refreshToken: user.currentRefreshToken,
        };
      } else {
        throw new UnauthorizedException('access token expired');
      }
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = this.genAccessToken(user);
      const refreshData = this.genRefreshToken(user);
      await this.userRepository.updateRefreshToken(user, refreshData);
      return {
        accessToken,
        refreshToken: refreshData.refreshToken,
        tokenStatus: TokenValid.VALID,
      };
    } else {
      throw new UnauthorizedException('login failed');
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const user =
        await this.userRepository.getUserByRefreshToken(refreshToken);
      const verified = this.jwtService.verify(user.currentRefreshToken, {
        secret: 'nest_tutorial',
      });
      if (verified) {
        const accessToken = this.genAccessToken(user);
        const refreshTokenData = this.genRefreshToken(user);
        await this.userRepository.updateRefreshToken(user, refreshTokenData);
        return { accessToken, refreshToken: refreshTokenData.refreshToken };
      }
    } catch (error) {
      console.log('refresh token expired', error);
      throw new HttpException('refresh token expired', HttpStatus.UNAUTHORIZED);
    }
  }

  async validUser(username: string) {
    const user = await this.userRepository.findOne({ where: { username } });
    if (user) {
      return user;
    }
    throw new UnauthorizedException('Unauthorize');
  }

  isValidAccessToken(accessToken) {
    try {
      const verified = this.jwtService.verify(accessToken, {
        secret: 'nest_tutorial',
      });
      if (verified) {
        const diff = moment(verified.exp).diff(verified.iat);
        if (diff < 1000) {
          return TokenValid.DIFF;
        } else {
          return TokenValid.VALID;
        }
      }
    } catch (error) {
      return TokenValid.EXPIRED;
    }
  }
}
