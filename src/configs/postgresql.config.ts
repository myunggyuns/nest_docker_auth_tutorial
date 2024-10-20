import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const postgresConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'auth-tutorial',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: true,
};
