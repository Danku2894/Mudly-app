import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as otpGenerator from 'otp-generator';
import { RegisterDto, LoginDto, VerifyOtpDto } from './dto/auth.dto';
import { PrismaService } from '../../database/prisma.service';
import { UserStatus } from '@prisma/client';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Check if user exists
    let user = await this.usersService.findOne(email);
    if (user && user.status !== UserStatus.PENDING) {
      throw new BadRequestException('User already exists');
    }

    // Check for username uniqueness
    const existingUsername = await this.prisma.user.findUnique({
        where: { username: registerDto.username }
    });

    if (existingUsername && existingUsername.email !== email) {
        throw new BadRequestException('Username is already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        if (user && user.status === UserStatus.PENDING) {
            // Update existing pending user
            await this.usersService.update(user.id, {
                password: hashedPassword,
                username: registerDto.username,
            });
        } else {
            // Create new user
            user = await this.usersService.create({
                email,
                password: hashedPassword,
                username: registerDto.username,
                status: UserStatus.PENDING,
            });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        throw new BadRequestException('Registration failed. Username or Email might be invalid.');
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // Save OTP to DB (TTL 5 mins)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.prisma.otp.create({
      data: {
        email,
        code: otp,
        expiresAt,
      },
    });
    
    // LOG OTP FOR DEV
    console.log("==================================================");
    console.log(`[DEV OTP] For ${email}: ${otp}`);
    console.log("==================================================");

    // Send Email OTP
    try {
        await this.mailService.sendOtp(email, otp);
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        // Continue even if email fails (for dev purposes)? Or throw?
        // throw new BadRequestException('Failed to send OTP email');
    }

    return {
      message: 'Registration successful. Please check your email for OTP.',
      userId: user.id,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        email,
        code: otp,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Activate User
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');

    await this.usersService.update(user.id, {
        status: UserStatus.ACTIVE,
        rank: 'Neutral Member',
        points: 50
    });

    // Delete used OTP
    await this.prisma.otp.delete({ where: { id: otpRecord.id } });

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOne(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(token: string) {
      const storedToken = await this.prisma.refreshToken.findUnique({
          where: { token },
      });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
          throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findOneById(storedToken.userId);
      if (!user) throw new UnauthorizedException('User not found');

      // Revoke old token (Rotation)
      await this.prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { isRevoked: true }
      });

      return this.generateTokens(user.id, user.email, user.role);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any,
    });

    // Save Refresh Token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Sync with JWT_REFRESH_EXPIRES

    await this.prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: userId,
            expiresAt
        }
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');

    // Generate Token
    const resetToken = this.jwtService.sign(
        { email }, 
        { 
            secret: process.env.JWT_ACCESS_SECRET, 
            expiresIn: '1h' 
        }
    );

    // Link: /auth/reset-password?token=xxx
    try {
        await this.mailService.sendResetPasswordLink(email, resetToken);
    } catch (error) {
        console.error('Failed to send reset password email:', error);
    }

    return {
        message: 'If the email exists, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
      try {
        const payload = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
        const email = payload.email;
        
        const user = await this.usersService.findOne(email);
        if (!user) throw new BadRequestException('Invalid token');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(user.id, { password: hashedPassword });

        return { message: 'Password reset successfully' };
      } catch (e) {
          throw new BadRequestException('Invalid or expired token');
      }
  }
}
