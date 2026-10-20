# Security Policy

Admin takes the security of our unified management and operations platform seriously. We appreciate the responsible disclosure of security issues by the community and our customers.

## Supported Versions

Only the latest active major releases receive security updates and vulnerability patches.

| Version | Supported          |
| ------- | ------------------ |
| 5.8.x   | :white_check_mark: |
| < 5.8.0 | :x:                |

## Reporting a Vulnerability

If you discover a vulnerability or security flaw in Admin or any associated packages:

1. **Do not disclose publicly:** Please do not file public GitHub issues or discussions for vulnerabilities.
2. **Private Reporting:**
   - Email details to **security@tuquet.com**.
   - Alternatively, open a private vulnerability report via **GitHub Advisory**:  
     [Submit Security Advisory](https://github.com/tuquet/admin/security/advisories/new)
3. **Include the following information:**
   - Type of vulnerability (e.g., CSRF, XSS, SSRF, Remote Code Execution, Privilege Escalation).
   - Component affected (e.g., `web-admin`, desktop Tauri shell, API adapters, authentication flow).
   - Detailed step-by-step reproduction instructions or Proof-of-Concept (PoC).
   - Potential impact of the vulnerability.

## Response SLA

- **Acknowledgment:** Within 24-48 business hours.
- **Initial Assessment:** Within 3 business days.
- **Remediation & Patch Release:** Priority critical CVEs will be expedited and released with hotfix versions.

Thank you for helping keep and its community secure.
