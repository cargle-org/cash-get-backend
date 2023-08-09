import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNotificationDto {
  // @IsString() @IsNotEmpty() agentId: string;
  @IsString() @IsNotEmpty() notificationToken: string;
}
