<?php

use Peopleinside\AntiFlood\FloodThrottler;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Translation\Translator;

test('FloodThrottler can be instantiated', function () {
    $translator = Mockery::mock(Translator::class);
    $settings = Mockery::mock(SettingsRepositoryInterface::class);
    $throttler = new FloodThrottler($translator, $settings);
    expect($throttler)->toBeInstanceOf(FloodThrottler::class);
});

test('FloodThrottler returns null for guest actors', function () {
    $translator = Mockery::mock(Translator::class);
    $settings = Mockery::mock(SettingsRepositoryInterface::class);
    $throttler = new FloodThrottler($translator, $settings);

    $actor = Mockery::mock(\Flarum\User\User::class);
    $actor->shouldReceive('isGuest')->andReturn(true);
    $actor->shouldNotReceive('isAdmin');

    $request = (new \GuzzleHttp\Psr7\ServerRequest('POST', '/'))->withAttribute('actor', $actor);

    expect($throttler($request))->toBeNull();
});

test('FloodThrottler returns null for admin actors', function () {
    $translator = Mockery::mock(Translator::class);
    $settings = Mockery::mock(SettingsRepositoryInterface::class);
    $throttler = new FloodThrottler($translator, $settings);

    $actor = Mockery::mock(\Flarum\User\User::class);
    $actor->shouldReceive('isGuest')->andReturn(false);
    $actor->shouldReceive('isAdmin')->andReturn(true);

    $request = (new \GuzzleHttp\Psr7\ServerRequest('POST', '/'))->withAttribute('actor', $actor);

    expect($throttler($request))->toBeNull();
});
