import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { CollectionStatusEnum } from 'src/utils/constants';

export class AcceptOrderDto {
  @IsString() @IsNotEmpty() agentId: string;
  @IsNumber() amount: number;
  @IsEnum(CollectionStatusEnum) collectionStatus: CollectionStatusEnum;
  @IsBoolean() useSpikk: boolean;
}
