# AntiFlood Extension for Flarum

[![Packagist](https://img.shields.io/packagist/v/peopleinside/flarum-ext-antiflood.svg)](https://packagist.org/packages/peopleinside/flarum-ext-antiflood)
[![License](https://img.shields.io/github/license/PeopleInside/flarum-ext-antiflood.svg)](LICENSE)

**AntiFlood** is a Flarum extension that adds longer-term flood protection and pending-approval limits on top of Flarum's built-in throttling.

## How it relates to Flarum's built-in throttle

Flarum already ships a `PostCreationThrottler` that blocks any user who posts (a reply **or** a new topic) within **10 seconds** of their previous post. This is a short-term anti-double-posting guard and is always active.

This extension adds **two complementary protections** on top:

| Protection | Applies to | Default | Configurable |
|---|---|---|---|
| **Topic flood limit** | New topics (`discussions.create`) | max 3 per 5 min | ✅ |
| **Reply flood limit** | Replies (`posts.create`) | disabled (0) | ✅ |
| **Pending approval limit** | Both topics and replies | max 6 pending | ✅ |

* **Topic flood limit** — prevents a user from opening more than N new topics within a configurable time window (minutes). Useful on forums where topic spam is the main concern.
* **Reply flood limit** — optionally limits how many replies a user may post in the same time window. Disabled by default because Flarum's 10-second throttle is usually enough for replies; enable it for stricter forums.
* **Pending approval limit** — blocks further posting if the user already has too many posts/topics awaiting moderator approval. Avoids approval queues being swamped.

Administrators are exempt from all limits.

## Compatibility

| Flarum Version | Supported |
|----------------|-----------|
| 1.x            | ✅        |
| 2.x            | ✅        |

## Admin settings

All limits and error messages can be customised in **Admin → Extensions → AntiFlood**:

<img width="1637" height="896" alt="Screenshot 2026-05-15 151232" src="https://github.com/user-attachments/assets/005c099e-96c4-4633-814d-65f9ca707380" />


| Setting | Default | Description |
|---|---|---|
| Topic flood limit | 3 | Max new topics per interval |
| Reply flood limit | 0 (off) | Max new replies per interval (0 = disabled) |
| Flood interval | 5 min | Time window for flood checks |
| Maximum pending posts | 6 | Max combined pending posts+topics before blocking |
| Custom error messages | — | Override the default translated messages |

## Disclaimer

This software is provided **"AS IS"**, without any warranty. While it has been tested and reasonable efforts are made to ensure security and reliability, no guarantees are provided. As an open project, anyone may contribute or report issues, but this does not imply endorsement or liability from the maintainers.

**You use this software entirely at your own risk.** The authors and contributors are not liable for any damages, data loss, or unexpected behavior resulting from its use, modification, or distribution. Always review and test the code independently before deploying it in critical or production environments.

## Installation

### 1. Install via Composer

In your Flarum root directory, run the following command:

```bash
composer require peopleinside/flarum-ext-antiflood
php flarum assets:publish
```

### 2. Update via Composer

```bash
composer update peopleinside/flarum-ext-antiflood
php flarum assets:publish
```

### 3. Uninstall via Composer

```bash
composer remove peopleinside/flarum-ext-antiflood
```
Packagist link: https://packagist.org/packages/peopleinside/flarum-ext-antiflood
