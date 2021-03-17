# Obsidian Admonition

Adds admonition block-styled content to Obsidian.md

## Usage

Place a code block with the admonition type:

````markdown
```note
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.
```
````

This will then render as the admonition:

<img src="https://i.imgur.com/295CZkD.png">

### Titles

The admonition will render with the type of admonition by default. If you wish to customize the title, you can do so this way:

````markdown
```note
title: Title
content: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla.
```
````

<img src="https://i.imgur.com/pBTJAFa.png">

**Please note that when the title is included, you _must_ specificy the content as well.**

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

The admonitions are each styled with with the following classes, which can be override to custom their appearance:

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
    box-shadow: var(--background-modifier-box-shadow);
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

Additionally, each admonition type will receive the ```.admonition-<type>``` class:

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

The admonition icons are defined as variables on the ```:root``` with the name ```--admonition-icon--<type>```. Override this variable to customize the icon.

## Installation

### From GitHub
- Download the Latest Release from the Releases section of the GitHub Repository
- Copy the `main.js`, `styles.css` and `manifest.json` files from the release to your vault's plugins folder: `<vault>/.obsidian/plugins/`  
Note: On some machines the `.obsidian` folder may be hidden. On MacOS you should be able to press `Command+Shift+Dot` to show the folder in Finder.
- Reload Obsidian
- If prompted about Safe Mode, you can disable safe mode and enable the plugin.
Otherwise head to Settings, third-party plugins, make sure safe mode is off and
enable the plugin from there.


## Warning

This plugin comes with no guarantee of stability and bugs may delete data.
Please ensure you have automated backups.