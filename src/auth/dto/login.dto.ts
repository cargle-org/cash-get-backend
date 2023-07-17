import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserEnum } from 'src/utils/constants';

export class LoginDto {
  @IsString() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() password: string;
}
