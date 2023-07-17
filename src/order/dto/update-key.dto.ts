import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateKeyDto {
  @IsString() @IsNotEmpty() key: string;
}
