import {
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber() amount: number;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() contactName: string;
  @IsDateString() deliveryPeriod: Date;
  @IsString()
  @Matches(
    /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
  )
  contactNumber: string;
  @IsString() @IsOptional() extraInfo: string;
}
