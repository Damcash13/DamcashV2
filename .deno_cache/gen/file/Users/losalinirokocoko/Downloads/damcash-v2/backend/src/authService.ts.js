import Prisma from 'npm:@prisma/client';
const { PrismaClient } = Prisma;
import * as bcrypt from 'npm:bcrypt';
import * as jwt from 'npm:jsonwebtoken';
const prisma = new PrismaClient();
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'damcash-super-secret-jwt-key-change-in-production-2024';
const SALT_ROUNDS = 10;
export const authService = {
  /**
     * Register a new user
     */ async register (data) {
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: data.email
          },
          {
            username: data.username
          }
        ]
      }
    });
    if (existing) {
      if (existing.email === data.email) {
        throw new Error('Email already in use');
      }
      throw new Error('Username already taken');
    }
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash
      }
    });
    // Generate token
    const token = this.generateToken(user.id);
    return {
      user: this.sanitizeUser(user),
      token
    };
  },
  /**
     * Login user
     */ async login (data) {
    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: data.email
      }
    });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    // Verify password
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }
    // Update last login
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        lastLoginAt: new Date()
      }
    });
    // Generate token
    const token = this.generateToken(user.id);
    return {
      user: this.sanitizeUser(user),
      token
    };
  },
  /**
     * Verify JWT token and get user
     */ async verifyToken (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId
        }
      });
      if (!user) {
        throw new Error('User not found');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },
  /**
     * Update user profile
     */ async updateProfile (userId, data) {
    // Check if username is taken (if updating username)
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: {
            id: userId
          }
        }
      });
      if (existing) {
        throw new Error('Username already taken');
      }
    }
    const user = await prisma.user.update({
      where: {
        id: userId
      },
      data
    });
    return this.sanitizeUser(user);
  },
  /**
     * Change password
     */ async changePassword (userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      throw new Error('User not found');
    }
    // Verify old password
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw new Error('Current password is incorrect');
    }
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    // Update password
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        passwordHash
      }
    });
  },
  /**
     * Generate JWT token
     */ generateToken (userId) {
    return jwt.sign({
      userId
    }, JWT_SECRET, {
      expiresIn: '7d'
    });
  },
  /**
     * Remove sensitive data from user object
     */ sanitizeUser (user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy9hdXRoU2VydmljZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJpc21hIGZyb20gJ25wbTpAcHJpc21hL2NsaWVudCdcbmNvbnN0IHsgUHJpc21hQ2xpZW50IH0gPSBQcmlzbWFcblxuaW1wb3J0ICogYXMgYmNyeXB0IGZyb20gJ25wbTpiY3J5cHQnXG5pbXBvcnQgKiBhcyBqd3QgZnJvbSAnbnBtOmpzb253ZWJ0b2tlbidcblxuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpXG5jb25zdCBKV1RfU0VDUkVUID0gRGVuby5lbnYuZ2V0KCdKV1RfU0VDUkVUJykgfHwgJ2RhbWNhc2gtc3VwZXItc2VjcmV0LWp3dC1rZXktY2hhbmdlLWluLXByb2R1Y3Rpb24tMjAyNCdcbmNvbnN0IFNBTFRfUk9VTkRTID0gMTBcblxuZXhwb3J0IGludGVyZmFjZSBSZWdpc3RlckRhdGEge1xuICAgIHVzZXJuYW1lOiBzdHJpbmdcbiAgICBlbWFpbDogc3RyaW5nXG4gICAgcGFzc3dvcmQ6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2luRGF0YSB7XG4gICAgZW1haWw6IHN0cmluZ1xuICAgIHBhc3N3b3JkOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVc2VyIHtcbiAgICBpZDogc3RyaW5nXG4gICAgdXNlcm5hbWU6IHN0cmluZ1xuICAgIGVtYWlsOiBzdHJpbmdcbiAgICBjb2luczogbnVtYmVyXG4gICAgZWxvQ2hlY2tlcnM6IG51bWJlclxuICAgIGVsb0NoZXNzOiBudW1iZXJcbiAgICBhdmF0YXI/OiBzdHJpbmdcbiAgICBjb3VudHJ5Pzogc3RyaW5nXG4gICAgYmlvPzogc3RyaW5nXG4gICAgY3JlYXRlZEF0OiBEYXRlXG4gICAgdXBkYXRlZEF0OiBEYXRlXG4gICAgbGFzdExvZ2luQXQ/OiBEYXRlXG59XG5cbmV4cG9ydCBjb25zdCBhdXRoU2VydmljZSA9IHtcbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhIG5ldyB1c2VyXG4gICAgICovXG4gICAgYXN5bmMgcmVnaXN0ZXIoZGF0YTogUmVnaXN0ZXJEYXRhKTogUHJvbWlzZTx7IHVzZXI6IFVzZXI7IHRva2VuOiBzdHJpbmcgfT4ge1xuICAgICAgICAvLyBDaGVjayBpZiB1c2VyIGFscmVhZHkgZXhpc3RzXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZEZpcnN0KHtcbiAgICAgICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICAgICAgT1I6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBlbWFpbDogZGF0YS5lbWFpbCB9LFxuICAgICAgICAgICAgICAgICAgICB7IHVzZXJuYW1lOiBkYXRhLnVzZXJuYW1lIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmcuZW1haWwgPT09IGRhdGEuZW1haWwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VtYWlsIGFscmVhZHkgaW4gdXNlJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlcm5hbWUgYWxyZWFkeSB0YWtlbicpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYXNoIHBhc3N3b3JkXG4gICAgICAgIGNvbnN0IHBhc3N3b3JkSGFzaCA9IGF3YWl0IGJjcnlwdC5oYXNoKGRhdGEucGFzc3dvcmQsIFNBTFRfUk9VTkRTKVxuXG4gICAgICAgIC8vIENyZWF0ZSB1c2VyXG4gICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5jcmVhdGUoe1xuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBkYXRhLnVzZXJuYW1lLFxuICAgICAgICAgICAgICAgIGVtYWlsOiBkYXRhLmVtYWlsLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkSGFzaFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIEdlbmVyYXRlIHRva2VuXG4gICAgICAgIGNvbnN0IHRva2VuID0gdGhpcy5nZW5lcmF0ZVRva2VuKHVzZXIuaWQpXG5cbiAgICAgICAgcmV0dXJuIHsgdXNlcjogdGhpcy5zYW5pdGl6ZVVzZXIodXNlciksIHRva2VuIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTG9naW4gdXNlclxuICAgICAqL1xuICAgIGFzeW5jIGxvZ2luKGRhdGE6IExvZ2luRGF0YSk6IFByb21pc2U8eyB1c2VyOiBVc2VyOyB0b2tlbjogc3RyaW5nIH0+IHtcbiAgICAgICAgLy8gRmluZCB1c2VyXG4gICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGVtYWlsOiBkYXRhLmVtYWlsIH1cbiAgICAgICAgfSlcblxuICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBlbWFpbCBvciBwYXNzd29yZCcpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZXJpZnkgcGFzc3dvcmRcbiAgICAgICAgY29uc3QgdmFsaWQgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShkYXRhLnBhc3N3b3JkLCB1c2VyLnBhc3N3b3JkSGFzaClcblxuICAgICAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZW1haWwgb3IgcGFzc3dvcmQnKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIGxhc3QgbG9naW5cbiAgICAgICAgYXdhaXQgcHJpc21hLnVzZXIudXBkYXRlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGlkOiB1c2VyLmlkIH0sXG4gICAgICAgICAgICBkYXRhOiB7IGxhc3RMb2dpbkF0OiBuZXcgRGF0ZSgpIH1cbiAgICAgICAgfSlcblxuICAgICAgICAvLyBHZW5lcmF0ZSB0b2tlblxuICAgICAgICBjb25zdCB0b2tlbiA9IHRoaXMuZ2VuZXJhdGVUb2tlbih1c2VyLmlkKVxuXG4gICAgICAgIHJldHVybiB7IHVzZXI6IHRoaXMuc2FuaXRpemVVc2VyKHVzZXIpLCB0b2tlbiB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFZlcmlmeSBKV1QgdG9rZW4gYW5kIGdldCB1c2VyXG4gICAgICovXG4gICAgYXN5bmMgdmVyaWZ5VG9rZW4odG9rZW46IHN0cmluZyk6IFByb21pc2U8VXNlcj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGVjb2RlZCA9IGp3dC52ZXJpZnkodG9rZW4sIEpXVF9TRUNSRVQpIGFzIHsgdXNlcklkOiBzdHJpbmcgfVxuXG4gICAgICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7XG4gICAgICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IGRlY29kZWQudXNlcklkIH1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlciBub3QgZm91bmQnKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zYW5pdGl6ZVVzZXIodXNlcilcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBvciBleHBpcmVkIHRva2VuJylcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgdXNlciBwcm9maWxlXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlUHJvZmlsZSh1c2VySWQ6IHN0cmluZywgZGF0YTogUGFydGlhbDx7IHVzZXJuYW1lOiBzdHJpbmc7IGF2YXRhcjogc3RyaW5nOyBjb3VudHJ5OiBzdHJpbmc7IGJpbzogc3RyaW5nIH0+KTogUHJvbWlzZTxVc2VyPiB7XG4gICAgICAgIC8vIENoZWNrIGlmIHVzZXJuYW1lIGlzIHRha2VuIChpZiB1cGRhdGluZyB1c2VybmFtZSlcbiAgICAgICAgaWYgKGRhdGEudXNlcm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZEZpcnN0KHtcbiAgICAgICAgICAgICAgICB3aGVyZToge1xuICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogZGF0YS51c2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgTk9UOiB7IGlkOiB1c2VySWQgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlcm5hbWUgYWxyZWFkeSB0YWtlbicpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgcHJpc21hLnVzZXIudXBkYXRlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGlkOiB1c2VySWQgfSxcbiAgICAgICAgICAgIGRhdGFcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gdGhpcy5zYW5pdGl6ZVVzZXIodXNlcilcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIHBhc3N3b3JkXG4gICAgICovXG4gICAgYXN5bmMgY2hhbmdlUGFzc3dvcmQodXNlcklkOiBzdHJpbmcsIG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHVzZXJJZCB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgbm90IGZvdW5kJylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlcmlmeSBvbGQgcGFzc3dvcmRcbiAgICAgICAgY29uc3QgdmFsaWQgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShvbGRQYXNzd29yZCwgdXNlci5wYXNzd29yZEhhc2gpXG5cbiAgICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDdXJyZW50IHBhc3N3b3JkIGlzIGluY29ycmVjdCcpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYXNoIG5ldyBwYXNzd29yZFxuICAgICAgICBjb25zdCBwYXNzd29yZEhhc2ggPSBhd2FpdCBiY3J5cHQuaGFzaChuZXdQYXNzd29yZCwgU0FMVF9ST1VORFMpXG5cbiAgICAgICAgLy8gVXBkYXRlIHBhc3N3b3JkXG4gICAgICAgIGF3YWl0IHByaXNtYS51c2VyLnVwZGF0ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogdXNlcklkIH0sXG4gICAgICAgICAgICBkYXRhOiB7IHBhc3N3b3JkSGFzaCB9XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIEpXVCB0b2tlblxuICAgICAqL1xuICAgIGdlbmVyYXRlVG9rZW4odXNlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gand0LnNpZ24oeyB1c2VySWQgfSwgSldUX1NFQ1JFVCwgeyBleHBpcmVzSW46ICc3ZCcgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHNlbnNpdGl2ZSBkYXRhIGZyb20gdXNlciBvYmplY3RcbiAgICAgKi9cbiAgICBzYW5pdGl6ZVVzZXIodXNlcjogYW55KTogVXNlciB7XG4gICAgICAgIGNvbnN0IHsgcGFzc3dvcmRIYXNoLCAuLi5zYW5pdGl6ZWQgfSA9IHVzZXJcbiAgICAgICAgcmV0dXJuIHNhbml0aXplZCBhcyBVc2VyXG4gICAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sWUFBWSxxQkFBb0I7QUFDdkMsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHO0FBRXpCLFlBQVksWUFBWSxhQUFZO0FBQ3BDLFlBQVksU0FBUyxtQkFBa0I7QUFFdkMsTUFBTSxTQUFTLElBQUk7QUFDbkIsTUFBTSxhQUFhLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUI7QUFDakQsTUFBTSxjQUFjO0FBNEJwQixPQUFPLE1BQU0sY0FBYztFQUN2Qjs7S0FFQyxHQUNELE1BQU0sVUFBUyxJQUFrQjtJQUM3QiwrQkFBK0I7SUFDL0IsTUFBTSxXQUFXLE1BQU0sT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO01BQ3pDLE9BQU87UUFDSCxJQUFJO1VBQ0E7WUFBRSxPQUFPLEtBQUssS0FBSztVQUFDO1VBQ3BCO1lBQUUsVUFBVSxLQUFLLFFBQVE7VUFBQztTQUM3QjtNQUNMO0lBQ0o7SUFFQSxJQUFJLFVBQVU7TUFDVixJQUFJLFNBQVMsS0FBSyxLQUFLLEtBQUssS0FBSyxFQUFFO1FBQy9CLE1BQU0sSUFBSSxNQUFNO01BQ3BCO01BQ0EsTUFBTSxJQUFJLE1BQU07SUFDcEI7SUFFQSxnQkFBZ0I7SUFDaEIsTUFBTSxlQUFlLE1BQU0sT0FBTyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUU7SUFFdEQsY0FBYztJQUNkLE1BQU0sT0FBTyxNQUFNLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztNQUNsQyxNQUFNO1FBQ0YsVUFBVSxLQUFLLFFBQVE7UUFDdkIsT0FBTyxLQUFLLEtBQUs7UUFDakI7TUFDSjtJQUNKO0lBRUEsaUJBQWlCO0lBQ2pCLE1BQU0sUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRTtJQUV4QyxPQUFPO01BQUUsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDO01BQU87SUFBTTtFQUNsRDtFQUVBOztLQUVDLEdBQ0QsTUFBTSxPQUFNLElBQWU7SUFDdkIsWUFBWTtJQUNaLE1BQU0sT0FBTyxNQUFNLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztNQUN0QyxPQUFPO1FBQUUsT0FBTyxLQUFLLEtBQUs7TUFBQztJQUMvQjtJQUVBLElBQUksQ0FBQyxNQUFNO01BQ1AsTUFBTSxJQUFJLE1BQU07SUFDcEI7SUFFQSxrQkFBa0I7SUFDbEIsTUFBTSxRQUFRLE1BQU0sT0FBTyxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUUsS0FBSyxZQUFZO0lBRW5FLElBQUksQ0FBQyxPQUFPO01BQ1IsTUFBTSxJQUFJLE1BQU07SUFDcEI7SUFFQSxvQkFBb0I7SUFDcEIsTUFBTSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7TUFDckIsT0FBTztRQUFFLElBQUksS0FBSyxFQUFFO01BQUM7TUFDckIsTUFBTTtRQUFFLGFBQWEsSUFBSTtNQUFPO0lBQ3BDO0lBRUEsaUJBQWlCO0lBQ2pCLE1BQU0sUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRTtJQUV4QyxPQUFPO01BQUUsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDO01BQU87SUFBTTtFQUNsRDtFQUVBOztLQUVDLEdBQ0QsTUFBTSxhQUFZLEtBQWE7SUFDM0IsSUFBSTtNQUNBLE1BQU0sVUFBVSxJQUFJLE1BQU0sQ0FBQyxPQUFPO01BRWxDLE1BQU0sT0FBTyxNQUFNLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN0QyxPQUFPO1VBQUUsSUFBSSxRQUFRLE1BQU07UUFBQztNQUNoQztNQUVBLElBQUksQ0FBQyxNQUFNO1FBQ1AsTUFBTSxJQUFJLE1BQU07TUFDcEI7TUFFQSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDN0IsRUFBRSxPQUFPLE9BQU87TUFDWixNQUFNLElBQUksTUFBTTtJQUNwQjtFQUNKO0VBRUE7O0tBRUMsR0FDRCxNQUFNLGVBQWMsTUFBYyxFQUFFLElBQWlGO0lBQ2pILG9EQUFvRDtJQUNwRCxJQUFJLEtBQUssUUFBUSxFQUFFO01BQ2YsTUFBTSxXQUFXLE1BQU0sT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3pDLE9BQU87VUFDSCxVQUFVLEtBQUssUUFBUTtVQUN2QixLQUFLO1lBQUUsSUFBSTtVQUFPO1FBQ3RCO01BQ0o7TUFFQSxJQUFJLFVBQVU7UUFDVixNQUFNLElBQUksTUFBTTtNQUNwQjtJQUNKO0lBRUEsTUFBTSxPQUFPLE1BQU0sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO01BQ2xDLE9BQU87UUFBRSxJQUFJO01BQU87TUFDcEI7SUFDSjtJQUVBLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztFQUM3QjtFQUVBOztLQUVDLEdBQ0QsTUFBTSxnQkFBZSxNQUFjLEVBQUUsV0FBbUIsRUFBRSxXQUFtQjtJQUN6RSxNQUFNLE9BQU8sTUFBTSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7TUFDdEMsT0FBTztRQUFFLElBQUk7TUFBTztJQUN4QjtJQUVBLElBQUksQ0FBQyxNQUFNO01BQ1AsTUFBTSxJQUFJLE1BQU07SUFDcEI7SUFFQSxzQkFBc0I7SUFDdEIsTUFBTSxRQUFRLE1BQU0sT0FBTyxPQUFPLENBQUMsYUFBYSxLQUFLLFlBQVk7SUFFakUsSUFBSSxDQUFDLE9BQU87TUFDUixNQUFNLElBQUksTUFBTTtJQUNwQjtJQUVBLG9CQUFvQjtJQUNwQixNQUFNLGVBQWUsTUFBTSxPQUFPLElBQUksQ0FBQyxhQUFhO0lBRXBELGtCQUFrQjtJQUNsQixNQUFNLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztNQUNyQixPQUFPO1FBQUUsSUFBSTtNQUFPO01BQ3BCLE1BQU07UUFBRTtNQUFhO0lBQ3pCO0VBQ0o7RUFFQTs7S0FFQyxHQUNELGVBQWMsTUFBYztJQUN4QixPQUFPLElBQUksSUFBSSxDQUFDO01BQUU7SUFBTyxHQUFHLFlBQVk7TUFBRSxXQUFXO0lBQUs7RUFDOUQ7RUFFQTs7S0FFQyxHQUNELGNBQWEsSUFBUztJQUNsQixNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcsV0FBVyxHQUFHO0lBQ3ZDLE9BQU87RUFDWDtBQUNKLEVBQUMifQ==
// denoCacheMetadata=12090232493633417799,9646350443467766885