import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNotificationDto {
  @IsString() @IsNotEmpty() shopId: string;
  @IsString() @IsNotEmpty() notificationToken: string;
}
