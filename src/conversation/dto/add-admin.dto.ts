import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class AddAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  memberId: string
}
