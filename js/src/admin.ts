type ExtensionDataContext = {
  registerSetting: (setting: Record<string, unknown> | (() => unknown)) => void;
};

type SettingStream = {
  (): string;
  (value: string): string;
};

type SettingsPageContext = {
  setting: (key: string, fallback?: string) => SettingStream;
};

type AdminApp = {
  extensionData?: {
    for: (extensionId: string) => ExtensionDataContext;
  };
  initializers?: {
    add: (key: string, callback: () => void) => void;
  };
  translator?: {
    trans: (key: string) => string;
  };
  data?: {
    extensions?: Record<
      string,
      {
        description?: string;
      }
    >;
  };
};

type FlarumGlobal = {
  core?: {
    compat?: Record<string, AdminApp>;
  };
  reg?: {
    get: (namespace: string, id: string) => AdminApp | undefined;
  };
};

type SettingType = 'number' | 'textarea';

type ResettableSettingConfig = {
  setting: string;
  label: string;
  help: string;
  type: SettingType;
  min?: number;
  placeholder: string;
  default: string;
};

const EXTENSION_IDS = ['peopleinside-antiflood', 'peopleinside-flarum-ext-antiflood'] as const;
const DEFAULT_MAX_PENDING = 6;
const DEFAULT_FLOOD_LIMIT = 3;
const DEFAULT_POST_FLOOD_LIMIT = 0;
const DEFAULT_FLOOD_INTERVAL_MINUTES = 5;

const FALLBACK_PENDING_LIMIT_MESSAGE =
  'You have too many posts or topics pending approval. Please wait until some are reviewed before creating new content.';
const FALLBACK_FLOOD_LIMIT_MESSAGE =
  'You are posting too quickly. Please wait {minutes} minutes before posting again.';

const flarumGlobal =
  typeof globalThis !== 'undefined' ? (globalThis as { flarum?: FlarumGlobal }).flarum : undefined;
const m =
  typeof globalThis !== 'undefined'
    ? (globalThis as { m?: (selector: string, attrs?: Record<string, unknown> | null, children?: unknown) => unknown }).m
    : undefined;
const app =
  flarumGlobal?.core?.compat?.['admin/app'] ??
  flarumGlobal?.reg?.get('core', 'admin/app');

const canRegisterSettings =
  app &&
  typeof app.initializers?.add === 'function' &&
  typeof app.extensionData?.for === 'function' &&
  typeof app.translator?.trans === 'function';

const translateOrFallback = (key: string, fallback: string): string => {
  if (!app?.translator) {
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
  if (!app?.translator || !app.data?.extensions) {
    return;
  }

  const localizedDescription = app.translator.trans('peopleinside-antiflood.admin.description');

  if (localizedDescription === 'peopleinside-antiflood.admin.description') {
    return;
  }

  for (const extensionId of EXTENSION_IDS) {
    if (app.data.extensions[extensionId]) {
      app.data.extensions[extensionId].description = localizedDescription;
    }
  }
};

const createResettableSetting = (config: ResettableSettingConfig, resetLabel: string) => {
  return function renderResettableSetting(this: SettingsPageContext) {
    if (!m) {
      return null;
    }

    const inputId = `peopleinside-antiflood-setting-${config.setting}`;
    const resetAriaLabel = `${resetLabel}: ${config.label}`;
    const settingStream = this.setting(config.setting, config.default);
    const value = settingStream() || '';

    const inputAttributes: Record<string, unknown> = {
      id: inputId,
      className: 'FormControl',
      placeholder: config.placeholder,
      style: config.type === 'textarea' ? { flex: '1 1 auto', minHeight: '84px' } : { flex: '1 1 auto' },
      value,
      oninput: (event: Event) => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        settingStream(target.value);
      },
    };

    if (config.type === 'number') {
      inputAttributes.type = 'number';
      if (typeof config.min === 'number') {
        inputAttributes.min = String(config.min);
      }
    } else {
      inputAttributes.rows = 3;
    }

    return m('div', { className: 'Form-group' }, [
      config.label ? m('label', { for: inputId }, config.label) : null,
      m('div', { className: 'helpText' }, config.help),
      m(
        'div',
        {
          style: {
            display: 'flex',
            gap: '8px',
            alignItems: config.type === 'textarea' ? 'flex-start' : 'center',
          },
        },
        [
          config.type === 'textarea' ? m('textarea', inputAttributes) : m('input', inputAttributes),
          m(
            'button',
            {
              type: 'button',
              className: 'Button',
              'aria-label': resetAriaLabel,
              onclick: () => {
                settingStream('');
              },
            },
            resetLabel
          ),
        ]
      ),
    ]);
  };
};

if (canRegisterSettings) {
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
    const resetButtonLabel = translateOrFallback('peopleinside-antiflood.admin.settings.reset_button', 'Reset');

    const settingConfigs: ResettableSettingConfig[] = [
      {
        setting: 'peopleinside-antiflood.max_pending',
        label: app.translator.trans('peopleinside-antiflood.admin.settings.max_pending_label'),
        help: app.translator.trans('peopleinside-antiflood.admin.settings.max_pending_help'),
        type: 'number',
        min: 1,
        placeholder: String(DEFAULT_MAX_PENDING),
        default: String(DEFAULT_MAX_PENDING),
      },
      {
        setting: 'peopleinside-antiflood.flood_limit',
        label: app.translator.trans('peopleinside-antiflood.admin.settings.flood_limit_label'),
        help: app.translator.trans('peopleinside-antiflood.admin.settings.flood_limit_help'),
        type: 'number',
        min: 1,
        placeholder: String(DEFAULT_FLOOD_LIMIT),
        default: String(DEFAULT_FLOOD_LIMIT),
      },
      {
        setting: 'peopleinside-antiflood.post_flood_limit',
        label: app.translator.trans('peopleinside-antiflood.admin.settings.post_flood_limit_label'),
        help: app.translator.trans('peopleinside-antiflood.admin.settings.post_flood_limit_help'),
        type: 'number',
        min: 0,
        placeholder: String(DEFAULT_POST_FLOOD_LIMIT),
        default: String(DEFAULT_POST_FLOOD_LIMIT),
      },
      {
        setting: 'peopleinside-antiflood.flood_interval_minutes',
        label: app.translator.trans('peopleinside-antiflood.admin.settings.flood_interval_minutes_label'),
        help: app.translator.trans('peopleinside-antiflood.admin.settings.flood_interval_minutes_help'),
        type: 'number',
        min: 1,
        placeholder: String(DEFAULT_FLOOD_INTERVAL_MINUTES),
        default: String(DEFAULT_FLOOD_INTERVAL_MINUTES),
      },
      {
        setting: 'peopleinside-antiflood.pending_limit_message',
        label: app.translator.trans('peopleinside-antiflood.admin.settings.pending_limit_message_label'),
        help: app.translator.trans('peopleinside-antiflood.admin.settings.pending_limit_message_help'),
        type: 'textarea',
        placeholder: pendingLimitDefaultMessage,
        default: pendingLimitDefaultMessage,
      },
      {
        setting: 'peopleinside-antiflood.flood_limit_message',
        label: app.translator.trans('peopleinside-antiflood.admin.settings.flood_limit_message_label'),
        help: app.translator.trans('peopleinside-antiflood.admin.settings.flood_limit_message_help'),
        type: 'textarea',
        placeholder: floodLimitDefaultMessage,
        default: floodLimitDefaultMessage,
      },
    ];

    const processedExtensionData = new Set<ExtensionDataContext>();

    for (const extensionId of EXTENSION_IDS) {
      const extension = app.extensionData.for(extensionId);
      if (processedExtensionData.has(extension)) {
        continue;
      }
      processedExtensionData.add(extension);

      for (const setting of settingConfigs) {
        extension.registerSetting(createResettableSetting(setting, resetButtonLabel));
      }
    }
  });
} else if (typeof console !== 'undefined' && typeof console.warn === 'function') {
  console.warn('[peopleinside-antiflood] Unable to initialize admin settings: admin app API not available.');
}
