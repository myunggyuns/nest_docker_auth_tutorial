import { IsEnum, IsString } from 'class-validator';

export enum TokenValid {
  EXPIRED = 0,
  VALID = 1,
  DIFF = 2,
}

export class AuthUserDto {
  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;

  @IsEnum(TokenValid)
  tokenStatus: TokenValid;
}
