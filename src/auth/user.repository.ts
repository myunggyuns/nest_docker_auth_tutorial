import { CustomRepository } from 'src/typeorm-ex.decorator';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

@CustomRepository(User)
export class UserRepository extends Repository<User> {
  // async createUser(authCredentialsDto: AuthCredentialsDto): Promise<User> {
  //   const { username, password } = authCredentialsDto;
  //   try {
  //     const user = this.create({ username, password });

  //     const salt = await bcrypt.genSalt();
  //     const hash = await bcrypt.hash(password, salt);

  //     user.password = hash;
  //     return user;
  //   } catch (error) {
  //     if (error.code === '23505') {
  //       console.log('error', error);
  //       throw new ConflictException('Existing username');
  //     } else {
  //       throw new InternalServerErrorException();
  //     }
  //   }
  // }

  async updateRefreshToken(
    user: User,
    refreshData: {
      refreshToken: string;
      refreshTokenIat: Date;
    },
  ) {
    try {
      user.currentRefreshToken = refreshData.refreshToken;
      user.currentRefreshIat = refreshData.refreshTokenIat;
      const result = await this.save(user);
      return result;
    } catch (error) {
      console.log('error', error);
      if (error.code === '23505') {
        throw new ConflictException('Existing username');
      } else {
        throw new InternalServerErrorException('updateRefreshToken');
      }
    }
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('Not found user');
    }

    return user;
  }

  async getUserByRefreshToken(refreshToken: string): Promise<User> {
    const user = await this.findOne({
      where: { currentRefreshToken: refreshToken },
    });
    if (!user) {
      throw new NotFoundException('Not found user');
    }

    return user;
  }
}
