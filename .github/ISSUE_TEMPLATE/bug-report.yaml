name: Bug Report
description: File a bug report
labels: bug
title: "[Bug]: "
assignees:
 - Valentine195
body:
  - type: markdown
    attributes:
      value: |
        ## Before you begin
        Make sure to use the latest version of the plugin.
        If you face any issues after installing, updating, or reloading the plugin, try restarting Obsidian before reporting the bug.
        Also, please make sure you **read and understand the **[guide for good bug reports](https://plugins.javalent.com/support/report-bug)**.

  - type: checkboxes
    id: duplicate-issues
    attributes:
      label: "Check for existing bug reports before submitting."
      description: "Use Label filters to refine your search. Check both open and closed issues to see if your issue has already been reported."
      options:
        - label: "I searched for existing Bug Reports and found no similar reports."
          required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What *should have** happened?
    validations:
      required: true

  - type: textarea
    id: what-happened
    attributes:
      label: Current behaviour
      description: |
        How did the issue manifest itself in reality? Including screenshots would be helpful.
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction
      description: |
       Please provide us with the exact steps to reproduce the issue. 
       The more detail you provide, the easier it will be for us to narrow down and fix the bug. 
       Please ensure that you paste in codeblocks and/or queries as text, rather than screenshots.
       Format your pasted text as described in Give us Text to copy. 
       We will not accept bug reports that require anyone to re-type text from screenshots or descriptive text.
       Please note that if you're a Mac user, a Safari bug might strip newlines from your text.
      placeholder: |
        Example of the level of detail needed to reproduce any bugs efficiently and reliably. 
        Without it, your issue may get worked on last.
        1. Launch Obsidian Sandbox via the `Open Sandbox Vault` command.
        2. Install the Javalent plugin.
        3. Change the global filter to...
        4. Create a new note called `Demo problem`.
        5. Installed Dataview and Statblocks stopped working.
        6. Switch to Reading mode.
        7. etc
        (Mac users: a Safari bug strips newlines from this text.)
    validations:
      required: true

  - type: checkboxes
    id: operating-systems
    attributes:
      label: Which Operating Systems are you using?
      description: You may select more than one.
      options:
        - label: Android
        - label: iPhone/iPad
        - label: Linux
        - label: macOS
        - label: Windows

  - type: input
    id: obsidian-version
    attributes:
      label: Obsidian Version Check
      description: Which Obsidian Version and Installer Version are you using?
      placeholder: 1.28.7 and 1.2.7
    validations:
      required: true

  - type: input
    id: plugin-version
    attributes:
      label: Plugin Version
      description: Which plugin version are you using?
      placeholder: 3.6.3
    validations:
      required: true

  - type: checkboxes
    id: other-plugins-disabled
    attributes:
      label: Confirmation
      description: Please confirm that you have completed the following steps before submitting your issue.
      options:
        - label: I have disabled all other plugins and the issue still persists.
          required: false

  - type: textarea
    id: possible-solution
    attributes:
      label: Possible solution
      description: |
        (Optional) If you have any ideas, please suggest a fix or a possible reason for the bug.
