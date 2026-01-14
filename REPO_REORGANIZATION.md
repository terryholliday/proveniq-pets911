# Repository Reorganization: PROVENIQ Pet 911 & PROVENIQ Charitable Trust

## Overview

The PetNexus petmayday project has been split into two repositories to better separate concerns:

1. **PetNexus-petmayday** - The emergency pet coordination application
2. **proveniq-trust** - All nonprofit-related content and operations

## Files/Components to Move to proveniq-trust

### 1. Organizational Pages
These pages belong in the nonprofit repository as they describe the organization rather than the app:
- `/src/app/about/page.tsx` - Organization about page
- `/src/app/press/page.tsx` - Press and media information
- Future: `/partners` - Partner organizations
- Future: `/donate` - Donation page
- Future: `/volunteer` - Volunteer information
- Future: `/careers` - Job opportunities
- Future: `/blog` - Nonprofit blog/stories

### 2. Support & Empathy Components
The empathy companion is a nonprofit service, not a core app feature:
- `/src/components/support/` - Entire directory
  - `SupportCompanionAvatar.tsx`
  - `SupportCompanionChat.tsx`
- `/src/lib/services/ori-empathy.ts` - Origins empathy integration
- `/src/lib/ai/SupportCompanionPersona.ts` - Support companion persona
- `/src/lib/ai/counselor-engine.ts` - AI counselor engine
- `/src/app/support/page.tsx` - Support companion page

### 3. Legal & Policy Documents
These should be maintained by the nonprofit:
- `/src/app/terms/page.tsx` - Terms of service
- `/src/app/privacy/page.tsx` - Privacy policy
- Future: Governance documents
- Future: Annual reports
- Future: Financial statements

### 4. Branding Assets
- Logo files (when created)
- Brand guidelines
- Press kit materials
- Marketing templates

## Staying in proveniq-petmayday

### Core Application Features
- Emergency finder assist (`/emergency`)
- Missing pet reporting (`/missing/*`)
- Sighting reporting (`/sighting/*`, `/sightings`)
- Moderator console (`/admin/pigpig`)
- Onboarding flow (`/onboarding`)
- Safety pages (`/help/safety`, `/app-store-safety`)

### Technical Components
- All API routes
- Database schemas and migrations
- Offline functionality
- County pack system
- Notification system
- Authentication logic

### UI Components
- Emergency components
- Moderator components
- Form components
- Layout components
- Offline status components

## Implementation Steps

1. **Create proveniq-trust repository structure**
   ```
   proveniq-trust/
   ├── src/
   │   ├── pages/          # Organizational pages
   │   ├── components/     # Support components
   │   ├── lib/           # AI and empathy services
   │   └── assets/        # Branding assets
   ├── docs/             # Legal and policy docs
   └── static/           # Static assets
   ```

2. **Move identified files**
   - Copy files to new repository
   - Update imports and references
   - Remove from petmayday repo

3. **Update petmayday application**
   - Remove references to moved components
   - Update navigation to point to trust site where needed
   - Add links to trust domain for organizational info

4. **Configure domains**
   - petmayday.proveniq.org (or similar) - Application
   - proveniq.org - Nonprofit organization site

5. **Update documentation**
   - Update READMEs
   - Update API documentation
   - Update deployment configurations

## Cross-Repository Dependencies

### Authentication
- Shared auth system between both repositories
- Single Sign-On (SSO) implementation
- Shared user database

### API Integration
- Trust site may need API access to petmayday for:
  - Donation tracking
  - Impact metrics
  - Volunteer management

### Brand Consistency
- Shared design system
- Common component library
- Unified color scheme and typography

## Timeline

1. **Phase 1** (Immediate): Update repository names and documentation
2. **Phase 2** (Next): Create trust repository structure
3. **Phase 3** (Following): Move organizational content
4. **Phase 4** (Final): Configure domains and cross-repo integration

## Notes

- The empathy companion ("Ori") should be renamed to "Support Companion" as per organizational guidelines
- All references to "Ori" or "Origins app character" should be removed
- The trust repository will focus on the nonprofit mission, stories, and community engagement
- The petmayday repository will focus purely on the emergency coordination functionality
