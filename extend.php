<?php

use Flarum\Extend;
use Peopleinside\AntiFlood\FloodGuard;

return [
    (new Extend\Event())
        ->listen(\Flarum\Discussion\Event\Saving::class, [FloodGuard::class, 'handleDiscussionSaving']),
    (new Extend\Event())
        ->listen(\Flarum\Post\Event\Saving::class, [FloodGuard::class, 'handlePostSaving']),
];
