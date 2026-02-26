import { userService } from './userService.ts';
import { authMiddleware } from './authMiddleware.ts';
export async function handleUserRoutes(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // GET /api/users/:id
    const userMatch = path.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && req.method === 'GET') {
      const userId = userMatch[1];
      const user = await userService.getUser(userId);
      if (!user) {
        return new Response(JSON.stringify({
          error: 'User not found'
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      return new Response(JSON.stringify({
        user
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // GET /api/users/:id/stats
    const statsMatch = path.match(/^\/api\/users\/([^/]+)\/stats$/);
    if (statsMatch && req.method === 'GET') {
      const userId = statsMatch[1];
      const stats = await userService.getUserStats(userId);
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // GET /api/leaderboard/:gameType
    const leaderboardMatch = path.match(/^\/api\/leaderboard\/(checkers|chess)$/);
    if (leaderboardMatch && req.method === 'GET') {
      const gameType = leaderboardMatch[1];
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const leaderboard = await userService.getLeaderboard(gameType, limit);
      return new Response(JSON.stringify({
        leaderboard
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // GET /api/transactions/history/:userId
    const transactionsMatch = path.match(/^\/api\/transactions\/history\/([^/]+)$/);
    if (transactionsMatch && req.method === 'GET') {
      const userId = transactionsMatch[1];
      const user = await authMiddleware(req);
      // Only allow users to see their own transactions
      if (!user || user.id !== userId) {
        return new Response(JSON.stringify({
          error: 'Unauthorized'
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const transactions = await userService.getTransactions(userId, limit);
      return new Response(JSON.stringify({
        transactions
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('User route error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy91c2VyUm91dGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZXJTZXJ2aWNlIH0gZnJvbSAnLi91c2VyU2VydmljZS50cydcbmltcG9ydCB7IGF1dGhNaWRkbGV3YXJlLCByZXF1aXJlQXV0aCB9IGZyb20gJy4vYXV0aE1pZGRsZXdhcmUudHMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVVc2VyUm91dGVzKHJlcTogUmVxdWVzdCk6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwpXG4gICAgY29uc3QgcGF0aCA9IHVybC5wYXRobmFtZVxuXG4gICAgLy8gQ09SUyBoZWFkZXJzXG4gICAgY29uc3QgY29yc0hlYWRlcnMgPSB7XG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCwgUE9TVCwgUFVULCBERUxFVEUsIE9QVElPTlMnLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdDb250ZW50LVR5cGUsIEF1dGhvcml6YXRpb24nLFxuICAgIH1cblxuICAgIC8vIEhhbmRsZSBPUFRJT05TXG4gICAgaWYgKHJlcS5tZXRob2QgPT09ICdPUFRJT05TJykge1xuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHsgaGVhZGVyczogY29yc0hlYWRlcnMgfSlcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBHRVQgL2FwaS91c2Vycy86aWRcbiAgICAgICAgY29uc3QgdXNlck1hdGNoID0gcGF0aC5tYXRjaCgvXlxcL2FwaVxcL3VzZXJzXFwvKFteL10rKSQvKVxuICAgICAgICBpZiAodXNlck1hdGNoICYmIHJlcS5tZXRob2QgPT09ICdHRVQnKSB7XG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSB1c2VyTWF0Y2hbMV1cbiAgICAgICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCB1c2VyU2VydmljZS5nZXRVc2VyKHVzZXJJZClcblxuICAgICAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1VzZXIgbm90IGZvdW5kJyB9KSxcbiAgICAgICAgICAgICAgICAgICAgeyBzdGF0dXM6IDQwNCwgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyB1c2VyIH0pLCB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gR0VUIC9hcGkvdXNlcnMvOmlkL3N0YXRzXG4gICAgICAgIGNvbnN0IHN0YXRzTWF0Y2ggPSBwYXRoLm1hdGNoKC9eXFwvYXBpXFwvdXNlcnNcXC8oW14vXSspXFwvc3RhdHMkLylcbiAgICAgICAgaWYgKHN0YXRzTWF0Y2ggJiYgcmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IHN0YXRzTWF0Y2hbMV1cbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgdXNlclNlcnZpY2UuZ2V0VXNlclN0YXRzKHVzZXJJZClcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShzdGF0cyksIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6IDIwMCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyBHRVQgL2FwaS9sZWFkZXJib2FyZC86Z2FtZVR5cGVcbiAgICAgICAgY29uc3QgbGVhZGVyYm9hcmRNYXRjaCA9IHBhdGgubWF0Y2goL15cXC9hcGlcXC9sZWFkZXJib2FyZFxcLyhjaGVja2Vyc3xjaGVzcykkLylcbiAgICAgICAgaWYgKGxlYWRlcmJvYXJkTWF0Y2ggJiYgcmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGdhbWVUeXBlID0gbGVhZGVyYm9hcmRNYXRjaFsxXSBhcyAnY2hlY2tlcnMnIHwgJ2NoZXNzJ1xuICAgICAgICAgICAgY29uc3QgbGltaXQgPSBwYXJzZUludCh1cmwuc2VhcmNoUGFyYW1zLmdldCgnbGltaXQnKSB8fCAnMTAnKVxuXG4gICAgICAgICAgICBjb25zdCBsZWFkZXJib2FyZCA9IGF3YWl0IHVzZXJTZXJ2aWNlLmdldExlYWRlcmJvYXJkKGdhbWVUeXBlLCBsaW1pdClcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGxlYWRlcmJvYXJkIH0pLCB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gR0VUIC9hcGkvdHJhbnNhY3Rpb25zL2hpc3RvcnkvOnVzZXJJZFxuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbnNNYXRjaCA9IHBhdGgubWF0Y2goL15cXC9hcGlcXC90cmFuc2FjdGlvbnNcXC9oaXN0b3J5XFwvKFteL10rKSQvKVxuICAgICAgICBpZiAodHJhbnNhY3Rpb25zTWF0Y2ggJiYgcmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IHRyYW5zYWN0aW9uc01hdGNoWzFdXG4gICAgICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgYXV0aE1pZGRsZXdhcmUocmVxKVxuXG4gICAgICAgICAgICAvLyBPbmx5IGFsbG93IHVzZXJzIHRvIHNlZSB0aGVpciBvd24gdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICBpZiAoIXVzZXIgfHwgdXNlci5pZCAhPT0gdXNlcklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1VuYXV0aG9yaXplZCcgfSksXG4gICAgICAgICAgICAgICAgICAgIHsgc3RhdHVzOiA0MDEsIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsaW1pdCA9IHBhcnNlSW50KHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdsaW1pdCcpIHx8ICc1MCcpXG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbnMgPSBhd2FpdCB1c2VyU2VydmljZS5nZXRUcmFuc2FjdGlvbnModXNlcklkLCBsaW1pdClcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IHRyYW5zYWN0aW9ucyB9KSwge1xuICAgICAgICAgICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoJ05vdCBGb3VuZCcsIHsgc3RhdHVzOiA0MDQsIGhlYWRlcnM6IGNvcnNIZWFkZXJzIH0pXG5cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VzZXIgcm91dGUgZXJyb3I6JywgZXJyb3IpXG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pLFxuICAgICAgICAgICAgeyBzdGF0dXM6IDUwMCwgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH1cbiAgICAgICAgKVxuICAgIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLFdBQVcsUUFBUSxtQkFBa0I7QUFDOUMsU0FBUyxjQUFjLFFBQXFCLHNCQUFxQjtBQUVqRSxPQUFPLGVBQWUsaUJBQWlCLEdBQVk7RUFDL0MsTUFBTSxNQUFNLElBQUksSUFBSSxJQUFJLEdBQUc7RUFDM0IsTUFBTSxPQUFPLElBQUksUUFBUTtFQUV6QixlQUFlO0VBQ2YsTUFBTSxjQUFjO0lBQ2hCLCtCQUErQjtJQUMvQixnQ0FBZ0M7SUFDaEMsZ0NBQWdDO0VBQ3BDO0VBRUEsaUJBQWlCO0VBQ2pCLElBQUksSUFBSSxNQUFNLEtBQUssV0FBVztJQUMxQixPQUFPLElBQUksU0FBUyxNQUFNO01BQUUsU0FBUztJQUFZO0VBQ3JEO0VBRUEsSUFBSTtJQUNBLHFCQUFxQjtJQUNyQixNQUFNLFlBQVksS0FBSyxLQUFLLENBQUM7SUFDN0IsSUFBSSxhQUFhLElBQUksTUFBTSxLQUFLLE9BQU87TUFDbkMsTUFBTSxTQUFTLFNBQVMsQ0FBQyxFQUFFO01BQzNCLE1BQU0sT0FBTyxNQUFNLFlBQVksT0FBTyxD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
// denoCacheMetadata=7118271426026637798,12082722324697359400