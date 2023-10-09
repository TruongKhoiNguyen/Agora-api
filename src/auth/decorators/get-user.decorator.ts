import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { Request } from 'express'

export const GetUserRequest = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request: Request = context.switchToHttp().getRequest()
  return request.user
})
