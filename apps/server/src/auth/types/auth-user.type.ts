/**
 * Local User type that mirrors the Prisma User model.
 * Used in auth decorators/services before `prisma generate` produces `@prisma/client` types.
 */
export interface AuthUser {
  id: string;
  email: string;
  hashedPassword: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
