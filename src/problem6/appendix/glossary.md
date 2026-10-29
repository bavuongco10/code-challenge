# Appendix C — Glossary

> Short explanations of every less common term in [../README.md](../README.md).

**Live updates**
- **SSE (Server-Sent Events):** a standard way for a server to keep an HTTP response open and push text messages to the browser. One way only: server → browser.
- **`EventSource`:** the browser API that opens an SSE connection and reconnects by itself if it drops.
- **`Last-Event-ID`:** a header the browser sends on reconnect, holding the `id` of the last SSE message it received.
- **WebSocket:** a two-way connection between browser and server, started by "upgrading" an HTTP request to a different protocol.
- **Polling:** the browser asks the server again every few seconds.
- **Fan-out:** sending one message to many receivers (here: one top-10 change to every connected browser).
- **Pub/sub (publish/subscribe):** a messaging pattern where senders publish to a channel and every subscriber gets a copy. Redis has it built in (`PUBLISH` / `SUBSCRIBE`).
- **Sticky sessions:** a load balancer setting that always sends one user to the same server. Not needed here.
- **LB (load balancer):** spreads incoming requests across API instances.
- **CDN (Content Delivery Network):** servers around the world that cache and deliver content close to users.
- **HTTP/2:** a newer HTTP version that sends many requests over one connection, which lifts the browser's 6-connections-per-site limit.

**Storage**
- **Redis:** an in-memory key-value store. Very fast, data can expire on its own.
- **Sorted set (ZSET):** a Redis type that keeps members ordered by a number (here: `userId` ordered by score). Commands start with `Z`.
- **`ZADD` / `ZADD GT`:** add or update a member's score. `GT` means "only if the new score is greater", so an older, late write can't lower it.
- **`ZREVRANGE key start stop [WITHSCORES]`:** read members by position, highest score first (`0 9` = top 10). **`ZREVRANK`:** one member's position, highest first (0 = first). **`ZREM`:** remove a member.
- **`INCR`, `SET`, `GETDEL`, `SISMEMBER`, `SADD`:** increment a counter, write a value, read-and-delete in one step, check / add membership in a set.
- **TTL (time to live):** how long a key lives before Redis deletes it automatically.
- **`SET NX EX`:** write a key only if it does not exist yet (`NX`), with an expiry (`EX`). One command, so two requests can never both win.
- **Atomic:** happens completely or not at all, with nothing else in between.
- **Postgres:** the relational database that holds the permanent data.
- **Source of truth:** the system whose data wins when two copies disagree. Here: Postgres.
- **Transaction:** a group of database statements that commit together or not at all.
- **`FOR UPDATE` (row lock):** locks the selected row until the transaction ends, so concurrent requests for the same user run one at a time.
- **`UNIQUE` constraint:** the database refuses a second row with the same value. Used as the last guard against double awards.
- **`LISTEN` / `NOTIFY`:** Postgres's own simple pub/sub.
- **Append-only audit log:** a table where rows are only ever added, never changed or deleted, so history can be trusted.
- **Partitioning:** splitting a big table into smaller ones (for example by month) that still act as one table.
- **Outbox pattern:** write "this needs to be sent" into the database in the same transaction, then a worker sends it. Nothing is lost if the send fails.
- **Drift:** two copies of data (Redis and Postgres) no longer matching.
- **Fail closed:** when a dependency is down, refuse the request instead of letting it through unchecked.

**Requests and reliability**
- **Idempotency key:** an ID the client sends so the server can recognise a retry and return the first result instead of doing the work twice. Here: the action token's `jti`.
- **UUID:** a 128-bit random-looking ID, unique without asking a central server.
- **Lease:** a lock that expires by itself (here 30 s), so a crashed server can't hold it forever.
- **Race condition:** a bug where the result depends on which of two parallel requests runs first.
- **Rate limit / token bucket:** cap on requests per time window. A token bucket refills N "tokens" per minute and each request uses one.
- **Cooldown:** the minimum time between two paid actions by the same user.
- **Daily cap:** the most points one user can earn per UTC day.
- **`Retry-After`:** a response header telling the client how long to wait before trying again.
- **p95 latency:** 95% of requests are faster than this.
- **Stateless:** the API instance keeps no user data in memory, so any instance can serve any request.

**Security**
- **Authentication / authorisation:** who you are / what you are allowed to do.
- **Passkey / WebAuthn:** login with a key stored on the device (unlocked by fingerprint, face or PIN) instead of a password. WebAuthn is the browser standard behind it.
- **Challenge:** a random value the server asks the passkey to sign, so an old login can't be replayed.
- **Session / `sid`:** the server-side record of a logged-in user / its random ID.
- **PASETO v4.local:** a token format (a safer alternative to JWT). `local` means it is encrypted with a server key, so the browser can't read or change it.
- **JWT:** JSON Web Token, a common signed token format.
- **Cookie flags:** `HttpOnly` = JavaScript can't read it; `Secure` = HTTPS only; `SameSite=Strict` = not sent on requests from other sites; `__Host-` prefix = must be `Secure`, on this exact host, path `/`.
- **XSS (Cross-Site Scripting):** an attacker gets their JavaScript to run on our page.
- **CSRF (Cross-Site Request Forgery):** another site makes the user's browser send a request to our API with the user's cookie.
- **`Origin` header:** the site that sent the request; we only accept our own.
- **`iss` / `aud` / `sub` / `exp`:** token fields: issuer, audience (who it is for), subject (the user), expiry.
- **`amr` / `authTime`:** how the user logged in (for example passkey) / when.
- **`kid` (key ID):** names which key signed or encrypted a token, so keys can be rotated.
- **Key rotation:** replacing secret keys on a schedule.
- **Secret manager:** a service that stores keys and passwords safely (for example AWS Secrets Manager or Vault).
- **Action token:** the encrypted, single-use token from `POST /actions/start`; proves the server started this action for this user.
- **`jti` / `iat`:** token fields: unique token ID / issued-at time.
- **Verifier:** the server-side check that an action really finished (§2.2).
- **Ed25519:** a public-key signature scheme; a trusted game server signs results, we check with its public key.
- **Constant-time compare:** comparing secrets in a way that always takes the same time, so attackers can't guess them by measuring response time.
- **OAuth / OIDC / PKCE:** "log in with Google/GitHub" standards; PKCE protects the login code from being stolen.
- **Magic link:** a one-time login link sent by email.
- **Sybil attack:** one person creating many fake accounts.
- **Device fingerprinting:** recognising a device from its browser and hardware traits.
- **DBSC (Device Bound Session Credentials):** a new browser feature that ties a cookie to one device, so a stolen cookie is useless elsewhere.
- **Flagged / banned:** hidden from the public top 10 pending review / blocked from the service.

**Docs**
- **Cucumber / Gherkin / feature file:** a test tool and its plain-English format (`Given / When / Then`). Each `.feature` file is one user story.