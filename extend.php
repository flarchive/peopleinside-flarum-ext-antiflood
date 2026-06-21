<?php

use Flarum\Extend;
use Peopleinside\AntiFlood\FloodThrottler;

if (!class_exists(FloodThrottler::class)) {
    require_once __DIR__ . '/src/FloodThrottler.php';
}

return [
    new Extend\Locales(__DIR__ . '/locale'),

    (new Extend\ThrottleApi())
        ->set('peopleinside-antiflood', FloodThrottler::class),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js'),
];
