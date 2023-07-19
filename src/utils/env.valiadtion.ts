import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  SECRET_KEY: string;

  @IsNumber()
  JWT_EXPIRATION_TIME: number;

  @IsString()
  @IsNotEmpty()
  VERSION: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST: string;

  @IsNumber()
  @IsNotEmpty()
  POSTGRES_PORT: number;

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_DATABASE: string;

  @IsString()
  @IsNotEmpty()
  FIREBASE_PRIVATE_KEY: string;

  @IsString()
  @IsNotEmpty()
  FIREBASE_DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  FIREBASE_PROJECT_ID: string;

  @IsString()
  @IsNotEmpty()
  FIREBASE_CLIENT_EMAIL: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_CERT: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
