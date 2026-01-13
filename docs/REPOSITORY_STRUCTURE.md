# PROVENIQ Repository Structure Documentation

## Overview

PROVENIQ operates two main repositories to separate the emergency coordination application from nonprofit operations:

1. **proveniq-PetMayday** - Emergency pet coordination PWA
2. **proveniq-trust** - Nonprofit organization website and services

## proveniq-PetMayday Repository

### Purpose
Emergency coordination system for lost and found pets in West Virginia. This is a mission-critical, offline-first Progressive Web Application (PWA).

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS
- **Auth**: Firebase Auth
- **Database**: Supabase/Postgres
- **Offline Storage**: IndexedDB via `idb`
- **Deployment**: Vercel (recommended)

### Directory Structure
```
proveniq-PetMayday/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── emergency/         # Emergency finder assist
│   │   ├── missing/           # Missing pet reporting
│   │   ├── sighting/          # Sighting reporting
│   │   ├── sightings/         # View all sightings
│   │   ├── admin/             # Moderator console
│   │   ├── api/               # API routes
│   │   ├── help/              # Safety and help pages
│   │   └── onboarding/        # User onboarding
│   ├── components/            # Reusable components
│   │   ├── emergency/         # Emergency triage components
│   │   ├── moderator/         # Moderator UI components
│   │   ├── ui/                # Base UI components
│   │   ├── offline/           # Offline status indicators
│   │   ├── notifications/     # Notification system
│   │   └── county/            # County selection
│   ├── lib/                   # Utility libraries
│   │   ├── db/                # IndexedDB stores
│   │   ├── hooks/             # Custom React hooks
│   │   ├── sync/              # Offline sync worker
│   │   ├── api/               # API client
│   │   └── utils/             # Helper functions
│   ├── contexts/              # React contexts
│   └── types/                 # TypeScript type definitions
├── supabase/
│   └── migrations/            # Database schema migrations
├── docs/                      # Documentation
├── scripts/                   # Build and utility scripts
└── public/                    # Static assets
```

### Key Features
- **Emergency Triage**: Route found animals to appropriate care
- **Missing Pet Reports**: File and track missing pets
- **Sighting Reports**: Report found animal sightings
- **AI-Assisted Matching**: Intelligent clustering of sightings
- **Offline-First**: Full functionality without internet
- **Moderator Console**: Review and manage cases
- **Real-time Notifications**: Emergency alerts and updates

## proveniq-trust Repository

### Purpose
Nonprofit organization website housing organizational information, support services, and community engagement features.

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS
- **CMS**: Sanity.io (recommended for content management)
- **Payment**: Stripe (for donations)
- **Email**: Resend (for communications)

### Directory Structure (Proposed)
```
proveniq-trust/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── about/             # Organization about page
│   │   ├── press/             # Press and media
│   │   ├── support/           # Support companion
│   │   ├── donate/            # Donation pages
│   │   ├── volunteer/         # Volunteer opportunities
│   │   ├── partners/          # Partner organizations
│   │   ├── blog/              # News and stories
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   │   ├── support/           # Support companion UI
│   │   ├── donation/          # Donation components
│   │   ├── blog/              # Blog components
│   │   └── ui/                # Base UI components
│   ├── lib/                   # Utility libraries
│   │   ├── ai/                # Support companion AI
│   │   ├── services/          # External service integrations
│   │   └── utils/             # Helper functions
│   └── types/                 # TypeScript type definitions
├── sanity/                    # Sanity CMS configuration
├── docs/                      # Legal and policy documents
├── assets/                    # Media assets
└── public/                    # Static assets
```

### Key Features
- **Organization Information**: Mission, vision, team
- **Press Kit**: Media resources and press releases
- **Support Companion**: AI empathy support for pet parents
- **Donation System**: Online donation processing
- **Volunteer Management**: Volunteer signup and coordination
- **Partner Directory**: Partner organization showcase
- **Blog/News**: Stories and updates
- **Legal Documents**: Privacy policy, terms, etc.

## Shared Resources

### Authentication
- Single Sign-On (SSO) between both repositories
- Shared Firebase Auth project
- Common user profiles

### Design System
- Shared component library
- Common color palette and typography
- Unified branding guidelines

### API Integration
- Trust site reads from PetMayday for impact metrics
- Shared webhook endpoints for notifications
- Common database for user data

## Deployment Architecture

### Domains
- **PetMayday.proveniq.org** - Emergency application
- **proveniq.org** - Nonprofit website
- **api.proveniq.org** - Shared API gateway

### Hosting
- **Vercel** - Frontend applications
- **Supabase** - Database and backend
- **Firebase** - Authentication and cloud functions
- **Cloudflare** - CDN and DNS

### CI/CD
- GitHub Actions for automated testing
- Automated deployments on merge to main
- Environment-specific configurations

## Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### Code Standards
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Jest for unit testing
- Playwright for E2E testing

### Documentation
- README in each repository
- API documentation with OpenAPI
- Component documentation with Storybook
- Architecture decision records (ADRs)

## Security Considerations

### Data Protection
- PII encryption at rest and in transit
- Role-based access control (RBAC)
- Audit logging for sensitive operations
- GDPR compliance measures

### Application Security
- OWASP Top 10 compliance
- Regular security audits
- Dependency vulnerability scanning
- CSP headers implemented

## Monitoring and Analytics

### Application Monitoring
- Sentry for error tracking
- Vercel Analytics for performance
- Custom dashboards for KPIs
- Uptime monitoring

### Business Metrics
- User engagement tracking
- Success rate metrics
- Geographic coverage analysis
- Impact measurement

## Future Considerations

### Scalability
- Multi-state expansion readiness
- Microservices architecture preparation
- Database sharding strategy
- CDN optimization

### New Features
- Mobile apps (iOS/Android)
- Advanced AI matching
- Integration with veterinary systems
- Municipal partnership portals
