# Nimbus Cloud Security & Data Retention Policy

> Nimbus Cloud is a fictional company created for the DocuMind portfolio demo. Certifications, durations and procedures below are invented.

## Purpose and scope

This policy explains how Nimbus Cloud protects customer data, how long different types of data are kept, and how data is deleted. It applies to all Nimbus Cloud services, including object storage, serverless functions, the CDN, logs and the dashboard. It does not cover third-party services that customers connect to their own workspaces.

## Shared responsibility model

Nimbus Cloud is responsible for the security **of** the cloud: physical data centres, hardware, the network, the hypervisor and the managed services themselves. Customers are responsible for security **in** the cloud: managing user access, protecting API keys, configuring bucket permissions and securing their own application code.

## Encryption

### Encryption at rest

All customer data stored on Nimbus Cloud is encrypted at rest with **AES-256-GCM**. Encryption keys are managed by the Nimbus Key Management Service and rotated automatically every 12 months. Business and Enterprise customers can enable **customer-managed keys (CMK)**, which lets them rotate or revoke their own keys. Revoking a customer-managed key makes the associated data unreadable, including to Nimbus staff.

### Encryption in transit

All traffic to public endpoints is encrypted with TLS 1.2 or higher; TLS 1.3 is preferred where clients support it. Older protocols such as TLS 1.0 and 1.1 are disabled. Traffic between Nimbus data centres travels over encrypted private links.

## Access control

Workspace access is managed through roles: **Owner**, **Admin**, **Developer**, **Billing Admin** and **Viewer**. Nimbus recommends granting the least privilege needed for each person.

Multi-factor authentication (MFA) is available to all users and can be **enforced** for an entire workspace on the Team plan and above. Business and Enterprise workspaces can require single sign-on through SAML 2.0 and automatically provision users via SCIM.

Nimbus employees do not have standing access to customer data. Support engineers can access a workspace only after the customer grants temporary access from the dashboard, and that access expires automatically after 72 hours. Every access is recorded in the customer's audit log.

## Compliance and audits

Nimbus Cloud maintains a SOC 2 Type II report and ISO/IEC 27001 certification, both audited annually by an independent firm. Enterprise customers can request the latest reports under NDA. Nimbus also supports GDPR obligations and offers a Data Processing Addendum (DPA) to all customers.

An external penetration test is performed at least once a year, and Nimbus operates a public bug bounty program for responsible disclosure.

## Data residency

Customers choose a primary region when creating a project: **US East**, **EU Central (Frankfurt)** or **Asia Pacific (Singapore)**. Stored objects and databases stay in the selected region. CDN caches may temporarily hold copies of public content at edge locations worldwide. Enterprise customers can request additional regions.

## Data retention

The table below lists default retention periods. Customers can shorten most of them in the dashboard.

| Data type                    | Default retention                     |
|------------------------------|---------------------------------------|
| Stored objects and databases | Until deleted by the customer         |
| Application logs             | 30 days (Starter: 7 days)             |
| Audit logs                   | 1 year (Enterprise: up to 7 years)    |
| Automatic backups            | 35 days                               |
| Deleted objects (soft delete)| 14 days                               |
| Billing records              | 7 years, for tax and legal reasons    |
| Support tickets              | 2 years after the ticket is closed    |

### Backups

Databases are backed up automatically every 24 hours, with point-in-time recovery available for the last 7 days on Business and Enterprise plans. Backups are encrypted and stored in a second availability zone within the same region. Backups are kept for 35 days and then permanently deleted.

### Soft delete

When an object or bucket is deleted, it enters a **14-day soft-delete** period during which it can be restored from the dashboard or with the `POST /buckets/{id}/restore` endpoint. After 14 days the data is permanently purged and cannot be recovered.

## Account closure and data deletion

When a customer closes their account, all workspaces enter a **30-day grace period** in read-only mode so data can be exported. After the grace period, customer data is deleted from primary storage within 7 days and from backups within the following 35 days, when the backup retention window expires. Billing records are retained for 7 years as required by law.

Customers can request expedited deletion by contacting support; in that case data is removed from primary storage within 48 hours. Nimbus issues a deletion certificate on request.

## Incident response

Nimbus Cloud maintains a 24/7 security operations team. If a security incident affects customer data, Nimbus will notify affected customers **without undue delay and within 72 hours** of confirming the incident. Notifications are sent by email to workspace Owners and include the nature of the incident, the data involved, the actions taken and recommended next steps. A post-incident report is published within 14 days.

## Reporting a vulnerability

Security researchers can report vulnerabilities to `security@nimbus.example` or through the bug bounty program. Nimbus acknowledges reports within 2 business days and does not pursue legal action against researchers who act in good faith and follow the disclosure guidelines.
