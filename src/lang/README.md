## Localization

The plugin has full localization support, and will attempt to load the current Obsidian locale. If one does not exist, it will fall back to English.

### Adding a new Locale

New locales can be added by creating a pull request. Two things should be done in this pull request:

1. Create the locale in the `locales` folder by copying the `en.ts` file. This file should be given a name matching the string returned by `moment.locale()`.
2. Create the translation by editing the value of each property.
3. Add the import in `locales.ts`.
4. Add the language to the `localeMap` variable.

