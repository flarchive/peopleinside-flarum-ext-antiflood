<?php

namespace Peopleinside\AntiFlood;

use Carbon\Carbon;
use Flarum\Discussion\Discussion;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\Post\Post;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Illuminate\Contracts\Translation\Translator;
use Psr\Http\Message\ServerRequestInterface;

class FloodThrottler
{
    private ?bool $hasApprovalColumns = null;

    public function __construct(
        private Translator $translator,
        private SettingsRepositoryInterface $settings
    ) {}

    public function __invoke(ServerRequestInterface $request): ?bool
    {
        $actor = RequestUtil::getActor($request);

        if ($actor->isGuest() || $actor->isAdmin()) {
            return null;
        }

        $routeName = $request->getAttribute('routeName');

        if ($routeName === 'discussions.create') {
            $this->checkPending($actor);
            $this->checkFlooding($actor, Discussion::class, $this->floodLimit());
        } elseif ($routeName === 'posts.create') {
            $this->checkPending($actor);
            if ($this->postFloodLimit() > 0) {
                $this->checkFlooding($actor, Post::class, $this->postFloodLimit());
            }
        }

        return null;
    }

    protected function maxPending(): int
    {
        return (int) ($this->settings->get('peopleinside-antiflood.max_pending') ?: 6);
    }

    protected function floodLimit(): int
    {
        return (int) ($this->settings->get('peopleinside-antiflood.flood_limit') ?: 3);
    }

    protected function floodIntervalMinutes(): int
    {
        return (int) ($this->settings->get('peopleinside-antiflood.flood_interval_minutes') ?: 5);
    }

    protected function postFloodLimit(): int
    {
        return (int) ($this->settings->get('peopleinside-antiflood.post_flood_limit') ?: 0);
    }

    protected function checkPending(User $actor): void
    {
        if (!$this->hasApprovalColumns()) {
            return;
        }

        $pendingPosts = Post::where('user_id', $actor->id)
            ->where('is_approved', false)
            ->count();

        $pendingDiscussions = Discussion::where('user_id', $actor->id)
            ->where('is_approved', false)
            ->count();

        if (($pendingPosts + $pendingDiscussions) >= $this->maxPending()) {
            $custom = $this->settings->get('peopleinside-antiflood.pending_limit_message');
            $message = $this->resolveMessage(
                is_string($custom) ? $custom : null,
                'peopleinside-antiflood.forum.error.pending_limit'
            );

            throw new ValidationException(['content' => $message]);
        }
    }

    protected function checkFlooding(User $actor, string $model, int $limit): void
    {
        $minutes = $this->floodIntervalMinutes();

        $recentCount = $model::where('user_id', $actor->id)
            ->where('created_at', '>=', Carbon::now()->subMinutes($minutes))
            ->count();

        if ($recentCount >= $limit) {
            $custom = $this->settings->get('peopleinside-antiflood.flood_limit_message');
            $message = $this->resolveMessage(
                is_string($custom) ? $custom : null,
                'peopleinside-antiflood.forum.error.flood_limit',
                ['minutes' => $minutes]
            );

            throw new ValidationException(['content' => $message]);
        }
    }

    protected function resolveMessage(?string $custom, string $defaultKey, array $replacement = []): string
    {
        if ($custom === null || trim($custom) === '') {
            return $this->translator->get($defaultKey, $replacement);
        }

        // Handle legacy values where a translation key was stored as custom text.
        if ($custom === $defaultKey) {
            return $this->translator->get($defaultKey, $replacement);
        }

        if (!empty($replacement)) {
            $tokens = [];
            $values = [];

            foreach ($replacement as $key => $value) {
                $tokens[] = '{'.$key.'}';
                $values[] = (string) $value;
            }

            return str_replace($tokens, $values, $custom);
        }

        return $custom;
    }

    protected function hasApprovalColumns(): bool
    {
        if ($this->hasApprovalColumns !== null) {
            return $this->hasApprovalColumns;
        }

        $schema = Post::query()->getConnection()->getSchemaBuilder();

        $this->hasApprovalColumns = $schema->hasColumn((new Post())->getTable(), 'is_approved')
            && $schema->hasColumn((new Discussion())->getTable(), 'is_approved');

        return $this->hasApprovalColumns;
    }
}
