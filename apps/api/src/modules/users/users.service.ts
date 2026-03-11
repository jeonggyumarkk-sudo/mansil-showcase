import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    // Anonymize user data instead of hard-deleting (PRV-014)
    // Hash a random value so the password field is never plaintext (PRV-NEW-002)
    const hashedPassword = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

    await this.prisma.$transaction([
      // Anonymize user record
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@mansil.com`,
          name: '탈퇴 회원',
          password: hashedPassword,
        },
      }),
      // Soft-delete properties
      this.prisma.property.updateMany({
        where: { agentId: userId },
        data: { deletedAt: new Date() },
      }),
      // Soft-delete contracts
      this.prisma.contract.updateMany({
        where: { agentId: userId },
        data: { deletedAt: new Date() },
      }),
      // Soft-delete customers
      this.prisma.customer.updateMany({
        where: { agentId: userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: '계정이 삭제되었습니다' };
  }

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    const [properties, contracts, customers, clientRequests, posts] =
      await Promise.all([
        this.prisma.property.findMany({
          where: { agentId: userId, deletedAt: null },
        }),
        this.prisma.contract.findMany({
          where: { agentId: userId, deletedAt: null },
        }),
        this.prisma.customer.findMany({
          where: { agentId: userId, deletedAt: null },
        }),
        this.prisma.clientRequest.findMany({
          where: { agentId: userId },
        }),
        this.prisma.post.findMany({
          where: { authorId: userId },
        }),
      ]);

    return {
      user,
      properties,
      contracts,
      customers,
      clientRequests,
      posts,
      exportedAt: new Date().toISOString(),
    };
  }

  async recordConsent(
    userId: string,
    type: string,
    version: string,
    accepted: boolean,
    ipAddress: string | null,
  ) {
    return this.prisma.consentRecord.create({
      data: {
        userId,
        type,
        version,
        accepted,
        ipAddress,
      },
    });
  }
}
