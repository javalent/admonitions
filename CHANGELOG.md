# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [8.0.0](https://github.com/valentine195/obsidian-admonition/compare/7.0.4...8.0.0) (2022-03-14)


### Features

* Admonitions has been updated to support the new Obsidian callouts feature! Check the Readme for more information on what this means. ([3697e4b](https://github.com/valentine195/obsidian-admonition/commit/3697e4b60ca34ad703555de19f0b21f628aea530))

### [7.0.4](https://github.com/valentine195/obsidian-admonition/compare/7.0.3...7.0.4) (2022-03-03)


### Bug Fixes

* Content element will no longer be added if no content is provided (close [#201](https://github.com/valentine195/obsidian-admonition/issues/201)) ([94d7a4b](https://github.com/valentine195/obsidian-admonition/commit/94d7a4b956c9c7c7a23480242e27e00c19ac97e0))

### [7.0.3](https://github.com/valentine195/obsidian-admonition/compare/7.0.2...7.0.3) (2022-02-28)


### Bug Fixes

* fixes issue with icon suggester not loading icons ([4a463d3](https://github.com/valentine195/obsidian-admonition/commit/4a463d340a1625daba7bae7739e331c5522d33c0))

### [7.0.1](https://github.com/valentine195/obsidian-admonition/compare/7.0.0...7.0.1) (2022-02-25)


### Bug Fixes

* Fixes MSDoc-syntax in Live Preview ([e4d1cdb](https://github.com/valentine195/obsidian-admonition/commit/e4d1cdb7dd0e15b5f1876d8d14dfeb850b85527b))

## [7.0.0](https://github.com/valentine195/obsidian-admonition/compare/6.12.1...7.0.0) (2022-02-25)


### ⚠ BREAKING CHANGES

* Removes support for Python-style non-codeblock Admonitions.
* Removes generated `id` from Admonition elements.
* Python Markdown nesting syntax is no longer supported. Use nesting code blocks instead.

### Features

* Added Icon Packs (close [#181](https://github.com/valentine195/obsidian-admonition/issues/181)) ([e973cec](https://github.com/valentine195/obsidian-admonition/commit/e973cec353a656112f9310c64afb7780ba8590c3))
* Python Markdown nesting syntax is no longer supported. Use nesting code blocks instead. ([3e65292](https://github.com/valentine195/obsidian-admonition/commit/3e6529217ec54f2145d4eec5bb1ba1f687fef228))
* Removes generated `id` from Admonition elements. ([2f87101](https://github.com/valentine195/obsidian-admonition/commit/2f87101ed6ceaf7b7b4ebf5c07063efe476019dc))
* Removes support for Python-style non-codeblock Admonitions. ([b6ad0c4](https://github.com/valentine195/obsidian-admonition/commit/b6ad0c4ac146b9a946982b218aae599cf92ff7d4))


### Bug Fixes

* Admonition modal image button switched to icon ([02882e7](https://github.com/valentine195/obsidian-admonition/commit/02882e7adcb3a280508cf32d13a5f19db74bc729))
* Admonition suggestor is now the full width of the input element ([#190](https://github.com/valentine195/obsidian-admonition/issues/190)) ([a3b3c54](https://github.com/valentine195/obsidian-admonition/commit/a3b3c54703d4b8128ae1a16687c11dca40144908))
* Fixed checkboxes not working when in blockquotes or nested, including in the MS-Doc syntax (close [#150](https://github.com/valentine195/obsidian-admonition/issues/150)) ([202b826](https://github.com/valentine195/obsidian-admonition/commit/202b826b4d82e33c0524cde0da6f21f5d33ea0bf))
* Fixes pandoc and PDF export of blockquotes (close [#192](https://github.com/valentine195/obsidian-admonition/issues/192)) ([ba75de8](https://github.com/valentine195/obsidian-admonition/commit/ba75de802b10e12ed347d9dd05239e1c3905ca09))
* Removed old polyfill, fixed app layout ready call ([2ab15f1](https://github.com/valentine195/obsidian-admonition/commit/2ab15f101d193061cc13523465decbbf25527efa))

### [6.12.1](https://github.com/valentine195/obsidian-admonition/compare/6.12.0...6.12.1) (2022-02-22)


### Bug Fixes

* fixed mathjax rendering (close [#189](https://github.com/valentine195/obsidian-admonition/issues/189)) ([79acf7f](https://github.com/valentine195/obsidian-admonition/commit/79acf7f3bb426bfc6076a1d17ecaf59aad3af556))

## [6.12.0](https://github.com/valentine195/obsidian-admonition/compare/6.11.1...6.12.0) (2022-02-18)


### Features

* adds support for indented code blocks using MSDoc syntax (close [#176](https://github.com/valentine195/obsidian-admonition/issues/176)) ([9c9e6ac](https://github.com/valentine195/obsidian-admonition/commit/9c9e6ac6e1340a16eb498b1df321cd5fd2b3b9a6))


### Bug Fixes

* admonitions with custom titles now include them when using the inserted with title command (close [#145](https://github.com/valentine195/obsidian-admonition/issues/145)) ([7034477](https://github.com/valentine195/obsidian-admonition/commit/7034477ffbcd377a58f2c2308ceec6a7e3f0f314))
* fixed rpg awesome icons not showing on mobile (close [#122](https://github.com/valentine195/obsidian-admonition/issues/122)) ([903f18a](https://github.com/valentine195/obsidian-admonition/commit/903f18acca5b5fd49c5680b9d5d2bf2505aeb6d3))
* reduced margin on content inside admonitions without titles (close [#185](https://github.com/valentine195/obsidian-admonition/issues/185)) ([643ca8e](https://github.com/valentine195/obsidian-admonition/commit/643ca8e866f468358b0ca40e4064e68b30d588c9))

### [6.11.1](https://github.com/valentine195/obsidian-admonition/compare/6.11.0...6.11.1) (2022-02-17)


### Bug Fixes

* fixes bug where you couldn't have an empty title for the MSDoc syntax (close [#183](https://github.com/valentine195/obsidian-admonition/issues/183)) ([ca3de23](https://github.com/valentine195/obsidian-admonition/commit/ca3de23c3ba3e8e7130299ae2144f4b65522ba95))

## [6.11.0](https://github.com/valentine195/obsidian-admonition/compare/6.10.1...6.11.0) (2022-02-08)


### Features

* adds Hide Empty Admonitions setting (close [#171](https://github.com/valentine195/obsidian-admonition/issues/171)) ([bf379bf](https://github.com/valentine195/obsidian-admonition/commit/bf379bf5de32236dc0ca4bfa7b03a3768f3be090))


### Bug Fixes

* Disabled `!!!`-style syntax in settings. Legacy support will continue until version 7.0.0. ([14b662d](https://github.com/valentine195/obsidian-admonition/commit/14b662d8eb0a5bbc632d23e4d51ef8d639501cc2))
* Fixes several issues with Live Preview MSDoc syntax rendering (closes [#170](https://github.com/valentine195/obsidian-admonition/issues/170)) ([50562db](https://github.com/valentine195/obsidian-admonition/commit/50562db72329af76ed07d448af936a7347efac20))
* switch to Obsidian's Live Preview State Facet ([a9e43f9](https://github.com/valentine195/obsidian-admonition/commit/a9e43f93d8a0dfbddbeaf9a23d1f3df6e7513062))
* warned about future removal of `!!!`-style syntax ([cc183a8](https://github.com/valentine195/obsidian-admonition/commit/cc183a8cbae2c78bdc09d7b9a8d853534abed9a1))

### [6.10.1](https://github.com/valentine195/obsidian-admonition/compare/6.10.0...6.10.1) (2022-02-02)


### Bug Fixes

* admonitions render again when restarting app ([5945f02](https://github.com/valentine195/obsidian-admonition/commit/5945f022e8138847c1e8c167e6f2007152dbbc73))

## [6.10.0](https://github.com/valentine195/obsidian-admonition/compare/6.9.10...6.10.0) (2022-02-02)


### Features

* adds Drop Shadow setting to remove drop shadow ([d6d598e](https://github.com/valentine195/obsidian-admonition/commit/d6d598eee14a894c0ef06b6291a51f21f0c67967))

### [6.9.10](https://github.com/valentine195/obsidian-admonition/compare/6.9.9...6.9.10) (2022-02-02)


### Bug Fixes

* deferred onload to layout ready to improve plugin load times ([a9accc9](https://github.com/valentine195/obsidian-admonition/commit/a9accc9b44cdbc0531f7335b5c9d8c6d216c9422))

### [6.9.9](https://github.com/valentine195/obsidian-admonition/compare/6.9.8...6.9.9) (2022-01-28)


### Bug Fixes

* 🐛 ordered lists in live preview now render correctly ([72d03b6](https://github.com/valentine195/obsidian-admonition/commit/72d03b6d312f45ad1b097b9a67071ba3304de85e))

### [6.9.8](https://github.com/valentine195/obsidian-admonition/compare/6.9.7...6.9.8) (2022-01-27)


### Bug Fixes

* 🐛 MS Doc syntax is no longer case sensitive ([b2de6be](https://github.com/valentine195/obsidian-admonition/commit/b2de6be03c5885a2b6fd1c1935276a38a8d1d712))

### [6.9.7](https://github.com/valentine195/obsidian-admonition/compare/6.9.6...6.9.7) (2022-01-23)


### Bug Fixes

* fixes issue with an extra space in msdoc syntax not rendering ([0c08854](https://github.com/valentine195/obsidian-admonition/commit/0c0885461f7c410192d70bcf24253b878b129bdf))

### [6.9.6](https://github.com/valentine195/obsidian-admonition/compare/6.9.5...6.9.6) (2022-01-18)


### Bug Fixes

* improved live preview styling ([5a0c111](https://github.com/valentine195/obsidian-admonition/commit/5a0c11182c4935e491f52248123a98226e631660))
* improves live preview detection ([4a941fc](https://github.com/valentine195/obsidian-admonition/commit/4a941fc6e0af271bf1996183d19b6a1fd295d2b5))
* removed logs ([6a56b70](https://github.com/valentine195/obsidian-admonition/commit/6a56b706ed2248b4d142c37e7c314a4e5d6e68c9))
* Update release notes again ([e9ba91f](https://github.com/valentine195/obsidian-admonition/commit/e9ba91f727a4c61ab9249f668c18760679616b2c))

### [6.9.5](https://github.com/valentine195/obsidian-admonition/compare/6.9.4...6.9.5) (2022-01-12)


### Bug Fixes

* Remove Changelog boilerplate from release notes ([9ab1d18](https://github.com/valentine195/obsidian-admonition/commit/9ab1d18d4164e64ba74dcc151eff6cf1485ccb93))

### [6.9.4](https://github.com/valentine195/obsidian-admonition/compare/6.9.3...6.9.4) (2022-01-12)


### Bug Fixes

* Add release notes to releases ([ca4d88c](https://github.com/valentine195/obsidian-admonition/commit/ca4d88ca8f31078678bcbac3fa96139cc8a6e989))

### [6.9.3](https://github.com/valentine195/obsidian-admonition/compare/6.9.2...6.9.3) (2022-01-12)


### Bug Fixes

* fixes issue with long scrolling notes with new MS syntax in LP (closes [#149](https://github.com/valentine195/obsidian-admonition/issues/149)) ([03582c6](https://github.com/valentine195/obsidian-admonition/commit/03582c661d77f49a605ae6231681fdadb8a55e92))

### [6.9.2](https://github.com/valentine195/obsidian-admonition/compare/6.9.1...6.9.2) (2022-01-11)


### Bug Fixes

* add admonition copy button to MS syntax style admonitions ([7a1fc6c](https://github.com/valentine195/obsidian-admonition/commit/7a1fc6ca0ecca6370ac93496fba781a30a8a90f9))

### [6.9.1](https://github.com/valentine195/obsidian-admonition/compare/6.9.0...6.9.1) (2022-01-11)

## [6.9.0](https://github.com/valentine195/obsidian-admonition/compare/6.8.0...6.9.0) (2022-01-11)


### Features

* add a toggle for MS syntax in live preview ([8b73f47](https://github.com/valentine195/obsidian-admonition/commit/8b73f47b60d2984deee062ac396dc0562f5cb535))
* add live preview support to new blockquote admonitions ([936199c](https://github.com/valentine195/obsidian-admonition/commit/936199c182767d7563e60c03f414db2de1d18ab1))


### Bug Fixes

* clean up settings code ([b36e7e8](https://github.com/valentine195/obsidian-admonition/commit/b36e7e86d301024fc19a8e770ad594b67865e1d2))
* fixed webpack external modules ([f6c70a7](https://github.com/valentine195/obsidian-admonition/commit/f6c70a70df01924ff4c38d6972fa7d27102964ae))

## [6.8.0](https://github.com/valentine195/obsidian-admonition/compare/6.7.5...6.8.0) (2022-01-09)


### Features

* Adds MSDoc-style admonitions (close [#133](https://github.com/valentine195/obsidian-admonition/issues/133)) ([3af3922](https://github.com/valentine195/obsidian-admonition/commit/3af392265a6ec8f27002ece8a61d0f9d65626484))

### [6.7.5](https://github.com/valentine195/obsidian-admonition/compare/6.7.4...6.7.5) (2022-01-07)


### Bug Fixes

* improve live preview rendering ([#141](https://github.com/valentine195/obsidian-admonition/issues/141)) ([636eb83](https://github.com/valentine195/obsidian-admonition/commit/636eb83e18a4bbe484a2a2a9256d56e369204f5e))

### [6.7.4](https://github.com/valentine195/obsidian-admonition/compare/6.7.3...6.7.4) (2022-01-06)


### Bug Fixes

* partial fix for LP display issues ([85ca7b7](https://github.com/valentine195/obsidian-admonition/commit/85ca7b7d0c6553a4b01f4e327d8b86c2351530cf))

### [6.7.3](https://github.com/valentine195/obsidian-admonition/compare/6.7.2...6.7.3) (2022-01-05)


### Bug Fixes

* fixed checkbox behavior in admonitions (close [#135](https://github.com/valentine195/obsidian-admonition/issues/135)) ([db3f55e](https://github.com/valentine195/obsidian-admonition/commit/db3f55ed96ced410d3129faa38d7275b6613ccc7))

### [6.7.2](https://github.com/valentine195/obsidian-admonition/compare/6.7.1...6.7.2) (2021-12-03)


### Bug Fixes

* insert admonition commands now properly wrap selected text ([758ce51](https://github.com/valentine195/obsidian-admonition/commit/758ce516b1e639f0d6829aea866c9d0fa3101747))

### [6.7.1](https://github.com/valentine195/obsidian-admonition/compare/6.7.0...6.7.1) (2021-11-29)


### Bug Fixes

* admonitions without titles properly display again (close [#131](https://github.com/valentine195/obsidian-admonition/issues/131)) ([b3bd5c2](https://github.com/valentine195/obsidian-admonition/commit/b3bd5c2fe1010a85e79c5662dc83752de54f032f))

## [6.7.0](https://github.com/valentine195/obsidian-admonition/compare/6.6.1...6.7.0) (2021-11-22)

### Features

-   added ability to default to no title ([0983790](https://github.com/valentine195/obsidian-admonition/commit/0983790cd930657d69c96c885c23eabcb884987e))
-   added per-admonition copy button setting ([0983790](https://github.com/valentine195/obsidian-admonition/commit/0983790cd930657d69c96c885c23eabcb884987e)), closes [#118](https://github.com/valentine195/obsidian-admonition/issues/118)
-   added setting to turn off title parsing ([0983790](https://github.com/valentine195/obsidian-admonition/commit/0983790cd930657d69c96c885c23eabcb884987e)) (close [#123](https://github.com/valentine195/obsidian-admonition/issues/123))

### Bug Fixes

-   fixed error that could happen when editing admonitions

### [6.6.1](https://github.com/valentine195/obsidian-admonition/compare/6.6.0...6.6.1) (2021-11-16)

### Bug Fixes

-   added tdlr admonition type (not sure how it got removed) ([c7d14eb](https://github.com/valentine195/obsidian-admonition/commit/c7d14eb50b693830d0e8f227777097e411b474f5))

## [6.6.0](https://github.com/valentine195/obsidian-admonition/compare/6.5.1...6.6.0) (2021-11-16)

### Features

-   parent element now receives styles ([1297cc1](https://github.com/valentine195/obsidian-admonition/commit/1297cc1659f02b9510669b00034943515fef8365))

### [6.5.1](https://github.com/valentine195/obsidian-admonition/compare/6.5.0...6.5.1) (2021-11-01)

### Bug Fixes

-   fixed admonition color issue ([b600bfb](https://github.com/valentine195/obsidian-admonition/commit/b600bfbac6c0a8077d91aa65717be81782cb4438))

## [6.5.0](https://github.com/valentine195/obsidian-admonition/compare/6.4.1...6.5.0) (2021-11-01)

### Features

-   added ability to globally turn off Admonition Color being set directly on element ([afbcc23](https://github.com/valentine195/obsidian-admonition/commit/afbcc235dd3314ec779f44a25c4ffda74e0acaf1))
