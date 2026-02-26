import { tournamentService } from './tournamentService.ts';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
export async function handleTournamentRoutes(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  const url = new URL(req.url);
  const path = url.pathname;
  try {
    // GET /api/tournaments - List all tournaments
    if (path === "/api/tournaments" && req.method === "GET") {
      const tournaments = await tournamentService.getAllTournaments();
      return new Response(JSON.stringify({
        tournaments
      }), {
        headers: {
          ...corsHeaders,
          "content-type": "application/json"
        }
      });
    }
    // GET /api/tournament/:id - Get tournament details
    const tournamentMatch = path.match(/^\/api\/tournament\/([^/]+)$/);
    if (tournamentMatch && req.method === "GET") {
      const tournamentId = tournamentMatch[1];
      const tournament = await tournamentService.getTournament(tournamentId);
      if (!tournament) {
        return new Response(JSON.stringify({
          error: "Tournament not found"
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            "content-type": "application/json"
          }
        });
      }
      const standings = await tournamentService.getStandings(tournamentId);
      return new Response(JSON.stringify({
        tournament,
        standings
      }), {
        headers: {
          ...corsHeaders,
          "content-type": "application/json"
        }
      });
    }
    // POST /api/tournament/create - Create tournament
    if (path === "/api/tournament/create" && req.method === "POST") {
      const body = await req.json();
      const params = {
        name: body.name,
        gameType: body.gameType,
        variant: body.variant,
        startTime: new Date(body.startTime),
        duration: body.duration,
        rated: body.rated,
        minRating: body.minRating,
        maxRating: body.maxRating,
        maxPlayers: body.maxPlayers,
        allowBerserk: body.allowBerserk !== false,
        minGames: body.minGames || 1,
        createdBy: body.createdBy
      };
      const tournament = await tournamentService.createTournament(params);
      return new Response(JSON.stringify({
        tournament
      }), {
        headers: {
          ...corsHeaders,
          "content-type": "application/json"
        }
      });
    }
    // POST /api/tournament/:id/join - Join tournament
    const joinMatch = path.match(/^\/api\/tournament\/([^/]+)\/join$/);
    if (joinMatch && req.method === "POST") {
      const tournamentId = joinMatch[1];
      const body = await req.json();
      try {
        const result = await tournamentService.joinTournament(tournamentId, body.userId, body.username, body.rating);
        const tournament = await tournamentService.getTournament(tournamentId);
        return new Response(JSON.stringify({
          success: true,
          tournament
        }), {
          headers: {
            ...corsHeaders,
            "content-type": "application/json"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({
          error: e instanceof Error ? e.message : "Failed to join"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "content-type": "application/json"
          }
        });
      }
    }
    // DELETE /api/tournament/:id/withdraw - Leave tournament
    const withdrawMatch = path.match(/^\/api\/tournament\/([^/]+)\/withdraw$/);
    if (withdrawMatch && req.method === "DELETE") {
      const tournamentId = withdrawMatch[1];
      const body = await req.json();
      const success = await tournamentService.leaveTournament(tournamentId, body.userId);
      return new Response(JSON.stringify({
        success
      }), {
        headers: {
          ...corsHeaders,
          "content-type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify({
      error: "Not found"
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        "content-type": "application/json"
      }
    });
  } catch (error) {
    console.error('[Tournament API] Error:', error);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "content-type": "application/json"
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy90b3VybmFtZW50Um91dGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHRvdXJuYW1lbnRTZXJ2aWNlIH0gZnJvbSAnLi90b3VybmFtZW50U2VydmljZS50cydcbmltcG9ydCB7IENyZWF0ZVRvdXJuYW1lbnRQYXJhbXMgfSBmcm9tICcuL2VudGl0aWVzLnRzJ1xuXG5jb25zdCBjb3JzSGVhZGVycyA9IHtcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIixcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIjogXCJHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TXCIsXG4gICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCI6IFwiQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uXCIsXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVUb3VybmFtZW50Um91dGVzKHJlcTogUmVxdWVzdCk6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7IGhlYWRlcnM6IGNvcnNIZWFkZXJzIH0pXG4gICAgfVxuXG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsKVxuICAgIGNvbnN0IHBhdGggPSB1cmwucGF0aG5hbWVcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIEdFVCAvYXBpL3RvdXJuYW1lbnRzIC0gTGlzdCBhbGwgdG91cm5hbWVudHNcbiAgICAgICAgaWYgKHBhdGggPT09IFwiL2FwaS90b3VybmFtZW50c1wiICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRvdXJuYW1lbnRzID0gYXdhaXQgdG91cm5hbWVudFNlcnZpY2UuZ2V0QWxsVG91cm5hbWVudHMoKVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IHRvdXJuYW1lbnRzIH0pLCB7XG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdFVCAvYXBpL3RvdXJuYW1lbnQvOmlkIC0gR2V0IHRvdXJuYW1lbnQgZGV0YWlsc1xuICAgICAgICBjb25zdCB0b3VybmFtZW50TWF0Y2ggPSBwYXRoLm1hdGNoKC9eXFwvYXBpXFwvdG91cm5hbWVudFxcLyhbXi9dKykkLylcbiAgICAgICAgaWYgKHRvdXJuYW1lbnRNYXRjaCAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XG4gICAgICAgICAgICBjb25zdCB0b3VybmFtZW50SWQgPSB0b3VybmFtZW50TWF0Y2hbMV1cbiAgICAgICAgICAgIGNvbnN0IHRvdXJuYW1lbnQgPSBhd2FpdCB0b3VybmFtZW50U2VydmljZS5nZXRUb3VybmFtZW50KHRvdXJuYW1lbnRJZClcblxuICAgICAgICAgICAgaWYgKCF0b3VybmFtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcIlRvdXJuYW1lbnQgbm90IGZvdW5kXCIgfSksIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiA0MDQsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzdGFuZGluZ3MgPSBhd2FpdCB0b3VybmFtZW50U2VydmljZS5nZXRTdGFuZGluZ3ModG91cm5hbWVudElkKVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICB0b3VybmFtZW50LFxuICAgICAgICAgICAgICAgIHN0YW5kaW5nc1xuICAgICAgICAgICAgfSksIHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUE9TVCAvYXBpL3RvdXJuYW1lbnQvY3JlYXRlIC0gQ3JlYXRlIHRvdXJuYW1lbnRcbiAgICAgICAgaWYgKHBhdGggPT09IFwiL2FwaS90b3VybmFtZW50L2NyZWF0ZVwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVxLmpzb24oKVxuICAgICAgICAgICAgY29uc3QgcGFyYW1zOiBDcmVhdGVUb3VybmFtZW50UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGJvZHkubmFtZSxcbiAgICAgICAgICAgICAgICBnYW1lVHlwZTogYm9keS5nYW1lVHlwZSxcbiAgICAgICAgICAgICAgICB2YXJpYW50OiBib2R5LnZhcmlhbnQsXG4gICAgICAgICAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShib2R5LnN0YXJ0VGltZSksXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IGJvZHkuZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgcmF0ZWQ6IGJvZHkucmF0ZWQsXG4gICAgICAgICAgICAgICAgbWluUmF0aW5nOiBib2R5Lm1pblJhdGluZyxcbiAgICAgICAgICAgICAgICBtYXhSYXRpbmc6IGJvZHkubWF4UmF0aW5nLFxuICAgICAgICAgICAgICAgIG1heFBsYXllcnM6IGJvZHkubWF4UGxheWVycyxcbiAgICAgICAgICAgICAgICBhbGxvd0JlcnNlcms6IGJvZHkuYWxsb3dCZXJzZXJrICE9PSBmYWxzZSwgLy8gRGVmYXVsdCB0cnVlXG4gICAgICAgICAgICAgICAgbWluR2FtZXM6IGJvZHkubWluR2FtZXMgfHwgMSxcbiAgICAgICAgICAgICAgICBjcmVhdGVkQnk6IGJvZHkuY3JlYXRlZEJ5XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRvdXJuYW1lbnQgPSBhd2FpdCB0b3VybmFtZW50U2VydmljZS5jcmVhdGVUb3VybmFtZW50KHBhcmFtcylcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IHRvdXJuYW1lbnQgfSksIHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUE9TVCAvYXBpL3RvdXJuYW1lbnQvOmlkL2pvaW4gLSBKb2luIHRvdXJuYW1lbnRcbiAgICAgICAgY29uc3Qgam9pbk1hdGNoID0gcGF0aC5tYXRjaCgvXlxcL2FwaVxcL3RvdXJuYW1lbnRcXC8oW14vXSspXFwvam9pbiQvKVxuICAgICAgICBpZiAoam9pbk1hdGNoICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG4gICAgICAgICAgICBjb25zdCB0b3VybmFtZW50SWQgPSBqb2luTWF0Y2hbMV1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXEuanNvbigpXG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdG91cm5hbWVudFNlcnZpY2Uuam9pblRvdXJuYW1lbnQoXG4gICAgICAgICAgICAgICAgICAgIHRvdXJuYW1lbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgYm9keS51c2VySWQsXG4gICAgICAgICAgICAgICAgICAgIGJvZHkudXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGJvZHkucmF0aW5nXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdG91cm5hbWVudCA9IGF3YWl0IHRvdXJuYW1lbnRTZXJ2aWNlLmdldFRvdXJuYW1lbnQodG91cm5hbWVudElkKVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHRvdXJuYW1lbnRcbiAgICAgICAgICAgICAgICB9KSwge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFwiRmFpbGVkIHRvIGpvaW5cIiB9KSwge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBERUxFVEUgL2FwaS90b3VybmFtZW50LzppZC93aXRoZHJhdyAtIExlYXZlIHRvdXJuYW1lbnRcbiAgICAgICAgY29uc3Qgd2l0aGRyYXdNYXRjaCA9IHBhdGgubWF0Y2goL15cXC9hcGlcXC90b3VybmFtZW50XFwvKFteL10rKVxcL3dpdGhkcmF3JC8pXG4gICAgICAgIGlmICh3aXRoZHJhd01hdGNoICYmIHJlcS5tZXRob2QgPT09IFwiREVMRVRFXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRvdXJuYW1lbnRJZCA9IHdpdGhkcmF3TWF0Y2hbMV1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXEuanNvbigpXG5cbiAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCB0b3VybmFtZW50U2VydmljZS5sZWF2ZVRvdXJuYW1lbnQodG91cm5hbWVudElkLCBib2R5LnVzZXJJZClcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3MgfSksIHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcIk5vdCBmb3VuZFwiIH0pLCB7XG4gICAgICAgICAgICBzdGF0dXM6IDQwNCxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH1cbiAgICAgICAgfSlcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tUb3VybmFtZW50IEFQSV0gRXJyb3I6JywgZXJyb3IpXG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIiB9KSwge1xuICAgICAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgICAgICBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gICAgICAgIH0pXG4gICAgfVxu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
// denoCacheMetadata=17526402613816819646,4539988597515808333