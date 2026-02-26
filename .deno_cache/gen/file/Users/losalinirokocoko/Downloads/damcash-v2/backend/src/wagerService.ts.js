import Prisma from 'npm:@prisma/client';
const { PrismaClient } = Prisma;
import { userService } from './userService.ts';
const prisma = new PrismaClient();
export class WagerService {
  /**
     * Create a new wager for a game
     */ async createWager(params) {
    const { creatorId, amount, gameType, variant } = params;
    // Validate user has sufficient coins
    const creator = await prisma.user.findUnique({
      where: {
        id: creatorId
      }
    });
    if (!creator) {
      throw new Error('Creator not found');
    }
    if (creator.coins < amount) {
      throw new Error(`Insufficient coins. You have ${creator.coins} available.`);
    }
    // Deduct coins from creator (escrow)
    await userService.updateCoins(creatorId, -amount);
    // Create wager
    const wager = await prisma.wager.create({
      data: {
        creatorId,
        amount,
        gameType,
        variant,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h expiry
      }
    });
    console.log(`📝 Created wager ${wager.id} for ${amount} coins by ${creator.username}`);
    return wager;
  }
  /**
     * Accept a wager
     */ async acceptWager(wagerId, opponentId) {
    const wager = await prisma.wager.findUnique({
      where: {
        id: wagerId
      }
    });
    if (!wager) {
      throw new Error('Wager not found');
    }
    if (wager.status !== 'pending') {
      throw new Error(`Wager is not pending (status: ${wager.status})`);
    }
    const opponent = await prisma.user.findUnique({
      where: {
        id: opponentId
      }
    });
    if (!opponent) {
      throw new Error('Opponent not found');
    }
    if (opponent.coins < wager.amount) {
      throw new Error(`Insufficient coins. You have ${opponent.coins}, need ${wager.amount}`);
    }
    // Deduct coins from opponent (escrow)
    await userService.updateCoins(opponentId, -wager.amount);
    // Update wager
    const updatedWager = await prisma.wager.update({
      where: {
        id: wagerId
      },
      data: {
        opponentId,
        status: 'accepted'
      }
    });
    // Create game
    const game = await prisma.game.create({
      data: {
        whiteId: Math.random() > 0.5 ? wager.creatorId : opponentId,
        blackId: Math.random() > 0.5 ? opponentId : wager.creatorId,
        gameType: wager.gameType,
        variant: wager.variant,
        wagerId: wager.id,
        moves: JSON.stringify([]),
        finalPosition: JSON.stringify({}),
        status: 'active'
      }
    });
    // Correct color assignment logic
    // If we want random, we can't do random twice independently.
    // Let's fix it:
    const isCreatorWhite = Math.random() > 0.5;
    await prisma.game.update({
      where: {
        id: game.id
      },
      data: {
        whiteId: isCreatorWhite ? wager.creatorId : opponentId,
        blackId: isCreatorWhite ? opponentId : wager.creatorId
      }
    });
    console.log(`🤝 Wager ${wagerId} accepted by ${opponent.username}`);
    return {
      wager: updatedWager,
      game
    };
  }
  /**
     * Decline a wager
     */ async declineWager(wagerId) {
    const wager = await prisma.wager.findUnique({
      where: {
        id: wagerId
      }
    });
    if (!wager) {
      throw new Error('Wager not found');
    }
    if (wager.status !== 'pending') {
      throw new Error('Can only decline pending wagers');
    }
    // Refund creator
    await userService.updateCoins(wager.creatorId, wager.amount);
    const updatedWager = await prisma.wager.update({
      where: {
        id: wagerId
      },
      data: {
        status: 'declined'
      }
    });
    console.log(`❌ Wager ${wagerId} declined`);
    return updatedWager;
  }
  /**
     * Cancel a wager (only if no opponent yet)
     */ async cancelWager(wagerId, userId) {
    const wager = await prisma.wager.findUnique({
      where: {
        id: wagerId
      }
    });
    if (!wager) {
      throw new Error('Wager not found');
    }
    if (wager.creatorId !== userId) {
      throw new Error('Only creator can cancel wager');
    }
    if (wager.status !== 'pending') {
      throw new Error('Can only cancel pending wagers');
    }
    // Refund creator
    await userService.updateCoins(wager.creatorId, wager.amount);
    const updatedWager = await prisma.wager.update({
      where: {
        id: wagerId
      },
      data: {
        status: 'cancelled'
      }
    });
    console.log(`🚫 Wager ${wagerId} cancelled by creator`);
    return updatedWager;
  }
  /**
     * Complete a wager after game ends
     */ async completeWager(wagerId, winnerId) {
    const wager = await prisma.wager.findUnique({
      where: {
        id: wagerId
      }
    });
    if (!wager) {
      throw new Error('Wager not found');
    }
    if (wager.status !== 'accepted') {
      throw new Error('Wager is not in accepted state');
    }
    if (!winnerId) {
      // Draw - refund both players
      await userService.updateCoins(wager.creatorId, wager.amount);
      if (wager.opponentId) {
        await userService.updateCoins(wager.opponentId, wager.amount);
      }
      await prisma.wager.update({
        where: {
          id: wagerId
        },
        data: {
          status: 'completed',
          winnerId: null
        }
      });
    } else {
      // Winner takes all (2 * amount)
      await userService.updateCoins(winnerId, wager.amount * 2);
      await prisma.wager.update({
        where: {
          id: wagerId
        },
        data: {
          status: 'completed',
          winnerId
        }
      });
    }
    console.log(`✅ Wager ${wagerId} completed`);
  }
  /**
     * Get pending wagers (open challenges)
     */ async getPendingWagers(limit = 20) {
    return await prisma.wager.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        creator: {
          select: {
            username: true,
            avatar: true,
            eloCheckers: true,
            eloChess: true
          }
        }
      }
    });
  }
  /**
     * Get user's active wagers
     */ async getUserActiveWagers(userId) {
    return await prisma.wager.findMany({
      where: {
        OR: [
          {
            creatorId: userId
          },
          {
            opponentId: userId
          }
        ],
        status: {
          in: [
            'pending',
            'accepted'
          ]
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        creator: {
          select: {
            username: true
          }
        },
        opponent: {
          select: {
            username: true
          }
        }
      }
    });
  }
  /**
     * Get user's wager history
     */ async getUserWagerHistory(userId, limit = 50) {
    return await prisma.wager.findMany({
      where: {
        OR: [
          {
            creatorId: userId
          },
          {
            opponentId: userId
          }
        ],
        status: 'completed'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        creator: {
          select: {
            username: true
          }
        },
        opponent: {
          select: {
            username: true
          }
        }
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy93YWdlclNlcnZpY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFByaXNtYSBmcm9tICducG06QHByaXNtYS9jbGllbnQnXG5jb25zdCB7IFByaXNtYUNsaWVudCB9ID0gUHJpc21hXG5pbXBvcnQgeyB1c2VyU2VydmljZSB9IGZyb20gJy4vdXNlclNlcnZpY2UudHMnXG5cbmNvbnN0IHByaXNtYSA9IG5ldyBQcmlzbWFDbGllbnQoKVxuXG5leHBvcnQgY2xhc3MgV2FnZXJTZXJ2aWNlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgd2FnZXIgZm9yIGEgZ2FtZVxuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZVdhZ2VyKHBhcmFtczoge1xuICAgICAgICBjcmVhdG9ySWQ6IHN0cmluZ1xuICAgICAgICBhbW91bnQ6IG51bWJlclxuICAgICAgICBnYW1lVHlwZTogJ2NoZWNrZXJzJyB8ICdjaGVzcydcbiAgICAgICAgdmFyaWFudDogc3RyaW5nXG4gICAgICAgIHRpbWVDb250cm9sOiBzdHJpbmcgLy8gTm90IHVzZWQgaW4gc2NoZW1hIHlldCwgc3RvcmVkIGluIEpTT04vbWV0YWRhdGEgaWYgbmVlZGVkXG4gICAgICAgIGNvbG9yPzogJ3doaXRlJyB8ICdibGFjaycgfCAncmFuZG9tJ1xuICAgIH0pIHtcbiAgICAgICAgY29uc3QgeyBjcmVhdG9ySWQsIGFtb3VudCwgZ2FtZVR5cGUsIHZhcmlhbnQgfSA9IHBhcmFtc1xuXG4gICAgICAgIC8vIFZhbGlkYXRlIHVzZXIgaGFzIHN1ZmZpY2llbnQgY29pbnNcbiAgICAgICAgY29uc3QgY3JlYXRvciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IGNyZWF0b3JJZCB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCFjcmVhdG9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NyZWF0b3Igbm90IGZvdW5kJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjcmVhdG9yLmNvaW5zIDwgYW1vdW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEluc3VmZmljaWVudCBjb2lucy4gWW91IGhhdmUgJHtjcmVhdG9yLmNvaW5zfSBhdmFpbGFibGUuYClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlZHVjdCBjb2lucyBmcm9tIGNyZWF0b3IgKGVzY3JvdylcbiAgICAgICAgYXdhaXQgdXNlclNlcnZpY2UudXBkYXRlQ29pbnMoY3JlYXRvcklkLCAtYW1vdW50KVxuXG4gICAgICAgIC8vIENyZWF0ZSB3YWdlclxuICAgICAgICBjb25zdCB3YWdlciA9IGF3YWl0IHByaXNtYS53YWdlci5jcmVhdGUoe1xuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIGNyZWF0b3JJZCxcbiAgICAgICAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgICAgICAgZ2FtZVR5cGUsXG4gICAgICAgICAgICAgICAgdmFyaWFudCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcbiAgICAgICAgICAgICAgICBleHBpcmVzQXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyAyNCAqIDYwICogNjAgKiAxMDAwKSAvLyAyNGggZXhwaXJ5XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgY29uc29sZS5sb2coYPCfk50gQ3JlYXRlZCB3YWdlciAke3dhZ2VyLmlkfSBmb3IgJHthbW91bnR9IGNvaW5zIGJ5ICR7Y3JlYXRvci51c2VybmFtZX1gKVxuXG4gICAgICAgIHJldHVybiB3YWdlclxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFjY2VwdCBhIHdhZ2VyXG4gICAgICovXG4gICAgYXN5bmMgYWNjZXB0V2FnZXIod2FnZXJJZDogc3RyaW5nLCBvcHBvbmVudElkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgd2FnZXIgPSBhd2FpdCBwcmlzbWEud2FnZXIuZmluZFVuaXF1ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogd2FnZXJJZCB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCF3YWdlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXYWdlciBub3QgZm91bmQnKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdhZ2VyLnN0YXR1cyAhPT0gJ3BlbmRpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFdhZ2VyIGlzIG5vdCBwZW5kaW5nIChzdGF0dXM6ICR7d2FnZXIuc3RhdHVzfSlgKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3Bwb25lbnQgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGlkOiBvcHBvbmVudElkIH1cbiAgICAgICAgfSlcblxuICAgICAgICBpZiAoIW9wcG9uZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09wcG9uZW50IG5vdCBmb3VuZCcpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3Bwb25lbnQuY29pbnMgPCB3YWdlci5hbW91bnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5zdWZmaWNpZW50IGNvaW5zLiBZb3UgaGF2ZSAke29wcG9uZW50LmNvaW5zfSwgbmVlZCAke3dhZ2VyLmFtb3VudH1gKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVkdWN0IGNvaW5zIGZyb20gb3Bwb25lbnQgKGVzY3JvdylcbiAgICAgICAgYXdhaXQgdXNlclNlcnZpY2UudXBkYXRlQ29pbnMob3Bwb25lbnRJZCwgLXdhZ2VyLmFtb3VudClcblxuICAgICAgICAvLyBVcGRhdGUgd2FnZXJcbiAgICAgICAgY29uc3QgdXBkYXRlZFdhZ2VyID0gYXdhaXQgcHJpc21hLndhZ2VyLnVwZGF0ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogd2FnZXJJZCB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIG9wcG9uZW50SWQsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnYWNjZXB0ZWQnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gQ3JlYXRlIGdhbWVcbiAgICAgICAgY29uc3QgZ2FtZSA9IGF3YWl0IHByaXNtYS5nYW1lLmNyZWF0ZSh7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgd2hpdGVJZDogTWF0aC5yYW5kb20oKSA+IDAuNSA/IHdhZ2VyLmNyZWF0b3JJZCA6IG9wcG9uZW50SWQsIC8vIFJhbmRvbWl6ZSBpZiBjb2xvciBub3Qgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgYmxhY2tJZDogTWF0aC5yYW5kb20oKSA+IDAuNSA/IG9wcG9uZW50SWQgOiB3YWdlci5jcmVhdG9ySWQsIC8vIFRoaXMgbG9naWMgaXMgc2ltcGxpZmllZCwgbmVlZHMgZml4XG4gICAgICAgICAgICAgICAgZ2FtZVR5cGU6IHdhZ2VyLmdhbWVUeXBlLFxuICAgICAgICAgICAgICAgIHZhcmlhbnQ6IHdhZ2VyLnZhcmlhbnQsXG4gICAgICAgICAgICAgICAgd2FnZXJJZDogd2FnZXIuaWQsXG4gICAgICAgICAgICAgICAgbW92ZXM6IEpTT04uc3RyaW5naWZ5KFtdKSxcbiAgICAgICAgICAgICAgICBmaW5hbFBvc2l0aW9uOiBKU09OLnN0cmluZ2lmeSh7fSksXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnYWN0aXZlJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIENvcnJlY3QgY29sb3IgYXNzaWdubWVudCBsb2dpY1xuICAgICAgICAvLyBJZiB3ZSB3YW50IHJhbmRvbSwgd2UgY2FuJ3QgZG8gcmFuZG9tIHR3aWNlIGluZGVwZW5kZW50bHkuXG4gICAgICAgIC8vIExldCdzIGZpeCBpdDpcbiAgICAgICAgY29uc3QgaXNDcmVhdG9yV2hpdGUgPSBNYXRoLnJhbmRvbSgpID4gMC41XG4gICAgICAgIGF3YWl0IHByaXNtYS5nYW1lLnVwZGF0ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogZ2FtZS5pZCB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIHdoaXRlSWQ6IGlzQ3JlYXRvcldoaXRlID8gd2FnZXIuY3JlYXRvcklkIDogb3Bwb25lbnRJZCxcbiAgICAgICAgICAgICAgICBibGFja0lkOiBpc0NyZWF0b3JXaGl0ZSA/IG9wcG9uZW50SWQgOiB3YWdlci5jcmVhdG9ySWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBjb25zb2xlLmxvZyhg8J+knSBXYWdlciAke3dhZ2VySWR9IGFjY2VwdGVkIGJ5ICR7b3Bwb25lbnQudXNlcm5hbWV9YClcblxuICAgICAgICByZXR1cm4geyB3YWdlcjogdXBkYXRlZFdhZ2VyLCBnYW1lIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsaW5lIGEgd2FnZXJcbiAgICAgKi9cbiAgICBhc3luYyBkZWNsaW5lV2FnZXIod2FnZXJJZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHdhZ2VyID0gYXdhaXQgcHJpc21hLndhZ2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHdhZ2VySWQgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICghd2FnZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2FnZXIgbm90IGZvdW5kJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YWdlci5zdGF0dXMgIT09ICdwZW5kaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gb25seSBkZWNsaW5lIHBlbmRpbmcgd2FnZXJzJylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlZnVuZCBjcmVhdG9yXG4gICAgICAgIGF3YWl0IHVzZXJTZXJ2aWNlLnVwZGF0ZUNvaW5zKHdhZ2VyLmNyZWF0b3JJZCwgd2FnZXIuYW1vdW50KVxuXG4gICAgICAgIGNvbnN0IHVwZGF0ZWRXYWdlciA9IGF3YWl0IHByaXNtYS53YWdlci51cGRhdGUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHdhZ2VySWQgfSxcbiAgICAgICAgICAgIGRhdGE6IHsgc3RhdHVzOiAnZGVjbGluZWQnIH1cbiAgICAgICAgfSlcblxuICAgICAgICBjb25zb2xlLmxvZyhg4p2MIFdhZ2VyICR7d2FnZXJJZH0gZGVjbGluZWRgKVxuICAgICAgICByZXR1cm4gdXBkYXRlZFdhZ2VyXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FuY2VsIGEgd2FnZXIgKG9ubHkgaWYgbm8gb3Bwb25lbnQgeWV0KVxuICAgICAqL1xuICAgIGFzeW5jIGNhbmNlbFdhZ2VyKHdhZ2VySWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgd2FnZXIgPSBhd2FpdCBwcmlzbWEud2FnZXIuZmluZFVuaXF1ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogd2FnZXJJZCB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCF3YWdlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXYWdlciBub3QgZm91bmQnKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdhZ2VyLmNyZWF0b3JJZCAhPT0gdXNlcklkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgY3JlYXRvciBjYW4gY2FuY2VsIHdhZ2VyJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YWdlci5zdGF0dXMgIT09ICdwZW5kaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gb25seSBjYW5jZWwgcGVuZGluZyB3YWdlcnMnKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVmdW5kIGNyZWF0b3JcbiAgICAgICAgYXdhaXQgdXNlclNlcnZpY2UudXBkYXRlQ29pbnMod2FnZXIuY3JlYXRvcklkLCB3YWdlci5hbW91bnQpXG5cbiAgICAgICAgY29uc3QgdXBkYXRlZFdhZ2VyID0gYXdhaXQgcHJpc21hLndhZ2VyLnVwZGF0ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogd2FnZXJJZCB9LFxuICAgICAgICAgICAgZGF0YTogeyBzdGF0dXM6ICdjYW5jZWxsZWQnIH1cbiAgICAgICAgfSlcblxuICAgICAgICBjb25zb2xlLmxvZyhg8J+aqyBXYWdlciAke3dhZ2VySWR9IGNhbmNlbGxlZCBieSBjcmVhdG9yYClcbiAgICAgICAgcmV0dXJuIHVwZGF0ZWRXYWdlclxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXBsZXRlIGEgd2FnZXIgYWZ0ZXIgZ2FtZSBlbmRzXG4gICAgICovXG4gICAgYXN5bmMgY29tcGxldGVXYWdlcih3YWdlcklkOiBzdHJpbmcsIHdpbm5lcklkOiBzdHJpbmcgfCBudWxsKSB7XG4gICAgICAgIGNvbnN0IHdhZ2VyID0gYXdhaXQgcHJpc21hLndhZ2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHdhZ2VySWQgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICghd2FnZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2FnZXIgbm90IGZvdW5kJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YWdlci5zdGF0dXMgIT09ICdhY2NlcHRlZCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2FnZXIgaXMgbm90IGluIGFjY2VwdGVkIHN0YXRlJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghd2lubmVySWQpIHtcbiAgICAgICAgICAgIC8vIERyYXcgLSByZWZ1bmQgYm90aCBwbGF5ZXJzXG4gICAgICAgICAgICBhd2FpdCB1c2VyU2VydmljZS51cGRhdGVDb2lucyh3YWdlci5jcmVhdG9ySWQsIHdhZ2VyLmFtb3VudClcbiAgICAgICAgICAgIGlmICh3YWdlci5vcHBvbmVudElkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdXNlclNlcnZpY2UudXBkYXRlQ29pbnMod2FnZXIub3Bwb25lbnRJZCwgd2FnZXIuYW1vdW50KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCBwcmlzbWEud2FnZXIudXBkYXRlKHtcbiAgICAgICAgICAgICAgICB3aGVyZTogeyBpZDogd2FnZXJJZCB9LFxuICAgICAgICAgICAgICAgIGRhdGE6IHsgc3RhdHVzOiAnY29tcGxldGVkJywgd2lubmVySWQ6IG51bGwgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdpbm5lciB0YWtlcyBhbGwgKDIgKiBhbW91bnQpXG4gICAgICAgICAgICBhd2FpdCB1c2VyU2VydmljZS51cGRhdGVDb2lucyh3aW5uZXJJZCwgd2FnZXIuYW1vdW50ICogMilcblxuICAgICAgICAgICAgYXdhaXQgcHJpc21hLndhZ2VyLnVwZGF0ZSh7XG4gICAgICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHdhZ2VySWQgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiB7IHN0YXR1czogJ2NvbXBsZXRlZCcsIHdpbm5lcklkIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhg4pyFIFdhZ2VyICR7d2FnZXJJZH0gY29tcGxldGVkYClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgcGVuZGluZyB3YWdlcnMgKG9wZW4gY2hhbGxlbmdlcylcbiAgICAgKi9cbiAgICBhc3luYyBnZXRQZW5kaW5nV2FnZXJzKGxpbWl0OiBudW1iZXIgPSAyMCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgcHJpc21hLndhZ2VyLmZpbmRNYW55KHtcbiAgICAgICAgICAgIHdoZXJlOiB7IHN0YXR1czogJ3BlbmRpbmcnIH0sXG4gICAgICAgICAgICBvcmRlckJ5OiB7IGNyZWF0ZWRBdDogJ2Rlc2MnIH0sXG4gICAgICAgICAgICB0YWtlOiBsaW1pdCxcbiAgICAgICAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgICAgICAgICBjcmVhdG9yOiB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdDogeyB1c2VybmFtZTogdHJ1ZSwgYXZhdGFyOiB0cnVlLCBlbG9DaGVja2VyczogdHJ1ZSwgZWxvQ2hlc3M6IHRydWUgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdXNlcidzIGFjdGl2ZSB3YWdlcnNcbiAgICAgKi9cbiAgICBhc3luYyBnZXRVc2VyQWN0aXZlV2FnZXJzKHVzZXJJZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBwcmlzbWEud2FnZXIuZmluZE1hbnkoe1xuICAgICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgICAgICBPUjogW1xuICAgICAgICAgICAgICAgICAgICB7IGNyZWF0b3JJZDogdXNlcklkIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgb3Bwb25lbnRJZDogdXNlcklkIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHN0YXR1czogeyBpbjogWydwZW5kaW5nJywgJ2FjY2VwdGVkJ10gfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9yZGVyQnk6IHsgY3JlYXRlZEF0OiAnZGVzYycgfSxcbiAgICAgICAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgICAgICAgICBjcmVhdG9yOiB7IHNlbGVjdDogeyB1c2VybmFtZTogdHJ1ZSB9IH0sXG4gICAgICAgICAgICAgICAgb3Bwb25lbnQ6IHsgc2VsZWN0OiB7IHVzZXJuYW1lOiB0cnVlIH0gfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB1c2VyJ3Mgd2FnZXIgaGlzdG9yeVxuICAgICAqL1xuICAgIGFzeW5jIGdldFVzZXJXYWdlckhpc3RvcnkodXNlcklkOiBzdHJpbmcsIGxpbWl0OiBudW1iZXIgPSA1MCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgcHJpc21hLndhZ2VyLmZpbmRNYW55KHtcbiAgICAgICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICAgICAgT1I6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBjcmVhdG9ySWQ6IHVzZXJJZCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG9wcG9uZW50SWQ6IHVzZXJJZCB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3JkZXJCeTogeyBjcmVhdGVkQXQ6ICdkZXNjJyB9LFxuICAgICAgICAgICAgdGFrZTogbGltaXQsXG4gICAgICAgICAgICBpbmNsdWRlOiB7XG4gICAgICAgICAgICAgICAgY3JlYXRvcjogeyBzZWxlY3Q6IHsgdXNlcm5hbWU6IHRydWUgfSB9LFxuICAgICAgICAgICAgICAgIG9wcG9uZW50OiB7IHNlbGVjdDogeyB1c2VybmFtZTogdHJ1ZSB9IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxZQUFZLHFCQUFvQjtBQUN2QyxNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUc7QUFDekIsU0FBUyxXQUFXLFFBQVEsbUJBQWtCO0FBRTlDLE1BQU0sU0FBUyxJQUFJO0FBRW5CLE9BQU8sTUFBTTtFQUNUOztLQUVDLEdBQ0QsTUFBTSxZQUFZLE1BT2pCLEVBQUU7SUFDQyxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUc7SUFFakQscUNBQXFDO0lBQ3JDLE1BQU0sVUFBVSxNQUFNLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztNQUN6QyxPQUFPO1FBQUUsSUFBSTtNQUFVO0lBQzNCO0lBRUEsSUFBSSxDQUFDLFNBQVM7TUFDVixNQUFNLElBQUksTUFBTTtJQUNw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
// denoCacheMetadata=4805537680117830839,17754402569277975784