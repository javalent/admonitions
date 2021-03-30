# Obsidian Admonition

Adds admonition block-styled content to Obsidian.md, styled after [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/reference/admonitions/)

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/all.gif)

## Usage

Place a code block with the admonition type:

````markdown
```note
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.
```
````

Becomes:

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/default.png)

## Options

````markdown
```<type> # Admonition type. See below for a list of available types.
title:                  # Admonition title.
collapse:               # Create a collapsible admonition.
content:                # Actual text of admonition. Only required if "title" or "collapse" is used.
```
````

### Content

Content is the actual text of the admonition.

**Note: As of 0.2.0, this is no longer required. Anything other than `title:` and `collapse:` will be included as the content.**

### Titles

The admonition will render with the type of admonition by default. If you wish to customize the title, you can do so this way:

````markdown
```note
title: Title
content: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.
```
````

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/title.png)

Leave the title field blank to only display the admonition.

````markdown
```note
title:
content: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.
```
````

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/no-title.png)

**Please note that when the title is included, you _must_ specify the content as well.**

### Collapsible

Use the `collapse` parameter to create a collapsible admonition.

`collapse: open` will start the admonition opened on render, but allow collapse on click.

If a blank title is provided, the collapse parameter will not do anything.

![](https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/images/collapse.gif)

**Please note that when the collapse parameter is included, you _must_ specify the content as well.**

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

## Customization

This is all of the CSS applied to the admonitions. Override these classes to customize the look.

### Base Classes

Every admonition receives the following CSS classes:

```css
.admonition {
    margin: 1.5625em 0;
    padding: 0 0.6rem;
    overflow: hidden;
    color: var(--text-normal);
    page-break-inside: avoid;
    background-color: var(--background-secondary);
    border-left: 0.2rem solid;
    border-radius: 0.1rem;
    box-shadow: 0 0.2rem 0.5rem var(--background-modifier-box-shadow);
}
.admonition-title::before {
    position: absolute;
    left: 0.6rem;
    width: 1.25rem;
    height: 1.25rem;
    content: "";
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: contain;
    mask-size: contain;
}
.admonition-title {
    position: relative;
    margin: 0 -0.6rem 0 -0.8rem;
    padding: 0.4rem 0.6rem 0.4rem 2rem;
    font-weight: 700;
    background-color: rgba(68, 138, 255, 0.1);
    border-left: 0.2rem solid;
}
.admonition-content {
    margin-bottom: 0.6rem;
}
```

### Type Specific

Additionally, each admonition type will receive the `.admonition-<type>` class:

```css
/* Example of .admonition-note */
.admonition-note {
    border-color: #448aff;
}
.admonition-note > .admonition-title {
    background-color: rgba(68, 138, 255, 0.1);
}
.admonition-note > .admonition-title::before {
    background-color: #448aff;
    -webkit-mask-image: var(--admonition-icon--note);
    mask-image: var(--admonition-icon--note);
}
```

#### Type Icons

The admonition icons are svgs defined as variables on the `:root` with the name `--admonition-icon--<type>`. Override this variable to customize the icon. Example:

```css
--admonition-icon--quote: url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M14 17h3l2-4V7h-6v6h3M6 17h3l2-4V7H5v6h3l-2 4z'/></svg>");
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
    padding: 0.4rem 1.8rem 0.4rem 2rem;
    border-top-left-radius: 0.1rem;
    border-top-right-radius: 0.1rem;
    cursor: pointer;
}
details.admonition > summary::-webkit-details-marker {
    display: none;
}

details.admonition > summary:after {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background-color: currentColor;
    -webkit-mask-image: var(--admonition-details-icon);
    mask-image: var(--admonition-details-icon);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: contain;
    mask-size: contain;
    transform: rotate(0deg);
    transition: transform 0.25s;
    content: "";
}
details.admonition[open] > summary:after {
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

## Todo

-   [x] Add the ability to collapse the admonition
-   [ ] Custom admonitions
-   [ ] Settings tab to customize icon and color of all admonitions
-   [x] Ability to render markdown inside an admonition

# Version History

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
