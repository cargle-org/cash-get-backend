import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class AcceptOrderDto {
  @IsString() @IsNotEmpty() agentId: string;
  @IsBoolean() useSpikk: boolean;
}
