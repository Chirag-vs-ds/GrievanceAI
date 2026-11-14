# Project Limitations

GrievanceAI is an academic and portfolio prototype. It demonstrates a complete local workflow, but it is not deployed, production-ready, affiliated with UIDAI, or endorsed by a government agency.

## Data and privacy

Development, evaluation, and demonstrations use synthetic or fictional complaints. The application should not receive real Aadhaar numbers, biometric data, authentication codes, government records, or other sensitive personal information. The repository does not provide a production privacy program, retention policy, consent flow, or data-subject request process.

## Machine-learning recommendations

The classifier suggests one of six categories and an illustrative department. Its output is a recommendation for human review, not an approval, rejection, entitlement decision, or official routing decision. Logistic Regression scores exposed by the service are not calibrated probabilities.

The manual-review rule uses provisional score and margin thresholds. Ambiguous, mixed-intent, short, misspelled, Hinglish, or out-of-distribution complaints can be misclassified. Human review remains important, especially when the top score is low or category scores are close.

## Evaluation limits

Existing development validation influenced model development. It is not equivalent to an independently collected, independently reviewed, untouched real-world test. Blind-test preparation under `reports/blind_test/` remains awaiting independent annotation and must not be represented as completed independent evaluation.

No result should be presented as real-world accuracy without a new protocol, documented provenance, independent review, frozen labels, and representative data. Experimental artifacts do not replace Model B in the running service.

## Illustrative routing and priority

Department mappings are prototype examples rather than official organizational guidance. Priority is assigned by a small keyword/category rule and has not been validated as an operational triage policy. Both require domain-owner review before real use.

## Application and access controls

- Authentication is configured for one administrator.
- Login throttling is held in one backend process and is unsuitable for distributed deployment.
- Local HTTP mode uses cookie settings that differ from HTTPS deployment.
- Public tracking relies on possession of the grievance ID rather than verified identity.
- Sequential grievance ID generation needs concurrency review for production use.
- The project has no migration framework, production secret manager, reverse proxy, monitoring, alerting, backup plan, disaster recovery, or deployment automation.
- Backend tests use in-memory SQLite and do not replace MySQL integration or browser end-to-end testing.

## Operational readiness

Broader use would require independent model evaluation, accessibility testing, privacy and legal review, threat modeling, penetration testing, HTTPS, shared rate limiting, hardened secret management, database migrations and backups, observability, incident response, concurrency testing, and clear human decision ownership.
