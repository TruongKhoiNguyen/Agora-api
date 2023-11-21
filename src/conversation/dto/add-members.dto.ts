import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class AddMembersDto {
  @ApiProperty()
  @IsNotEmpty()
  members: string[]
}
