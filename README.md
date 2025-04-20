# AntiFlood Extension for Flarum

**AntiFlood** is a Flarum extension designed to limit topic and post flooding and ensure that users do not exceed a specific number of pending approvals. This extension aims to prevent spam and improve the moderation process.

## Features
- Limits the creation of **maximum 3 topics per 10 minutes** for each user.
- Blocks topic/post creation if there are already **3 posts or topics pending approval**.

## Installation

### 1. Install via Composer

In your Flarum root directory, run the following command:

```bash
composer require peopleinside/flarum-ext-antiflood
```

### 2. Update via Composer

```bash
composer update peopleinside/flarum-ext-antiflood
```

### 3. Unistall via Composer

```bash
composer remove peopleinside/flarum-ext-antiflood
```
