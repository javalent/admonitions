# Obsidian Admonition

Adds admonition block-styled content to Obsidian.md, styled after [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/reference/admonitions/)

**Please note, as of 2.0.0, all admonitions must be prefixed with `ad-`**

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/all.gif)

## Usage

Place a code block with the admonition type:

````markdown
```ad-note
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.
```
````

Becomes:

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/default.png)

## Options

````markdown
```ad-<type> # Admonition type. See below for a list of available types.
title:                  # Admonition title.
collapse:               # Create a collapsible admonition.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.

```
````

### Titles

The admonition will render with the type of admonition by default. If you wish to customize the title, you can do so this way:

````markdown
```ad-note
title: Title
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.
```
````

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/title.png)

Custom titles are rendered as Markdown, so they support the full Obsidian Markdown syntax.

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/title-markdown.png)

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/rendered-title-markdown.png)

Leave the title field blank to only display the admonition.

````markdown
```ad-note
title:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.
```
````

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/no-title.png)

### Collapsible

Use the `collapse` parameter to create a collapsible admonition.

`collapse: open` will start the admonition opened on render, but allow collapse on click.

If a blank title is provided, the collapse parameter will not do anything.

Admonitions may be set to be collapsible by default in settings.

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/collapse.gif)

## Nesting Admonitions

Admonitions may be nested inside each other indefinitely using the [Python Markdown](https://python-markdown.github.io/extensions/admonition/) syntax.

> :warning: **Please note that this syntax _cannot_ be used for the original admonition. It must be a codeblock (```).**

Example:

````
```ad-note
title: Nested Admonitions
collapse: open

Hello!

!!! ad-note
	title: This admonition is nested.
	This is a nested admonition!
	!!! ad-warning
		title: This admonition is closed.
		collapse: close


This is in the original admonition.
```
````

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/nested.png)

## Admonition Types

The following admonition types are currently supported:

| Type     | Aliases                     |
| -------- | --------------------------- |
| note     | note, seealso               |
| abstract | abstract, summary, tldr     |
| info     | info, todo                  |
| tip      | tip, hint, important        |
| success  | success, check, done        |
| question | question, help, faq         |
| warning  | warning, caution, attention |
| failure  | failure, fail, missing      |
| danger   | danger, error               |
| bug      | bug                         |
| example  | example                     |
| quote    | quote, cite                 |

See [this](https://squidfunk.github.io/mkdocs-material/reference/admonitions/) for a reference of what these admonitions look like.

The default admonitions are customizable by creating a user-defined admonition of the same name.

## Custom Admonitions

Custom admonitions may be created in settings.

Creating a new admonition requires three things: the type, the icon to use, and the color of the admonition.

Only one admonition of each type may exist at any given time; if another admonition of the same type is created, it will override the previously created one.

If a default admonition is overridden, it can be restored by deleting the user-defined admonition.

Please note that by default, the background color of the title is simply the color of the admonition at 10% opacity. CSS must be used to update this.

## Customization

This is all of the CSS applied to the admonitions. Override these classes to customize the look.

### Base Classes

Every admonition receives the following CSS classes:

```css
:root {
    --admonition-details-icon: url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42z'/></svg>");
}

.admonition {
    margin: 1.5625em 0;
    padding: 0;
    overflow: hidden;
    color: var(--text-normal);
    page-break-inside: avoid;
    background-color: var(--background-secondary);
    border-left: 0.2rem solid rgb(var(--admonition-color));
    border-radius: 0.1rem;
    box-shadow: 0 0.2rem 0.5rem var(--background-modifier-box-shadow);
}

.admonition-title {
    position: relative;
    padding: 0.6rem 0.25em;
    font-weight: 700;
    background-color: rgba(var(--admonition-color), 0.1);
}

.admonition-title-content {
    display: flex;
    justify-content: flex-start;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
}

.admonition-title-icon {
    color: rgb(var(--admonition-color));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0.5em 0 0.25em;
    min-width: 1em;
}

.admonition-title-markdown {
    display: block;
}

.admonition-title.no-title {
    display: none;
}

.admonition > .admonition-title.no-title + .admonition-content {
    margin-top: 1rem;
    margin-bottom: 1rem;
}

.admonition-content {
    margin: 0 0.6rem;
}
```

**_Please note, as of 3.0.0, the admonition colors are no longer set in the CSS._**

Each admonition receives the `.admonition-<type>` class. You can use this selector to override specific admonition types, but the plugin does not add any styling using this selector by default.

To set the color of admonition types via CSS, specific the following the `--admonition-color` variable **_as an RGB triad_**:

```css
.admonition-note {
    --admonition-color: 68, 138, 255 !important;
}
```

### Collapsible

If an admonition is collapsible, it will receive the following CSS:

```css
details.admonition:not([open]) {
    padding-bottom: 0;
    box-shadow: none;
}

details.admonition > summary {
    outline: none;
    list-style: none;
    display: block;
    min-height: 1rem;
    border-top-left-radius: 0.1rem;
    border-top-right-radius: 0.1rem;
    cursor: pointer;
}

details.admonition > summary::-webkit-details-marker {
    display: none;
}

details.admonition > summary > .collapser {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    content: "";
}

details.admonition > summary > .collapser > .handle {
    transform: rotate(0deg);
    transition: transform 0.25s;
    background-color: currentColor;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-image: var(--admonition-details-icon);
    mask-image: var(--admonition-details-icon);
    width: 20px;
    height: 20px;
}

details.admonition[open] > summary > .collapser > .handle {
    transform: rotate(90deg);
}
```

### No Title

An icon without a title will have this CSS:

```css
.admonition-title.no-title {
    display: none;
}
```

## Settings

### Syntax Highlighting

Turns on an experimental mode that uses Obsidian's markdown syntax highlighter inside admonition code blocks.

### Sync Links to Metadata Cache

This will attempt to sync internal links within admonitions to the metadata cache used by Obsidian. This will allow graph view to display these links.

This setting is experimental and could have unintended consequences. If you begin to experience odd behavior, try turning it off and reloading Obsidian.

### Collapsible By Default

Admonitions will be automatically rendered as collapsible (open) by default.

If set, use `collapse: none` in an admonition block to override.

### Default Collapse Type

**This setting is only available if Collapsible By Default is ON**

Admonitions will be automatically rendered as opened or closed when collapsible by default.

### Copy Button

Adds a "copy content" button to every admonition block.

### Register and Unregister Commands

Commands may be registered for each custom admonition type to insert them into an open note by clicking the `Register Commands` button.

Clicking this button will add two commands for that admonition type:

1. Insert <type>
2. Insert <type> with title

These commands can have hotkeys assigned to them under Settings > Hotkeys.

Registered commands may be removed by clicking on `Unregister Commands`.

## Todo

No additional features are planned at this time. If there is a feature missing that you would like to see, please open an issue.

-   [x] Add the ability to collapse the admonition
-   [x] Custom admonitions
-   [x] Settings tab to customize icon and color of all admonitions
-   [x] Ability to render markdown inside an admonition

# Version History

## 4.4.0

-   Added ability to register and unregister commands to insert admonitions into a note
    -   Admonitions that have been created in settings can have commands registered by clicking the new "Register Commands" button
    -   Registering commands adds two commands: `Insert <type>` and `Insert <type> With Title`
    -   Registered commands can be removed by clicking "Unregister Commands"

## 4.3.0

-   Added Sync Links to Metadata Cache setting

## 4.2.0

-   Added Collapsible by Default and Default Collapse Type settings

## 4.1.5

-   Improved Admonition Icon selection experience

## 4.1.4

-   Trimmed whitespace from content when copying to clipboard.

## 4.1.0

-   Added "Copy Button" setting
    -   Turning this on adds a "copy content" button to each admonition, which copies the admonition content to the clipboard

## 4.0.0

-   Nested admonitions are now possible

## 3.3.0

-   Added commands to open and collapse all admonitions in active note
-   Admonition icons now respect the font size of the admonition title
-   Collapse handle now centers inside the title element
-   CSS changes

## 3.2.0

-   Added a setting to turn on default Obsidian syntax highlighting to admonition code block types
-   Admonitions now render titles as Markdown

## 3.1.0

-   Fixed issue where checkboxes in admonitions were not toggleable

## 3.0.0

-   Added ability to create custom admonitions via Settings
    -   Color, icon, and admonition-type are customizable
    -   Default admonitions can be overridden by creating a custom admonition of the same type
    -   Delete the custom admonition to restore default

## 2.0.0

-   To maintain compatibility with other plugins, admonition types must now be prefixed with `ad-` (as in, `ad-note`).

## 1.0.0

-   Community plugin release
-   Bug fixes

## 0.2.0

-   Uses Obsidian's native markdown renderer to render admonition content
-   Removed requirement to use the `content:` tag if `title:` or `collapse:` is set

## 0.0.5

-   Added `collapse:` parameter to create collapsible admonitions

## 0.0.1

-   Release

# Installation

## From within Obsidian

From Obsidian v0.9.8, you can activate this plugin within Obsidian by doing the following:

-   Open Settings > Third-party plugin
-   Make sure Safe mode is **off**
-   Click Browse community plugins
-   Search for this plugin
-   Click Install
-   Once installed, close the community plugins window and activate the newly installed plugin

## From GitHub

-   Download the Latest Release from the Releases section of the GitHub Repository
-   Extract the plugin folder from the zip to your vault's plugins folder: `<vault>/.obsidian/plugins/`  
    Note: On some machines the `.obsidian` folder may be hidden. On MacOS you should be able to press `Command+Shift+Dot` to show the folder in Finder.
-   Reload Obsidian
-   If prompted about Safe Mode, you can disable safe mode and enable the plugin.
    Otherwise head to Settings, third-party plugins, make sure safe mode is off and
    enable the plugin from there.

### Updates

You can follow the same procedure to update the plugin

# Warning

This plugin comes with no guarantee of stability and bugs may delete data.
Please ensure you have automated backups.

# TTRPG plugins

If you're using Obsidian to run/plan a TTRPG, you may find my other plugin useful:

-   [Obsidian Leaflet](https://github.com/valentine195/obsidian-leaflet-plugin) - Add interactive maps to Obsidian.md notes
-   [Dice Roller](https://github.com/valentine195/obsidian-dice-roller) - Roll & re-roll dice in notes
