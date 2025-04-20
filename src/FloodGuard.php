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
use Flarum\Locale\Translator;

class FloodGuard
{
    protected $maxPending = 4;
    protected $floodLimit = 3;
    protected $floodIntervalMinutes = 5;

    protected $translator;


    public function __construct(Translator $translator)
    {
        $this->translator = $translator;
    }

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
            throw new PermissionDeniedException(
                $this->translator->trans('peopleinside-antiflood.forum.error.pending_limit')
            );
        }
    }

    protected function checkFlooding(User $actor, string $model)
    {
        $floodInterval = Carbon::now()->subMinutes($this->floodIntervalMinutes);

        $recentCount = $model::where('user_id', $actor->id)
            ->where('created_at', '>=', $floodInterval)
            ->count();

        if ($recentCount >= $this->floodLimit) {
            $lastPostTime = $model::where('user_id', $actor->id)
                ->orderBy('created_at', 'desc')
                ->first()?->created_at;

            $remainingMinutes = $lastPostTime
                ? max(1, $this->floodIntervalMinutes - Carbon::parse($lastPostTime)->diffInMinutes())
                : $this->floodIntervalMinutes;

            throw new PermissionDeniedException(
                $this->translator->trans('peopleinside-antiflood.forum.error.flood_limit', [
                    '{count}' => $this->floodLimit,
                    '{minutes}' => $this->floodIntervalMinutes,
                    '{remaining}' => $remainingMinutes,
                ])
            );
        }
    }
}
