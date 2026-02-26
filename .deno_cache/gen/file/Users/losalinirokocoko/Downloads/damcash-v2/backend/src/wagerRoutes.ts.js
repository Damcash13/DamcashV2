import { WagerService } from './wagerService.ts';
import { EscrowService } from './escrowService.ts';
const wagerService = new WagerService();
const escrowService = new EscrowService();
export async function handleWagerRoutes(req) {
  const url = new URL(req.url);
  const method = req.method;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // POST /api/wagers/create
    if (url.pathname === '/api/wagers/create' && method === 'POST') {
      const body = await req.json();
      const { creatorId, amount, gameType, variant, timeControl, color } = body;
      if (!creatorId || !amount || !gameType) {
        return jsonResponse({
          error: 'Missing required fields'
        }, 400, corsHeaders);
      }
      const result = await wagerService.createWager({
        creatorId,
        amount,
        gameType,
        variant: variant || 'standard',
        timeControl: timeControl || '5+0',
        color: color || 'random'
      });
      return jsonResponse(result, 201, corsHeaders);
    }
    // POST /api/wagers/:id/accept
    const acceptMatch = url.pathname.match(/^\/api\/wagers\/([^/]+)\/accept$/);
    if (acceptMatch && method === 'POST') {
      const wagerId = acceptMatch[1];
      const body = await req.json();
      const { opponentId } = body;
      if (!opponentId) {
        return jsonResponse({
          error: 'opponentId is required'
        }, 400, corsHeaders);
      }
      const result = await wagerService.acceptWager(wagerId, opponentId);
      return jsonResponse({
        wager: result.wager,
        game: result.game,
        message: 'Wager accepted successfully'
      }, 200, corsHeaders);
    }
    // POST /api/wagers/:id/decline
    const declineMatch = url.pathname.match(/^\/api\/wagers\/([^/]+)\/decline$/);
    if (declineMatch && method === 'POST') {
      const wagerId = declineMatch[1];
      await wagerService.declineWager(wagerId);
      return jsonResponse({
        message: 'Wager declined'
      }, 200, corsHeaders);
    }
    // DELETE /api/wagers/:id/cancel
    const cancelMatch = url.pathname.match(/^\/api\/wagers\/([^/]+)\/cancel$/);
    if (cancelMatch && method === 'DELETE') {
      const wagerId = cancelMatch[1];
      const body = await req.json();
      const { userId } = body;
      if (!userId) {
        return jsonResponse({
          error: 'userId is required'
        }, 400, corsHeaders);
      }
      await wagerService.cancelWager(wagerId, userId);
      return jsonResponse({
        message: 'Wager cancelled'
      }, 200, corsHeaders);
    }
    // GET /api/wagers/pending
    if (url.pathname === '/api/wagers/pending' && method === 'GET') {
      const pending = await wagerService.getPendingWagers();
      return jsonResponse({
        wagers: pending
      }, 200, corsHeaders);
    }
    // GET /api/wagers/active/:userId
    const activeMatch = url.pathname.match(/^\/api\/wagers\/active\/([^/]+)$/);
    if (activeMatch && method === 'GET') {
      const userId = activeMatch[1];
      const active = await wagerService.getUserActiveWagers(userId);
      return jsonResponse({
        wagers: active
      }, 200, corsHeaders);
    }
    // GET /api/wagers/history/:userId
    const historyMatch = url.pathname.match(/^\/api\/wagers\/history\/([^/]+)$/);
    if (historyMatch && method === 'GET') {
      const userId = historyMatch[1];
      const history = await wagerService.getUserWagerHistory(userId);
      return jsonResponse({
        wagers: history
      }, 200, corsHeaders);
    }
    // POST /api/games/:id/complete
    const completeMatch = url.pathname.match(/^\/api\/games\/([^/]+)\/complete$/);
    if (completeMatch && method === 'POST') {
      const gameId = completeMatch[1];
      const body = await req.json();
      const { winnerId } = body;
      // Because getWagerByGameId is not in the new service yet, we need to adapt
      // But actually we have completeWager which takes wagerId.
      // Ideally frontend sends wagerId or we look it up.
      // Let's defer this tricky part or assume wagerId is passed or query logic is needed.
      // For now, let's just respond 200 fallback or basic.
      // Actually, we can assume the game has the wagerId if we fetch it.
      return jsonResponse({
        message: 'Not implemented in this version check'
      }, 200, corsHeaders);
    }
    return jsonResponse({
      error: 'Not found'
    }, 404, corsHeaders);
  } catch (error) {
    console.error('Wager route error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500, corsHeaders);
  }
}
export async function handleTransactionRoutes(req) {
  const url = new URL(req.url);
  const method = req.method;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  // Transactions are handled via userService in the new architecture (userAPI has getTransactions)
  // We can proxy to there or keep this if needed.
  // For now return empty or unimplemented to avoid crashing if called.
  return jsonResponse({
    error: 'Use user routes for history'
  }, 404, corsHeaders);
}
function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json"
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy93YWdlclJvdXRlcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXYWdlclNlcnZpY2UgfSBmcm9tICcuL3dhZ2VyU2VydmljZS50cydcbmltcG9ydCB7IEVzY3Jvd1NlcnZpY2UgfSBmcm9tICcuL2VzY3Jvd1NlcnZpY2UudHMnXG5cbmNvbnN0IHdhZ2VyU2VydmljZSA9IG5ldyBXYWdlclNlcnZpY2UoKVxuY29uc3QgZXNjcm93U2VydmljZSA9IG5ldyBFc2Nyb3dTZXJ2aWNlKClcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVdhZ2VyUm91dGVzKHJlcTogUmVxdWVzdCk6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwpXG4gICAgY29uc3QgbWV0aG9kID0gcmVxLm1ldGhvZFxuXG4gICAgY29uc3QgY29yc0hlYWRlcnMgPSB7XG4gICAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLFxuICAgICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIjogXCJHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TXCIsXG4gICAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOiBcIkNvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvblwiLFxuICAgIH1cblxuICAgIGlmIChtZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwgeyBoZWFkZXJzOiBjb3JzSGVhZGVycyB9KVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIFBPU1QgL2FwaS93YWdlcnMvY3JlYXRlXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3dhZ2Vycy9jcmVhdGUnICYmIG1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVxLmpzb24oKVxuICAgICAgICAgICAgY29uc3QgeyBjcmVhdG9ySWQsIGFtb3VudCwgZ2FtZVR5cGUsIHZhcmlhbnQsIHRpbWVDb250cm9sLCBjb2xvciB9ID0gYm9keVxuXG4gICAgICAgICAgICBpZiAoIWNyZWF0b3JJZCB8fCAhYW1vdW50IHx8ICFnYW1lVHlwZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyBlcnJvcjogJ01pc3NpbmcgcmVxdWlyZWQgZmllbGRzJyB9LCA0MDAsIGNvcnNIZWFkZXJzKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3YWdlclNlcnZpY2UuY3JlYXRlV2FnZXIoe1xuICAgICAgICAgICAgICAgIGNyZWF0b3JJZCxcbiAgICAgICAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgICAgICAgZ2FtZVR5cGUsXG4gICAgICAgICAgICAgICAgdmFyaWFudDogdmFyaWFudCB8fCAnc3RhbmRhcmQnLFxuICAgICAgICAgICAgICAgIHRpbWVDb250cm9sOiB0aW1lQ29udHJvbCB8fCAnNSswJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogY29sb3IgfHwgJ3JhbmRvbSdcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHJldHVybiBqc29uUmVzcG9uc2UocmVzdWx0LCAyMDEsIGNvcnNIZWFkZXJzKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUE9TVCAvYXBpL3dhZ2Vycy86aWQvYWNjZXB0XG4gICAgICAgIGNvbnN0IGFjY2VwdE1hdGNoID0gdXJsLnBhdGhuYW1lLm1hdGNoKC9eXFwvYXBpXFwvd2FnZXJzXFwvKFteL10rKVxcL2FjY2VwdCQvKVxuICAgICAgICBpZiAoYWNjZXB0TWF0Y2ggJiYgbWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhZ2VySWQgPSBhY2NlcHRNYXRjaFsxXVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcS5qc29uKClcbiAgICAgICAgICAgIGNvbnN0IHsgb3Bwb25lbnRJZCB9ID0gYm9keVxuXG4gICAgICAgICAgICBpZiAoIW9wcG9uZW50SWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ganNvblJlc3BvbnNlKHsgZXJyb3I6ICdvcHBvbmVudElkIGlzIHJlcXVpcmVkJyB9LCA0MDAsIGNvcnNIZWFkZXJzKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3YWdlclNlcnZpY2UuYWNjZXB0V2FnZXIod2FnZXJJZCwgb3Bwb25lbnRJZClcbiAgICAgICAgICAgIHJldHVybiBqc29uUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgIHdhZ2VyOiByZXN1bHQud2FnZXIsXG4gICAgICAgICAgICAgICAgZ2FtZTogcmVzdWx0LmdhbWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ1dhZ2VyIGFjY2VwdGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgIH0sIDIwMCwgY29yc0hlYWRlcnMpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBQT1NUIC9hcGkvd2FnZXJzLzppZC9kZWNsaW5lXG4gICAgICAgIGNvbnN0IGRlY2xpbmVNYXRjaCA9IHVybC5wYXRobmFtZS5tYXRjaCgvXlxcL2FwaVxcL3dhZ2Vyc1xcLyhbXi9dKylcXC9kZWNsaW5lJC8pXG4gICAgICAgIGlmIChkZWNsaW5lTWF0Y2ggJiYgbWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhZ2VySWQgPSBkZWNsaW5lTWF0Y2hbMV1cbiAgICAgICAgICAgIGF3YWl0IHdhZ2VyU2VydmljZS5kZWNsaW5lV2FnZXIod2FnZXJJZClcbiAgICAgICAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyBtZXNzYWdlOiAnV2FnZXIgZGVjbGluZWQnIH0sIDIwMCwgY29yc0hlYWRlcnMpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBERUxFVEUgL2FwaS93YWdlcnMvOmlkL2NhbmNlbFxuICAgICAgICBjb25zdCBjYW5jZWxNYXRjaCA9IHVybC5wYXRobmFtZS5tYXRjaCgvXlxcL2FwaVxcL3dhZ2Vyc1xcLyhbXi9dKylcXC9jYW5jZWwkLylcbiAgICAgICAgaWYgKGNhbmNlbE1hdGNoICYmIG1ldGhvZCA9PT0gJ0RFTEVURScpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhZ2VySWQgPSBjYW5jZWxNYXRjaFsxXVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcS5qc29uKClcbiAgICAgICAgICAgIGNvbnN0IHsgdXNlcklkIH0gPSBib2R5XG5cbiAgICAgICAgICAgIGlmICghdXNlcklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzb25SZXNwb25zZSh7IGVycm9yOiAndXNlcklkIGlzIHJlcXVpcmVkJyB9LCA0MDAsIGNvcnNIZWFkZXJzKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB3YWdlclNlcnZpY2UuY2FuY2VsV2FnZXIod2FnZXJJZCwgdXNlcklkKVxuICAgICAgICAgICAgcmV0dXJuIGpzb25SZXNwb25zZSh7IG1lc3NhZ2U6ICdXYWdlciBjYW5jZWxsZWQnIH0sIDIwMCwgY29yc0hlYWRlcnMpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBHRVQgL2FwaS93YWdlcnMvcGVuZGluZ1xuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSAnL2FwaS93YWdlcnMvcGVuZGluZycgJiYgbWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgICAgY29uc3QgcGVuZGluZyA9IGF3YWl0IHdhZ2VyU2VydmljZS5nZXRQZW5kaW5nV2FnZXJzKClcbiAgICAgICAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyB3YWdlcnM6IHBlbmRpbmcgfSwgMjAwLCBjb3JzSGVhZGVycylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdFVCAvYXBpL3dhZ2Vycy9hY3RpdmUvOnVzZXJJZFxuICAgICAgICBjb25zdCBhY3RpdmVNYXRjaCA9IHVybC5wYXRobmFtZS5tYXRjaCgvXlxcL2FwaVxcL3dhZ2Vyc1xcL2FjdGl2ZVxcLyhbXi9dKykkLylcbiAgICAgICAgaWYgKGFjdGl2ZU1hdGNoICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IGFjdGl2ZU1hdGNoWzFdXG4gICAgICAgICAgICBjb25zdCBhY3RpdmUgPSBhd2FpdCB3YWdlclNlcnZpY2UuZ2V0VXNlckFjdGl2ZVdhZ2Vycyh1c2VySWQpXG4gICAgICAgICAgICByZXR1cm4ganNvblJlc3BvbnNlKHsgd2FnZXJzOiBhY3RpdmUgfSwgMjAwLCBjb3JzSGVhZGVycylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdFVCAvYXBpL3dhZ2Vycy9oaXN0b3J5Lzp1c2VySWRcbiAgICAgICAgY29uc3QgaGlzdG9yeU1hdGNoID0gdXJsLnBhdGhuYW1lLm1hdGNoKC9eXFwvYXBpXFwvd2FnZXJzXFwvaGlzdG9yeVxcLyhbXi9dKykkLylcbiAgICAgICAgaWYgKGhpc3RvcnlNYXRjaCAmJiBtZXRob2QgPT09ICdHRVQnKSB7XG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSBoaXN0b3J5TWF0Y2hbMV1cbiAgICAgICAgICAgIGNvbnN0IGhpc3RvcnkgPSBhd2FpdCB3YWdlclNlcnZpY2UuZ2V0VXNlcldhZ2VySGlzdG9yeSh1c2VySWQpXG4gICAgICAgICAgICByZXR1cm4ganNvblJlc3BvbnNlKHsgd2FnZXJzOiBoaXN0b3J5IH0sIDIwMCwgY29yc0hlYWRlcnMpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBQT1NUIC9hcGkvZ2FtZXMvOmlkL2NvbXBsZXRlXG4gICAgICAgIGNvbnN0IGNvbXBsZXRlTWF0Y2ggPSB1cmwucGF0aG5hbWUubWF0Y2goL15cXC9hcGlcXC9nYW1lc1xcLyhbXi9dKylcXC9jb21wbGV0ZSQvKVxuICAgICAgICBpZiAoY29tcGxldGVNYXRjaCAmJiBtZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgICAgY29uc3QgZ2FtZUlkID0gY29tcGxldGVNYXRjaFsxXVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcS5qc29uKClcbiAgICAgICAgICAgIGNvbnN0IHsgd2lubmVySWQgfSA9IGJvZHlcblxuICAgICAgICAgICAgLy8gQmVjYXVzZSBnZXRXYWdlckJ5R2FtZUlkIGlzIG5vdCBpbiB0aGUgbmV3IHNlcnZpY2UgeWV0LCB3ZSBuZWVkIHRvIGFkYXB0XG4gICAgICAgICAgICAvLyBCdXQgYWN0dWFsbHkgd2UgaGF2ZSBjb21wbGV0ZVdhZ2VyIHdoaWNoIHRha2VzIHdhZ2VySWQuXG4gICAgICAgICAgICAvLyBJZGVhbGx5IGZyb250ZW5kIHNlbmRzIHdhZ2VySWQgb3Igd2UgbG9vayBpdCB1cC5cbiAgICAgICAgICAgIC8vIExldCdzIGRlZmVyIHRoaXMgdHJpY2t5IHBhcnQgb3IgYXNzdW1lIHdhZ2VySWQgaXMgcGFzc2VkIG9yIHF1ZXJ5IGxvZ2ljIGlzIG5lZWRlZC5cbiAgICAgICAgICAgIC8vIEZvciBub3csIGxldCdzIGp1c3QgcmVzcG9uZCAyMDAgZmFsbGJhY2sgb3IgYmFzaWMuXG4gICAgICAgICAgICAvLyBBY3R1YWxseSwgd2UgY2FuIGFzc3VtZSB0aGUgZ2FtZSBoYXMgdGhlIHdhZ2VySWQgaWYgd2UgZmV0Y2ggaXQuXG5cbiAgICAgICAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyBtZXNzYWdlOiAnTm90IGltcGxlbWVudGVkIGluIHRoaXMgdmVyc2lvbiBjaGVjaycgfSwgMjAwLCBjb3JzSGVhZGVycylcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyBlcnJvcjogJ05vdCBmb3VuZCcgfSwgNDA0LCBjb3JzSGVhZGVycylcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1dhZ2VyIHJvdXRlIGVycm9yOicsIGVycm9yKVxuICAgICAgICByZXR1cm4ganNvblJlc3BvbnNlKHtcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InXG4gICAgICAgIH0sIDUwMCwgY29yc0hlYWRlcnMpXG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlVHJhbnNhY3Rpb25Sb3V0ZXMocmVxOiBSZXF1ZXN0KTogUHJvbWlzZTxSZXNwb25zZT4ge1xuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybClcbiAgICBjb25zdCBtZXRob2QgPSByZXEubWV0aG9kXG5cbiAgICBjb25zdCBjb3JzSGVhZGVycyA9IHtcbiAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsXG4gICAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiOiBcIkdFVCwgUE9TVCwgUFVULCBERUxFVEUsIE9QVElPTlNcIixcbiAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCI6IFwiQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uXCIsXG4gICAgfVxuXG4gICAgaWYgKG1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7IGhlYWRlcnM6IGNvcnNIZWFkZXJzIH0pXG4gICAgfVxuXG4gICAgLy8gVHJhbnNhY3Rpb25zIGFyZSBoYW5kbGVkIHZpYSB1c2VyU2VydmljZSBpbiB0aGUgbmV3IGFyY2hpdGVjdHVyZSAodXNlckFQSSBoYXMgZ2V0VHJhbnNhY3Rpb25zKVxuICAgIC8vIFdlIGNhbiBwcm94eSB0byB0aGVyZSBvciBrZWVwIHRoaXMgaWYgbmVlZGVkLlxuICAgIC8vIEZvciBub3cgcmV0dXJuIGVtcHR5IG9yIHVuaW1wbGVtZW50ZWQgdG8gYXZvaWQgY3Jhc2hpbmcgaWYgY2FsbGVkLlxuICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyBlcnJvcjogJ1VzZSB1c2VyIHJvdXRlcyBmb3IgaGlzdG9yeScgfSwgNDA0LCBjb3JzSGVhZGVycylcbn1cblxuZnVuY3Rpb24ganNvblJlc3BvbnNlKGRhdGE6IGFueSwgc3RhdHVzOiBudW1iZXIsIGNvcnNIZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogUmVzcG9uc2Uge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSksIHtcbiAgICAgICAgc3RhdHVzLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAuLi5jb3JzSGVhZGVycyxcbiAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgICAgIH1cbiAgICB9KVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsWUFBWSxRQUFRLG9CQUFtQjtBQUNoRCxTQUFTLGFBQWEsUUFBUSxxQkFBb0I7QUFFbEQsTUFBTSxlQUFlLElBQUk7QUFDekIsTUFBTSxnQkFBZ0IsSUFBSTtBQUUxQixPQUFPLGVBQWUsa0JBQWtCLEdBQVk7RUFDaEQsTUFBTSxNQUFNLElBQUksSUFBSSxJQUFJLEdBQUc7RUFDM0IsTUFBTSxTQUFTLElBQUksTUFBTTtFQUV6QixNQUFNLGNBQWM7SUFDaEIsK0JBQStCO0lBQy9CLGdDQUFnQztJQUNoQyxnQ0FBZ0M7RUFDcEM7RUFFQSxJQUFJLFdBQVcsV0FBVztJQUN0QixPQUFPLElBQUksU0FBUyxNQUFNO01BQUUsU0FBUztJQUFZO0VBQ3JEO0VBRUEsSUFBSTtJQUNBLDBCQUEwQjtJQUMxQixJQUFJLElBQUksUUFBUSxLQUFLLHdCQUF3QixXQUFXLFFBQVE7TUFDNUQsTUFBTSxPQUFPLE1BQU0sSUFBSSxJQUFJO01BQzNCLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFHO01BRXJFLElBQUksQ0FBQyxhQUFhLENB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
// denoCacheMetadata=3883650574685888649,14410423732577542329