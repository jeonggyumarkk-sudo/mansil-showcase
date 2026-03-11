import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: { id: string; email: string; name: string | null; role: string }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(data: RegisterDto, ipAddress?: string | null) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      // Atomic user + consent creation (PRV-AUDIT-002)
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: 'AGENT',
          },
        });

        // Persist consent records (PRV-NEW-001, PRV-AUDIT-001)
        if (data.consents?.length) {
          await tx.consentRecord.createMany({
            data: data.consents.map((c) => ({
              userId: created.id,
              type: c.type,
              version: c.version,
              accepted: c.accepted,
              ipAddress: ipAddress ?? null,
            })),
          });
        }

        return created;
      });

      // Exclude password from response (API-012, PRV-017)
      const { password, ...result } = user;
      return this.login(result);
    } catch (error: unknown) {
      // Handle unique constraint violation for duplicate email (API-020)
      if (
        error instanceof Error &&
        'code' in error &&
        (error as any).code === 'P2002'
      ) {
        throw new ConflictException('이미 등록된 이메일입니다');
      }
      throw error;
    }
  }
}
