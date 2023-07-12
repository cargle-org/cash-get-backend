import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAgentDto {
  @IsString() @IsNotEmpty() shopId: string;
}
