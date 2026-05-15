<?php

namespace Peopleinside\AntiFlood;

use Carbon\Carbon;
use Flarum\Discussion\Discussion;
use Flarum\Post\Post;
use Flarum\User\User;
use Flarum\Discussion\Event\Saving as DiscussionSaving;
use Flarum\Post\Event\Saving as PostSaving;
use Flarum\User\Exception\PermissionDeniedException;
use Illuminate\Contracts\Translation\Translator;

class FloodGuard
{
    protected int $maxPending = 6;
    protected int $floodLimit = 3;
    protected int $floodIntervalMinutes = 5;

    public function __construct(
        private Translator $translator
    ) {}

    public function handleDiscussionSaving(DiscussionSaving $event): void
    {
        $actor = $event->actor;

        if ($actor->isGuest() || $actor->isAdmin()) {
            return;
        }

        $this->checkPending($actor);
        $this->checkFlooding($actor, Discussion::class);
    }

    public function handlePostSaving(PostSaving $event): void
    {
        $actor = $event->actor;

        if ($actor->isGuest() || $actor->isAdmin()) {
            return;
        }

        $this->checkPending($actor);
    }

    protected function checkPending(User $actor): void
    {
        $pendingPosts = Post::where('user_id', $actor->id)
            ->where('is_approved', false)
            ->count();

        $pendingDiscussions = Discussion::where('user_id', $actor->id)
            ->where('is_approved', false)
            ->count();

        if (($pendingPosts + $pendingDiscussions) >= $this->maxPending) {
            throw new PermissionDeniedException(
                $this->translator->get('peopleinside-antiflood.forum.error.pending_limit')
            );
        }
    }

    protected function checkFlooding(User $actor, string $model): void
    {
        $recentCount = $model::where('user_id', $actor->id)
            ->where('created_at', '>=', Carbon::now()->subMinutes($this->floodIntervalMinutes))
            ->count();

        if ($recentCount >= $this->floodLimit) {
            throw new PermissionDeniedException(
                $this->translator->get('peopleinside-antiflood.forum.error.flood_limit', [
                    'minutes' => $this->floodIntervalMinutes,
                ])
            );
        }
    }
}
