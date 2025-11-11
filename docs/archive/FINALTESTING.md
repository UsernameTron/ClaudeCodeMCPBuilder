Execute complete MCP Builder deployment verification and generate deployment certification:

PHASE 1: ENVIRONMENT SETUP
- Create verification directory: `mkdir -p deployment-verification && cd deployment-verification`
- Record start time: `echo "Verification started: $(date -Iseconds)" > verification-log.txt`
- Record system info: `echo "Node: $(node --version)" >> verification-log.txt && echo "NPM: $(npm --version)" >> verification-log.txt`
- Return to project root: `cd ..`

PHASE 2: CLEAN BUILD
- Remove artifacts: `rm -rf dist/ coverage/ node_modules/`
- Fresh install: `npm ci`
- Build project: `npm run build 2>&1 | tee deployment-verification/build-log.txt`
- Check exit code: If build fails, STOP and report "BLOCKER: Build failed"
- Type check: `npm run type-check 2>&1 | tee deployment-verification/typecheck-log.txt`
- Lint: `npm run lint 2>&1 | tee deployment-verification/lint-log.txt`

PHASE 3: COMPREHENSIVE TESTING
- Run full test suite with coverage: `npm run test:coverage 2>&1 | tee deployment-verification/test-log.txt`
- Extract coverage summary: `cat coverage/coverage-summary.json > deployment-verification/coverage-summary.json`
- Check overall coverage ≥70%: Parse coverage-summary.json and verify
- Run E2E tests: `npm run test:e2e 2>&1 | tee deployment-verification/e2e-log.txt`
- Check exit code: If any test fails, STOP and report "BLOCKER: Test failures"

PHASE 4: CRITICAL MODULE COVERAGE VERIFICATION
For each critical module, verify ≥80% coverage:
- src/generator/validation/capabilityValidator.ts
- src/generator/validators/postGenerationValidator.ts
- src/utils/security/pathSanitization.ts
- src/utils/security/xssPrevention.ts
- src/utils/filesystem/boundaryChecker.ts

Extract per-file coverage from coverage/lcov-report/ or coverage-final.json
If any <80%, STOP and report "BLOCKER: Critical module coverage below threshold"

PHASE 5: SECURITY VALIDATION
- Run security audit: `npm audit --audit-level=moderate --json > deployment-verification/audit-report.json 2>&1`
- Check for moderate+ vulnerabilities: Parse audit-report.json, if any found STOP and report "BLOCKER: Security vulnerabilities"
- Execute security test suites:
  - `npm test -- src/utils/security/pathSanitization.test.ts 2>&1 | tee deployment-verification/security-path-test.txt`
  - `npm test -- src/utils/security/xssPrevention.test.ts 2>&1 | tee deployment-verification/security-xss-test.txt`
  - `npm test -- src/utils/filesystem/boundaryChecker.test.ts 2>&1 | tee deployment-verification/security-boundary-test.txt`
- Verify all security tests pass 100%

PHASE 6: SERVER GENERATION VALIDATION
- Create test directory: `mkdir -p deployment-verification/test-servers`
- Generate all server types:
  - Tools: `npm run create-server -- --name test-tools --type tools --output deployment-verification/test-servers --skip-install --no-examples`
  - Resources: `npm run create-server -- --name test-resources --type resources --output deployment-verification/test-servers --skip-install --no-examples`
  - Prompts: `npm run create-server -- --name test-prompts --type prompts --output deployment-verification/test-servers --skip-install --no-examples`
  - Mixed: `npm run create-server -- --name test-mixed --type mixed --output deployment-verification/test-servers --skip-install --no-examples`
- For each generated server, verify files exist:
  - package.json, tsconfig.json, src/index.ts, README.md, .gitignore
- If any file missing, STOP and report "BLOCKER: Generated server incomplete"

PHASE 7: GENERATE CERTIFICATION REPORT
Create deployment-verification/CERTIFICATION-REPORT.md with:

---
# MCP Builder Deployment Certification

**Generated:** [ISO timestamp]
**System:** Node [version], NPM [version]
**Platform:** [OS platform]

## ✅ BUILD VERIFICATION
- Clean build: PASS
- TypeScript compilation: PASS
- Type checking: PASS  
- Linting: PASS

## ✅ TEST COVERAGE
- Overall Coverage: [X]% (threshold: ≥70%)
- Lines: [X]%
- Statements: [X]%
- Functions: [X]%
- Branches: [X]%

### Critical Modules (threshold: ≥80%)
- capabilityValidator.ts: [X]%
- postGenerationValidator.ts: [X]%
- pathSanitization.ts: [X]%
- xssPrevention.ts: [X]%
- boundaryChecker.ts: [X]%

## ✅ TEST EXECUTION
- Unit tests: [X] passed, [Y] failed
- E2E tests: PASS
- Security test suites: PASS (100%)

## ✅ SECURITY AUDIT
- Vulnerabilities: 0 moderate+
- Dependencies checked: [X] packages
- Security test coverage: 100%

## ✅ SERVER GENERATION
- Tools server: PASS
- Resources server: PASS
- Prompts server: PASS
- Mixed server: PASS
- All required files present: PASS

## 📊 VERIFICATION SUMMARY
- Total phases completed: 7/7
- Blockers found: 0
- Warnings: [list any non-blocking issues]

## 🎯 DEPLOYMENT STATUS
**✅ CERTIFIED FOR PRODUCTION DEPLOYMENT**

This codebase has passed all verification requirements and is ready for senior developer review and production deployment.

**Certified by:** Claude Code Verification System
**Timestamp:** [ISO timestamp]
---

PHASE 8: ARCHIVE RESULTS
- Copy all logs: `cp -r coverage/ deployment-verification/coverage-archive/`
- Create archive: `tar -czf deployment-verification-$(date +%Y%m%d-%H%M%S).tar.gz deployment-verification/`
- Save certification: Final CERTIFICATION-REPORT.md is at deployment-verification/CERTIFICATION-REPORT.md

FINAL OUTPUT:
Display complete certification report to user
List archive location: deployment-verification-[timestamp].tar.gz
Provide summary:
  ✅ ALL PHASES PASSED
  ✅ 0 BLOCKERS
  ✅ READY FOR DEPLOYMENT
  📦 Results archived: deployment-verification-[timestamp].tar.gz
  📄 Certification: deployment-verification/CERTIFICATION-REPORT.md

If ANY blocker encountered during any phase:
- STOP immediately
- Report: "❌ DEPLOYMENT BLOCKED"
- List specific blocker(s)
- Save partial results
- Recommend: "Fix blockers and re-run full verification"