import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { UserEnum } from 'src/utils/constants';

export class CreateUserDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString()
  @Matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
  // @Matches(/^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/)
  phoneNo: string;
  @IsString() @IsEmail() email: string;
  @IsString()
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
  password: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsEnum(UserEnum) role: UserEnum.AGENT;
}
