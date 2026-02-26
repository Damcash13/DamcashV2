import { authService } from './authService.ts';
export async function handleAuthRoutes(req) {
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
    // POST /api/auth/register
    if (path === '/api/auth/register' && req.method === 'POST') {
      const body = await req.json();
      // Validate input
      if (!body.username || !body.email || !body.password) {
        return new Response(JSON.stringify({
          error: 'Username, email, and password are required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (body.password.length < 6) {
        return new Response(JSON.stringify({
          error: 'Password must be at least 6 characters'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const result = await authService.register(body);
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // POST /api/auth/login
    if (path === '/api/auth/login' && req.method === 'POST') {
      const body = await req.json();
      if (!body.email || !body.password) {
        return new Response(JSON.stringify({
          error: 'Email and password are required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const result = await authService.login(body);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // GET /api/auth/me
    if (path === '/api/auth/me' && req.method === 'GET') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Authorization token required'
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
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
    // PUT /api/auth/profile
    if (path === '/api/auth/profile' && req.method === 'PUT') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Authorization token required'
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const token = authHeader.substring(7);
      const currentUser = await authService.verifyToken(token);
      const body = await req.json();
      const user = await authService.updateProfile(currentUser.id, body);
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
    // POST /api/auth/change-password
    if (path === '/api/auth/change-password' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Authorization token required'
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const token = authHeader.substring(7);
      const currentUser = await authService.verifyToken(token);
      const body = await req.json();
      if (!body.oldPassword || !body.newPassword) {
        return new Response(JSON.stringify({
          error: 'Old password and new password are required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (body.newPassword.length < 6) {
        return new Response(JSON.stringify({
          error: 'New password must be at least 6 characters'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      await authService.changePassword(currentUser.id, body.oldPassword, body.newPassword);
      return new Response(JSON.stringify({
        success: true
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
    console.error('Auth route error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: error.message?.includes('Invalid') || error.message?.includes('already') ? 400 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvbG9zYWxpbmlyb2tvY29rby9Eb3dubG9hZHMvZGFtY2FzaC12Mi9iYWNrZW5kL3NyYy9hdXRoUm91dGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGF1dGhTZXJ2aWNlIH0gZnJvbSAnLi9hdXRoU2VydmljZS50cydcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUF1dGhSb3V0ZXMocmVxOiBSZXF1ZXN0KTogUHJvbWlzZTxSZXNwb25zZT4ge1xuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybClcbiAgICBjb25zdCBwYXRoID0gdXJsLnBhdGhuYW1lXG5cbiAgICAvLyBDT1JTIGhlYWRlcnNcbiAgICBjb25zdCBjb3JzSGVhZGVycyA9IHtcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULCBQT1NULCBQVVQsIERFTEVURSwgT1BUSU9OUycsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvbicsXG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIE9QVElPTlNcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwgeyBoZWFkZXJzOiBjb3JzSGVhZGVycyB9KVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIFBPU1QgL2FwaS9hdXRoL3JlZ2lzdGVyXG4gICAgICAgIGlmIChwYXRoID09PSAnL2FwaS9hdXRoL3JlZ2lzdGVyJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXEuanNvbigpXG5cbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgICAgICAgICBpZiAoIWJvZHkudXNlcm5hbWUgfHwgIWJvZHkuZW1haWwgfHwgIWJvZHkucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKFxuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnVXNlcm5hbWUsIGVtYWlsLCBhbmQgcGFzc3dvcmQgYXJlIHJlcXVpcmVkJyB9KSxcbiAgICAgICAgICAgICAgICAgICAgeyBzdGF0dXM6IDQwMCwgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChib2R5LnBhc3N3b3JkLmxlbmd0aCA8IDYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKFxuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnUGFzc3dvcmQgbXVzdCBiZSBhdCBsZWFzdCA2IGNoYXJhY3RlcnMnIH0pLFxuICAgICAgICAgICAgICAgICAgICB7IHN0YXR1czogNDAwLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UucmVnaXN0ZXIoYm9keSlcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShyZXN1bHQpLCB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUE9TVCAvYXBpL2F1dGgvbG9naW5cbiAgICAgICAgaWYgKHBhdGggPT09ICcvYXBpL2F1dGgvbG9naW4nICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcS5qc29uKClcblxuICAgICAgICAgICAgaWYgKCFib2R5LmVtYWlsIHx8ICFib2R5LnBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0VtYWlsIGFuZCBwYXNzd29yZCBhcmUgcmVxdWlyZWQnIH0pLFxuICAgICAgICAgICAgICAgICAgICB7IHN0YXR1czogNDAwLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UubG9naW4oYm9keSlcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShyZXN1bHQpLCB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gR0VUIC9hcGkvYXV0aC9tZVxuICAgICAgICBpZiAocGF0aCA9PT0gJy9hcGkvYXV0aC9tZScgJiYgcmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVycy5nZXQoJ0F1dGhvcml6YXRpb24nKVxuXG4gICAgICAgICAgICBpZiAoIWF1dGhIZWFkZXIgfHwgIWF1dGhIZWFkZXIuc3RhcnRzV2l0aCgnQmVhcmVyICcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0F1dGhvcml6YXRpb24gdG9rZW4gcmVxdWlyZWQnIH0pLFxuICAgICAgICAgICAgICAgICAgICB7IHN0YXR1czogNDAxLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnN1YnN0cmluZyg3KVxuICAgICAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhTZXJ2aWNlLnZlcmlmeVRva2VuKHRva2VuKVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgdXNlciB9KSwge1xuICAgICAgICAgICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBVVCAvYXBpL2F1dGgvcHJvZmlsZVxuICAgICAgICBpZiAocGF0aCA9PT0gJy9hcGkvYXV0aC9wcm9maWxlJyAmJiByZXEubWV0aG9kID09PSAnUFVUJykge1xuICAgICAgICAgICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzLmdldCgnQXV0aG9yaXphdGlvbicpXG5cbiAgICAgICAgICAgIGlmICghYXV0aEhlYWRlciB8fCAhYXV0aEhlYWRlci5zdGFydHNXaXRoKCdCZWFyZXIgJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKFxuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnQXV0aG9yaXphdGlvbiB0b2tlbiByZXF1aXJlZCcgfSksXG4gICAgICAgICAgICAgICAgICAgIHsgc3RhdHVzOiA0MDEsIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIuc3Vic3RyaW5nKDcpXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50VXNlciA9IGF3YWl0IGF1dGhTZXJ2aWNlLnZlcmlmeVRva2VuKHRva2VuKVxuXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVxLmpzb24oKVxuICAgICAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhTZXJ2aWNlLnVwZGF0ZVByb2ZpbGUoY3VycmVudFVzZXIuaWQsIGJvZHkpXG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyB1c2VyIH0pLCB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUE9TVCAvYXBpL2F1dGgvY2hhbmdlLXBhc3N3b3JkXG4gICAgICAgIGlmIChwYXRoID09PSAnL2FwaS9hdXRoL2NoYW5nZS1wYXNzd29yZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICBjb25zdCBhdXRoSGVhZGVyID0gcmVxLmhlYWRlcnMuZ2V0KCdBdXRob3JpemF0aW9uJylcblxuICAgICAgICAgICAgaWYgKCFhdXRoSGVhZGVyIHx8ICFhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXG4gICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdBdXRob3JpemF0aW9uIHRva2VuIHJlcXVpcmVkJyB9KSxcbiAgICAgICAgICAgICAgICAgICAgeyBzdGF0dXM6IDQwMSwgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRva2VuID0gYXV0aEhlYWRlci5zdWJzdHJpbmcoNylcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRVc2VyID0gYXdhaXQgYXV0aFNlcnZpY2UudmVyaWZ5VG9rZW4odG9rZW4pXG5cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXEuanNvbigpXG5cbiAgICAgICAgICAgIGlmICghYm9keS5vbGRQYXNzd29yZCB8fCAhYm9keS5uZXdQYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXG4gICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdPbGQgcGFzc3dvcmQgYW5kIG5ldyBwYXNzd29yZCBhcmUgcmVxdWlyZWQnIH0pLFxuICAgICAgICAgICAgICAgICAgICB7IHN0YXR1czogNDAwLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGJvZHkubmV3UGFzc3dvcmQubGVuZ3RoIDwgNikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXG4gICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdOZXcgcGFzc3dvcmQgbXVzdCBiZSBhdCBsZWFzdCA2IGNoYXJhY3RlcnMnIH0pLFxuICAgICAgICAgICAgICAgICAgICB7IHN0YXR1czogNDAwLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgYXV0aFNlcnZpY2UuY2hhbmdlUGFzc3dvcmQoY3VycmVudFVzZXIuaWQsIGJvZHkub2xkUGFzc3dvcmQsIGJvZHkubmV3UGFzc3dvcmQpXG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlIH0pLCB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnTm90IEZvdW5kJywgeyBzdGF0dXM6IDQwNCwgaGVhZGVyczogY29yc0hlYWRlcnMgfSlcblxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQXV0aCByb3V0ZSBlcnJvcjonLCBlcnJvcilcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSksXG4gICAgICAgICAgICB7IHN0YXR1czogZXJyb3IubWVzc2FnZT8uaW5jbHVkZXMoJ0ludmFsaWQnKSB8fCBlcnJvci5tZXNzYWdlPy5pbmNsdWRlcygnYWxyZWFkeScpID8gNDAwIDogNTAwLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfVxuICAgICAgICApXG4gICAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsV0FBVyxRQUFRLG1CQUFrQjtBQUU5QyxPQUFPLGVBQWUsaUJBQWlCLEdBQVk7RUFDL0MsTUFBTSxNQUFNLElBQUksSUFBSSxJQUFJLEdBQUc7RUFDM0IsTUFBTSxPQUFPLElBQUksUUFBUTtFQUV6QixlQUFlO0VBQ2YsTUFBTSxjQUFjO0lBQ2hCLCtCQUErQjtJQUMvQixnQ0FBZ0M7SUFDaEMsZ0NBQWdDO0VBQ3BDO0VBRUEsaUJBQWlCO0VBQ2pCLElBQUksSUFBSSxNQUFNLEtBQUssV0FBVztJQUMxQixPQUFPLElBQUksU0FBUyxNQUFNO01BQUUsU0FBUztJQUFZO0VBQ3JEO0VBRUEsSUFBSTtJQUNBLDBCQUEwQjtJQUMxQixJQUFJLFNBQVMsd0JBQXdCLElBQUksTUFBTSxLQUFLLFFBQVE7TUFDeEQsTUFBTSxPQUFPLE1BQU0sSUFBSSxJQUFJO01BRTNCLGlCQUFpQjtNQUNqQixJQUFJLENBQUMsS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssUUFBUSxFQUFFO1FBQ2pELE9BQU8sSUFBSSxTQUNQLEtBQUssU0FBUyxDQUFDO1VBQUUsT0FBTztRQUE2QyxJQUNyRTtVQUFFLFFBQVE7VUFBSyxTQUFTO1lBQUUsR0FBRyxXQUFXO1lBQUUsZ0JBQWdCO1VBQW1CO1FBQUU7TUFFdkY7TUFFQSxJQUFJLEtBQUssUUFBUSxDQUFDLE1BQU0sR0FBRyxHQUFHO1FBQzFCLE9BQU8sSUFBSSxTQUNQLEtBQUssU0FBUyxDQUFDO1VBQUUsT0FBTztRQUF5QyxJQUNqRTtVQUFFLFFBQVE7VUFBSyxTQUFTO1lBQUUsR0FBRyxXQUFXO1lBQUUsZ0JBQWdCO1VBQW1CO1FBQUU7TUFFdkY7TUFFQSxNQUFNLFNBQVMsTUFBTSxZQUFZLFFBQVEsQ0FBQztNQUUxQyxPQUFPLElBQUksU0FBUyxLQUFLLFNB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
// denoCacheMetadata=18291349318521171270,16206784505665450327