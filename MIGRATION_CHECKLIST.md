# Repository Migration Checklist

## Pre-Migration Preparation

### 1. Backup Current Repository
- [ ] Create full backup of current repository
- [ ] Tag current state with `pre-migration` tag
- [ ] Document current branch structure

### 2. Create New Repositories
- [ ] Create `proveniq-Pet911` repository
- [ ] Create `proveniq-trust` repository
- [ ] Configure repository settings (teams, protections, etc.)
- [ ] Set up branch protection rules

## Phase 1: Update Current Repository (proveniq-pets911 → proveniq-Pet911)

### Repository Configuration
- [x] Update `package.json` name field
- [x] Update README.md title
- [x] Update API headers in `ori-empathy.ts`
- [ ] Update any hardcoded URLs in configuration
- [ ] Update deployment configuration files
- [ ] Update environment variable names if needed

### Documentation Updates
- [x] Create `REPO_REORGANIZATION.md`
- [x] Create `docs/REPOSITORY_STRUCTURE.md`
- [x] Create `MIGRATION_CHECKLIST.md`
- [ ] Update all README references
- [ ] Update API documentation
- [ ] Update contributing guidelines

## Phase 2: Setup proveniq-trust Repository

### Initial Setup
- [ ] Clone template from proveniq-Pet911
- [ ] Remove app-specific files
- [ ] Update package.json with new name/description
- [ ] Configure CI/CD pipeline
- [ ] Set up deployment configuration

### Directory Structure Creation
- [ ] Create directories for organizational content
- [ ] Set up CMS configuration (Sanity.io)
- [ ] Create placeholder pages
- [ ] Set up component structure

## Phase 3: Move Content to proveniq-trust

### Organizational Pages
- [ ] Copy `/src/app/about/page.tsx`
- [ ] Copy `/src/app/press/page.tsx`
- [ ] Update branding and navigation
- [ ] Remove from Pet911 repository
- [ ] Test links and routing

### Support Components
- [ ] Copy `/src/components/support/` directory
- [ ] Copy `/src/lib/services/ori-empathy.ts`
- [ ] Copy `/src/lib/ai/SupportCompanionPersona.ts`
- [ ] Copy `/src/lib/ai/counselor-engine.ts`
- [ ] Copy `/src/app/support/page.tsx`
- [ ] Rename "Ori" references to "Support Companion"
- [ ] Update imports and dependencies
- [ ] Remove from Pet911 repository

### Legal Documents
- [ ] Copy `/src/app/terms/page.tsx`
- [ ] Copy `/src/app/privacy/page.tsx`
- [ ] Update with nonprofit information
- [ ] Add additional legal documents
- [ ] Remove from Pet911 repository

## Phase 4: Update proveniq-Pet911

### Remove Moved Content
- [ ] Delete organizational pages
- [ ] Delete support components
- [ ] Delete empathy services
- [ ] Delete legal pages
- [ ] Update navigation to link to trust site

### Update Application Logic
- [ ] Remove support companion references
- [ ] Update onboarding flow
- [ ] Update home page links
- [ ] Clean up unused imports
- [ ] Update routing configuration

### Cross-Repository Integration
- [ ] Add links to proveniq.org for organizational info
- [ ] Implement SSO if needed
- [ ] Set up API access for trust site
- [ ] Configure shared authentication

## Phase 5: Domain and Deployment Configuration

### Domain Setup
- [ ] Configure `Pet911.proveniq.org` → proveniq-Pet911
- [ ] Configure `proveniq.org` → proveniq-trust
- [ ] Set up `api.proveniq.org` as shared gateway
- [ ] Configure SSL certificates
- [ ] Update DNS records

### Deployment Updates
- [ ] Update Vercel projects
- [ ] Configure environment variables
- [ ] Set up build hooks
- [ ] Test deployment pipelines
- [ ] Update monitoring configuration

## Phase 6: Testing and Validation

### Functionality Testing
- [ ] Test all app features in Pet911
- [ ] Test all pages in trust site
- [ ] Test cross-site navigation
- [ ] Test authentication flow
- [ ] Test API integrations

### Content Review
- [ ] Review all text for branding consistency
- [ ] Check for "Ori" references and remove
- [ ] Validate legal documents
- [ ] Review contact information
- [ ] Check social media links

### Performance Testing
- [ ] Run Lighthouse audits
- [ ] Test offline functionality
- [ ] Verify Core Web Vitals
- [ ] Test mobile responsiveness
- [ ] Check accessibility compliance

## Phase 7: Post-Migration Tasks

### Communication
- [ ] Notify team of repository changes
- [ ] Update documentation links
- [ ] Announce new structure to stakeholders
- [ ] Update project management tools

### Maintenance
- [ ] Set up automated dependency updates
- [ ] Configure security scanning
- [ ] Set up backup procedures
- [ ] Document maintenance procedures

### Archive Old Repository
- [ ] Archive proveniq-pets911 repository
- [ ] Add migration notice to old README
- [ ] Set up redirect notices
- [ ] Update all external references

## Rollback Plan

If migration fails:
1. Revert to `pre-migration` tag
2. Restore from backup
3. Notify team of rollback
4. Document failure reasons
5. Plan retry with fixes

## Success Criteria

- [ ] All repositories created and configured
- [ ] All content moved successfully
- [ ] No broken links or 404s
- [ ] Authentication works across sites
- [ ] Performance metrics maintained
- [ ] Team trained on new structure
- [ ] Documentation fully updated

## Notes

- Keep branches separate until migration is complete
- Test in staging environment before production
- Have team review each phase before proceeding
- Document any deviations from this checklist
