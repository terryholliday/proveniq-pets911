# ISO 27001 / NIST Control Mapping: AI Safety Governance

## Control Framework Alignment

This document maps AI safety governance controls to ISO 27001:2022 Annex A controls and NIST Cybersecurity Framework (CSF) functions.

| ISO 27001 Control | NIST CSF Function | AI Safety Control | Implementation | Evidence |
|-------------------|-------------------|------------------|----------------|----------|
| **A.5.1: Policies for Information Security** | PR.IP-1 | AI Safety Canon Document | Formal documentation of safety requirements | `AI_SAFETY_CANON.md` |
| **A.8.1: User Endpoint Devices** | PR.DS-1 | Type Safety Enforcement | TypeScript strict mode prevents unsafe code | TypeScript config |
| **A.8.9: Configuration Management** | PR.IP-2 | Automated Governance | Code analysis enforces safety rules | `canon-governance.js` |
| **A.8.16: Monitoring Activities** | DE.CM-1 | CI/CD Monitoring | Automated checks on all changes | GitHub Actions |
| **A.8.20: Malware Detection** | PR.DS-8 | Type Safety | No `any` types prevents unsafe patterns | Governance logs |
| **A.8.23: Web Filtering** | PR.AC-5 | Content Controls | Forbidden phrase detection | Response templates |
| **A.8.24: Use of Cryptography** | PR.DS-2 | Privacy Protection | No collection of sensitive data | Privacy guidance |
| **A.9.1: Access Control Policy** | PR.AC-1 | Code Review Requirements | Pre-commit hooks enforce safety | `.husky/pre-commit` |
| **A.9.2: Access to Networks** | PR.AC-4 | Deployment Controls | CI blocks non-compliant code | Branch protection |
| **A.9.3: User Identification** | PR.AC-2 | Anonymous System | No user accounts required | System design |
| **A.9.4: Access Rights** | PR.AC-3 | Role-Based Access | Different permissions for safety | Git permissions |
| **A.10.1: Cryptographic Controls** | PR.DS-2 | Data Protection | Minimal data collection | Privacy policy |
| **A.12.1: Data Protection** | PR.DS-1 | Privacy by Design | DV responses protect location | Response templates |
| **A.12.2: Data Classification** | PR.IP-1 | Risk Categorization | Priority order for risk routing | Governance script |
| **A.12.3: Data Labelling** | PR.IP-1 | Category Labels | 21 distinct response categories | Test suite |
| **A.14.2: Secure Development** | PR.PS-8 | Safe Coding Practices | TypeScript, governance checks | Development guidelines |
| **A.14.3: Application Security** | PR.PS-8 | Input Validation | Suicide triage with guards | `analyzeSuicideRisk` |
| **A.16.1: Incident Management** | RS.RP-1 | Governance Failures | Failed checks block deployment | CI/CD logs |
| **A.16.2: Response Planning** | RS.RP-1 | Escalation Procedures | Suicide risk escalation paths | Response templates |
| **A.17.1: Information Security Continuity** | PR.PS-1 | Graceful Fallback | `general` category for safety | Test coverage |

## Detailed Implementation Evidence

### A.5.1: Policies for Information Security
**Control Requirement**: Information security policy must be defined, approved, and communicated

**AI Safety Implementation**:
- **Policy Document**: `AI_SAFETY_CANON.md` defines canonical safety requirements
- **Approval Process**: Document version control with change management
- **Communication**: Integrated into development workflow and CI/CD

**Evidence**:
- Policy document with version history
- Developer training materials
- Integration in onboarding process

### A.8.1: User Endpoint Devices
**Control Requirement**: Information stored on, processed by, or accessible via user endpoint devices must be protected

**AI Safety Implementation**:
- **Type Safety**: TypeScript strict mode prevents unsafe code patterns
- **Static Analysis**: Automated type checking prevents runtime errors
- **Code Quality**: No `any` types ensures predictable behavior

**Evidence**:
- `tsconfig.json` with strict settings
- TypeScript compilation logs
- Governance type safety checks

### A.8.9: Configuration Management
**Control Requirement**: Hardware, software, services, and networks must be configured

**AI Safety Implementation**:
- **Automated Governance**: `scripts/canon-governance.js` enforces safety configuration
- **Version Control**: All safety rules tracked in git
- **Change Management**: Pre-commit hooks prevent unsafe changes

**Evidence**:
- Governance script source code
- Git history of safety rule changes
- Pre-commit hook configuration

### A.8.16: Monitoring Activities
**Control Requirement**: Networks, systems, and applications must be monitored

**AI Safety Implementation**:
- **CI/CD Monitoring**: GitHub Actions monitor all changes
- **Test Execution**: Automated testing on every commit
- **Governance Checks**: Continuous safety validation

**Evidence**:
- GitHub Actions workflow logs
- Test execution history
- Governance check results

### A.8.20: Malware Detection
**Control Requirement**: Measures must be implemented to detect malicious code

**AI Safety Implementation**:
- **Type Safety**: Prevents unsafe code patterns that could be exploited
- **Input Validation**: Suicide triage prevents malicious input manipulation
- **Content Filtering**: Forbidden phrase detection prevents harmful outputs

**Evidence**:
- TypeScript compilation preventing unsafe patterns
- Input validation test cases
- Forbidden phrase detection logs

### A.8.23: Web Filtering
**Control Requirement**: Access to information sources must be controlled

**AI Safety Implementation**:
- **Content Controls**: Forbidden phrase detection in responses
- **Template Enforcement**: All responses use predefined safe templates
- **Output Validation**: Automated checks for unsafe content

**Evidence**:
- Response template definitions
- Forbidden phrase lists
- Governance check logs

### A.9.1: Access Control Policy
**Control Requirement**: Access control policy must be established, documented, and reviewed

**AI Safety Implementation**:
- **Code Review Requirements**: All changes must pass safety checks
- **Pre-commit Hooks**: Automated enforcement before commits
- **Branch Protection**: Protected branches require review

**Evidence**:
- Pre-commit hook configuration
- Branch protection rules
- Pull request review process

### A.12.1: Data Protection
**Control Requirement**: Data protection must be ensured in accordance with legal requirements

**AI Safety Implementation**:
- **Privacy by Design**: DV responses include explicit privacy guidance
- **Minimal Collection**: System avoids collecting sensitive information
- **Anonymous Support**: No user accounts or persistent identifiers

**Evidence**:
- DV response templates with privacy guidance
- System architecture documentation
- Privacy policy documentation

### A.12.2: Data Classification
**Control Requirement**: Information must be classified in terms of value, requirements, and criticality

**AI Safety Implementation**:
- **Risk Categorization**: 21 response categories ordered by risk priority
- **Priority Routing**: High-risk categories (suicide, DV) processed first
- **Risk-Based Testing**: Higher-risk categories have extensive test coverage

**Evidence**:
- Priority order definition in governance script
- Risk categorization matrix
- Test coverage by category

### A.14.2: Secure Development
**Control Requirement**: Secure development principles must be applied

**AI Safety Implementation**:
- **TypeScript**: Strongly typed language prevents common vulnerabilities
- **Automated Testing**: Comprehensive test suite prevents regressions
- **Governance Checks**: Automated enforcement of safety rules

**Evidence**:
- Development guidelines
- TypeScript configuration
- Automated test suite

### A.14.3: Application Security
**Control Requirement**: Information security must be integrated into application development

**AI Safety Implementation**:
- **Input Validation**: Suicide triage with negation and attribution guards
- **Output Validation**: Response template contracts enforce safety
- **Error Handling**: Graceful fallback prevents unsafe states

**Evidence**:
- Input validation test cases
- Response template definitions
- Error handling procedures

### A.16.1: Incident Management
**Control Requirement**: Incidents must be managed consistently

**AI Safety Implementation**:
- **Governance Failures**: Failed safety checks block deployment
- **Alerting**: Automated notifications for safety violations
- **Documentation**: All incidents logged and tracked

**Evidence**:
- Incident response procedures
- Alerting configuration
- Incident logs and tracking

### A.17.1: Information Security Continuity
**Control Requirement**: Information security continuity must be ensured

**AI Safety Implementation**:
- **Graceful Fallback**: `general` category ensures safe responses
- **Redundancy**: Multiple safety layers prevent single points of failure
- **Testing**: Regular testing of continuity procedures

**Evidence**:
- Fallback response definitions
- Redundancy documentation
- Continuity test results

## NIST CSF Implementation Details

### Identify (ID)
- **ID.AM-5**: Resources prioritized based on risk (priority order)
- **ID.RA-1**: Risk assessment process (governance checks)
- **ID.RA-3**: Risk communication (CI/CD notifications)

### Protect (PR)
- **PR.AC-1**: Access control policies (code review requirements)
- **PR.AC-5**: Network integrity (content filtering)
- **PR.DS-1**: Data-at-rest security (privacy protection)
- **PR.DS-2**: Data-in-transit security (type safety)
- **PR.IP-1**: Configuration management (automated governance)
- **PR.PS-1**: Baseline configuration (safety canon)
- **PR.PS-8**: Response planning (incident procedures)

### Detect (DE)
- **DE.CM-1**: Monitoring (CI/CD checks)
- **DE.CM-8**: Vulnerability scanning (type checking)

### Respond (RS)
- **RS.RP-1**: Response plan (incident management)
- **RS.RP-2**: Response planning (escalation procedures)

### Recover (RC)
- **RC.RP-1**: Recovery planning (graceful fallback)
- **RC.RP-2**: Improvement (continuous monitoring)

## Compliance Evidence Matrix

### Required Documentation
- [ ] AI Safety Canon (A.5.1)
- [ ] Configuration Management (A.8.9)
- [ ] Monitoring Procedures (A.8.16)
- [ ] Access Control Policy (A.9.1)
- [ ] Data Protection Policy (A.12.1)
- [ ] Secure Development Guidelines (A.14.2)
- [ ] Incident Management Plan (A.16.1)
- [ ] Continuity Plan (A.17.1)

### Technical Evidence
- [ ] Governance Script Source Code
- [ ] CI/CD Pipeline Configuration
- [ ] Test Suite Results
- [ ] Type Safety Configuration
- [ ] Response Template Definitions
- [ ] Privacy Implementation
- [ ] Monitoring Logs
- [ ] Incident Reports

### Verification Activities
- [ ] Quarterly Governance Review
- [ ] Annual Risk Assessment
- [ ] Penetration Testing Results
- [ ] Compliance Audit Reports
- [ ] Training Records
- [ ] Policy Review Sign-offs

---

**Document Control**: ISO-NIST-MAP-001  
**Effective Date**: 2025-01-05  
**Review Date**: 2026-01-05  
**Owner**: Security & Compliance Team
