import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[A-Z]{2,10}$/)
  traderId: string;

  @IsString()
  @MinLength(1)
  desk: string;

  @IsString()
  @MinLength(8)
  password: string;
}
