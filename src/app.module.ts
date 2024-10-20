import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from './configs/postgresql.config';

@Module({
  imports: [TypeOrmModule.forRoot(postgresConfig), AuthModule],
})
export class AppModule {}
