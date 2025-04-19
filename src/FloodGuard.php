<?php

namespace Peopleinside\AntiFlood;

use Carbon\Carbon;
use Flarum\Discussion\Discussion;
use Flarum\Post\Post;
use Flarum\User\User;
use Flarum\Discussion\Event\Saving as DiscussionSaving;
use Flarum\Post\Event\Saving as PostSaving;
use Illuminate\Support\Arr;
use Flarum\User\Exception\PermissionDeniedException;

class FloodGuard
{
    protected $maxPending = 4;
    protected $floodLimit = 3;
    protected $floodIntervalMinutes = 10;

    public function handleDiscussionSaving(DiscussionSaving $event)
    {
        $actor = $event->actor;

        if ($actor->isAdmin()) return;

        $this->checkPending($actor);
        $this->checkFlooding($actor, Discussion::class);
    }

    public function handlePostSaving(PostSaving $event)
    {
        $actor = $event->actor;

        if ($actor->isAdmin()) return;

        $this->checkPending($actor);
    }

    protected function checkPending(User $actor)
    {
        $pendingPosts = Post::where('user_id', $actor->id)
            ->where('is_approved', false)
            ->count();

        $pendingDiscussions = Discussion::where('user_id', $actor->id)
            ->where('is_approved', false)
            ->count();

        if (($pendingPosts + $pendingDiscussions) >= $this->maxPending) {
            throw new PermissionDeniedException(app('translator')->trans('peopleinside-antiflood.forum.error.pending_limit'));
        }
    }

    protected function checkFlooding(User $actor, string $model)
    {
        $recentCount = $model::where('user_id', $actor->id)
            ->where('created_at', '>=', Carbon::now()->subMinutes($this->floodIntervalMinutes))
            ->count();

        if ($recentCount >= $this->floodLimit) {
            throw new PermissionDeniedException(app('translator')->trans('peopleinside-antiflood.forum.error.flood_limit', [
                'minutes' => $this->floodIntervalMinutes
            ]));
        }
    }
}
