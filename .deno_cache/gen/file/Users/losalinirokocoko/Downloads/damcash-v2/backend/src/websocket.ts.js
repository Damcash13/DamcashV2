import { db } from "./entities.ts";
// Connection tracking
const connections = new Map();
const games = new Map();
const tournaments = new Map();
const spectators = new Map();
const userConnections = new Map(); // userId -> connectionId
const userStatus = new Map();
export function handleWebSocket(req) {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, {
      status: 501
    });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  const connectionId = crypto.randomUUID();
  socket.addEventListener("open", ()=>{
    connections.set(connectionId, socket);
    console.log(`✅ Client connected: ${connectionId}`);
  });
  socket.addEventListener("message", (event)=>{
    try {
      const message = JSON.parse(event.data);
      handleMessage(connectionId, message, socket);
    } catch (e) {
      console.error("Invalid JSON:", event.data);
    }
  });
  socket.addEventListener("close", ()=>{
    handleDisconnect(connectionId);
    console.log(`❌ Client disconnected: ${connectionId}`);
  });
  return response;
}
function handleMessage(connectionId, message, socket) {
  const { type, payload } = message;
  switch(type){
    case 'game_join':
      joinGame(connectionId, payload.gameId);
      break;
    case 'game_move':
    case 'game_chat':
      broadcastToGame(payload.gameId, message, connectionId);
      break;
    case 'tournament_join':
      joinTournamentLobby(connectionId, payload.tournamentId, payload.userId);
      break;
    case 'tournament_leave':
      leaveTournamentLobby(connectionId, payload.tournamentId);
      break;
    case 'chat_message':
      broadcastChatMessage(payload);
      break;
    case 'spectate_join':
      joinGameAsSpectator(connectionId, payload.gameId);
      break;
    case 'spectate_leave':
      leaveGameAsSpectator(connectionId, payload.gameId);
      break;
    case 'status_update':
      updateUserStatus(connectionId, payload.userId, payload.status);
      break;
    // Invitation/Challenge handling
    case 'game_invitation':
      sendGameInvitation(payload);
      break;
    case 'wager_challenge':
      sendWagerChallenge(payload);
      break;
    case 'invitation_accept':
      handleInvitationAccept(payload);
      break;
    case 'invitation_decline':
      handleInvitationDecline(payload);
      break;
    case 'friend_request':
      sendFriendRequest(payload);
      break;
    // Waiting Games
    case 'create_waiting_game':
      createWaitingGame(connectionId, payload);
      break;
    case 'join_waiting_game':
      joinWaitingGame(connectionId, payload);
      break;
    case 'get_waiting_games':
      getWaitingGames(connectionId, payload);
      break;
    case 'ping':
      socket.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date()
      }));
      break;
    default:
      console.log(`Unknown message type: ${type}`);
  }
}
function joinGame(connectionId, gameId) {
  if (!games.has(gameId)) {
    games.set(gameId, new Set());
  }
  games.get(gameId).add(connectionId);
  console.log(`🎮 Connection ${connectionId} joined game ${gameId}`);
}
function joinTournamentLobby(connectionId, tournamentId, userId) {
  if (!tournaments.has(tournamentId)) {
    tournaments.set(tournamentId, new Set());
  }
  tournaments.get(tournamentId).add(connectionId);
  if (userId) {
    userConnections.set(userId, connectionId);
    updateUserStatus(connectionId, userId, 'online');
  }
  console.log(`🏆 Connection ${connectionId} joined tournament lobby ${tournamentId}`);
  const conn = connections.get(connectionId);
  if (conn && conn.readyState === WebSocket.OPEN) {
    conn.send(JSON.stringify({
      type: 'tournament_joined',
      tournamentId,
      timestamp: new Date()
    }));
  }
  broadcastToTournament(tournamentId, {
    type: 'tournament_participant_count',
    tournamentId,
    count: tournaments.get(tournamentId)?.size || 0
  });
}
function leaveTournamentLobby(connectionId, tournamentId) {
  const lobby = tournaments.get(tournamentId);
  if (lobby) {
    lobby.delete(connectionId);
    if (lobby.size === 0) {
      tournaments.delete(tournamentId);
    }
    broadcastToTournament(tournamentId, {
      type: 'tournament_participant_count',
      tournamentId,
      count: lobby.size
    });
  }
  console.log(`🏆 Connection ${connectionId} left tournament lobby ${tournamentId}`);
}
function broadcastChatMessage(payload) {
  const { tournamentId, userId, message, username } = payload;
  const chatMessage = {
    type: 'chat_message',
    tournamentId,
    user: username || getUserName(userId),
    message,
    timestamp: new Date()
  };
  broadcastToTournament(tournamentId, chatMessage);
  console.log(`💬 Chat message in tournament ${tournamentId}: ${message}`);
}
function joinGameAsSpectator(connectionId, gameId) {
  if (!spectators.has(gameId)) {
    spectators.set(gameId, new Set());
  }
  spectators.get(gameId).add(connectionId);
  console.log(`👁️ Connection ${connectionId} spectating game ${gameId}`);
  const conn = connections.get(connectionId);
  if (conn && conn.readyState === WebSocket.OPEN) {
    const game = db.games.get(gameId);
    if (game) {
      conn.send(JSON.stringify({
        type: 'game_state',
        gameId,
        state: game
      }));
    }
  }
  broadcastSpectatorCount(gameId);
}
function leaveGameAsSpectator(connectionId, gameId) {
  const gameSpectators = spectators.get(gameId);
  if (gameSpectators) {
    gameSpectators.delete(connectionId);
    if (gameSpectators.size === 0) {
      spectators.delete(gameId);
    }
    broadcastSpectatorCount(gameId);
  }
}
function updateUserStatus(connectionId, userId, status) {
  userStatus.set(userId, status);
  userConnections.set(userId, connectionId);
  broadcast({
    type: 'user_status',
    userId,
    status,
    timestamp: new Date()
  });
  console.log(`👤 User ${userId} status: ${status}`);
}
// NEW: Invitation & Challenge functions
function sendGameInvitation(payload) {
  const { fromUserId, toUserId, gameType, timeControl, variant } = payload;
  const invitation = {
    id: crypto.randomUUID(),
    type: 'game_invitation',
    from: getUserName(fromUserId),
    fromId: fromUserId,
    gameType,
    timeControl,
    variant,
    timestamp: new Date()
  };
  // Send to recipient
  sendToUser(toUserId, invitation);
  console.log(`🎯 Game invitation sent from ${fromUserId} to ${toUserId}`);
}
function sendWagerChallenge(payload) {
  const { fromUserId, toUserId, amount, gameType, timeControl, variant } = payload;
  const challenge = {
    id: crypto.randomUUID(),
    type: 'wager_challenge',
    from: getUserName(fromUserId),
    fromId: fromUserId,
    amount,
    gameType,
    timeControl,
    variant,
    timestamp: new Date()
  };
  sendToUser(toUserId, challenge);
  console.log(`💰 Wager challenge sent from ${fromUserId} to ${toUserId} for ${amount} coins`);
}
function handleInvitationAccept(payload) {
  const { invitationId, acceptorId, senderId } = payload;
  // Notify sender that invitation was accepted
  sendToUser(senderId, {
    type: 'invitation_accepted',
    invitationId,
    acceptor: getUserName(acceptorId),
    acceptorId,
    timestamp: new Date()
  });
  console.log(`✅ Invitation ${invitationId} accepted by ${acceptorId}`);
}
function handleInvitationDecline(payload) {
  const { invitationId, declinerId, senderId } = payload;
  // Notify sender that invitation was declined
  sendToUser(senderId, {
    type: 'invitation_declined',
    invitationId,
    decliner: getUserName(declinerId),
    timestamp: new Date()
  });
  console.log(`❌ Invitation ${invitationId} declined by ${declinerId}`);
}
function sendFriendRequest(payload) {
  const { fromUserId, toUserId } = payload;
  const request = {
    id: crypto.randomUUID(),
    type: 'friend_request',
    from: getUserName(fromUserId),
    fromId: fromUserId,
    timestamp: new Date()
  };
  sendToUser(toUserId, request);
  console.log(`👥 Friend request sent from ${fromUserId} to ${toUserId}`);
}
function sendToUser(userId, message) {
  const connectionId = userConnections.get(userId);
  if (connectionId) {
    const conn = connections.get(connectionId);
    if (conn && conn.readyState === WebSocket.OPEN) {
      conn.send(JSON.stringify(message));
    }
  }
}
function broadcastToGame(gameId, message, senderId) {
  const participants = games.get(gameId);
  if (!participants) return;
  for (const id of participants){
    if (id !== senderId) {
      const conn = connections.get(id);
      if (conn && conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify(message));
      }
    }
  }
  // Also broadcast to spectators
  const gameSpectators = spectators.get(gameId);
  if (gameSpectators) {
    for (const id of gameSpectators){
      const conn = connections.get(id);
      if (conn && conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify(message));
      }
    }
  }
}
function broadcastToTournament(tournamentId, message) {
  const participants = tournaments.get(tournamentId);
  if (!participants) return;
  for (const id of participants){
    const conn = connections.get(id);
    if (conn && conn.readyState === WebSocket.OPEN) {
      conn.send(JSON.stringify(message));
    }
  }
}
function broadcastSpectatorCount(gameId) {
  const count = spectators.get(gameId)?.size || 0;
  broadcastToGame(gameId, {
    type: 'spectator_count',
    gameId,
    count
  }, '');
  const gameSpectators = spectators.get(gameId);
  if (gameSpectators) {
    for (const id of gameSpectators){
      const conn = connections.get(id);
      if (conn && conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify({
          type: 'spectator_count',
          gameId,
          count
        }));
      }
    }
  }
}
function broadcast(message) {
  for (const conn of connections.values()){
    if (conn.readyState === WebSocket.OPEN) {
      conn.send(JSON.stringify(message));
    }
  }
}
function handleDisconnect(connectionId) {
  connections.delete(connectionId);
  // Remove from games
  for (const [gameId, participants] of games){
    participants.delete(connectionId);
    if (participants.size === 0) {
      games.delete(gameId);
    }
  }
  // Remove from tournaments
  for (const [tournamentId, participants] of tournaments){
    if (participants.delete(connectionId)) {
      broadcastToTournament(tournamentId, {
        type: 'tournament_participant_count',
        tournamentId,
        count: participants.size
      });
    }
    if (participants.size === 0) {
      tournaments.delete(tournamentId);
    }
  }
  // Remove from spectators
  for (const [gameId, specs] of spectators){
    if (specs.delete(connectionId)) {
      broadcastSpectatorCount(gameId);
    }
    if (specs.size === 0) {
      spectators.delete(gameId);
    }
  }
  // Update user status
  for (const [userId, connId] of userConnections){
    if (connId === connectionId) {
      updateUserStatus(connectionId, userId, 'offline');
      userConnections.delete(userId);
    }
  }
}
// ========== WAITING GAMES FUNCTIONS ==========
function createWaitingGame(connectionId, payload) {
  const { userId, gameType, variant, timeControl, mode, color, wagerAmount } = payload;
  // Create new game with "waiting" status
  const gameId = crypto.randomUUID();
  const now = new Date();
  // Determine creator's color (if specified)
  let whitePlayerId = userId;
  if (color === 'black') {
    whitePlayerId = ''; // Will be assigned when someone joins
  }
  const newGame = {
    id: gameId,
    gameType: gameType || 'checkers',
    whitePlayerId: color === 'black' ? '' : userId,
    blackPlayerId: null,
    boardState: JSON.stringify({}),
    currentTurn: 'white',
    status: 'waiting',
    moves: [],
    variant: variant || 'standard',
    timeControl: timeControl || '5+0',
    mode: mode || 'casual',
    color: color || 'random',
    wagerId: undefined,
    createdAt: now,
    updatedAt: now
  };
  // Save to database
  db.games.set(gameId, newGame);
  console.log(`🎮 Waiting game created: ${gameId} by user ${userId}`);
  // Send confirmation to creator
  const conn = connections.get(connectionId);
  if (conn && conn.readyState === WebSocket.OPEN) {
    conn.send(JSON.stringify({
      type: 'game_created',
      gameId,
      status: 'waiting',
      timestamp: now
    }));
  }
  // Broadcast updated waiting games list to ALL clients
  broadcastWaitingGames();
}
function joinWaitingGame(connectionId, payload) {
  const { gameId, userId } = payload;
  const game = db.games.get(gameId);
  if (!game) {
    console.error(`❌ Game ${gameId} not found`);
    return;
  }
  if (game.status !== 'waiting') {
    console.error(`❌ Game ${gameId} is not waiting (status: ${game.status})`);
    return;
  }
  // Assign player 2
  const creatorId = game.whitePlayerId || game.blackPlayerId;
  // Determine colors based on creator's preference
  if (game.color === 'random') {
    // Random assignment
    const random = Math.random() > 0.5;
    game.whitePlayerId = random ? creatorId : userId;
    game.blackPlayerId = random ? userId : creatorId;
  } else if (game.color === 'white') {
    // Creator is white
    game.whitePlayerId = creatorId;
    game.blackPlayerId = userId;
  } else if (game.color === 'black') {
    // Creator is black
    game.whitePlayerId = userId;
    game.blackPlayerId = creatorId;
  } else {
    // Default: creator is white
    game.whitePlayerId = creatorId;
    game.blackPlayerId = userId;
  }
  // Update game status
  game.status = 'active';
  game.updatedAt = new Date();
  db.games.set(gameId, game);
  console.log(`✅ User ${userId} joined game ${gameId}`);
  // Get usernames
  const player1Name = getUserName(game.whitePlayerId);
  const player2Name = getUserName(game.blackPlayerId);
  // Notify both players
  const gameStartedMessage = {
    type: 'game_started',
    gameId,
    player1: {
      id: game.whitePlayerId,
      username: player1Name,
      color: 'white'
    },
    player2: {
      id: game.blackPlayerId,
      username: player2Name,
      color: 'black'
    },
    variant: game.variant,
    timeControl: game.timeControl,
    mode: game.mode,
    timestamp: new Date()
  };
  // Send to creator
  sendToUser(creatorId, gameStartedMessage);
  // Send to joiner
  sendToUser(userId, gameStartedMessage);
  // Broadcast updated waiting games list (this game is now removed)
  broadcastWaitingGames();
}
function getWaitingGames(connectionId, payload) {
  const { gameType } = payload;
  // Filter games by status "waiting" and optionally by gameType
  const waitingGames = Array.from(db.games.values()).filter((game)=>{
    if (game.status !== 'waiting') return false;
    if (gameType && game.gameType !== gameType) return false;
    return true;
  }).map((game)=>{
    const creatorId = game.whitePlayerId || game.blackPlayerId;
    const creator = db.users.get(creatorId);
    return {
      id: game.id,
      creatorId: creatorId,
      creatorName: creator?.username || 'Unknown',
      creatorElo: game.gameType === 'checkers' ? creator?.eloCheckers : creator?.eloChess,
      creatorTier: game.gameType === 'checkers' ? creator?.tierCheckers : creator?.tierChess,
      timeControl: game.timeControl,
      variant: game.variant,
      mode: game.mode,
      wagerAmount: game.wagerId ? db.wagers.get(game.wagerId)?.amount : undefined,
      createdAt: game.createdAt,
      gameType: game.gameType
    };
  });
  // Send to requesting client
  const conn = connections.get(connectionId);
  if (conn && conn.readyState === WebSocket.OPEN) {
    conn.send(JSON.stringify({
      type: 'waiting_games_update',
      data: waitingGames,
      timestamp: new Date()
    }));
  }
  console.log(`📋 Sent ${waitingGames.length} waiting games to connection ${connectionId}`);
}
function broadcastWaitingGames() {
  // Get all waiting games
  const waitingGames = Array.from(db.games.values()).filter((game)=>game.status === 'waiting').map((game)=>{
    const creatorId = game.whitePlayerId || game.blackPlayerId;
    const creator = db.users.get(creatorId);
    return {
      id: game.id,
      creatorId: creatorId,
      creatorName: creator?.username || 'Unknown',
      creatorElo: game.gameType === 'checkers' ? creator?.eloCheckers : creator?.eloChess,
      creatorTier: game.gameType === 'checkers' ? creator?.tierCheckers : creator?.tierChess,
      timeControl: game.timeControl,
      variant: game.variant,
      mode: game.mode,
      wagerAmount: game.wagerId ? db.wagers.get(game.wagerId)?.amount : undefined,
      createdAt: game.createdAt,
      gameType: game.gameType
    };
  });
  // Broadcast to ALL connected clients
  broadcast({
    type: 'waiting_games_update',
    data: waitingGames,
    timestamp: new Date()
  });
  console.log(`📢 Broadcasted ${waitingGames.length} waiting games to all clients`);
}
function getUserName(userId) {
  const user = db.users.get(userId);
  return user?.username || 'Unknown';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy93ZWJzb2NrZXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VydmUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTc3LjAvaHR0cC9zZXJ2ZXIudHNcIjtcbmltcG9ydCB7IGRiIH0gZnJvbSBcIi4vZW50aXRpZXMudHNcIjtcblxuLy8gQ29ubmVjdGlvbiB0cmFja2luZ1xuY29uc3QgY29ubmVjdGlvbnMgPSBuZXcgTWFwPHN0cmluZywgV2ViU29ja2V0PigpO1xuY29uc3QgZ2FtZXMgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG5jb25zdCB0b3VybmFtZW50cyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4oKTtcbmNvbnN0IHNwZWN0YXRvcnMgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG5jb25zdCB1c2VyQ29ubmVjdGlvbnMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpOyAvLyB1c2VySWQgLT4gY29ubmVjdGlvbklkXG5jb25zdCB1c2VyU3RhdHVzID0gbmV3IE1hcDxzdHJpbmcsICdvbmxpbmUnIHwgJ2F3YXknIHwgJ29mZmxpbmUnPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlV2ViU29ja2V0KHJlcTogUmVxdWVzdCk6IFJlc3BvbnNlIHtcbiAgaWYgKHJlcS5oZWFkZXJzLmdldChcInVwZ3JhZGVcIikgIT0gXCJ3ZWJzb2NrZXRcIikge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDUwMSB9KTtcbiAgfVxuXG4gIGNvbnN0IHsgc29ja2V0LCByZXNwb25zZSB9ID0gRGVuby51cGdyYWRlV2ViU29ja2V0KHJlcSk7XG4gIGNvbnN0IGNvbm5lY3Rpb25JZCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG5cbiAgc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsICgpID0+IHtcbiAgICBjb25uZWN0aW9ucy5zZXQoY29ubmVjdGlvbklkLCBzb2NrZXQpO1xuICAgIGNvbnNvbGUubG9nKGDinIUgQ2xpZW50IGNvbm5lY3RlZDogJHtjb25uZWN0aW9uSWR9YCk7XG4gIH0pO1xuXG4gIHNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCAoZXZlbnQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICBoYW5kbGVNZXNzYWdlKGNvbm5lY3Rpb25JZCwgbWVzc2FnZSwgc29ja2V0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiSW52YWxpZCBKU09OOlwiLCBldmVudC5kYXRhKTtcbiAgICB9XG4gIH0pO1xuXG4gIHNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwiY2xvc2VcIiwgKCkgPT4ge1xuICAgIGhhbmRsZURpc2Nvbm5lY3QoY29ubmVjdGlvbklkKTtcbiAgICBjb25zb2xlLmxvZyhg4p2MIENsaWVudCBkaXNjb25uZWN0ZWQ6ICR7Y29ubmVjdGlvbklkfWApO1xuICB9KTtcblxuICByZXR1cm4gcmVzcG9uc2U7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoY29ubmVjdGlvbklkOiBzdHJpbmcsIG1lc3NhZ2U6IGFueSwgc29ja2V0OiBXZWJTb2NrZXQpIHtcbiAgY29uc3QgeyB0eXBlLCBwYXlsb2FkIH0gPSBtZXNzYWdlO1xuXG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2dhbWVfam9pbic6XG4gICAgICBqb2luR2FtZShjb25uZWN0aW9uSWQsIHBheWxvYWQuZ2FtZUlkKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnZ2FtZV9tb3ZlJzpcbiAgICBjYXNlICdnYW1lX2NoYXQnOlxuICAgICAgYnJvYWRjYXN0VG9HYW1lKHBheWxvYWQuZ2FtZUlkLCBtZXNzYWdlLCBjb25uZWN0aW9uSWQpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICd0b3VybmFtZW50X2pvaW4nOlxuICAgICAgam9pblRvdXJuYW1lbnRMb2JieShjb25uZWN0aW9uSWQsIHBheWxvYWQudG91cm5hbWVudElkLCBwYXlsb2FkLnVzZXJJZCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3RvdXJuYW1lbnRfbGVhdmUnOlxuICAgICAgbGVhdmVUb3VybmFtZW50TG9iYnkoY29ubmVjdGlvbklkLCBwYXlsb2FkLnRvdXJuYW1lbnRJZCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ2NoYXRfbWVzc2FnZSc6XG4gICAgICBicm9hZGNhc3RDaGF0TWVzc2FnZShwYXlsb2FkKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnc3BlY3RhdGVfam9pbic6XG4gICAgICBqb2luR2FtZUFzU3BlY3RhdG9yKGNvbm5lY3Rpb25JZCwgcGF5bG9hZC5nYW1lSWQpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdzcGVjdGF0ZV9sZWF2ZSc6XG4gICAgICBsZWF2ZUdhbWVBc1NwZWN0YXRvcihjb25uZWN0aW9uSWQsIHBheWxvYWQuZ2FtZUlkKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnc3RhdHVzX3VwZGF0ZSc6XG4gICAgICB1cGRhdGVVc2VyU3RhdHVzKGNvbm5lY3Rpb25JZCwgcGF5bG9hZC51c2VySWQsIHBheWxvYWQuc3RhdHVzKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgLy8gSW52aXRhdGlvbi9DaGFsbGVuZ2UgaGFuZGxpbmdcbiAgICBjYXNlICdnYW1lX2ludml0YXRpb24nOlxuICAgICAgc2VuZEdhbWVJbnZpdGF0aW9uKHBheWxvYWQpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICd3YWdlcl9jaGFsbGVuZ2UnOlxuICAgICAgc2VuZFdhZ2VyQ2hhbGxlbmdlKHBheWxvYWQpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdpbnZpdGF0aW9uX2FjY2VwdCc6XG4gICAgICBoYW5kbGVJbnZpdGF0aW9uQWNjZXB0KHBheWxvYWQpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdpbnZpdGF0aW9uX2RlY2xpbmUnOlxuICAgICAgaGFuZGxlSW52aXRhdGlvbkRlY2xpbmUocGF5bG9hZCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ2ZyaWVuZF9yZXF1ZXN0JzpcbiAgICAgIHNlbmRGcmllbmRSZXF1ZXN0KHBheWxvYWQpO1xuICAgICAgYnJlYWs7XG5cbiAgICAvLyBXYWl0aW5nIEdhbWVzXG4gICAgY2FzZSAnY3JlYXRlX3dhaXRpbmdfZ2FtZSc6XG4gICAgICBjcmVhdGVXYWl0aW5nR2FtZShjb25uZWN0aW9uSWQsIHBheWxvYWQpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdqb2luX3dhaXRpbmdfZ2FtZSc6XG4gICAgICBqb2luV2FpdGluZ0dhbWUoY29ubmVjdGlvbklkLCBwYXlsb2FkKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnZ2V0X3dhaXRpbmdfZ2FtZXMnOlxuICAgICAgZ2V0V2FpdGluZ0dhbWVzKGNvbm5lY3Rpb25JZCwgcGF5bG9hZCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3BpbmcnOlxuICAgICAgc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAncG9uZycsIHRpbWVzdGFtcDogbmV3IERhdGUoKSB9KSk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zb2xlLmxvZyhgVW5rbm93biBtZXNzYWdlIHR5cGU6ICR7dHlwZX1gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBqb2luR2FtZShjb25uZWN0aW9uSWQ6IHN0cmluZywgZ2FtZUlkOiBzdHJpbmcpIHtcbiAgaWYgKCFnYW1lcy5oYXMoZ2FtZUlkKSkge1xuICAgIGdhbWVzLnNldChnYW1lSWQsIG5ldyBTZXQoKSk7XG4gIH1cbiAgZ2FtZXMuZ2V0KGdhbWVJZCkhLmFkZChjb25uZWN0aW9uSWQpO1xuICBjb25zb2xlLmxvZyhg8J+OriBDb25uZWN0aW9uICR7Y29ubmVjdGlvbklkfSBqb2luZWQgZ2FtZSAke2dhbWVJZH1gKTtcbn1cblxuZnVuY3Rpb24gam9pblRvdXJuYW1lbnRMb2JieShjb25uZWN0aW9uSWQ6IHN0cmluZywgdG91cm5hbWVudElkOiBzdHJpbmcsIHVzZXJJZD86IHN0cmluZykge1xuICBpZiAoIXRvdXJuYW1lbnRzLmhhcyh0b3VybmFtZW50SWQpKSB7XG4gICAgdG91cm5hbWVudHMuc2V0KHRvdXJuYW1lbnRJZCwgbmV3IFNldCgpKTtcbiAgfVxuICB0b3VybmFtZW50cy5nZXQodG91cm5hbWVudElkKSEuYWRkKGNvbm5lY3Rpb25JZCk7XG5cbiAgaWYgKHVzZXJJZCkge1xuICAgIHVzZXJDb25uZWN0aW9ucy5zZXQodXNlcklkLCBjb25uZWN0aW9uSWQpO1xuICAgIHVwZGF0ZVVzZXJTdGF0dXMoY29ubmVjdGlvbklkLCB1c2VySWQsICdvbmxpbmUnKTtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGDwn4+GIENvbm5lY3Rpb24gJHtjb25uZWN0aW9uSWR9IGpvaW5lZCB0b3VybmFtZW50IGxvYmJ5ICR7dG91cm5hbWVudElkfWApO1xuXG4gIGNvbnN0IGNvbm4gPSBjb25uZWN0aW9ucy5nZXQoY29ubmVjdGlvbklkKTtcbiAgaWYgKGNvbm4gJiYgY29ubi5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xuICAgIGNvbm4uc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICB0eXBlOiAndG91cm5hbWVudF9qb2luZWQnLFxuICAgICAgdG91cm5hbWVudElkLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgfSkpO1xuICB9XG5cbiAgYnJvYWRjYXN0VG9Ub3VybmFtZW50KHRvdXJuYW1lbnRJZCwge1xuICAgIHR5cGU6ICd0b3VybmFtZW50X3BhcnRpY2lwYW50X2NvdW50JyxcbiAgICB0b3VybmFtZW50SWQsXG4gICAgY291bnQ6IHRvdXJuYW1lbnRzLmdldCh0b3VybmFtZW50SWQpPy5zaXplIHx8IDBcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxlYXZlVG91cm5hbWVudExvYmJ5KGNvbm5lY3Rpb25JZDogc3RyaW5nLCB0b3VybmFtZW50SWQ6IHN0cmluZykge1xuICBjb25zdCBsb2JieSA9IHRvdXJuYW1lbnRzLmdldCh0b3VybmFtZW50SWQpO1xuICBpZiAobG9iYnkpIHtcbiAgICBsb2JieS5kZWxldGUoY29ubmVjdGlvbklkKTtcbiAgICBpZiAobG9iYnkuc2l6ZSA9PT0gMCkge1xuICAgICAgdG91cm5hbWVudHMuZGVsZXRlKHRvdXJuYW1lbnRJZCk7XG4gICAgfVxuXG4gICAgYnJvYWRjYXN0VG9Ub3VybmFtZW50KHRvdXJuYW1lbnRJZCwge1xuICAgICAgdHlwZTogJ3RvdXJuYW1lbnRfcGFydGljaXBhbnRfY291bnQnLFxuICAgICAgdG91cm5hbWVudElkLFxuICAgICAgY291bnQ6IGxvYmJ5LnNpemVcbiAgICB9KTtcbiAgfVxuICBjb25zb2xlLmxvZyhg8J+PhiBDb25uZWN0aW9uICR7Y29ubmVjdGlvbklkfSBsZWZ0IHRvdXJuYW1lbnQgbG9iYnkgJHt0b3VybmFtZW50SWR9YCk7XG59XG5cbmZ1bmN0aW9uIGJyb2FkY2FzdENoYXRNZXNzYWdlKHBheWxvYWQ6IGFueSkge1xuICBjb25zdCB7IHRvdXJuYW1lbnRJZCwgdXNlcklkLCBtZXNzYWdlLCB1c2VybmFtZSB9ID0gcGF5bG9hZDtcblxuICBjb25zdCBjaGF0TWVzc2FnZSA9IHtcbiAgICB0eXBlOiAnY2hhdF9tZXNzYWdlJyxcbiAgICB0b3VybmFtZW50SWQsXG4gICAgdXNlcjogdXNlcm5hbWUgfHwgZ2V0VXNlck5hbWUodXNlcklkKSxcbiAgICBtZXNzYWdlLFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICB9O1xuXG4gIGJyb2FkY2FzdFRvVG91cm5hbWVudCh0b3VybmFtZW50SWQsIGNoYXRNZXNzYWdlKTtcbiAgY29uc29sZS5sb2coYPCfkqwgQ2hhdCBtZXNzYWdlIGluIHRvdXJuYW1lbnQgJHt0b3VybmFtZW50SWR9OiAke21lc3NhZ2V9YCk7XG59XG5cbmZ1bmN0aW9uIGpvaW5HYW1lQXNTcGVjdGF0b3IoY29ubmVjdGlvbklkOiBzdHJpbmcsIGdhbWVJZDogc3RyaW5nKSB7XG4gIGlmICghc3BlY3RhdG9ycy5oYXMoZ2FtZUlkKSkge1xuICAgIHNwZWN0YXRvcnMuc2V0KGdhbWVJZCwgbmV3IFNldCgpKTtcbiAgfVxuICBzcGVjdGF0b3JzLmdldChnYW1lSWQpIS5hZGQoY29ubmVjdGlvbklkKTtcblxuICBjb25zb2xlLmxvZyhg8J+Rge+4jyBDb25uZWN0aW9uICR7Y29ubmVjdGlvbklkfSBzcGVjdGF0aW5nIGdhbWUgJHtnYW1lSWR9YCk7XG5cbiAgY29uc3QgY29ubiA9IGNvbm5lY3Rpb25zLmdldChjb25uZWN0aW9uSWQpO1xuICBpZiAoY29ubiAmJiBjb25uLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgY29uc3QgZ2FtZSA9IGRiLmdhbWVzLmdldChnYW1lSWQpO1xuICAgIGlmIChnYW1lKSB7XG4gICAgICBjb25uLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICB0eXBlOiAnZ2FtZV9zdGF0ZScsXG4gICAgICAgIGdhbWVJZCxcbiAgICAgICAgc3RhdGU6IGdhbWVcbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBicm9hZGNhc3RTcGVjdGF0b3JDb3VudChnYW1lSWQpO1xufVxuXG5mdW5jdGlvbiBsZWF2ZUdhbWVBc1NwZWN0YXRvcihjb25uZWN0aW9uSWQ6IHN0cmluZywgZ2FtZUlkOiBzdHJpbmcpIHtcbiAgY29uc3QgZ2FtZVNwZWN0YXRvcnMgPSBzcGVjdGF0b3JzLmdldChnYW1lSWQpO1xuICBpZiAoZ2FtZVNwZWN0YXRvcnMpIHtcbiAgICBnYW1lU3BlY3RhdG9ycy5kZWxldGUoY29ubmVjdGlvbklkKTtcbiAgICBpZiAoZ2FtZVNwZWN0YXRvcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgc3BlY3RhdG9ycy5kZWxldGUoZ2FtZUlkKTtcbiAgICB9XG4gICAgYnJvYWRjYXN0U3BlY3RhdG9yQ291bnQoZ2FtZUlkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVVc2VyU3RhdHVzKGNvbm5lY3Rpb25JZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZywgc3RhdHVzOiAnb25saW5lJyB8ICdhd2F5JyB8ICdvZmZsaW5lJykge1xuICB1c2VyU3RhdHVzLnNldCh1c2VySWQsIHN0YXR1cyk7XG4gIHVzZXJDb25uZWN0aW9ucy5zZXQodXNlcklkLCBjb25uZWN0aW9uSWQpO1xuXG4gIGJyb2FkY2FzdCh7XG4gICAgdHlwZTogJ3VzZXJfc3RhdHVzJyxcbiAgICB1c2VySWQsXG4gICAgc3RhdHVzLFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICB9KTtcblxuICBjb25zb2xlLmxvZyhg8J+RpCBVc2VyICR7dXNlcklkfSBzdGF0dXM6ICR7c3RhdHVzfWApO1xufVxuXG4vLyBORVc6IEludml0YXRpb24gJiBDaGFsbGVuZ2UgZnVuY3Rpb25zXG5mdW5jdGlvbiBzZW5kR2FtZUludml0YXRpb24ocGF5bG9hZDogYW55KSB7XG4gIGNvbnN0IHsgZnJvbVVzZXJJZCwgdG9Vc2VySWQsIGdhbWVUeXBlLCB0aW1lQ29udHJvbCwgdmFyaWFudCB9ID0gcGF5bG9hZDtcblxuICBjb25zdCBpbnZpdGF0aW9uID0ge1xuICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgIHR5cGU6ICdnYW1lX2ludml0YXRpb24nLFxuICAgIGZyb206IGdldFVzZXJOYW1lKGZyb21Vc2VySWQpLFxuICAgIGZyb21JZDogZnJvbVVzZXJJZCxcbiAgICBnYW1lVHlwZSxcbiAgICB0aW1lQ29udHJvbCxcbiAgICB2YXJpYW50LFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICB9O1xuXG4gIC8vIFNlbmQgdG8gcmVjaXBpZW50XG4gIHNlbmRUb1VzZXIodG9Vc2VySWQsIGludml0YXRpb24pO1xuICBjb25zb2xlLmxvZyhg8J+OryBHYW1lIGludml0YXRpb24gc2VudCBmcm9tICR7ZnJvbVVzZXJJZH0gdG8gJHt0b1VzZXJJZH1gKTtcbn1cblxuZnVuY3Rpb24gc2VuZFdhZ2VyQ2hhbGxlbmdlKHBheWxvYWQ6IGFueSkge1xuICBjb25zdCB7IGZyb21Vc2VySWQsIHRvVXNlcklkLCBhbW91bnQsIGdhbWVUeXBlLCB0aW1lQ29udHJvbCwgdmFyaWFudCB9ID0gcGF5bG9hZDtcblxuICBjb25zdCBjaGFsbGVuZ2UgPSB7XG4gICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgdHlwZTogJ3dhZ2VyX2NoYWxsZW5nZScsXG4gICAgZnJvbTogZ2V0VXNlck5hbWUoZnJvbVVzZXJJZCksXG4gICAgZnJvbUlkOiBmcm9tVXNlcklkLFxuICAgIGFtb3VudCxcbiAgICBnYW1lVHlwZSxcbiAgICB0aW1lQ29udHJvbCxcbiAgICB2YXJpYW50LFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICB9O1xuXG4gIHNlbmRUb1VzZXIodG9Vc2VySWQsIGNoYWxsZW5nZSk7XG4gIGNvbnNvbGUubG9nKGDwn5KwIFdhZ2VyIGNoYWxsZW5nZSBzZW50IGZyb20gJHtmcm9tVXNlcklkfSB0byAke3RvVXNlcklkfSBmb3IgJHthbW91bnR9IGNvaW5zYCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUludml0YXRpb25BY2NlcHQocGF5bG9hZDogYW55KSB7XG4gIGNvbnN0IHsgaW52aXRhdGlvbklkLCBhY2NlcHRvcklkLCBzZW5kZXJJZCB9ID0gcGF5bG9hZDtcblxuICAvLyBOb3RpZnkgc2VuZGVyIHRoYXQgaW52aXRhdGlvbiB3YXMgYWNjZXB0ZWRcbiAgc2VuZFRvVXNlcihzZW5kZXJJZCwge1xuICAgIHR5cGU6ICdpbnZpdGF0aW9uX2FjY2VwdGVkJyxcbiAgICBpbnZpdGF0aW9uSWQsXG4gICAgYWNjZXB0b3I6IGdldFVzZXJOYW1lKGFjY2VwdG9ySWQpLFxuICAgIGFjY2VwdG9ySWQsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gIH0pO1xuXG4gIGNvbnNvbGUubG9nKGDinIUgSW52aXRhdGlvbiAke2ludml0YXRpb25JZH0gYWNjZXB0ZWQgYnkgJHthY2NlcHRvcklkfWApO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVJbnZpdGF0aW9uRGVjbGluZShwYXlsb2FkOiBhbnkpIHtcbiAgY29uc3QgeyBpbnZpdGF0aW9uSWQsIGRlY2xpbmVySWQsIHNlbmRlcklkIH0gPSBwYXlsb2FkO1xuXG4gIC8vIE5vdGlmeSBzZW5kZXIgdGhhdCBpbnZpdGF0aW9uIHdhcyBkZWNsaW5lZFxuICBzZW5kVG9Vc2VyKHNlbmRlcklkLCB7XG4gICAgdHlwZTogJ2ludml0YXRpb25fZGVjbGluZWQnLFxuICAgIGludml0YXRpb25JZCxcbiAgICBkZWNsaW5lcjogZ2V0VXNlck5hbWUoZGVjbGluZXJJZCksXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gIH0pO1xuXG4gIGNvbnNvbGUubG9nKGDinYwgSW52aXRhdGlvbiAke2ludml0YXRpb25JZH0gZGVjbGluZWQgYnkgJHtkZWNsaW5lcklkfWApO1xufVxuXG5mdW5jdGlvbiBzZW5kRnJpZW5kUmVxdWVzdChwYXlsb2FkOiBhbnkpIHtcbiAgY29uc3QgeyBmcm9tVXNlcklkLCB0b1VzZXJJZCB9ID0gcGF5bG9hZDtcblxuICBjb25zdCByZXF1ZXN0ID0ge1xuICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgIHR5cGU6ICdmcmllbmRfcmVxdWVzdCcsXG4gICAgZnJvbTogZ2V0VXNlck5hbWUoZnJvbVVzZXJJZCksXG4gICAgZnJvbUlkOiBmcm9tVXNlcklkLFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICB9O1xuXG4gIHNlbmRUb1VzZXIodG9Vc2VySWQsIHJlcXVlc3QpO1xuICBjb25zb2xlLmxvZyhg8J+RpSBGcmllbmQgcmVxdWVzdCBzZW50IGZyb20gJHtmcm9tVXNlcklkfSB0byAke3RvVXNlcklkfWApO1xufVxuXG5mdW5jdGlvbiBzZW5kVG9Vc2VyKHVzZXJJZDogc3RyaW5nLCBtZXNzYWdlOiBhbnkpIHtcbiAgY29uc3QgY29ubmVjdGlvbklkID0gdXNlckNvbm5lY3Rpb25zLmdldCh1c2VySWQpO1xuICBpZiAoY29ubmVjdGlvbklkKSB7XG4gICAgY29uc3QgY29ubiA9IGNvbm5lY3Rpb25zLmdldChjb25uZWN0aW9uSWQpO1xuICAgIGlmIChjb25uICYmIGNvbm4ucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgIGNvbm4uc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGJyb2FkY2FzdFRvR2FtZShnYW1lSWQ6IHN0cmluZywgbWVzc2FnZTogYW55LCBzZW5kZXJJZDogc3RyaW5nKSB7XG4gIGNvbnN0IHBhcnRpY2lwYW50cyA9IGdhbWVzLmdldChnYW1lSWQpO1xuICBpZiAoIXBhcnRpY2lwYW50cykgcmV0dXJuO1xuXG4gIGZvciAoY29uc3QgaWQgb2YgcGFydGljaXBhbnRzKSB7XG4gICAgaWYgKGlkICE9PSBzZW5kZXJJZCkge1xuICAgICAgY29uc3QgY29ubiA9IGNvbm5lY3Rpb25zLmdldChpZCk7XG4gICAgICBpZiAoY29ubiAmJiBjb25uLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgICAgIGNvbm4uc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQWxzbyBicm9hZGNhc3QgdG8gc3BlY3RhdG9yc1xuICBjb25zdCBnYW1lU3BlY3RhdG9ycyA9IHNwZWN0YXRvcnMuZ2V0KGdhbWVJZCk7XG4gIGlmIChnYW1lU3BlY3RhdG9ycykge1xuICAgIGZvciAoY29uc3QgaWQgb2YgZ2FtZVNwZWN0YXRvcnMpIHtcbiAgICAgIGNvbnN0IGNvbm4gPSBjb25uZWN0aW9ucy5nZXQoaWQpO1xuICAgICAgaWYgKGNvbm4gJiYgY29ubi5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xuICAgICAgICBjb25uLnNlbmQoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBicm9hZGNhc3RUb1RvdXJuYW1lbnQodG91cm5hbWVudElkOiBzdHJpbmcsIG1lc3NhZ2U6IGFueSkge1xuICBjb25zdCBwYXJ0aWNpcGFudHMgPSB0b3VybmFtZW50cy5nZXQodG91cm5hbWVudElkKTtcbiAgaWYgKCFwYXJ0aWNpcGFudHMpIHJldHVybjtcblxuICBmb3IgKGNvbnN0IGlkIG9mIHBhcnRpY2lwYW50cykge1xuICAgIGNvbnN0IGNvbm4gPSBjb25uZWN0aW9ucy5nZXQoaWQpO1xuICAgIGlmIChjb25uICYmIGNvbm4ucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgIGNvbm4uc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGJyb2FkY2FzdFNwZWN0YXRvckNvdW50KGdhbWVJZDogc3RyaW5nKSB7XG4gIGNvbnN0IGNvdW50ID0gc3BlY3RhdG9ycy5nZXQoZ2FtZUlkKT8uc2l6ZSB8fCAwO1xuXG4gIGJyb2FkY2FzdFRvR2FtZShnYW1lSWQsIHtcbiAgICB0eXBlOiAnc3BlY3RhdG9yX2NvdW50JyxcbiAgICBnYW1lSWQsXG4gICAgY291bnRcbiAgfSwgJycpO1xuXG4gIGNvbnN0IGdhbWVTcGVjdGF0b3JzID0gc3BlY3RhdG9ycy5nZXQoZ2FtZUlkKTtcbiAgaWYgKGdhbWVTcGVjdGF0b3JzKSB7XG4gICAgZm9yIChjb25zdCBpZCBvZiBnYW1lU3BlY3RhdG9ycykge1xuICAgICAgY29uc3QgY29ubiA9IGNvbm5lY3Rpb25zLmdldChpZCk7XG4gICAgICBpZiAoY29ubiAmJiBjb25uLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgICAgIGNvbm4uc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgdHlwZTogJ3NwZWN0YXRvcl9jb3VudCcsXG4gICAgICAgICAgZ2FtZUlkLFxuICAgICAgICAgIGNvdW50XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYnJvYWRjYXN0KG1lc3NhZ2U6IGFueSkge1xuICBmb3IgKGNvbnN0IGNvbm4gb2YgY29ubmVjdGlvbnMudmFsdWVzKCkpIHtcbiAgICBpZiAoY29ubi5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xuICAgICAgY29ubi5zZW5kKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlRGlzY29ubmVjdChjb25uZWN0aW9uSWQ6IHN0cmluZykge1xuICBjb25uZWN0aW9ucy5kZWxldGUoY29ubmVjdGlvbklkKTtcblxuICAvLyBSZW1vdmUgZnJvbSBnYW1lc1xuICBmb3IgKGNvbnN0IFtnYW1lSWQsIHBhcnRpY2lwYW50c10gb2YgZ2FtZXMpIHtcbiAgICBwYXJ0aWNpcGFudHMuZGVsZXRlKGNvbm5lY3Rpb25JZCk7XG4gICAgaWYgKHBhcnRpY2lwYW50cy5zaXplID09PSAwKSB7XG4gICAgICBnYW1lcy5kZWxldGUoZ2FtZUlkKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZW1vdmUgZnJvbSB0b3VybmFtZW50c1xuICBmb3IgKGNvbnN0IFt0b3VybmFtZW50SWQsIHBhcnRpY2lwYW50c10gb2YgdG91cm5hbWVudHMpIHtcbiAgICBpZiAocGFydGljaXBhbnRzLmRlbGV0ZShjb25uZWN0aW9uSWQpKSB7XG4gICAgICBicm9hZGNhc3RUb1RvdXJuYW1lbnQodG91cm5hbWVudElkLCB7XG4gICAgICAgIHR5cGU6ICd0b3VybmFtZW50X3BhcnRpY2lwYW50X2NvdW50JyxcbiAgICAgICAgdG91cm5hbWVudElkLFxuICAgICAgICBjb3VudDogcGFydGljaXBhbnRzLnNpemVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAocGFydGljaXBhbnRzLnNpemUgPT09IDApIHtcbiAgICAgIHRvdXJuYW1lbnRzLmRlbGV0ZSh0b3VybmFtZW50SWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlbW92ZSBmcm9tIHNwZWN0YXRvcnNcbiAgZm9yIChjb25zdCBbZ2FtZUlkLCBzcGVjc10gb2Ygc3BlY3RhdG9ycykge1xuICAgIGlmIChzcGVjcy5kZWxldGUoY29ubmVjdGlvbklkKSkge1xuICAgICAgYnJvYWRjYXN0U3BlY3RhdG9yQ291bnQoZ2FtZUlkKTtcbiAgICB9XG4gICAgaWYgKHNwZWNzLnNpemUgPT09IDApIHtcbiAgICAgIHNwZWN0YXRvcnMuZGVsZXRlKGdhbWVJZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gVXBkYXRlIHVzZXIgc3RhdHVzXG4gIGZvciAoY29uc3QgW3VzZXJJZCwgY29ubklkXSBvZiB1c2VyQ29ubmVjdGlvbnMpIHtcbiAgICBpZiAoY29ubklkID09PSBjb25uZWN0aW9uSWQpIHtcbiAgICAgIHVwZGF0ZVVzZXJTdGF0dXMoY29ubmVjdGlvbklkLCB1c2VySWQsICdvZmZsaW5lJyk7XG4gICAgICB1c2VyQ29ubmVjdGlvbnMuZGVsZXRlKHVzZXJJZCk7XG4gICAgfVxuICB9XG59XG5cbi8vID09PT09PT09PT0gV0FJVElORyBHQU1FUyBGVU5DVElPTlMgPT09PT09PT09PVxuXG5mdW5jdGlvbiBjcmVhdGVXYWl0aW5nR2FtZShjb25uZWN0aW9uSWQ6IHN0cmluZywgcGF5bG9hZDogYW55KSB7XG4gIGNvbnN0IHsgdXNlcklkLCBnYW1lVHlwZSwgdmFyaWFudCwgdGltZUNvbnRyb2wsIG1vZGUsIGNvbG9yLCB3YWdlckFtb3VudCB9ID0gcGF5bG9hZDtcblxuICAvLyBDcmVhdGUgbmV3IGdhbWUgd2l0aCBcIndhaXRpbmdcIiBzdGF0dXNcbiAgY29uc3QgZ2FtZUlkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcblxuICAvLyBEZXRlcm1pbmUgY3JlYXRvcidzIGNvbG9yIChpZiBzcGVjaWZpZWQpXG4gIGxldCB3aGl0ZVBsYXllcklkID0gdXNlcklkO1xuICBpZiAoY29sb3IgPT09ICdibGFjaycpIHtcbiAgICB3aGl0ZVBsYXllcklkID0gJyc7ICAvLyBXaWxsIGJlIGFzc2lnbmVkIHdoZW4gc29tZW9uZSBqb2luc1xuICB9XG5cbiAgY29uc3QgbmV3R2FtZSA9IHtcbiAgICBpZDogZ2FtZUlkLFxuICAgIGdhbWVUeXBlOiBnYW1lVHlwZSB8fCAnY2hlY2tlcnMnLFxuICAgIHdoaXRlUGxheWVySWQ6IGNvbG9yID09PSAnYmxhY2snID8gJycgOiB1c2VySWQsXG4gICAgYmxhY2tQbGF5ZXJJZDogbnVsbCwgIC8vIFdhaXRpbmcgZm9yIG9wcG9uZW50XG4gICAgYm9hcmRTdGF0ZTogSlNPTi5zdHJpbmdpZnkoe30pLCAgLy8gRW1wdHkgaW5pdGlhbCBzdGF0ZVxuICAgIGN1cnJlbnRUdXJuOiAnd2hpdGUnIGFzIGNvbnN0LFxuICAgIHN0YXR1czogJ3dhaXRpbmcnIGFzIGNvbnN0LFxuICAgIG1vdmVzOiBbXSxcbiAgICB2YXJpYW50OiB2YXJpYW50IHx8ICdzdGFuZGFyZCcsXG4gICAgdGltZUNvbnRyb2w6IHRpbWVDb250cm9sIHx8ICc1KzAnLFxuICAgIG1vZGU6IG1vZGUgfHwgJ2Nhc3VhbCcsXG4gICAgY29sb3I6IGNvbG9yIHx8ICdyYW5kb20nLFxuICAgIHdhZ2VySWQ6IHVuZGVmaW5lZCwgIC8vIFdpbGwgYmUgc2V0IGlmIHdhZ2VyIGdhbWVcbiAgICBjcmVhdGVkQXQ6IG5vdyxcbiAgICB1cGRhdGVkQXQ6IG5vd1xuICB9O1xuXG4gIC8vIFNhdmUgdG8gZGF0YWJhc2VcbiAgZGIuZ2FtZXMuc2V0KGdhbWVJZCwgbmV3R2FtZSk7XG5cbiAgY29uc29sZS5sb2coYPCfjq4gV2FpdGluZyBnYW1lIGNyZWF0ZWQ6ICR7Z2FtZUlkfSBieSB1c2VyICR7dXNlcklkfWApO1xuXG4gIC8vIFNlbmQgY29uZmlybWF0aW9uIHRvIGNyZWF0b3JcbiAgY29uc3QgY29ubiA9IGNvbm5lY3Rpb25zLmdldChjb25uZWN0aW9uSWQpO1xuICBpZiAoY29ubiAmJiBjb25uLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgY29ubi5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHR5cGU6ICdnYW1lX2NyZWF0ZWQnLFxuICAgICAgZ2FtZUlkLFxuICAgICAgc3RhdHVzOiAnd2FpdGluZycsXG4gICAgICB0aW1lc3RhbXA6IG5vd1xuICAgIH0pKTtcbiAgfVxuXG4gIC8vIEJyb2FkY2FzdCB1cGRhdGVkIHdhaXRpbmcgZ2FtZXMgbGlzdCB0byBBTEwgY2xpZW50c1xuICBicm9hZGNhc3RXYWl0aW5nR2FtZXMoKTtcbn1cblxuZnVuY3Rpb24gam9pbldhaXRpbmdHYW1lKGNvbm5lY3Rpb25JZDogc3RyaW5nLCBwYXlsb2FkOiBhbnkpIHtcbiAgY29uc3QgeyBnYW1lSWQsIHVzZXJJZCB9ID0gcGF5bG9hZDtcblxuICBjb25zdCBnYW1lID0gZGIuZ2FtZXMuZ2V0KGdhbWVJZCk7XG5cbiAgaWYgKCFnYW1lKSB7XG4gICAgY29uc29sZS5lcnJvcihg4p2MIEdhbWUgJHtnYW1lSWR9IG5vdCBmb3VuZGApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChnYW1lLnN0YXR1cyAhPT0gJ3dhaXRpbmcnKSB7XG4gICAgY29uc29sZS5lcnJvcihg4p2MIEdhbWUgJHtnYW1lSWR9IGlzIG5vdCB3YWl0aW5nIChzdGF0dXM6ICR7Z2FtZS5zdGF0dXN9KWApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEFzc2lnbiBwbGF5ZXIgMlxuICBjb25zdCBjcmVhdG9ySWQgPSBnYW1lLndoaXRlUGxheWVySWQgfHwgZ2FtZS5ibGFja1BsYXllcklkO1xuXG4gIC8vIERldGVybWluZSBjb2xvcnMgYmFzZWQgb24gY3JlYXRvcidzIHByZWZlcmVuY2VcbiAgaWYgKGdhbWUuY29sb3IgPT09ICdyYW5kb20nKSB7XG4gICAgLy8gUmFuZG9tIGFzc2lnbm1lbnRcbiAgICBjb25zdCByYW5kb20gPSBNYXRoLnJhbmRvbSgpID4gMC41O1xuICAgIGdhbWUud2hpdGVQbGF5ZXJJZCA9IHJhbmRvbSA/IGNyZWF0b3JJZCEgOiB1c2VySWQ7XG4gICAgZ2FtZS5ibGFja1BsYXllcklkID0gcmFuZG9tID8gdXNlcklkIDogY3JlYXRvcklkITtcbiAgfSBlbHNlIGlmIChnYW1lLmNvbG9yID09PSAnd2hpdGUnKSB7XG4gICAgLy8gQ3JlYXRvciBpcyB3aGl0ZVxuICAgIGdhbWUud2hpdGVQbGF5ZXJJZCA9IGNyZWF0b3JJZCE7XG4gICAgZ2FtZS5ibGFja1BsYXllcklkID0gdXNlcklkO1xuICB9IGVsc2UgaWYgKGdhbWUuY29sb3IgPT09ICdibGFjaycpIHtcbiAgICAvLyBDcmVhdG9yIGlzIGJsYWNrXG4gICAgZ2FtZS53aGl0ZVBsYXllcklkID0gdXNlcklkO1xuICAgIGdhbWUuYmxhY2tQbGF5ZXJJZCA9IGNyZWF0b3JJZCE7XG4gIH0gZWxzZSB7XG4gICAgLy8gRGVmYXVsdDogY3JlYXRvciBpcyB3aGl0ZVxuICAgIGdhbWUud2hpdGVQbGF5ZXJJZCA9IGNyZWF0b3JJZCE7XG4gICAgZ2FtZS5ibGFja1BsYXllcklkID0gdXNlcklkO1xuICB9XG5cbiAgLy8gVXBkYXRlIGdhbWUgc3RhdHVzXG4gIGdhbWUuc3RhdHVzID0gJ2FjdGl2ZSc7XG4gIGdhbWUudXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcblxuICBkYi5nYW1lcy5zZXQoZ2FtZUlkLCBnYW1lKTtcblxuICBjb25zb2xlLmxvZyhg4pyFIFVzZXIgJHt1c2VySWR9IGpvaW5lZCBnYW1lICR7Z2FtZUlkfWApO1xuXG4gIC8vIEdldCB1c2VybmFtZXNcbiAgY29uc3QgcGxheWVyMU5hbWUgPSBnZXRVc2VyTmFtZShnYW1lLndoaXRlUGxheWVySWQpO1xuICBjb25zdCBwbGF5ZXIyTmFtZSA9IGdldFVzZXJOYW1lKGdhbWUuYmxhY2tQbGF5ZXJJZCEpO1xuXG4gIC8vIE5vdGlmeSBib3RoIHBsYXllcnNcbiAgY29uc3QgZ2FtZVN0YXJ0ZWRNZXNzYWdlID0ge1xuICAgIHR5cGU6ICdnYW1lX3N0YXJ0ZWQnLFxuICAgIGdhbWVJZCxcbiAgICBwbGF5ZXIxOiB7IGlkOiBnYW1lLndoaXRlUGxheWVySWQsIHVzZXJuYW1lOiBwbGF5ZXIxTmFtZSwgY29sb3I6ICd3aGl0ZScgfSxcbiAgICBwbGF5ZXIyOiB7IGlkOiBnYW1lLmJsYWNrUGxheWVySWQsIHVzZXJuYW1lOiBwbGF5ZXIyTmFtZSwgY29sb3I6ICdibGFjaycgfSxcbiAgICB2YXJpYW50OiBnYW1lLnZhcmlhbnQsXG4gICAgdGltZUNvbnRyb2w6IGdhbWUudGltZUNvbnRyb2wsXG4gICAgbW9kZTogZ2FtZS5tb2RlLFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICB9O1xuXG4gIC8vIFNlbmQgdG8gY3JlYXRvclxuICBzZW5kVG9Vc2VyKGNyZWF0b3JJZCEsIGdhbWVTdGFydGVkTWVzc2FnZSk7XG5cbiAgLy8gU2VuZCB0byBqb2luZXJcbiAgc2VuZFRvVXNlcih1c2VySWQsIGdhbWVTdGFydGVkTWVzc2FnZSk7XG5cbiAgLy8gQnJvYWRjYXN0IHVwZGF0ZWQgd2FpdGluZyBnYW1lcyBsaXN0ICh0aGlzIGdhbWUgaXMgbm93IHJlbW92ZWQpXG4gIGJyb2FkY2FzdFdhaXRpbmdHYW1lcygpO1xufVxuXG5mdW5jdGlvbiBnZXRXYWl0aW5nR2FtZXMoY29ubmVjdGlvbklkOiBzdHJpbmcsIHBheWxvYWQ6IGFueSkge1xuICBjb25zdCB7IGdhbWVUeXBlIH0gPSBwYXlsb2FkO1xuXG4gIC8vIEZpbHRlciBnYW1lcyBieSBzdGF0dXMgXCJ3YWl0aW5nXCIgYW5kIG9wdGlvbmFsbHkgYnkgZ2FtZVR5cGVcbiAgY29uc3Qgd2FpdGluZ0dhbWVzID0gQXJyYXkuZnJvbShkYi5nYW1lcy52YWx1ZXMoKSlcbiAgICAuZmlsdGVyKGdhbWUgPT4ge1xuICAgICAgaWYgKGdhbWUuc3RhdHVzICE9PSAnd2FpdGluZycpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChnYW1lVHlwZSAmJiBnYW1lLmdhbWVUeXBlICE9PSBnYW1lVHlwZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSlcbiAgICAubWFwKGdhbWUgPT4ge1xuICAgICAgY29uc3QgY3JlYXRvcklkID0gZ2FtZS53aGl0ZVBsYXllcklkIHx8IGdhbWUuYmxhY2tQbGF5ZXJJZDtcbiAgICAgIGNvbnN0IGNyZWF0b3IgPSBkYi51c2Vycy5nZXQoY3JlYXRvcklkISk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBnYW1lLmlkLFxuICAgICAgICBjcmVhdG9ySWQ6IGNyZWF0b3JJZCxcbiAgICAgICAgY3JlYXRvck5hbWU6IGNyZWF0b3I/LnVzZXJuYW1lIHx8ICdVbmtub3duJyxcbiAgICAgICAgY3JlYXRvckVsbzogZ2FtZS5nYW1lVHlwZSA9PT0gJ2NoZWNrZXJzJyA/IGNyZWF0b3I/LmVsb0NoZWNrZXJzIDogY3JlYXRvcj8uZWxvQ2hlc3MsXG4gICAgICAgIGNyZWF0b3JUaWVyOiBnYW1lLmdhbWVUeXBlID09PSAnY2hlY2tlcnMnID8gY3JlYXRvcj8udGllckNoZWNrZXJzIDogY3JlYXRvcj8udGllckNoZXNzLFxuICAgICAgICB0aW1lQ29udHJvbDogZ2FtZS50aW1lQ29udHJvbCxcbiAgICAgICAgdmFyaWFudDogZ2FtZS52YXJpYW50LFxuICAgICAgICBtb2RlOiBnYW1lLm1vZGUsXG4gICAgICAgIHdhZ2VyQW1vdW50OiBnYW1lLndhZ2VySWQgPyBkYi53YWdlcnMuZ2V0KGdhbWUud2FnZXJJZCk/LmFtb3VudCA6IHVuZGVmaW5lZCxcbiAgICAgICAgY3JlYXRlZEF0OiBnYW1lLmNyZWF0ZWRBdCxcbiAgICAgICAgZ2FtZVR5cGU6IGdhbWUuZ2FtZVR5cGVcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgLy8gU2VuZCB0byByZXF1ZXN0aW5nIGNsaWVudFxuICBjb25zdCBjb25uID0gY29ubmVjdGlvbnMuZ2V0KGNvbm5lY3Rpb25JZCk7XG4gIGlmIChjb25uICYmIGNvbm4ucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICBjb25uLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgdHlwZTogJ3dhaXRpbmdfZ2FtZXNfdXBkYXRlJyxcbiAgICAgIGRhdGE6IHdhaXRpbmdHYW1lcyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgIH0pKTtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGDwn5OLIFNlbnQgJHt3YWl0aW5nR2FtZXMubGVuZ3RofSB3YWl0aW5nIGdhbWVzIHRvIGNvbm5lY3Rpb24gJHtjb25uZWN0aW9uSWR9YCk7XG59XG5cbmZ1bmN0aW9uIGJyb2FkY2FzdFdhaXRpbmdHYW1lcygpIHtcbiAgLy8gR2V0IGFsbCB3YWl0aW5nIGdhbWVzXG4gIGNvbnN0IHdhaXRpbmdHYW1lcyA9IEFycmF5LmZyb20oZGIuZ2FtZXMudmFsdWVzKCkpXG4gICAgLmZpbHRlcihnYW1lID0+IGdhbWUuc3RhdHVzID09PSAnd2FpdGluZycpXG4gICAgLm1hcChnYW1lID0+IHtcbiAgICAgIGNvbnN0IGNyZWF0b3JJZCA9IGdhbWUud2hpdGVQbGF5ZXJJZCB8fCBnYW1lLmJsYWNrUGxheWVySWQ7XG4gICAgICBjb25zdCBjcmVhdG9yID0gZGIudXNlcnMuZ2V0KGNyZWF0b3JJZCEpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogZ2FtZS5pZCxcbiAgICAgICAgY3JlYXRvcklkOiBjcmVhdG9ySWQsXG4gICAgICAgIGNyZWF0b3JOYW1lOiBjcmVhdG9yPy51c2VybmFtZSB8fCAnVW5rbm93bicsXG4gICAgICAgIGNyZWF0b3JFbG86IGdhbWUuZ2FtZVR5cGUgPT09ICdjaGVja2VycycgPyBjcmVhdG9yPy5lbG9DaGVja2VycyA6IGNyZWF0b3I/LmVsb0NoZXNzLFxuICAgICAgICBjcmVhdG9yVGllcjogZ2FtZS5nYW1lVHlwZSA9PT0gJ2NoZWNrZXJzJyA/IGNyZWF0b3I/LnRpZXJDaGVja2VycyA6IGNyZWF0b3I/LnRpZXJDaGVzcyxcbiAgICAgICAgdGltZUNvbnRyb2w6IGdhbWUudGltZUNvbnRyb2wsXG4gICAgICAgIHZhcmlhbnQ6IGdhbWUudmFyaWFudCxcbiAgICAgICAgbW9kZTogZ2FtZS5tb2RlLFxuICAgICAgICB3YWdlckFtb3VudDogZ2FtZS53YWdlcklkID8gZGIud2FnZXJzLmdldChnYW1lLndhZ2VySWQpPy5hbW91bnQgOiB1bmRlZmluZWQsXG4gICAgICAgIGNyZWF0ZWRBdDogZ2FtZS5jcmVhdGVkQXQsXG4gICAgICAgIGdhbWVUeXBlOiBnYW1lLmdhbWVUeXBlXG4gICAgICB9O1xuICAgIH0pO1xuXG4gIC8vIEJyb2FkY2FzdCB0byBBTEwgY29ubmVjdGVkIGNsaWVudHNcbiAgYnJvYWRjYXN0KHtcbiAgICB0eXBlOiAnd2FpdGluZ19nYW1lc191cGRhdGUnLFxuICAgIGRhdGE6IHdhaXRpbmdHYW1lcyxcbiAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgfSk7XG5cbiAgY29uc29sZS5sb2coYPCfk6IgQnJvYWRjYXN0ZWQgJHt3YWl0aW5nR2FtZXMubGVuZ3RofSB3YWl0aW5nIGdhbWVzIHRvIGFsbCBjbGllbnRzYCk7XG59XG5cbmZ1bmN0aW9uIGdldFVzZXJOYW1lKHVzZXJJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdXNlciA9IGRiLnVzZXJzLmdldCh1c2VySWQpO1xuICByZXR1cm4gdXNlcj8udXNlcm5hbWUgfHwgJ1Vua25vd24nO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsRUFBRSxRQUFRLGdCQUFnQjtBQUVuQyxzQkFBc0I7QUFDdEIsTUFBTSxjQUFjLElBQUk7QUFDeEIsTUFBTSxRQUFRLElBQUk7QUFDbEIsTUFBTSxjQUFjLElBQUk7QUFDeEIsTUFBTSxhQUFhLElBQUk7QUFDdkIsTUFBTSxrQkFBa0IsSUFBSSxPQUF1Qix5QkFBeUI7QUFDNUUsTUFBTSxhQUFhLElBQUk7QUFFdkIsT0FBTyxTQUFTLGdCQUFnQixHQUFZO0VBQzFDLElBQUksSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsYUFBYTtJQUM3QyxPQUFPLElBQUksU0FBUyxNQUFNO01BQUUsUUFBUTtJQUFJO0VBQzFDO0VB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
// denoCacheMetadata=13384255680192541496,14999277626998912572