import app from 'flarum/admin/app';

const DEFAULT_MAX_PENDING = 6;
const DEFAULT_FLOOD_LIMIT = 3;
const DEFAULT_POST_FLOOD_LIMIT = 0;
const DEFAULT_FLOOD_INTERVAL_MINUTES = 5;

const FALLBACK_PENDING_LIMIT_MESSAGE =
  'You have too many posts or topics pending approval. Please wait until some are reviewed before creating new content.';
const FALLBACK_FLOOD_LIMIT_MESSAGE =
  'You are posting too quickly. Please wait {minutes} minutes before posting again.';

const translateOrFallback = (key: string, fallback: string): string => {
  if (!app.translator) {
    return fallback;
  }

  const translated = app.translator.trans(key);

  return translated === key ? fallback : translated;
};

const resolveDefaultMessage = (suggestionKey: string, forumErrorKey: string, fallback: string): string => {
  const suggestion = translateOrFallback(suggestionKey, '');

  if (suggestion) {
    return suggestion;
  }

  return translateOrFallback(forumErrorKey, fallback);
};

const localizeExtensionDescription = () => {
  if (!app.data?.extensions?.['peopleinside-antiflood']) {
    return;
  }

  const localizedDescription = app.translator.trans('peopleinside-antiflood.admin.description');

  if (localizedDescription === 'peopleinside-antiflood.admin.description') {
    return;
  }

  app.data.extensions['peopleinside-antiflood'].description = localizedDescription;
};

app.initializers.add('peopleinside-antiflood', () => {
  localizeExtensionDescription();

  const pendingLimitDefaultMessage = resolveDefaultMessage(
    'peopleinside-antiflood.admin.settings.pending_limit_message_suggestion',
    'peopleinside-antiflood.forum.error.pending_limit',
    FALLBACK_PENDING_LIMIT_MESSAGE
  );
  const floodLimitDefaultMessage = resolveDefaultMessage(
    'peopleinside-antiflood.admin.settings.flood_limit_message_suggestion',
    'peopleinside-antiflood.forum.error.flood_limit',
    FALLBACK_FLOOD_LIMIT_MESSAGE
  );

  const extension = app.extensionData.for('peopleinside-antiflood');

  extension.registerSetting({
    setting: 'peopleinside-antiflood.max_pending',
    type: 'number',
    min: 1,
    label: app.translator.trans('peopleinside-antiflood.admin.settings.max_pending_label'),
    help: app.translator.trans('peopleinside-antiflood.admin.settings.max_pending_help'),
    placeholder: String(DEFAULT_MAX_PENDING),
    default: String(DEFAULT_MAX_PENDING),
  });

  extension.registerSetting({
    setting: 'peopleinside-antiflood.flood_limit',
    type: 'number',
    min: 1,
    label: app.translator.trans('peopleinside-antiflood.admin.settings.flood_limit_label'),
    help: app.translator.trans('peopleinside-antiflood.admin.settings.flood_limit_help'),
    placeholder: String(DEFAULT_FLOOD_LIMIT),
    default: String(DEFAULT_FLOOD_LIMIT),
  });

  extension.registerSetting({
    setting: 'peopleinside-antiflood.post_flood_limit',
    type: 'number',
    min: 0,
    label: app.translator.trans('peopleinside-antiflood.admin.settings.post_flood_limit_label'),
    help: app.translator.trans('peopleinside-antiflood.admin.settings.post_flood_limit_help'),
    placeholder: String(DEFAULT_POST_FLOOD_LIMIT),
    default: String(DEFAULT_POST_FLOOD_LIMIT),
  });

  extension.registerSetting({
    setting: 'peopleinside-antiflood.flood_interval_minutes',
    type: 'number',
    min: 1,
    label: app.translator.trans('peopleinside-antiflood.admin.settings.flood_interval_minutes_label'),
    help: app.translator.trans('peopleinside-antiflood.admin.settings.flood_interval_minutes_help'),
    placeholder: String(DEFAULT_FLOOD_INTERVAL_MINUTES),
    default: String(DEFAULT_FLOOD_INTERVAL_MINUTES),
  });

  extension.registerSetting({
    setting: 'peopleinside-antiflood.pending_limit_message',
    type: 'textarea',
    label: app.translator.trans('peopleinside-antiflood.admin.settings.pending_limit_message_label'),
    help: app.translator.trans('peopleinside-antiflood.admin.settings.pending_limit_message_help'),
    placeholder: pendingLimitDefaultMessage,
    default: pendingLimitDefaultMessage,
  });

  extension.registerSetting({
    setting: 'peopleinside-antiflood.flood_limit_message',
    type: 'textarea',
    label: app.translator.trans('peopleinside-antiflood.admin.settings.flood_limit_message_label'),
    help: app.translator.trans('peopleinside-antiflood.admin.settings.flood_limit_message_help'),
    placeholder: floodLimitDefaultMessage,
    default: floodLimitDefaultMessage,
  });
});
