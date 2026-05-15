<?php

use Flarum\Extend;
use Flarum\Discussion\Event\Saving as DiscussionSaving;
use Flarum\Post\Event\Saving as PostSaving;
use Peopleinside\AntiFlood\FloodGuard;

return [
    new Extend\Locales(__DIR__ . '/locale'),

    (new Extend\Event())
        ->listen(DiscussionSaving::class, [FloodGuard::class, 'handleDiscussionSaving'])
        ->listen(PostSaving::class, [FloodGuard::class, 'handlePostSaving']),
];
