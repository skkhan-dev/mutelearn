# Real Canvas LMS Integration via Personal Access Token

## Context
Students want to connect their school's Canvas LMS to MuteLearn so courses, assignments, grades, and files drive the adaptive planner and study packs. Each school has its own Canvas URL (e.g., `yourschool.instructure.com`). We need a self-service flow — students enter their Canvas URL and Personal Access Token (no admin needed) from Settings.

The existing server (`server/index.js`) already has full Canvas sync logic (fetch courses, assignments, files, normalize, build study packs). We need to:
1. Make Canvas URL configurable per-student (currently env-var only)
2. Add a Personal Access Token auth path (currently OAuth only)
3. Add a Settings UI for students to enter their Canvas URL + token
4. Deploy the server alongside the static frontend on Cloud Run

## How Students Get a Canvas Token
1. Log into Canvas at their school URL (e.g., `yourschool.instructure.com`)
2. Click **Account** (profile icon, top left) → **Settings**
3. Scroll to **Approved Integrations** section
4. Click **+ New Access Token**
5. Enter a purpose like "MuteLearn" and click **Generate Token**
6. Copy the token (it's only shown once)
Takes about 30 seconds, no admin access required.

## Implementation Plan

### 1. Add Canvas Token Auth to Server (`server/index.js`)
- New endpoint: `POST /api/connectors/canvas/connect-token`
  - Accepts `{ canvasBaseUrl, accessToken }`
  - Validates by calling `GET /api/v1/users/self/profile` on the student's Canvas instance
  - Stores token + URL in the session record
  - Returns `{ success: true, accountName, canvasUserId }`
- Modify `performCanvasSync()` to use per-session `canvasBaseUrl` (from session) instead of global `CANVAS_BASE_URL` env var
- Modify `fetchCanvasJson()` to accept `baseUrl` parameter from session
- Keep existing OAuth flow for schools that set it up; personal access token is the default path

### 2. Update Settings UI (`src/pages/SettingsPage.jsx`)
- Add "Connect Canvas" form in the LMS Integration section:
  - Canvas URL input (placeholder: `yourschool.instructure.com`)
  - API Token input (password field, masked)
  - "How to get your token" expandable instructions with the 6 steps above
  - **Connect** button → calls the new endpoint, shows loading state
  - **Test Connection** indicator → shows account name on success, error on failure
- When connected:
  - Show connected account name and Canvas URL
  - "Sync Now" button to pull latest data
  - "Disconnect" button to clear stored token
- Error states: invalid URL, invalid token, Canvas unreachable

### 3. Add API Client Method (`src/lib/apiClient.js`)
```javascript
connectCanvasToken({ sessionToken, body: { canvasBaseUrl, accessToken } })
// POST /api/connectors/canvas/connect-token
```

### 4. Update PlatformContext (`src/contexts/PlatformContext.jsx`)
- Add `connectCanvasToken(canvasBaseUrl, accessToken)` method
- Calls `apiClient.connectCanvasToken(...)` with session token
- Refreshes connectors and session after successful connection
- Returns connection result to UI for status display

### 5. Update LMSContext (`src/contexts/LMSContext.jsx`)
- `syncCanvas` should detect when backend is online AND session has a stored Canvas token
- Uses server sync path (not demo fallback) when real token is available
- Falls back to demo only when no server or no token

### 6. Deploy Server + Frontend Together on Cloud Run
**Option A: Single container with process manager**
- Update `Dockerfile` to install Node.js alongside nginx
- Use `supervisord` or a shell script to run both:
  - nginx on port 8080 (serves static frontend)
  - Node.js server on port 8787 (API)
- Update `nginx.conf` to proxy `/api/` to `localhost:8787`

**Option B: Two Cloud Run services**
- `mutelearn` — static frontend (nginx, current setup)
- `mutelearn-api` — Node.js server (separate service)
- Frontend calls API service URL directly
- Simpler Dockerfiles, but need CORS headers on API

Recommended: **Option A** (single container) for simplicity.

### Updated nginx.conf (for Option A)
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Updated Dockerfile (for Option A)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/server /app/server
COPY --from=build /app/src/data/lmsDemoData.js /app/src/data/lmsDemoData.js
COPY --from=build /app/node_modules /app/node_modules
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8080
CMD ["/entrypoint.sh"]
```

### entrypoint.sh
```bash
#!/bin/sh
cd /app && node server/index.js &
nginx -g 'daemon off;'
```

## Files to Modify
| File | Changes |
|------|---------|
| `server/index.js` | Add `POST /connect-token` endpoint, make baseUrl per-session |
| `src/pages/SettingsPage.jsx` | Canvas URL + token connection UI form |
| `src/lib/apiClient.js` | Add `connectCanvasToken` method |
| `src/contexts/PlatformContext.jsx` | Add `connectCanvasToken` flow |
| `Dockerfile` | Run both nginx and node server |
| `nginx.conf` | Proxy `/api/` to node server |
| New: `entrypoint.sh` | Start both processes |

## Verification Checklist
- [ ] Run `npm run api` and `npm run dev` locally
- [ ] Go to Settings → LMS Integration
- [ ] Enter a Canvas URL and personal access token
- [ ] Click Connect — validates and shows account name
- [ ] Click Sync — pulls real courses, assignments, files
- [ ] Dashboard shows real Canvas data (courses, due dates, grades)
- [ ] Courses page shows real course cards
- [ ] Planner shows real assignments sorted by due date
- [ ] Study Packs auto-generated from real assignments
- [ ] Disconnect clears token and reverts to demo
- [ ] Deploy to Cloud Run with server included
- [ ] Verify on production URL

## Security Considerations
- Canvas tokens stored server-side in session (not browser localStorage)
- Tokens never exposed to frontend — only connection status
- File-backed session store works for dev; production should use encrypted storage
- Students should be warned to keep their token private
- Token can be revoked from Canvas Settings at any time
