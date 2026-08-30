import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from './user.entity.js';

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  traderId: string;
  desk: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedTraderId = dto.traderId.trim().toUpperCase();

    const existing = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new UnauthorizedException('User already exists');
    }

    const password = await hash(dto.password, 10);
    const user = this.userRepository.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: normalizedEmail,
      traderId: normalizedTraderId,
      desk: dto.desk.trim().toUpperCase(),
      password,
    });

    const saved = await this.userRepository.save(user);
    const access_token = await this.jwtService.signAsync({ sub: saved.id, email: saved.email });

    return {
      access_token,
      user: {
        id: saved.id,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        traderId: saved.traderId,
        desk: saved.desk,
      },
    };
  }

  async login(dto: { email: string; password: string }) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = await this.jwtService.signAsync({ sub: user.id, email: user.email });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        traderId: user.traderId,
        desk: user.desk,
      },
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  async validateJwtUser(userId: string) {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
