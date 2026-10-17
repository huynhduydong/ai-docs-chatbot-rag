# Nimbus API Reference: Authentication, Rate Limits & Webhooks

> Nimbus Cloud is a fictional company created for the DocuMind portfolio demo. Endpoints, limits and headers below are invented.

## Overview

The Nimbus REST API lets you manage projects, storage buckets, functions and deployments programmatically. All endpoints are served from `https://api.nimbus.example/v2` over HTTPS only. Requests and responses use JSON, and timestamps are formatted as ISO 8601 in UTC.

The current API version is **v2**. Version v1 is deprecated and will stop accepting requests on 30 June 2027.

## Authentication

### API keys

Every request must be authenticated with an API key sent in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer nmb_live_4f9c...
```

Keys are created under *Settings › Developers › API keys*. There are two key types:

- **Live keys** start with `nmb_live_` and act on production resources.
- **Test keys** start with `nmb_test_` and act on an isolated sandbox that is reset every 24 hours.

Each key has a **scope** of `read`, `write` or `admin`. A `read` key can only call `GET` endpoints. A `write` key can create and modify resources but cannot manage members, billing or other keys. Only `admin` keys can rotate or revoke keys.

### Key rotation

Nimbus recommends rotating keys at least every 90 days. When you rotate a key, the old key keeps working for a **24-hour grace period** so that you can roll out the new secret without downtime. Revoking a key, in contrast, takes effect immediately.

Keys are shown only once at creation time. Nimbus stores a salted hash of each key, so support staff cannot recover a lost key; you must create a new one.

### OAuth 2.0 for integrations

Third-party integrations that act on behalf of Nimbus users must use OAuth 2.0 with the authorization code flow and PKCE. Access tokens expire after 1 hour and refresh tokens after 30 days of inactivity. The token endpoint is `POST /oauth/token`.

## Rate limits

Rate limits protect the platform and are applied per API key using a token bucket algorithm.

| Plan       | Sustained rate        | Burst |
|------------|-----------------------|-------|
| Starter    | 60 requests/minute    | 20    |
| Team       | 600 requests/minute   | 100   |
| Business   | 3,000 requests/minute | 500   |
| Enterprise | Custom                | Custom|

Every response includes rate limit headers:

- `X-RateLimit-Limit`: the number of requests allowed per minute.
- `X-RateLimit-Remaining`: requests remaining in the current window.
- `X-RateLimit-Reset`: Unix timestamp when the bucket fully refills.

When you exceed the limit, the API returns **HTTP 429 Too Many Requests** with a `Retry-After` header expressed in seconds. Clients should wait at least that long and retry with exponential backoff and jitter. Repeatedly ignoring 429 responses can lead to a temporary block of the key for 10 minutes.

Upload endpoints have a separate limit of 50 concurrent multipart uploads per workspace.

## Errors

Errors use standard HTTP status codes and a consistent body:

```json
{ "error": { "code": "bucket_not_found", "message": "Bucket 'assets' does not exist.", "request_id": "req_8KfP2..." } }
```

Common codes are `400 invalid_request`, `401 unauthenticated`, `403 insufficient_scope`, `404 not_found`, `409 conflict`, `422 validation_failed`, `429 rate_limited` and `500 internal_error`. Always include the `request_id` when contacting support.

## Idempotency

`POST` requests accept an `Idempotency-Key` header containing a unique value such as a UUID. If the same key is sent again within 24 hours, the API returns the original response instead of performing the action twice. This is strongly recommended for deployments and billing-related calls.

## Pagination

List endpoints use cursor-based pagination. Pass `limit` (default 20, maximum 100) and the `cursor` value returned in the previous response's `next_cursor` field. When `next_cursor` is `null`, there are no more results.

## Webhooks

Webhooks notify your server when events happen in your workspace, such as `deployment.succeeded`, `deployment.failed`, `bucket.object_created`, `invoice.paid` and `usage.threshold_reached`.

### Configuring endpoints

Create webhook endpoints under *Settings › Developers › Webhooks* or with `POST /webhooks`. Each workspace can have up to 20 endpoints, and each endpoint can subscribe to specific event types or to all events with `*`. Endpoints must use HTTPS.

### Verifying signatures

Every webhook request includes a `Nimbus-Signature` header in the form `t=<timestamp>,v1=<signature>`. The signature is an **HMAC-SHA256** of the string `<timestamp>.<raw request body>` using the endpoint's signing secret. To verify a webhook:

1. Extract the timestamp and signature from the header.
2. Compute the HMAC-SHA256 of `timestamp + "." + body` with your signing secret.
3. Compare it to `v1` using a constant-time comparison.
4. Reject the request if the timestamp is more than 5 minutes old, to prevent replay attacks.

### Delivery and retries

Your endpoint must respond with a 2xx status within 10 seconds. If it times out or returns any other status, Nimbus retries delivery with exponential backoff: after 1 minute, 5 minutes, 30 minutes, 2 hours, 6 hours and 24 hours, for a total of up to 7 attempts over roughly 32 hours. After the final failure the event is marked as failed and can be replayed manually from the dashboard for up to 30 days.

If an endpoint fails continuously for 3 days, it is automatically disabled and workspace Owners are notified by email.

Events may be delivered more than once and are not guaranteed to arrive in order. Use the `event.id` field to de-duplicate and the `created_at` field to order events.

## SDKs

Official SDKs are available for JavaScript/TypeScript, Python and Go. They handle authentication, retries on 429 and 5xx responses, pagination and webhook signature verification out of the box.
