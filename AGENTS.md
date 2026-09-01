# Base44 development notes

- Start the app with `docker compose -f docker-compose.base44.yml up -d`.
- The Vite development server is exposed on host port 3000 and serves the bind-mounted repository source with hot reload.
- No external services, migrations, seeds, or credentials are required.
- Verify availability with `curl -fsS http://localhost:3000/` and verify preview-host access with `curl -fsS -H 'Host: external-preview.example.com' http://localhost:3000/`.
- Run the compile check inside the service with `docker compose -f docker-compose.base44.yml exec -T web npm run build`.
