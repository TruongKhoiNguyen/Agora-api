import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PassportStrategy } from '@nestjs/passport'
import { Model, Types } from 'mongoose'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Key } from 'src/user/schemas/key.schema'
import { User } from 'src/user/schemas/user.schema'

@Injectable()
export class JwtStratery extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Key.name) private keyModel: Model<Key>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (request, jwtToken, done) => {
        const userId = request.headers['x-client-id']
        if (!userId) {
          const error = new HttpException('unauthorized', HttpStatus.UNAUTHORIZED)
          return done(error, null)
        }
        const key = await this.keyModel.findOne({ user: new Types.ObjectId(userId) }).lean()
        if (!key) {
          const error = new HttpException('unauthorized', HttpStatus.UNAUTHORIZED)
          return done(error, null)
        }
        done(null, key.accessSecretKey)
      }
    })
  }

  async validate(payload: { id: Types.ObjectId; email: string }) {
    const user = await this.userModel.findById(payload.id)
    return user
  }
}
