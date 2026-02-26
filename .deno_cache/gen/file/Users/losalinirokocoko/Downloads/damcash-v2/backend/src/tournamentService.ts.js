import Prisma from 'npm:@prisma/client';
const { PrismaClient } = Prisma;
// Use any for destructured types to avoid TS errors with default import pattern in Deno
const { Tournament, TournamentPlayer, Game } = Prisma;
const prisma = new PrismaClient();
export class TournamentService {
  async createTournament(params) {
    // Generate ISO string for start time if needed, but Prisma handles Date objects
    return await prisma.tournament.create({
      data: {
        name: params.name,
        gameType: params.gameType,
        variant: params.variant || 'Standard',
        status: 'created',
        startTime: params.startTime,
        duration: params.duration,
        rated: params.rated ?? false,
        minRating: params.minRating,
        maxRating: params.maxRating,
        maxPlayers: params.maxPlayers,
        allowBerserk: params.allowBerserk ?? true,
        minGames: params.minGames ?? 0,
        createdBy: params.createdBy || 'system'
      }
    });
  }
  async getTournament(id) {
    return await prisma.tournament.findUnique({
      where: {
        id
      },
      include: {
        players: true,
        games: true
      }
    });
  }
  async getAllTournaments() {
    return await prisma.tournament.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  async joinTournament(tournamentId, userId, username, rating) {
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId
      },
      include: {
        players: true
      }
    });
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'created') throw new Error('Tournament already started or finished');
    // Check if already joined
    const existingPlayer = tournament.players.find((p)=>p.userId === userId);
    if (existingPlayer) throw new Error('Already joined');
    // Check max players
    if (tournament.maxPlayers && tournament.players.length >= tournament.maxPlayers) {
      throw new Error('Tournament is full');
    }
    // Check rating
    if (tournament.minRating && rating < tournament.minRating) throw new Error(`Rating too low (min: ${tournament.minRating})`);
    if (tournament.maxRating && rating > tournament.maxRating) throw new Error(`Rating too high (max: ${tournament.maxRating})`);
    return await prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        userId,
        username,
        rating
      }
    });
  }
  async leaveTournament(tournamentId, userId) {
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId
      }
    });
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'created') throw new Error('Cannot leave started tournament');
    // Find the player entry to delete
    // We need to delete by tournamentId_userId composite key if it exists, or find first and delete
    // Prisma schema has @@unique([tournamentId, userId]) so we can use delete
    try {
      await prisma.tournamentPlayer.delete({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId
          }
        }
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  async startTournament(tournamentId) {
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId
      },
      include: {
        players: true
      }
    });
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'created') throw new Error('Tournament already started');
    if (tournament.players.length < 2) throw new Error('Not enough players');
    return await prisma.tournament.update({
      where: {
        id: tournamentId
      },
      data: {
        status: 'started',
        startTime: new Date()
      }
    });
  }
  async finishTournament(tournamentId) {
    return await prisma.tournament.update({
      where: {
        id: tournamentId
      },
      data: {
        status: 'finished'
      }
    });
  }
  async getStandings(tournamentId) {
    const players = await prisma.tournamentPlayer.findMany({
      where: {
        tournamentId
      },
      orderBy: [
        {
          score: 'desc'
        },
        {
          performance: 'desc'
        },
        {
          buchholz: 'desc'
        },
        {
          wins: 'desc'
        }
      ]
    });
    return players.map((p, i)=>({
        rank: i + 1,
        ...p
      }));
  }
}
export class ScoringService {
  async updateGameResult(gameId, result) {
    const game = await prisma.game.findUnique({
      where: {
        id: gameId
      }
    });
    if (!game || !game.tournamentId) return;
    // Update game status
    await prisma.game.update({
      where: {
        id: gameId
      },
      data: {
        result: result,
        finishedAt: new Date()
      }
    });
    // Update players
    const whitePlayer = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: game.tournamentId,
          userId: game.whiteId
        }
      }
    });
    const blackPlayer = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: game.tournamentId,
          userId: game.blackId
        }
      }
    });
    if (!whitePlayer || !blackPlayer) return;
    // Verify logic: Simplified scoring
    // Win = 2pts, Draw = 1pt, Loss = 0pts
    // Streak > 2 wins => +1 pt ?? (Lichess rules are strict, let's keep it simple for now or mirror logic)
    // Original logic: Win=2, Draw=1, Loss=0. Streak(2+) doubles points.
    // We will implement simple scoring for verify first
    let wPoints = 0;
    let bPoints = 0;
    if (result === 'white') {
      wPoints = 2;
      bPoints = 0;
    } else if (result === 'black') {
      wPoints = 0;
      bPoints = 2;
    } else {
      wPoints = 1;
      bPoints = 1;
    }
    // Apply updates
    // We should ideally use transactions or careful updates
    await prisma.tournamentPlayer.update({
      where: {
        id: whitePlayer.id
      },
      data: {
        score: {
          increment: wPoints
        },
        games: {
          increment: 1
        },
        wins: {
          increment: result === 'white' ? 1 : 0
        },
        draws: {
          increment: result === 'draw' ? 1 : 0
        },
        losses: {
          increment: result === 'black' ? 1 : 0
        },
        // Simple streak logic
        streak: result === 'white' ? {
          increment: 1
        } : 0
      }
    });
    await prisma.tournamentPlayer.update({
      where: {
        id: blackPlayer.id
      },
      data: {
        score: {
          increment: bPoints
        },
        games: {
          increment: 1
        },
        wins: {
          increment: result === 'black' ? 1 : 0
        },
        draws: {
          increment: result === 'draw' ? 1 : 0
        },
        losses: {
          increment: result === 'white' ? 1 : 0
        },
        streak: result === 'black' ? {
          increment: 1
        } : 0
      }
    });
  }
}
// Singleton instances
export const tournamentService = new TournamentService();
export const scoringService = new ScoringService();
// Mock pairing service for now to satisfy imports, or implement if needed
export const pairingService = {
  pairPlayers: (tournament)=>[]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy90b3VybmFtZW50U2VydmljZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJpc21hIGZyb20gJ25wbTpAcHJpc21hL2NsaWVudCdcbmNvbnN0IHsgUHJpc21hQ2xpZW50IH0gPSBQcmlzbWFcbi8vIFVzZSBhbnkgZm9yIGRlc3RydWN0dXJlZCB0eXBlcyB0byBhdm9pZCBUUyBlcnJvcnMgd2l0aCBkZWZhdWx0IGltcG9ydCBwYXR0ZXJuIGluIERlbm9cbmNvbnN0IHsgVG91cm5hbWVudCwgVG91cm5hbWVudFBsYXllciwgR2FtZSB9ID0gUHJpc21hIGFzIGFueVxuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KClcblxuZXhwb3J0IGNsYXNzIFRvdXJuYW1lbnRTZXJ2aWNlIHtcblxuICAgIGFzeW5jIGNyZWF0ZVRvdXJuYW1lbnQocGFyYW1zOiB7XG4gICAgICAgIG5hbWU6IHN0cmluZ1xuICAgICAgICBnYW1lVHlwZTogc3RyaW5nXG4gICAgICAgIHZhcmlhbnQ/OiBzdHJpbmdcbiAgICAgICAgc3RhcnRUaW1lOiBEYXRlXG4gICAgICAgIGR1cmF0aW9uOiBudW1iZXJcbiAgICAgICAgcmF0ZWQ/OiBib29sZWFuXG4gICAgICAgIG1pblJhdGluZz86IG51bWJlclxuICAgICAgICBtYXhSYXRpbmc/OiBudW1iZXJcbiAgICAgICAgbWF4UGxheWVycz86IG51bWJlclxuICAgICAgICBhbGxvd0JlcnNlcms/OiBib29sZWFuXG4gICAgICAgIG1pbkdhbWVzPzogbnVtYmVyXG4gICAgICAgIGNyZWF0ZWRCeT86IHN0cmluZ1xuICAgIH0pIHtcbiAgICAgICAgLy8gR2VuZXJhdGUgSVNPIHN0cmluZyBmb3Igc3RhcnQgdGltZSBpZiBuZWVkZWQsIGJ1dCBQcmlzbWEgaGFuZGxlcyBEYXRlIG9iamVjdHNcbiAgICAgICAgcmV0dXJuIGF3YWl0IHByaXNtYS50b3VybmFtZW50LmNyZWF0ZSh7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogcGFyYW1zLm5hbWUsXG4gICAgICAgICAgICAgICAgZ2FtZVR5cGU6IHBhcmFtcy5nYW1lVHlwZSxcbiAgICAgICAgICAgICAgICB2YXJpYW50OiBwYXJhbXMudmFyaWFudCB8fCAnU3RhbmRhcmQnLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ2NyZWF0ZWQnLFxuICAgICAgICAgICAgICAgIHN0YXJ0VGltZTogcGFyYW1zLnN0YXJ0VGltZSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogcGFyYW1zLmR1cmF0aW9uLFxuICAgICAgICAgICAgICAgIHJhdGVkOiBwYXJhbXMucmF0ZWQgPz8gZmFsc2UsXG4gICAgICAgICAgICAgICAgbWluUmF0aW5nOiBwYXJhbXMubWluUmF0aW5nLFxuICAgICAgICAgICAgICAgIG1heFJhdGluZzogcGFyYW1zLm1heFJhdGluZyxcbiAgICAgICAgICAgICAgICBtYXhQbGF5ZXJzOiBwYXJhbXMubWF4UGxheWVycyxcbiAgICAgICAgICAgICAgICBhbGxvd0JlcnNlcms6IHBhcmFtcy5hbGxvd0JlcnNlcmsgPz8gdHJ1ZSxcbiAgICAgICAgICAgICAgICBtaW5HYW1lczogcGFyYW1zLm1pbkdhbWVzID8/IDAsXG4gICAgICAgICAgICAgICAgY3JlYXRlZEJ5OiBwYXJhbXMuY3JlYXRlZEJ5IHx8ICdzeXN0ZW0nXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0VG91cm5hbWVudChpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBwcmlzbWEudG91cm5hbWVudC5maW5kVW5pcXVlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGlkIH0sXG4gICAgICAgICAgICBpbmNsdWRlOiB7XG4gICAgICAgICAgICAgICAgcGxheWVyczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBnYW1lczogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGFzeW5jIGdldEFsbFRvdXJuYW1lbnRzKCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgcHJpc21hLnRvdXJuYW1lbnQuZmluZE1hbnkoe1xuICAgICAgICAgICAgb3JkZXJCeTogeyBjcmVhdGVkQXQ6ICdkZXNjJyB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgYXN5bmMgam9pblRvdXJuYW1lbnQodG91cm5hbWVudElkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nLCB1c2VybmFtZTogc3RyaW5nLCByYXRpbmc6IG51bWJlcikge1xuICAgICAgICBjb25zdCB0b3VybmFtZW50ID0gYXdhaXQgcHJpc21hLnRvdXJuYW1lbnQuZmluZFVuaXF1ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogdG91cm5hbWVudElkIH0sXG4gICAgICAgICAgICBpbmNsdWRlOiB7IHBsYXllcnM6IHRydWUgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICghdG91cm5hbWVudCkgdGhyb3cgbmV3IEVycm9yKCdUb3VybmFtZW50IG5vdCBmb3VuZCcpXG4gICAgICAgIGlmICh0b3VybmFtZW50LnN0YXR1cyAhPT0gJ2NyZWF0ZWQnKSB0aHJvdyBuZXcgRXJyb3IoJ1RvdXJuYW1lbnQgYWxyZWFkeSBzdGFydGVkIG9yIGZpbmlzaGVkJylcblxuICAgICAgICAvLyBDaGVjayBpZiBhbHJlYWR5IGpvaW5lZFxuICAgICAgICBjb25zdCBleGlzdGluZ1BsYXllciA9IHRvdXJuYW1lbnQucGxheWVycy5maW5kKHAgPT4gcC51c2VySWQgPT09IHVzZXJJZClcbiAgICAgICAgaWYgKGV4aXN0aW5nUGxheWVyKSB0aHJvdyBuZXcgRXJyb3IoJ0FscmVhZHkgam9pbmVkJylcblxuICAgICAgICAvLyBDaGVjayBtYXggcGxheWVyc1xuICAgICAgICBpZiAodG91cm5hbWVudC5tYXhQbGF5ZXJzICYmIHRvdXJuYW1lbnQucGxheWVycy5sZW5ndGggPj0gdG91cm5hbWVudC5tYXhQbGF5ZXJzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RvdXJuYW1lbnQgaXMgZnVsbCcpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayByYXRpbmdcbiAgICAgICAgaWYgKHRvdXJuYW1lbnQubWluUmF0aW5nICYmIHJhdGluZyA8IHRvdXJuYW1lbnQubWluUmF0aW5nKSB0aHJvdyBuZXcgRXJyb3IoYFJhdGluZyB0b28gbG93IChtaW46ICR7dG91cm5hbWVudC5taW5SYXRpbmd9KWApXG4gICAgICAgIGlmICh0b3VybmFtZW50Lm1heFJhdGluZyAmJiByYXRpbmcgPiB0b3VybmFtZW50Lm1heFJhdGluZykgdGhyb3cgbmV3IEVycm9yKGBSYXRpbmcgdG9vIGhpZ2ggKG1heDogJHt0b3VybmFtZW50Lm1heFJhdGluZ30pYClcblxuICAgICAgICByZXR1cm4gYXdhaXQgcHJpc21hLnRvdXJuYW1lbnRQbGF5ZXIuY3JlYXRlKHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICB0b3VybmFtZW50SWQsXG4gICAgICAgICAgICAgICAgdXNlcklkLFxuICAgICAgICAgICAgICAgIHVzZXJuYW1lLFxuICAgICAgICAgICAgICAgIHJhdGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGFzeW5jIGxlYXZlVG91cm5hbWVudCh0b3VybmFtZW50SWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgdG91cm5hbWVudCA9IGF3YWl0IHByaXNtYS50b3VybmFtZW50LmZpbmRVbmlxdWUoeyB3aGVyZTogeyBpZDogdG91cm5hbWVudElkIH0gfSlcbiAgICAgICAgaWYgKCF0b3VybmFtZW50KSB0aHJvdyBuZXcgRXJyb3IoJ1RvdXJuYW1lbnQgbm90IGZvdW5kJylcbiAgICAgICAgaWYgKHRvdXJuYW1lbnQuc3RhdHVzICE9PSAnY3JlYXRlZCcpIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGxlYXZlIHN0YXJ0ZWQgdG91cm5hbWVudCcpXG5cbiAgICAgICAgLy8gRmluZCB0aGUgcGxheWVyIGVudHJ5IHRvIGRlbGV0ZVxuICAgICAgICAvLyBXZSBuZWVkIHRvIGRlbGV0ZSBieSB0b3VybmFtZW50SWRfdXNlcklkIGNvbXBvc2l0ZSBrZXkgaWYgaXQgZXhpc3RzLCBvciBmaW5kIGZpcnN0IGFuZCBkZWxldGVcbiAgICAgICAgLy8gUHJpc21hIHNjaGVtYSBoYXMgQEB1bmlxdWUoW3RvdXJuYW1lbnRJZCwgdXNlcklkXSkgc28gd2UgY2FuIHVzZSBkZWxldGVcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHByaXNtYS50b3VybmFtZW50UGxheWVyLmRlbGV0ZSh7XG4gICAgICAgICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgICAgICAgICAgdG91cm5hbWVudElkX3VzZXJJZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG91cm5hbWVudElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcklkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBzdGFydFRvdXJuYW1lbnQodG91cm5hbWVudElkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgdG91cm5hbWVudCA9IGF3YWl0IHByaXNtYS50b3VybmFtZW50LmZpbmRVbmlxdWUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHRvdXJuYW1lbnRJZCB9LFxuICAgICAgICAgICAgaW5jbHVkZTogeyBwbGF5ZXJzOiB0cnVlIH1cbiAgICAgICAgfSlcblxuICAgICAgICBpZiAoIXRvdXJuYW1lbnQpIHRocm93IG5ldyBFcnJvcignVG91cm5hbWVudCBub3QgZm91bmQnKVxuICAgICAgICBpZiAodG91cm5hbWVudC5zdGF0dXMgIT09ICdjcmVhdGVkJykgdGhyb3cgbmV3IEVycm9yKCdUb3VybmFtZW50IGFscmVhZHkgc3RhcnRlZCcpXG4gICAgICAgIGlmICh0b3VybmFtZW50LnBsYXllcnMubGVuZ3RoIDwgMikgdGhyb3cgbmV3IEVycm9yKCdOb3QgZW5vdWdoIHBsYXllcnMnKVxuXG4gICAgICAgIHJldHVybiBhd2FpdCBwcmlzbWEudG91cm5hbWVudC51cGRhdGUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHRvdXJuYW1lbnRJZCB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIHN0YXR1czogJ3N0YXJ0ZWQnLFxuICAgICAgICAgICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGFzeW5jIGZpbmlzaFRvdXJuYW1lbnQodG91cm5hbWVudElkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHByaXNtYS50b3VybmFtZW50LnVwZGF0ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogdG91cm5hbWVudElkIH0sXG4gICAgICAgICAgICBkYXRhOiB7IHN0YXR1czogJ2ZpbmlzaGVkJyB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0U3RhbmRpbmdzKHRvdXJuYW1lbnRJZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBsYXllcnMgPSBhd2FpdCBwcmlzbWEudG91cm5hbWVudFBsYXllci5maW5kTWFueSh7XG4gICAgICAgICAgICB3aGVyZTogeyB0b3VybmFtZW50SWQgfSxcbiAgICAgICAgICAgIG9yZGVyQnk6IFtcbiAgICAgICAgICAgICAgICB7IHNjb3JlOiAnZGVzYycgfSxcbiAgICAgICAgICAgICAgICB7IHBlcmZvcm1hbmNlOiAnZGVzYycgfSxcbiAgICAgICAgICAgICAgICB7IGJ1Y2hob2x6OiAnZGVzYycgfSxcbiAgICAgICAgICAgICAgICB7IHdpbnM6ICdkZXNjJyB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHBsYXllcnMubWFwKChwLCBpKSA9PiAoe1xuICAgICAgICAgICAgcmFuazogaSArIDEsXG4gICAgICAgICAgICAuLi5wXG4gICAgICAgIH0pKVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjb3JpbmdTZXJ2aWNlIHtcbiAgICBhc3luYyB1cGRhdGVHYW1lUmVzdWx0KGdhbWVJZDogc3RyaW5nLCByZXN1bHQ6ICd3aGl0ZScgfCAnYmxhY2snIHwgJ2RyYXcnKSB7XG4gICAgICAgIGNvbnN0IGdhbWUgPSBhd2FpdCBwcmlzbWEuZ2FtZS5maW5kVW5pcXVlKHsgd2hlcmU6IHsgaWQ6IGdhbWVJZCB9IH0pXG4gICAgICAgIGlmICghZ2FtZSB8fCAhZ2FtZS50b3VybmFtZW50SWQpIHJldHVyblxuXG4gICAgICAgIC8vIFVwZGF0ZSBnYW1lIHN0YXR1c1xuICAgICAgICBhd2FpdCBwcmlzbWEuZ2FtZS51cGRhdGUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IGdhbWVJZCB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LFxuICAgICAgICAgICAgICAgIGZpbmlzaGVkQXQ6IG5ldyBEYXRlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICAvLyBVcGRhdGUgcGxheWVyc1xuICAgICAgICBjb25zdCB3aGl0ZVBsYXllciA9IGF3YWl0IHByaXNtYS50b3VybmFtZW50UGxheWVyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgdG91cm5hbWVudElkX3VzZXJJZDogeyB0b3VybmFtZW50SWQ6IGdhbWUudG91cm5hbWVudElkLCB1c2VySWQ6IGdhbWUud2hpdGVJZCB9IH1cbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgYmxhY2tQbGF5ZXIgPSBhd2FpdCBwcmlzbWEudG91cm5hbWVudFBsYXllci5maW5kVW5pcXVlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IHRvdXJuYW1lbnRJZF91c2VySWQ6IHsgdG91cm5hbWVudElkOiBnYW1lLnRvdXJuYW1lbnRJZCwgdXNlcklkOiBnYW1lLmJsYWNrSWQgfSB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCF3aGl0ZVBsYXllciB8fCAhYmxhY2tQbGF5ZXIpIHJldHVyblxuXG4gICAgICAgIC8vIFZlcmlmeSBsb2dpYzogU2ltcGxpZmllZCBzY29yaW5nXG4gICAgICAgIC8vIFdpbiA9IDJwdHMsIERyYXcgPSAxcHQsIExvc3MgPSAwcHRzXG4gICAgICAgIC8vIFN0cmVhayA+IDIgd2lucyA9PiArMSBwdCA/PyAoTGljaGVzcyBydWxlcyBhcmUgc3RyaWN0LCBsZXQncyBrZWVwIGl0IHNpbXBsZSBmb3Igbm93IG9yIG1pcnJvciBsb2dpYylcbiAgICAgICAgLy8gT3JpZ2luYWwgbG9naWM6IFdpbj0yLCBEcmF3PTEsIExvc3M9MC4gU3RyZWFrKDIrKSBkb3VibGVzIHBvaW50cy5cblxuICAgICAgICAvLyBXZSB3aWxsIGltcGxlbWVudCBzaW1wbGUgc2NvcmluZyBmb3IgdmVyaWZ5IGZpcnN0XG4gICAgICAgIGxldCB3UG9pbnRzID0gMFxuICAgICAgICBsZXQgYlBvaW50cyA9IDBcblxuICAgICAgICBpZiAocmVzdWx0ID09PSAnd2hpdGUnKSB7XG4gICAgICAgICAgICB3UG9pbnRzID0gMlxuICAgICAgICAgICAgYlBvaW50cyA9IDBcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQgPT09ICdibGFjaycpIHtcbiAgICAgICAgICAgIHdQb2ludHMgPSAwXG4gICAgICAgICAgICBiUG9pbnRzID0gMlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd1BvaW50cyA9IDFcbiAgICAgICAgICAgIGJQb2ludHMgPSAxXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBcHBseSB1cGRhdGVzXG4gICAgICAgIC8vIFdlIHNob3VsZCBpZGVhbGx5IHVzZSB0cmFuc2FjdGlvbnMgb3IgY2FyZWZ1bCB1cGRhdGVzXG4gICAgICAgIGF3YWl0IHByaXNtYS50b3VybmFtZW50UGxheWVyLnVwZGF0ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogd2hpdGVQbGF5ZXIuaWQgfSxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBzY29yZTogeyBpbmNyZW1lbnQ6IHdQb2ludHMgfSxcbiAgICAgICAgICAgICAgICBnYW1lczogeyBpbmNyZW1lbnQ6IDEgfSxcbiAgICAgICAgICAgICAgICB3aW5zOiB7IGluY3JlbWVudDogcmVzdWx0ID09PSAnd2hpdGUnID8gMSA6IDAgfSxcbiAgICAgICAgICAgICAgICBkcmF3czogeyBpbmNyZW1lbnQ6IHJlc3VsdCA9PT0gJ2RyYXcnID8gMSA6IDAgfSxcbiAgICAgICAgICAgICAgICBsb3NzZXM6IHsgaW5jcmVtZW50OiByZXN1bHQgPT09ICdibGFjaycgPyAxIDogMCB9LFxuICAgICAgICAgICAgICAgIC8vIFNpbXBsZSBzdHJlYWsgbG9naWNcbiAgICAgICAgICAgICAgICBzdHJlYWs6IHJlc3VsdCA9PT0gJ3doaXRlJyA/IHsgaW5jcmVtZW50OiAxIH0gOiAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgcHJpc21hLnRvdXJuYW1lbnRQbGF5ZXIudXBkYXRlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGlkOiBibGFja1BsYXllci5pZCB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIHNjb3JlOiB7IGluY3JlbWVudDogYlBvaW50cyB9LFxuICAgICAgICAgICAgICAgIGdhbWVzOiB7IGluY3JlbWVudDogMSB9LFxuICAgICAgICAgICAgICAgIHdpbnM6IHsgaW5jcmVtZW50OiByZXN1bHQgPT09ICdibGFjaycgPyAxIDogMCB9LFxuICAgICAgICAgICAgICAgIGRyYXdzOiB7IGluY3JlbWVudDogcmVzdWx0ID09PSAnZHJhdycgPyAxIDogMCB9LFxuICAgICAgICAgICAgICAgIGxvc3NlczogeyBpbmNyZW1lbnQ6IHJlc3VsdCA9PT0gJ3doaXRlJyA/IDEgOiAwIH0sXG4gICAgICAgICAgICAgICAgc3RyZWFrOiByZXN1bHQgPT09ICdibGFjaycgPyB7IGluY3JlbWVudDogMSB9IDogMFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuLy8gU2luZ2xldG9uIGluc3RhbmNlc1xuZXhwb3J0IGNvbnN0IHRvdXJuYW1lbnRTZXJ2aWNlID0gbmV3IFRvdXJuYW1lbnRTZXJ2aWNlKClcbmV4cG9ydCBjb25zdCBzY29yaW5nU2VydmljZSA9IG5ldyBTY29yaW5nU2VydmljZSgpXG4vLyBNb2NrIHBhaXJpbmcgc2VydmljZSBmb3Igbm93IHRvIHNhdGlzZnkgaW1wb3J0cywgb3IgaW1wbGVtZW50IGlmIG5lZWRlZFxuZXhwb3J0IGNvbnN0IHBhaXJpbmdTZXJ2aWNlID0ge1xuICAgIHBhaXJQbGF5ZXJzOiAodG91cm5hbWVudDogYW55KSA9PiBbXVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sWUFBWSxxQkFBb0I7QUFDdkMsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHO0FBQ3pCLHdGQUF3RjtBQUN4RixNQUFNLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxHQUFHO0FBRS9DLE1BQU0sU0FBUyxJQUFJO0FBRW5CLE9BQU8sTUFBTTtFQUVULE1BQU0saUJBQWlCLE1BYXRCLEVBQUU7SUFDQyxnRkFBZ0Y7SUFDaEYsT0FBTyxNQUFNLE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQztNQUNsQyxNQUFNO1FBQ0YsTUFBTSxPQUFPLElBQUk7UUFDakIsVUFBVSxPQUFPLFFBQVE7UUFDekIsU0FBUyxPQUFPLE9BQU8sSUFBSTtRQUMzQixRQUFRO1FBQ1IsV0FBVyxPQUFPLFNBQVM7UUFDM0IsVUFBVSxPQUFPLFFBQVE7UUFDekIsT0FB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
// denoCacheMetadata=8441885889815835329,6554995661703548374