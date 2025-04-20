<?php

use Peopleinside\AntiFlood\FloodGuard;

test('FloodGuard can be instantiated', function () {
    $guard = new FloodGuard();
    expect($guard)->toBeInstanceOf(FloodGuard::class);
});
