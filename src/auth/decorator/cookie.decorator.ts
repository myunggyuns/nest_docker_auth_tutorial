import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookie = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.cookies?.[data] : request.cookies;
});
