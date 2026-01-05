# SOC 2 Type II AI Safety Narrative

## System Description
The Pet Crisis Support Companion is an AI-powered system designed to provide emotional support and guidance to individuals experiencing pet loss, pet-related crises, and anticipatory grief. The system uses a deterministic, rule-based counselor engine to route user inputs to appropriate response categories while maintaining strict safety boundaries.

## Trust Services Criteria
### Security (Common Criteria 6)
The system implements automated governance controls to ensure AI safety requirements are met:

**Control Implementation:**
- **Automated Code Review**: `scripts/canon-governance.js` enforces canonical safety requirements including priority order, suicide triage safety, and response template contracts
- **Pre-commit Hooks**: `.husky/pre-commit` prevents commits that violate safety rules
- **CI/CD Pipeline**: `.github/workflows/canon-governance.yml` runs automated safety checks on all changes

**Evidence:**
- Governance script execution logs showing all checks passing
- Test coverage reports verifying minimum 2 tests per category
- Type safety enforcement preventing unsafe code patterns

### Availability (Common Criteria 1)
The system maintains availability through:

**Control Implementation:**
- **Graceful Fallback**: `general` category ensures all inputs receive appropriate responses
- **Error Handling**: Deterministic routing prevents system failures from exposing unsafe content
- **Monitoring**: Automated tests verify system behavior across all categories

**Evidence:**
- Test suites covering all 21 response categories
- Governance checks ensuring no category is untested
- Fallback response verification

### Processing Integrity (Common Criteria 8)
The system ensures processing integrity through:

**Control Implementation:**
- **Deterministic Routing**: Fixed priority order prevents race conditions and ensures predictable behavior
- **Input Validation**: Suicide risk triage with negation and attribution guards prevents misclassification
- **Template Enforcement**: All responses use predefined templates with required and forbidden content

**Evidence:**
- Priority order verification in governance checks
- Suicide triage safety tests with negation/attribution scenarios
- Response template contract validation

### Confidentiality (Common Criteria 7)
The system protects confidential information through:

**Control Implementation:**
- **Privacy by Design**: DV coercive control responses include explicit privacy guidance
- **No Data Collection**: System does not request or store precise location data
- **Safe Prompts**: Responses avoid asking for identifying information from at-risk users

**Evidence:**
- DV response templates containing privacy guidance
- Governance checks forbidding location requests in DV contexts
- Test cases verifying privacy-safe responses

### Privacy (Common Criteria 8)
The system respects privacy through:

**Control Implementation:**
- **Minimal Data Collection**: Only collects necessary information for response routing
- **Anonymous Support**: No user accounts or persistent identifiers required
- **Safe Disclosure**: Provides resources without requiring personal details

**Evidence:**
- System design documentation showing anonymous usage
- Response templates avoiding personal data requests
- Privacy guidance in high-risk scenarios

## AI-Specific Controls

### Safety Guardrails
**Control**: Automated enforcement of "No Certainty / No Medical Advice / No False Hope" principles

**Implementation**:
- Governance script checks for forbidden phrases and certainty language
- Response templates require uncertainty language and actionable steps
- Statistical claims and success rates are explicitly prohibited

**Evidence**:
- Governance check logs showing no forbidden phrases detected
- Response template content using uncertainty language
- Test cases verifying absence of statistical claims

### Risk Mitigation
**Control**: Suicide risk triage with immediate escalation

**Implementation**:
- Suicide categories prioritized above all other logic
- Required inclusion of 988 and crisis resources
- Negation and attribution guards prevent misclassification

**Evidence**:
- Priority order verification showing suicide categories first
- Response templates containing required crisis resources
- Test suite covering negation scenarios ("I don't want to die, but...")

### Quality Assurance
**Control**: Comprehensive test coverage and type safety

**Implementation**:
- Minimum 2 test cases per response category
- TypeScript strict mode with no `any` types
- Automated test execution in CI pipeline

**Evidence**:
- Test coverage reports showing ≥2 tests per category
- TypeScript compilation logs showing no type errors
- CI pipeline logs showing successful test execution

## Monitoring and Continuous Improvement

### Automated Monitoring
- Governance script runs on every commit and PR
- Test execution verifies system behavior
- Type checking prevents unsafe code patterns

### Incident Response
- Any governance failure blocks deployment
- Failed checks provide specific remediation guidance
- Rollback capability for unsafe changes

### Review Process
- Monthly review of governance effectiveness
- Annual assessment of control adequacy
- Update of safety requirements based on emerging risks

## Conclusion
The Pet Crisis Support Companion maintains SOC 2 compliance through automated, enforceable controls that ensure AI safety while providing valuable support to users experiencing pet-related crises. The deterministic rule-based approach, combined with comprehensive testing and governance automation, provides reliable evidence of control effectiveness.

---

**Document Control**: SOC-2-AI-001  
**Effective Date**: 2025-01-05  
**Review Date**: 2026-01-05  
**Owner**: AI Safety Team
