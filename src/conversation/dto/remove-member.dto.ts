import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class RemoveMemberDto {
  @ApiProperty()
  @IsNotEmpty()
  memberId: string
}
