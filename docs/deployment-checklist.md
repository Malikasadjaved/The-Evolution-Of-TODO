# Deployment Checklist - Phase 3 AI Chatbot

> **📋 Complete Deployment Guide**
> This checklist ensures all critical steps are completed before deploying the Phase 3 AI Chatbot to production.

**Constitution:** `.specify/memory/phase-3-constitution.md` (v1.1.0)
**Last Updated:** 2025-12-26

---

## Table of Contents

1. [Pre-Deployment](#pre-deployment)
2. [Domain Configuration](#domain-configuration)
3. [Production Deployment](#production-deployment)
4. [Post-Deployment](#post-deployment)
5. [Monitoring & Logging](#monitoring--logging)
6. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment

### Environment Variables

- [ ] **Backend `.env` configured**
  - [ ] `BETTER_AUTH_SECRET` generated (≥32 characters)
    ```bash
    python -c "import secrets; print(secrets.token_urlsafe(32))"
    ```
  - [ ] `OPENAI_API_KEY` configured (from https://platform.openai.com/api-keys)
  - [ ] `DATABASE_URL` points to production database (Neon PostgreSQL)
  - [ ] `FRONTEND_URL` set to production frontend URL
  - [ ] `DEBUG=False` for production
  - [ ] `HOST=0.0.0.0` for Docker
  - [ ] `PORT=8000` configured

- [ ] **Frontend `.env.local` configured**
  - [ ] `NEXT_PUBLIC_API_URL` points to production backend URL
  - [ ] `BETTER_AUTH_SECRET` matches backend exactly
  - [ ] `BETTER_AUTH_URL` set to production auth endpoint

### OpenAI API Configuration

- [ ] **API key validated**
  ```bash
  curl https://api.openai.com/v1/models \
    -H "Authorization: Bearer $OPENAI_API_KEY"
  ```
- [ ] **Usage limits configured** (rate limiting, quotas)
- [ ] **Billing configured** (payment method, spending limits)
- [ ] **API key rotated** (old key from security audit revoked)

### Database Migrations

- [ ] **Alembic migrations created**
  ```bash
  cd backend
  alembic revision --autogenerate -m "Initial schema"
  ```
- [ ] **Migrations reviewed** (verify generated SQL)
- [ ] **Migrations tested** on staging database
- [ ] **Production migrations run**
  ```bash
  alembic upgrade head
  ```
- [ ] **Database schema verified**
  ```bash
  psql $DATABASE_URL -c "\dt"  # List tables
  ```

### Health Checks

- [ ] **Backend health endpoint working**
  ```bash
  curl http://localhost:8000/health
  # Expected: {"status": "healthy"}
  ```
- [ ] **Database connection verified**
  ```bash
  curl http://localhost:8000/health/db
  ```
- [ ] **MCP server health check**
  ```bash
  curl http://localhost:8000/mcp/health
  ```
- [ ] **Frontend health check**
  ```bash
  curl http://localhost:3001
  ```

### Tests & Code Quality

- [ ] **Backend tests passing** (≥85% coverage required)
  ```bash
  cd backend
  pytest --cov=src --cov=mcp --cov-report=term-missing
  ```
  - [ ] Unit tests: `tests/unit/` (≥90% coverage)
  - [ ] Integration tests: `tests/integration/` (≥80% coverage)
  - [ ] E2E tests: `tests/e2e/` (critical paths only)
  - [ ] Performance tests: `tests/performance/` (baseline established)

- [ ] **Frontend tests passing** (≥60% coverage)
  ```bash
  cd frontend-chatbot
  npm test -- --coverage
  ```

- [ ] **Security audit complete** (T117-T119 from security-audit.md)
  - [ ] T117: Input sanitization ✅
  - [ ] T118: No PII in logs ✅
  - [ ] T119: No hardcoded secrets ✅

- [ ] **Code quality checks passing**
  ```bash
  # Backend
  black src/ mcp/ tests/
  flake8 src/ mcp/ tests/
  mypy src/ mcp/

  # Frontend
  npm run lint
  npm run type-check
  ```

### Build Validation

- [ ] **Docker images build successfully**
  ```bash
  # Backend
  cd backend
  docker build -t todo-backend:latest .

  # Frontend
  cd frontend-chatbot
  docker build -t todo-frontend-chatbot:latest .
  ```

- [ ] **Docker Compose validation**
  ```bash
  docker-compose config  # Validate syntax
  docker-compose up -d   # Test startup
  docker-compose down    # Cleanup
  ```

- [ ] **Image sizes optimized**
  ```bash
  docker images | grep todo
  # Backend should be <500MB
  # Frontend should be <200MB
  ```

---

## Domain Configuration

### Frontend Deployment

- [ ] **Frontend deployed to production** (Vercel/Netlify/Custom)
  - Platform: _________________
  - Production URL: _________________
  - SSL/TLS certificate: ✅ Auto (Vercel) or Manual

- [ ] **Environment variables configured** on hosting platform
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `BETTER_AUTH_SECRET`
  - [ ] `BETTER_AUTH_URL`

- [ ] **Build deployed successfully**
  ```bash
  cd frontend-chatbot
  npm run build
  npm start  # Test production build locally
  ```

### OpenAI Domain Allowlist

**Required for ChatKit integration** (see `specs/002-ai-chatbot-mcp/quickstart.md`)

- [ ] **Production frontend URL obtained**
  - Example: `https://todo-chatbot.vercel.app`

- [ ] **Domain added to OpenAI allowlist**
  1. Go to: https://platform.openai.com/settings/organization/domains
  2. Click "Add domain"
  3. Enter: `todo-chatbot.vercel.app` (without https://)
  4. Verify domain ownership (DNS TXT record or file upload)

- [ ] **Domain verification complete**
  - Verification method: DNS TXT / File Upload
  - Status: ✅ Verified

- [ ] **Domain key obtained**
  - Copy domain key from OpenAI dashboard
  - Format: `dk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### ChatKit Configuration

- [ ] **Domain key configured in frontend**
  ```typescript
  // frontend-chatbot/src/lib/chatkit.ts
  export const CHATKIT_CONFIG = {
    domainKey: process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY,
    // ...
  }
  ```

- [ ] **Environment variable added**
  ```bash
  # .env.local
  NEXT_PUBLIC_OPENAI_DOMAIN_KEY=dk_live_xxxxxxxx
  ```

- [ ] **ChatKit widget tested** on production domain
  - [ ] Widget loads successfully
  - [ ] MCP tools connect to backend
  - [ ] Task operations working (add, list, update, delete, toggle)

---

## Production Deployment

### Secrets Management

⚠️ **CRITICAL: Never use .env files in production**

- [ ] **Secrets stored in secure vault**
  - Platform: AWS Secrets Manager / HashiCorp Vault / Cloud Provider
  - Secrets migrated from .env files:
    - [ ] `BETTER_AUTH_SECRET`
    - [ ] `OPENAI_API_KEY`
    - [ ] `DATABASE_URL` (PostgreSQL connection string)

- [ ] **Environment variables injected at runtime**
  ```bash
  # Example: Docker Swarm secrets
  docker secret create better_auth_secret ./secret.txt

  # Example: Kubernetes secrets
  kubectl create secret generic todo-secrets \
    --from-literal=BETTER_AUTH_SECRET=xxx \
    --from-literal=OPENAI_API_KEY=xxx
  ```

- [ ] **.env files added to .gitignore** ✅ (completed in T119)

- [ ] **.env files removed from git history**
  ```bash
  # If secrets were ever committed:
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch backend/.env" \
    --prune-empty --tag-name-filter cat -- --all
  ```

### Docker Production Build

- [ ] **Multi-stage Dockerfiles optimized** ✅ (T120)
  - [ ] Backend Dockerfile (106 lines)
  - [ ] Frontend Dockerfile (102 lines)

- [ ] **Production images tagged**
  ```bash
  # Tag with version
  docker tag todo-backend:latest todo-backend:v1.0.0
  docker tag todo-frontend-chatbot:latest todo-frontend-chatbot:v1.0.0

  # Tag with git commit
  docker tag todo-backend:latest todo-backend:$(git rev-parse --short HEAD)
  ```

- [ ] **Images pushed to registry**
  ```bash
  # Docker Hub
  docker push yourusername/todo-backend:v1.0.0
  docker push yourusername/todo-frontend-chatbot:v1.0.0

  # AWS ECR
  aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
  docker push <account>.dkr.ecr.<region>.amazonaws.com/todo-backend:v1.0.0
  ```

### Database Configuration

- [ ] **Production database provisioned** (Neon PostgreSQL)
  - [ ] Database created: `todo_db`
  - [ ] User created with least-privilege permissions
  - [ ] SSL/TLS enabled (`sslmode=require`)
  - [ ] Connection pooling configured

- [ ] **Database backups configured**
  - Backup frequency: Daily at 2 AM UTC
  - Retention: 30 days
  - Backup location: _________________

- [ ] **Database monitoring enabled**
  - [ ] Connection pool metrics
  - [ ] Query performance tracking
  - [ ] Storage usage alerts

### SSL/TLS Configuration

- [ ] **Backend SSL certificate obtained**
  - Certificate provider: Let's Encrypt / Cloud Provider
  - Certificate expiry: _________________
  - Auto-renewal configured: Yes / No

- [ ] **Frontend SSL certificate obtained** ✅ (auto via Vercel/Netlify)

- [ ] **HTTPS enforced** (redirect HTTP → HTTPS)
  ```nginx
  # Nginx example
  server {
    listen 80;
    return 301 https://$host$request_uri;
  }
  ```

### Reverse Proxy / Load Balancer

- [ ] **Reverse proxy configured** (Nginx/Traefik/Cloud LB)
  - [ ] SSL termination
  - [ ] HTTP/2 enabled
  - [ ] Compression (gzip/brotli)
  - [ ] Rate limiting (100 req/min per IP)
  - [ ] Request timeout (30s)

- [ ] **CORS configured correctly**
  ```python
  # backend/src/api/main.py
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://todo-chatbot.vercel.app"],  # Production URL only
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE"],
      allow_headers=["*"],
  )
  ```

### Container Orchestration

- [ ] **Orchestration platform selected**
  - Platform: Docker Compose / Kubernetes / ECS / Cloud Run
  - Configuration file: _________________

- [ ] **Health checks configured** ✅ (T121 - docker-compose.yml)
  - [ ] Backend: `/health` endpoint (30s interval)
  - [ ] Frontend: HTTP 200 check (30s interval)
  - [ ] Database: `pg_isready` (10s interval)

- [ ] **Restart policies configured** ✅ (`restart: unless-stopped`)

- [ ] **Resource limits configured**
  ```yaml
  # docker-compose.yml or k8s manifest
  resources:
    limits:
      memory: 512M
      cpu: "0.5"
    requests:
      memory: 256M
      cpu: "0.25"
  ```

---

## Post-Deployment

### Smoke Tests

- [ ] **Frontend loads successfully**
  - Visit: `https://<production-url>`
  - Expected: Landing page renders without errors

- [ ] **Authentication works**
  - [ ] Sign up new user
  - [ ] Sign in existing user
  - [ ] JWT token issued correctly
  - [ ] Protected routes accessible

- [ ] **CRUD operations work**
  - [ ] Create task
  - [ ] List tasks (user-specific)
  - [ ] Update task
  - [ ] Delete task
  - [ ] Toggle task status

- [ ] **MCP integration works**
  - [ ] ChatKit widget loads
  - [ ] `/add_task` tool works
  - [ ] `/list_tasks` tool works
  - [ ] `/update_task` tool works
  - [ ] `/delete_task` tool works
  - [ ] `/toggle_task_status` tool works

- [ ] **User isolation verified**
  - [ ] User A cannot see User B's tasks
  - [ ] Attempt to access other user's task returns 403

### Performance Testing

- [ ] **Load testing performed**
  ```bash
  # Example: Apache Bench
  ab -n 1000 -c 10 https://<production-url>/api/health
  ```
  - [ ] API response time: <200ms (p95)
  - [ ] Frontend load time: <2s (p95)
  - [ ] No memory leaks detected

- [ ] **Database query optimization**
  - [ ] Slow query log reviewed
  - [ ] Indexes created for common queries
  - [ ] Query plan analyzed (`EXPLAIN ANALYZE`)

### Security Validation

- [ ] **Security headers configured**
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Content-Security-Policy: default-src 'self'
  ```

- [ ] **Secrets rotated** (if exposed during development)
  - [ ] `BETTER_AUTH_SECRET` rotated ✅ (T119)
  - [ ] `OPENAI_API_KEY` rotated ✅ (T119)
  - [ ] Database password rotated

- [ ] **Vulnerability scan run**
  ```bash
  # Docker image scan
  docker scan todo-backend:latest
  docker scan todo-frontend-chatbot:latest

  # Dependency scan
  npm audit fix
  pip-audit
  ```

---

## Monitoring & Logging

### Application Monitoring

- [ ] **APM tool configured** (Datadog / New Relic / Sentry)
  - [ ] Error tracking enabled
  - [ ] Performance monitoring enabled
  - [ ] Custom metrics configured

- [ ] **Uptime monitoring configured** (UptimeRobot / Pingdom)
  - [ ] Backend health check: `https://<api-url>/health`
  - [ ] Frontend health check: `https://<frontend-url>`
  - [ ] Alert contacts configured

### Logging

- [ ] **Centralized logging configured** (CloudWatch / ELK / Grafana Loki)
  - [ ] Backend logs forwarded
  - [ ] Frontend logs forwarded
  - [ ] Database logs forwarded

- [ ] **Log levels configured correctly**
  ```python
  # Production: INFO or WARNING
  # Development: DEBUG
  LOGGING_LEVEL = "INFO"
  ```

- [ ] **PII protection verified** ✅ (T118)
  - [ ] No email addresses logged
  - [ ] User IDs hashed (SHA256)
  - [ ] Sensitive fields redacted

- [ ] **Structured logging enabled**
  ```python
  # backend/mcp/utils/logger.py
  logger.info(
      event="user_signed_in",
      user_id="hash(user.id)",
      timestamp=datetime.utcnow().isoformat()
  )
  ```

### Alerting

- [ ] **Alerts configured** for critical metrics
  - [ ] High error rate (>5% of requests)
  - [ ] High response time (>500ms p95)
  - [ ] Database connection failures
  - [ ] Container restarts (>3 in 10 minutes)
  - [ ] Disk usage >80%
  - [ ] Memory usage >90%

- [ ] **Alert channels configured**
  - [ ] Email: _________________
  - [ ] Slack: _________________
  - [ ] PagerDuty: _________________

### Dashboards

- [ ] **Monitoring dashboard created**
  - [ ] API request rate
  - [ ] API error rate
  - [ ] API response time (p50, p95, p99)
  - [ ] Database connections
  - [ ] Active users
  - [ ] Task operations (create, update, delete)

---

## Rollback Procedures

### Quick Rollback

- [ ] **Previous Docker images tagged and available**
  ```bash
  docker images | grep todo-backend
  # v1.0.0 (current)
  # v0.9.0 (previous - rollback target)
  ```

- [ ] **Rollback command documented**
  ```bash
  # Docker Compose
  docker-compose down
  docker tag todo-backend:v0.9.0 todo-backend:latest
  docker-compose up -d

  # Kubernetes
  kubectl rollout undo deployment/todo-backend
  ```

### Database Rollback

- [ ] **Database backup before migration**
  ```bash
  # Create backup
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

  # Restore backup
  psql $DATABASE_URL < backup_20251226_120000.sql
  ```

- [ ] **Migration rollback tested**
  ```bash
  alembic downgrade -1  # Rollback one migration
  ```

### Rollback Testing

- [ ] **Rollback procedure tested on staging**
- [ ] **Rollback time measured**: ___________ minutes
- [ ] **Data loss verified**: None / Acceptable

---

## Sign-Off

### Deployment Team

- [ ] **Backend Developer**: _____________ (Date: _______)
- [ ] **Frontend Developer**: _____________ (Date: _______)
- [ ] **DevOps Engineer**: _____________ (Date: _______)
- [ ] **QA Engineer**: _____________ (Date: _______)
- [ ] **Security Review**: _____________ (Date: _______)
- [ ] **Product Owner**: _____________ (Date: _______)

### Deployment Approval

- [ ] **Staging deployment successful**: Yes / No
- [ ] **All checklist items complete**: Yes / No
- [ ] **Production deployment approved**: Yes / No

**Deployment Date**: _________________
**Deployment Time**: _________________
**Deployed By**: _________________

---

## Appendix

### Useful Commands

```bash
# Check Docker Compose logs
docker-compose logs -f backend
docker-compose logs -f frontend-chatbot
docker-compose logs -f database

# Check container health
docker ps
docker inspect <container_id> | grep Health

# Database connection
psql $DATABASE_URL

# Backend API test
curl https://<api-url>/health
curl https://<api-url>/docs  # Swagger UI

# Frontend build test
cd frontend-chatbot
npm run build
npm start

# Docker cleanup
docker system prune -a --volumes
```

### References

- **Constitution**: `.specify/memory/phase-3-constitution.md`
- **Architecture**: `specs/002-ai-chatbot-mcp/architecture.md`
- **API Spec**: `specs/002-ai-chatbot-mcp/api.md`
- **MCP Tools**: `specs/002-ai-chatbot-mcp/mcp-tools.md`
- **Quickstart**: `specs/002-ai-chatbot-mcp/quickstart.md`
- **Security Audit**: `docs/security-audit.md`

### Support Contacts

- **Backend Issues**: _________________
- **Frontend Issues**: _________________
- **Infrastructure Issues**: _________________
- **Database Issues**: _________________
- **Emergency Escalation**: _________________

---

**Document Version**: 1.0.0
**Last Reviewed**: 2025-12-26
**Next Review**: _________________
