import { ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common'
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
        const errorMess = []
        let isExpried = false
        info.forEach((val: any) => {
          if (val.message === 'jwt expired') {
            isExpried = true
          }
          errorMess.push(val.message)
        })

        if (isExpried) {
          throw new HttpException('Token Expired', 419)
        }

        throw new UnauthorizedException(errorMess.join('; '))
      } else {
        throw err || new UnauthorizedException()
      }
    }
    return user
  }
}
