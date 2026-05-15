<?php

use Peopleinside\AntiFlood\FloodGuard;
use Illuminate\Contracts\Translation\Translator;

test('FloodGuard can be instantiated', function () {
    $translator = Mockery::mock(Translator::class);
    $guard = new FloodGuard($translator);
    expect($guard)->toBeInstanceOf(FloodGuard::class);
});
