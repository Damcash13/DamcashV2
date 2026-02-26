import { db } from './entities.ts';
export class EscrowService {
  /**
     * Lock coins in escrow for a wager
     */ async lockCoins(userId, amount, wagerId) {
    const user = db.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.coinsAvailable < amount) {
      throw new Error('Insufficient coins available');
    }
    // Atomic transaction
    user.coinsAvailable -= amount;
    user.coinsLocked += amount;
    db.users.set(userId, user);
    // Create escrow transaction record
    const escrowTx = {
      id: crypto.randomUUID(),
      wagerId,
      userId,
      amount,
      type: 'lock',
      status: 'completed',
      createdAt: new Date()
    };
    db.escrowTransactions.set(escrowTx.id, escrowTx);
    // Create coin transaction record
    const coinTx = {
      id: crypto.randomUUID(),
      userId,
      amount: -amount,
      type: 'wager_lock',
      referenceId: wagerId,
      balanceAfter: user.coins - amount,
      description: `Locked ${amount} coins for wager ${wagerId}`,
      createdAt: new Date()
    };
    db.coinTransactions.set(coinTx.id, coinTx);
    console.log(`✅ Locked ${amount} coins for user ${user.username} (Wager: ${wagerId})`);
    return true;
  }
  /**
     * Unlock coins from escrow (refund)
     */ async unlockCoins(userId, amount, wagerId) {
    const user = db.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.coinsLocked < amount) {
      throw new Error('Insufficient locked coins');
    }
    // Atomic transaction
    user.coinsLocked -= amount;
    user.coinsAvailable += amount;
    db.users.set(userId, user);
    // Create escrow transaction record
    const escrowTx = {
      id: crypto.randomUUID(),
      wagerId,
      userId,
      amount,
      type: 'unlock',
      status: 'completed',
      createdAt: new Date()
    };
    db.escrowTransactions.set(escrowTx.id, escrowTx);
    // Create coin transaction record
    const coinTx = {
      id: crypto.randomUUID(),
      userId,
      amount: amount,
      type: 'wager_refund',
      referenceId: wagerId,
      balanceAfter: user.coins,
      description: `Refunded ${amount} coins from wager ${wagerId}`,
      createdAt: new Date()
    };
    db.coinTransactions.set(coinTx.id, coinTx);
    console.log(`💰 Unlocked ${amount} coins for user ${user.username} (Refund)`);
    return true;
  }
  /**
     * Process wager payout to winner
     */ async processWagerPayout(wagerId, winnerId) {
    const wager = db.wagers.get(wagerId);
    if (!wager) {
      throw new Error('Wager not found');
    }
    if (!wager.opponentId) {
      throw new Error('Wager has no opponent');
    }
    const winner = db.users.get(winnerId);
    const loser = db.users.get(winnerId === wager.creatorId ? wager.opponentId : wager.creatorId);
    if (!winner || !loser) {
      throw new Error('Winner or loser not found');
    }
    const totalPayout = wager.amount * 2;
    // Unlock winner's original bet
    winner.coinsLocked -= wager.amount;
    // Award total pot
    winner.coinsAvailable += totalPayout;
    winner.coins += wager.amount; // Net gain
    // Deduct loser's coins
    loser.coinsLocked -= wager.amount;
    loser.coins -= wager.amount;
    db.users.set(winner.id, winner);
    db.users.set(loser.id, loser);
    // Create payout escrow transaction
    const escrowTx = {
      id: crypto.randomUUID(),
      wagerId,
      userId: winnerId,
      amount: totalPayout,
      type: 'payout',
      status: 'completed',
      createdAt: new Date()
    };
    db.escrowTransactions.set(escrowTx.id, escrowTx);
    // Create win coin transaction
    const coinTx = {
      id: crypto.randomUUID(),
      userId: winnerId,
      amount: wager.amount,
      type: 'wager_win',
      referenceId: wagerId,
      balanceAfter: winner.coins,
      description: `Won ${wager.amount} coins from wager vs ${loser.username}`,
      createdAt: new Date()
    };
    db.coinTransactions.set(coinTx.id, coinTx);
    console.log(`🏆 Paid out ${totalPayout} coins to ${winner.username} (Winner)`);
    return true;
  }
  /**
     * Refund both players in case of draw or cancellation
     */ async refundWager(wagerId) {
    const wager = db.wagers.get(wagerId);
    if (!wager) {
      throw new Error('Wager not found');
    }
    if (wager.opponentId) {
      // Both players joined - refund both
      await this.unlockCoins(wager.creatorId, wager.amount, wagerId);
      await this.unlockCoins(wager.opponentId, wager.amount, wagerId);
      console.log(`↩️ Refunded both players for wager ${wagerId}`);
    } else {
      // Only creator - refund creator
      await this.unlockCoins(wager.creatorId, wager.amount, wagerId);
      console.log(`↩️ Refunded creator for wager ${wagerId}`);
    }
    return true;
  }
  /**
     * Get transaction history for a user
     */ getTransactionHistory(userId, limit = 50) {
    const transactions = Array.from(db.coinTransactions.values()).filter((tx)=>tx.userId === userId).sort((a, b)=>b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
    return transactions;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy9lc2Nyb3dTZXJ2aWNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRiLCBVc2VyLCBXYWdlciwgRXNjcm93VHJhbnNhY3Rpb24sIENvaW5UcmFuc2FjdGlvbiB9IGZyb20gJy4vZW50aXRpZXMudHMnO1xuXG5leHBvcnQgY2xhc3MgRXNjcm93U2VydmljZSB7XG4gICAgLyoqXG4gICAgICogTG9jayBjb2lucyBpbiBlc2Nyb3cgZm9yIGEgd2FnZXJcbiAgICAgKi9cbiAgICBhc3luYyBsb2NrQ29pbnModXNlcklkOiBzdHJpbmcsIGFtb3VudDogbnVtYmVyLCB3YWdlcklkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgdXNlciA9IGRiLnVzZXJzLmdldCh1c2VySWQpO1xuICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlciBub3QgZm91bmQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1c2VyLmNvaW5zQXZhaWxhYmxlIDwgYW1vdW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luc3VmZmljaWVudCBjb2lucyBhdmFpbGFibGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF0b21pYyB0cmFuc2FjdGlvblxuICAgICAgICB1c2VyLmNvaW5zQXZhaWxhYmxlIC09IGFtb3VudDtcbiAgICAgICAgdXNlci5jb2luc0xvY2tlZCArPSBhbW91bnQ7XG4gICAgICAgIGRiLnVzZXJzLnNldCh1c2VySWQsIHVzZXIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBlc2Nyb3cgdHJhbnNhY3Rpb24gcmVjb3JkXG4gICAgICAgIGNvbnN0IGVzY3Jvd1R4OiBFc2Nyb3dUcmFuc2FjdGlvbiA9IHtcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgd2FnZXJJZCxcbiAgICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICAgIGFtb3VudCxcbiAgICAgICAgICAgIHR5cGU6ICdsb2NrJyxcbiAgICAgICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCcsXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKClcbiAgICAgICAgfTtcbiAgICAgICAgZGIuZXNjcm93VHJhbnNhY3Rpb25zLnNldChlc2Nyb3dUeC5pZCwgZXNjcm93VHgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb2luIHRyYW5zYWN0aW9uIHJlY29yZFxuICAgICAgICBjb25zdCBjb2luVHg6IENvaW5UcmFuc2FjdGlvbiA9IHtcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgdXNlcklkLFxuICAgICAgICAgICAgYW1vdW50OiAtYW1vdW50LFxuICAgICAgICAgICAgdHlwZTogJ3dhZ2VyX2xvY2snLFxuICAgICAgICAgICAgcmVmZXJlbmNlSWQ6IHdhZ2VySWQsXG4gICAgICAgICAgICBiYWxhbmNlQWZ0ZXI6IHVzZXIuY29pbnMgLSBhbW91bnQsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYExvY2tlZCAke2Ftb3VudH0gY29pbnMgZm9yIHdhZ2VyICR7d2FnZXJJZH1gLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpXG4gICAgICAgIH07XG4gICAgICAgIGRiLmNvaW5UcmFuc2FjdGlvbnMuc2V0KGNvaW5UeC5pZCwgY29pblR4KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhg4pyFIExvY2tlZCAke2Ftb3VudH0gY29pbnMgZm9yIHVzZXIgJHt1c2VyLnVzZXJuYW1lfSAoV2FnZXI6ICR7d2FnZXJJZH0pYCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVubG9jayBjb2lucyBmcm9tIGVzY3JvdyAocmVmdW5kKVxuICAgICAqL1xuICAgIGFzeW5jIHVubG9ja0NvaW5zKHVzZXJJZDogc3RyaW5nLCBhbW91bnQ6IG51bWJlciwgd2FnZXJJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHVzZXIgPSBkYi51c2Vycy5nZXQodXNlcklkKTtcbiAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgbm90IGZvdW5kJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXNlci5jb2luc0xvY2tlZCA8IGFtb3VudCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnN1ZmZpY2llbnQgbG9ja2VkIGNvaW5zJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdG9taWMgdHJhbnNhY3Rpb25cbiAgICAgICAgdXNlci5jb2luc0xvY2tlZCAtPSBhbW91bnQ7XG4gICAgICAgIHVzZXIuY29pbnNBdmFpbGFibGUgKz0gYW1vdW50O1xuICAgICAgICBkYi51c2Vycy5zZXQodXNlcklkLCB1c2VyKTtcblxuICAgICAgICAvLyBDcmVhdGUgZXNjcm93IHRyYW5zYWN0aW9uIHJlY29yZFxuICAgICAgICBjb25zdCBlc2Nyb3dUeDogRXNjcm93VHJhbnNhY3Rpb24gPSB7XG4gICAgICAgICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgIHdhZ2VySWQsXG4gICAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgICB0eXBlOiAndW5sb2NrJyxcbiAgICAgICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCcsXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKClcbiAgICAgICAgfTtcbiAgICAgICAgZGIuZXNjcm93VHJhbnNhY3Rpb25zLnNldChlc2Nyb3dUeC5pZCwgZXNjcm93VHgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb2luIHRyYW5zYWN0aW9uIHJlY29yZFxuICAgICAgICBjb25zdCBjb2luVHg6IENvaW5UcmFuc2FjdGlvbiA9IHtcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgdXNlcklkLFxuICAgICAgICAgICAgYW1vdW50OiBhbW91bnQsXG4gICAgICAgICAgICB0eXBlOiAnd2FnZXJfcmVmdW5kJyxcbiAgICAgICAgICAgIHJlZmVyZW5jZUlkOiB3YWdlcklkLFxuICAgICAgICAgICAgYmFsYW5jZUFmdGVyOiB1c2VyLmNvaW5zLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBSZWZ1bmRlZCAke2Ftb3VudH0gY29pbnMgZnJvbSB3YWdlciAke3dhZ2VySWR9YCxcbiAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKVxuICAgICAgICB9O1xuICAgICAgICBkYi5jb2luVHJhbnNhY3Rpb25zLnNldChjb2luVHguaWQsIGNvaW5UeCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYPCfkrAgVW5sb2NrZWQgJHthbW91bnR9IGNvaW5zIGZvciB1c2VyICR7dXNlci51c2VybmFtZX0gKFJlZnVuZClgKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvY2VzcyB3YWdlciBwYXlvdXQgdG8gd2lubmVyXG4gICAgICovXG4gICAgYXN5bmMgcHJvY2Vzc1dhZ2VyUGF5b3V0KHdhZ2VySWQ6IHN0cmluZywgd2lubmVySWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCB3YWdlciA9IGRiLndhZ2Vycy5nZXQod2FnZXJJZCk7XG4gICAgICAgIGlmICghd2FnZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2FnZXIgbm90IGZvdW5kJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXdhZ2VyLm9wcG9uZW50SWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2FnZXIgaGFzIG5vIG9wcG9uZW50Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aW5uZXIgPSBkYi51c2Vycy5nZXQod2lubmVySWQpO1xuICAgICAgICBjb25zdCBsb3NlciA9IGRiLnVzZXJzLmdldCh3aW5uZXJJZCA9PT0gd2FnZXIuY3JlYXRvcklkID8gd2FnZXIub3Bwb25lbnRJZCA6IHdhZ2VyLmNyZWF0b3JJZCk7XG5cbiAgICAgICAgaWYgKCF3aW5uZXIgfHwgIWxvc2VyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dpbm5lciBvciBsb3NlciBub3QgZm91bmQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvdGFsUGF5b3V0ID0gd2FnZXIuYW1vdW50ICogMjtcblxuICAgICAgICAvLyBVbmxvY2sgd2lubmVyJ3Mgb3JpZ2luYWwgYmV0XG4gICAgICAgIHdpbm5lci5jb2luc0xvY2tlZCAtPSB3YWdlci5hbW91bnQ7XG4gICAgICAgIC8vIEF3YXJkIHRvdGFsIHBvdFxuICAgICAgICB3aW5uZXIuY29pbnNBdmFpbGFibGUgKz0gdG90YWxQYXlvdXQ7XG4gICAgICAgIHdpbm5lci5jb2lucyArPSB3YWdlci5hbW91bnQ7IC8vIE5ldCBnYWluXG5cbiAgICAgICAgLy8gRGVkdWN0IGxvc2VyJ3MgY29pbnNcbiAgICAgICAgbG9zZXIuY29pbnNMb2NrZWQgLT0gd2FnZXIuYW1vdW50O1xuICAgICAgICBsb3Nlci5jb2lucyAtPSB3YWdlci5hbW91bnQ7XG5cbiAgICAgICAgZGIudXNlcnMuc2V0KHdpbm5lci5pZCwgd2lubmVyKTtcbiAgICAgICAgZGIudXNlcnMuc2V0KGxvc2VyLmlkLCBsb3Nlcik7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHBheW91dCBlc2Nyb3cgdHJhbnNhY3Rpb25cbiAgICAgICAgY29uc3QgZXNjcm93VHg6IEVzY3Jvd1RyYW5zYWN0aW9uID0ge1xuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICB3YWdlcklkLFxuICAgICAgICAgICAgdXNlcklkOiB3aW5uZXJJZCxcbiAgICAgICAgICAgIGFtb3VudDogdG90YWxQYXlvdXQsXG4gICAgICAgICAgICB0eXBlOiAncGF5b3V0JyxcbiAgICAgICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCcsXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKClcbiAgICAgICAgfTtcbiAgICAgICAgZGIuZXNjcm93VHJhbnNhY3Rpb25zLnNldChlc2Nyb3dUeC5pZCwgZXNjcm93VHgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB3aW4gY29pbiB0cmFuc2FjdGlvblxuICAgICAgICBjb25zdCBjb2luVHg6IENvaW5UcmFuc2FjdGlvbiA9IHtcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgdXNlcklkOiB3aW5uZXJJZCxcbiAgICAgICAgICAgIGFtb3VudDogd2FnZXIuYW1vdW50LFxuICAgICAgICAgICAgdHlwZTogJ3dhZ2VyX3dpbicsXG4gICAgICAgICAgICByZWZlcmVuY2VJZDogd2FnZXJJZCxcbiAgICAgICAgICAgIGJhbGFuY2VBZnRlcjogd2lubmVyLmNvaW5zLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBXb24gJHt3YWdlci5hbW91bnR9IGNvaW5zIGZyb20gd2FnZXIgdnMgJHtsb3Nlci51c2VybmFtZX1gLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpXG4gICAgICAgIH07XG4gICAgICAgIGRiLmNvaW5UcmFuc2FjdGlvbnMuc2V0KGNvaW5UeC5pZCwgY29pblR4KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhg8J+PhiBQYWlkIG91dCAke3RvdGFsUGF5b3V0fSBjb2lucyB0byAke3dpbm5lci51c2VybmFtZX0gKFdpbm5lcilgKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVmdW5kIGJvdGggcGxheWVycyBpbiBjYXNlIG9mIGRyYXcgb3IgY2FuY2VsbGF0aW9uXG4gICAgICovXG4gICAgYXN5bmMgcmVmdW5kV2FnZXIod2FnZXJJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHdhZ2VyID0gZGIud2FnZXJzLmdldCh3YWdlcklkKTtcbiAgICAgICAgaWYgKCF3YWdlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXYWdlciBub3QgZm91bmQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YWdlci5vcHBvbmVudElkKSB7XG4gICAgICAgICAgICAvLyBCb3RoIHBsYXllcnMgam9pbmVkIC0gcmVmdW5kIGJvdGhcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudW5sb2NrQ29pbnMod2FnZXIuY3JlYXRvcklkLCB3YWdlci5hbW91bnQsIHdhZ2VySWQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bmxvY2tDb2lucyh3YWdlci5vcHBvbmVudElkLCB3YWdlci5hbW91bnQsIHdhZ2VySWQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOKGqe+4jyBSZWZ1bmRlZCBib3RoIHBsYXllcnMgZm9yIHdhZ2VyICR7d2FnZXJJZH1gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9ubHkgY3JlYXRvciAtIHJlZnVuZCBjcmVhdG9yXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVubG9ja0NvaW5zKHdhZ2VyLmNyZWF0b3JJZCwgd2FnZXIuYW1vdW50LCB3YWdlcklkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDihqnvuI8gUmVmdW5kZWQgY3JlYXRvciBmb3Igd2FnZXIgJHt3YWdlcklkfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRyYW5zYWN0aW9uIGhpc3RvcnkgZm9yIGEgdXNlclxuICAgICAqL1xuICAgIGdldFRyYW5zYWN0aW9uSGlzdG9yeSh1c2VySWQ6IHN0cmluZywgbGltaXQ6IG51bWJlciA9IDUwKTogQ29pblRyYW5zYWN0aW9uW10ge1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbnMgPSBBcnJheS5mcm9tKGRiLmNvaW5UcmFuc2FjdGlvbnMudmFsdWVzKCkpXG4gICAgICAgICAgICAuZmlsdGVyKHR4ID0+IHR4LnVzZXJJZCA9PT0gdXNlcklkKVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIuY3JlYXRlZEF0LmdldFRpbWUoKSAtIGEuY3JlYXRlZEF0LmdldFRpbWUoKSlcbiAgICAgICAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG5cbiAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9ucztcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxFQUFFLFFBQXlELGdCQUFnQjtBQUVwRixPQUFPLE1BQU07RUFDVDs7S0FFQyxHQUNELE1BQU0sVUFBVSxNQUFjLEVBQUUsTUFBYyxFQUFFLE9BQWUsRUFBb0I7SUFDL0UsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUMxQixJQUFJLENBQUMsTUFBTTtNQUNQLE1BQU0sSUFBSSxNQUFNO0lBQ3BCO0lBRUEsSUFBSSxLQUFLLGNBQWMsR0FBRyxRQUFRO01BQzlCLE1BQU0sSUFBSSxNQUFNO0lBQ3BCO0lBRUEscUJBQXFCO0lBQ3JCLEtBQUssY0FBYyxJQUFJO0lBQ3ZCLEtBQUssV0FBVyxJQUFJO0lBQ3BCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRO0lBRXJCLG1DQUFtQztJQUNuQyxNQUFNLFdBQThCO01BQ2hDLElBQUksT0FBTyxVQUFVO01BQ3JCO01BQ0E7TUFDQTtNQUNBLE1BQU07TUFDTixRQUFRO01BQ1IsV0FBVyxJQUFJO0lBQ25CO0lBQ0EsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUU7SUFFdkMsaUNBQWlDO0lBQ2pDLE1BQU0sU0FBMEI7TUFDNUIsSUFBSSxPQUFPLFVBQVU7TUFDckI7TUFDQSxRQUFRLENBQUM7TUFDVCxNQUFNO01BQ04sYUFBYTtNQUNiLGNBQWMsS0FBSyxLQUFLLEdBQUc7TUFDM0IsYUFBYSxDQUFDLE9BQU8sRUFBRSxPQUFPLGlCQUFpQixFQUFFLFNBQVM7TUFDMUQsV0FBVyxJQUFJO0lBQ25CO0lBQ0EsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFFbkMsUUFBUSxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxnQkFBZ0IsRUFBRSxLQUFLLFFBQVEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDcEYsT0FBTztFQUNYO0VBRUE7O0tBRUMsR0FDRCxNQUFNLFlBQVksTUFBYyxFQUFFLE1BQWMsRUFBRSxPQUFlLEVBQW9CO0lBQ2pGLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7SUFDMUIsSUFBSSxDQUFDLE1BQU07TUFDUCxNQUFNLElBQUksTUFBTTtJQUNwQjtJQUVBLElBQUksS0FBSyxXQUFXLEdBQUcsUUFBUTtNQUMzQixNQUFNLElBQUksTUFBTTtJQUNwQjtJQUVBLHFCQUFxQjtJQUNyQixLQUFLLFdBQVcsSUFBSTtJQUNwQixLQUFLLGNBQWMsSUFBSTtJQUN2QixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUTtJQUVyQixtQ0FBbUM7SUFDbkMsTUFBTSxXQUE4QjtNQUNoQyxJQUFJLE9BQU8sVUFBVTtNQUNyQjtNQUNBO01BQ0E7TUFDQSxNQUFNO01BQ04sUUFBUTtNQUNSLFdBQVcsSUFBSTtJQUNuQjtJQUNBLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFO0lBRXZDLGlDQUFpQztJQUNqQyxNQUFNLFNBQTBCO01BQzVCLElBQUksT0FBTyxVQUFVO01BQ3JCO01BQ0EsUUFBUTtNQUNSLE1BQU07TUFDTixhQUFhO01BQ2IsY0FBYyxLQUFLLEtBQUs7TUFDeEIsYUFBYSxDQUFDLFNBQVMsRUFBRSxPQUFPLGtCQUFrQixFQUFFLFNBQVM7TUFDN0QsV0FBVyxJQUFJO0lBQ25CO0lBQ0EsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFFbkMsUUFBUSxHQUFHLENBQUMsQ0FBQyxZQUFZLEVBQUUsT0FBTyxnQkFBZ0IsRUFBRSxLQUFLLFFBQVEsQ0FBQyxTQUFTLENBQUM7SUFDNUUsT0FBTztFQUNYO0VBRUE7O0tBRUMsR0FDRCxNQUFNLG1CQUFtQixPQUFlLEVBQUUsUUFBZ0IsRUFBb0I7SUFDMUUsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUM1QixJQUFJLENBQUMsT0FBTztNQUNSLE1BQU0sSUFBSSxNQUFNO0lBQ3BCO0lBRUEsSUFBSSxDQUFDLE1BQU0sVUFBVSxFQUFFO01BQ25CLE1BQU0sSUFBSSxNQUFNO0lBQ3BCO0lBRUEsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUM1QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLGFBQWEsTUFBTSxTQUFTLEdBQUcsTUFBTSxVQUFVLEdBQUcsTUFBTSxTQUFTO0lBRTVGLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTztNQUNuQixNQUFNLElBQUksTUFBTTtJQUNwQjtJQUVBLE1BQU0sY0FBYyxNQUFNLE1BQU0sR0FBRztJQUVuQywrQkFBK0I7SUFDL0IsT0FBTyxXQUFXLElBQUksTUFBTSxNQUFNO0lBQ2xDLGtCQUFrQjtJQUNsQixPQUFPLGNBQWMsSUFBSTtJQUN6QixPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sRUFBRSxXQUFXO0lBRXpDLHVCQUF1QjtJQUN2QixNQUFNLFdBQVcsSUFBSSxNQUFNLE1BQU07SUFDakMsTUFBTSxLQUFLLElBQUksTUFBTSxNQUFNO0lBRTNCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRTtJQUN4QixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFFdkIsbUNBQW1DO0lBQ25DLE1BQU0sV0FBOEI7TUFDaEMsSUFBSSxPQUFPLFVBQVU7TUFDckI7TUFDQSxRQUFRO01BQ1IsUUFBUTtNQUNSLE1BQU07TUFDTixRQUFRO01BQ1IsV0FBVyxJQUFJO0lBQ25CO0lBQ0EsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUU7SUFFdkMsOEJBQThCO0lBQzlCLE1BQU0sU0FBMEI7TUFDNUIsSUFBSSxPQUFPLFVBQVU7TUFDckIsUUFBUTtNQUNSLFFBQVEsTUFBTSxNQUFNO01BQ3BCLE1BQU07TUFDTixhQUFhO01BQ2IsY0FBYyxPQUFPLEtBQUs7TUFDMUIsYUFBYSxDQUFDLElBQUksRUFBRSxNQUFNLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLFFBQVEsRUFBRTtNQUN4RSxXQUFXLElBQUk7SUFDbkI7SUFDQSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRTtJQUVuQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLFlBQVksRUFBRSxZQUFZLFVBQVUsRUFBRSxPQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUM7SUFDN0UsT0FBTztFQUNYO0VBRUE7O0tBRUMsR0FDRCxNQUFNLFlBQVksT0FBZSxFQUFvQjtJQUNqRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDO0lBQzVCLElBQUksQ0FBQyxPQUFPO01BQ1IsTUFBTSxJQUFJLE1BQU07SUFDcEI7SUFFQSxJQUFJLE1BQU0sVUFBVSxFQUFFO01BQ2xCLG9DQUFvQztNQUNwQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxTQUFTLEVBQUUsTUFBTSxNQUFNLEVBQUU7TUFDdEQsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sVUFBVSxFQUFFLE1BQU0sTUFBTSxFQUFFO01BQ3ZELFFBQVEsR0FBRyxDQUFDLENBQUMsbUNBQW1DLEVBQUUsU0FBUztJQUMvRCxPQUFPO01BQ0gsZ0NBQWdDO01BQ2hDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLFNBQVMsRUFBRSxNQUFNLE1BQU0sRUFBRTtNQUN0RCxRQUFRLEdBQUcsQ0FBQyxDQUFDLDhCQUE4QixFQUFFLFNBQVM7SUFDMUQ7SUFFQSxPQUFPO0VBQ1g7RUFFQTs7S0FFQyxHQUNELHNCQUFzQixNQUFjLEVBQUUsUUFBZ0IsRUFBRSxFQUFxQjtJQUN6RSxNQUFNLGVBQWUsTUFBTSxJQUFJLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLElBQ3JELE1BQU0sQ0FBQyxDQUFBLEtBQU0sR0FBRyxNQUFNLEtBQUssUUFDM0IsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU8sS0FBSyxFQUFFLFNBQVMsQ0FBQyxPQUFPLElBQzFELEtBQUssQ0FBQyxHQUFHO0lBRWQsT0FBTztFQUNYO0FBQ0oifQ==
// denoCacheMetadata=10012724063105810616,600259248023110800