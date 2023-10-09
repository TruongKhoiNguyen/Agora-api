import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from '../decorators'

@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt', 'jwt-refresh-token']) {
  constructor(private reflector: Reflector) {
    super()
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) return true

    return super.canActivate(context)
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user || info) {
      if (info) {
        throw new HttpException(info[0].message, HttpStatus.UNAUTHORIZED)
      } else {
        throw err || new UnauthorizedException()
      }
    }
    return user
  }
}
