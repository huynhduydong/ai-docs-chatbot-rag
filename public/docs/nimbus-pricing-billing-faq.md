# Nimbus Cloud Pricing & Billing FAQ

> Nimbus Cloud is a fictional company created for the DocuMind portfolio demo. Plans, prices and policies below are invented.

## Plans at a glance

Nimbus Cloud offers four plans: **Starter**, **Team**, **Business** and **Enterprise**. Every plan includes managed object storage, serverless functions, a global CDN and the Nimbus dashboard.

- **Starter** is free forever and includes 5 GB of storage, 100,000 function invocations per month and 50 GB of CDN egress. It is limited to one project and community support.
- **Team** costs $29 per month per workspace and includes 100 GB of storage, 2 million invocations, 500 GB of egress, up to 10 seats and email support with a 24-hour response target.
- **Business** costs $149 per month per workspace and includes 1 TB of storage, 20 million invocations, 5 TB of egress, unlimited seats, SSO via SAML and a 99.95% uptime SLA.
- **Enterprise** is custom-priced and adds dedicated support engineers, a 99.99% uptime SLA, private networking, custom data residency and volume discounts.

Annual billing is available for Team and Business and gives a 20% discount compared to paying monthly.

## How usage-based overages work

When a workspace exceeds the quota included in its plan, Nimbus Cloud charges overages instead of shutting services down. Overage rates are the same on Team and Business:

- Storage: $0.021 per GB-month beyond the included amount.
- Function invocations: $0.40 per additional million invocations.
- CDN egress: $0.05 per GB beyond the included amount.
- Build minutes: $0.008 per minute after the first 3,000 minutes each month.

Starter workspaces do not incur overages. When a Starter workspace reaches a limit, new requests are throttled until the next billing cycle or until the workspace is upgraded.

## Spending limits and budget alerts

Owners and Billing Admins can set a **hard spending cap** for each workspace from *Settings › Billing › Spend controls*. When the cap is reached, overage-billed services are paused and the dashboard shows a banner. Included plan quotas keep working.

Budget alerts can be configured at 50%, 80% and 100% of a monthly budget. Alerts are delivered by email and, optionally, to a Slack channel or webhook endpoint. Alerts are evaluated every 15 minutes, so a short delay between crossing a threshold and receiving an alert is normal.

## Billing cycle and invoices

Billing cycles start on the day a paid plan is first activated and renew on the same calendar day each month. If that day does not exist in a given month (for example the 31st), the cycle renews on the last day of the month.

Invoices are generated within two hours after the cycle closes and are available as PDF under *Settings › Billing › Invoices*. Each invoice lists the plan fee, itemised overages, taxes and any credits applied. Invoices are emailed to every user with the Billing Admin role.

## Payment methods

Nimbus Cloud accepts Visa, Mastercard and American Express credit cards on all paid plans. Business and Enterprise customers can also pay by ACH transfer or wire transfer with net-30 terms after a credit review. Prepaid credits can be purchased in blocks of $500 and never expire while the account is active.

If a card payment fails, Nimbus retries the charge after 3 days and again after 7 days. If the payment still fails after 14 days, the workspace is downgraded to read-only mode until the balance is settled. Data is never deleted because of a failed payment within the first 30 days.

## Upgrades, downgrades and proration

Upgrades take effect immediately. You are charged a **prorated** amount for the rest of the current cycle based on the number of days remaining. Downgrades take effect at the end of the current billing cycle, so you keep the higher plan's features until then.

If a downgrade would put the workspace above the new plan's limits (for example more seats than allowed), the dashboard asks you to remove the excess before the downgrade is scheduled.

## Refunds and credits

Monthly plan fees are non-refundable once a billing cycle has started. Annual plans can be cancelled within 14 days of purchase for a full refund. After 14 days, annual plans are not refunded but can be downgraded at renewal.

If Nimbus Cloud misses its uptime SLA, eligible Business and Enterprise customers receive **service credits**: 10% of the monthly fee for uptime below the SLA but above 99.0%, and 25% for uptime below 99.0%. Credits must be requested through support within 30 days of the incident and are applied to the next invoice.

## Taxes

Prices are shown exclusive of tax. Nimbus Cloud collects VAT, GST or sales tax where required, based on the billing address. Customers with a valid VAT ID in the EU or UK can enter it under *Settings › Billing › Tax* to apply the reverse-charge mechanism.

## Startup and non-profit programs

Eligible early-stage startups can apply to **Nimbus Launch**, which provides $5,000 in credits valid for 12 months. Registered non-profit organisations receive a 50% discount on the Team and Business plans. Both programs require verification and are reviewed within 5 business days.

## Frequently asked questions

### Can I change my billing email?
Yes. Any Owner can change the billing contact under *Settings › Billing › Contacts*. Up to five billing contacts can receive invoices.

### Do unused quotas roll over?
No. Included quotas reset at the start of each billing cycle and unused amounts do not roll over to the next month.

### What happens when I delete a workspace?
Deleting a workspace ends the subscription immediately. A final invoice is issued for any overages accrued in the current cycle. The plan fee for the current cycle is not refunded.
