# UI UX Pro Max Installation Notes

Date: 2026-05-29

Repository: `/Users/sps/Documents/GitHub/sull1van.com`

Skill source: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`

## Summary

I installed UI UX Pro Max into this repository using the upstream installer for Codex:

```bash
npx uipro-cli init --ai codex
```

That command created a new repo-local `.codex` folder containing the Codex skill at:

```text
.codex/skills/ui-ux-pro-max
```

The repo already had a separate project-local copy at:

```text
.agents/skills/ui-ux-pro-max
```

I did not remove or overwrite that existing `.agents` copy. It was already present before this installation work started.

## What I Did

1. Read the local Codex skill installer instructions from:

```text
/Users/sps/.codex/skills/.system/skill-installer/SKILL.md
```

2. Checked the current repository path:

```bash
pwd
```

Result:

```text
/Users/sps/Documents/GitHub/sull1van.com
```

3. Checked the current git status:

```bash
git status --short
```

At the start, there were no visible tracked or untracked changes from `git status --short`.

4. Checked for existing local skills:

```bash
ls -la .agents .agents/skills .agents/skills/ui-ux-pro-max 2>/dev/null
find /Users/sps/.codex/skills /Users/sps/Documents/GitHub/sull1van.com/.agents/skills -maxdepth 3 -name SKILL.md -path '*ui-ux-pro-max*' -print 2>/dev/null
```

This showed that `.agents/skills/ui-ux-pro-max` already existed before the new install.

5. Tried the generic Codex skill installer against the GitHub repo:

```bash
python3 /Users/sps/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo nextlevelbuilder/ui-ux-pro-max-skill --path . --dest /Users/sps/Documents/GitHub/sull1van.com/.agents/skills
```

Result:

```text
Error: Invalid skill name.
```

Reason: the helper script derives the skill name from the selected path. A path of `.` does not produce a valid skill name.

6. Inspected the GitHub repository structure with the GitHub API:

```bash
curl -L https://api.github.com/repos/nextlevelbuilder/ui-ux-pro-max-skill/contents
curl -L 'https://api.github.com/repos/nextlevelbuilder/ui-ux-pro-max-skill/git/trees/main?recursive=1'
```

This showed that the Codex source assets live under `src/ui-ux-pro-max`, while the repo root contains the CLI, templates, docs, and generated platform files.

7. Tried the generic Codex skill installer with an explicit name:

```bash
python3 /Users/sps/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo nextlevelbuilder/ui-ux-pro-max-skill --path . --name ui-ux-pro-max --dest /Users/sps/Documents/GitHub/sull1van.com/.agents/skills
```

Result:

```text
Error: Destination already exists: /Users/sps/Documents/GitHub/sull1van.com/.agents/skills/ui-ux-pro-max
```

Reason: the repo already had `.agents/skills/ui-ux-pro-max`.

8. Tried downloading the upstream source subdirectory into a temporary install destination:

```bash
python3 /Users/sps/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo nextlevelbuilder/ui-ux-pro-max-skill --path src/ui-ux-pro-max --dest /private/tmp/ui-ux-pro-max-skill-install
```

Result:

```text
Error: SKILL.md not found in selected skill directory.
```

Reason: the upstream repo generates the final Codex skill from templates. The raw `src/ui-ux-pro-max` directory contains the data, scripts, and templates, but not a finished `SKILL.md`.

9. Read upstream installation instructions from:

```bash
curl -L https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/README.md
curl -L https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/src/ui-ux-pro-max/templates/platforms/codex.json
```

The upstream README recommends the CLI installer. The Codex platform template targets `.codex/skills/ui-ux-pro-max`.

10. Checked whether `.codex` already existed:

```bash
ls -la .codex .codex/skills .codex/skills/ui-ux-pro-max 2>/dev/null
find . -maxdepth 3 -path './.codex*' -print
```

Result: no `.codex` folder existed before the final install.

11. Ran the upstream installer:

```bash
npx uipro-cli init --ai codex
```

Installer output:

```text
npm warn exec The following package was not found and will be installed: uipro-cli@2.2.3

UI/UX Pro Max Installer

info Installing for: Codex (.codex/skills/)
- Installing files...
[ok] Generated from templates!

info Installed folders:
  + .codex

success UI/UX Pro Max installed successfully!

Next steps:
  1. Restart your AI coding assistant
  2. Try: "Build a landing page for a SaaS product"
```

12. Inventoried what was installed:

```bash
find .codex -type f | sort
find .codex -maxdepth 4 -type d | sort
du -sh .codex .codex/skills .codex/skills/ui-ux-pro-max .agents/skills/ui-ux-pro-max 2>/dev/null
git status --short
```

13. Verified the installed search script works:

```bash
python3 .codex/skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain style
```

Result: the command succeeded and returned 3 style results.

## Files And Folders Installed

The successful install created this new top-level folder:

```text
.codex
```

Installed directories:

```text
.codex
.codex/skills
.codex/skills/ui-ux-pro-max
.codex/skills/ui-ux-pro-max/data
.codex/skills/ui-ux-pro-max/data/stacks
.codex/skills/ui-ux-pro-max/scripts
.codex/skills/ui-ux-pro-max/scripts/__pycache__
```

Installed files:

```text
.codex/skills/ui-ux-pro-max/SKILL.md
.codex/skills/ui-ux-pro-max/data/charts.csv
.codex/skills/ui-ux-pro-max/data/colors.csv
.codex/skills/ui-ux-pro-max/data/icons.csv
.codex/skills/ui-ux-pro-max/data/landing.csv
.codex/skills/ui-ux-pro-max/data/products.csv
.codex/skills/ui-ux-pro-max/data/react-performance.csv
.codex/skills/ui-ux-pro-max/data/stacks/astro.csv
.codex/skills/ui-ux-pro-max/data/stacks/flutter.csv
.codex/skills/ui-ux-pro-max/data/stacks/html-tailwind.csv
.codex/skills/ui-ux-pro-max/data/stacks/jetpack-compose.csv
.codex/skills/ui-ux-pro-max/data/stacks/nextjs.csv
.codex/skills/ui-ux-pro-max/data/stacks/nuxt-ui.csv
.codex/skills/ui-ux-pro-max/data/stacks/nuxtjs.csv
.codex/skills/ui-ux-pro-max/data/stacks/react-native.csv
.codex/skills/ui-ux-pro-max/data/stacks/react.csv
.codex/skills/ui-ux-pro-max/data/stacks/shadcn.csv
.codex/skills/ui-ux-pro-max/data/stacks/svelte.csv
.codex/skills/ui-ux-pro-max/data/stacks/swiftui.csv
.codex/skills/ui-ux-pro-max/data/stacks/vue.csv
.codex/skills/ui-ux-pro-max/data/styles.csv
.codex/skills/ui-ux-pro-max/data/typography.csv
.codex/skills/ui-ux-pro-max/data/ui-reasoning.csv
.codex/skills/ui-ux-pro-max/data/ux-guidelines.csv
.codex/skills/ui-ux-pro-max/data/web-interface.csv
.codex/skills/ui-ux-pro-max/scripts/core.py
.codex/skills/ui-ux-pro-max/scripts/design_system.py
.codex/skills/ui-ux-pro-max/scripts/search.py
.codex/skills/ui-ux-pro-max/scripts/__pycache__/core.cpython-314.pyc
.codex/skills/ui-ux-pro-max/scripts/__pycache__/design_system.cpython-314.pyc
.codex/skills/ui-ux-pro-max/scripts/__pycache__/search.cpython-314.pyc
```

Size after installation:

```text
632K .codex
632K .codex/skills
632K .codex/skills/ui-ux-pro-max
```

## Pre-Existing Folder I Did Not Install

This folder already existed before the successful CLI install:

```text
.agents/skills/ui-ux-pro-max
```

I did not delete it, overwrite it, or update it. It is about `1.9M` and appears to be another project-local UI UX Pro Max skill copy.

## How To Use It

Restart Codex so it picks up the new `.codex` skill files.

Then ask for UI or UX work normally, for example:

```text
Build a landing page for a SaaS product.
```

You can also query the installed database directly:

```bash
python3 .codex/skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain style
```

## How To Uninstall The New Install

To remove only what I installed with the upstream CLI, delete the `.codex` folder from the repo root:

```bash
rm -rf /Users/sps/Documents/GitHub/sull1van.com/.codex
```

That removes:

```text
.codex/skills/ui-ux-pro-max
```

It also removes the generated Python bytecode files in:

```text
.codex/skills/ui-ux-pro-max/scripts/__pycache__
```

After removal, confirm it is gone:

```bash
test ! -e /Users/sps/Documents/GitHub/sull1van.com/.codex && echo ".codex removed"
git status --short
```

## How To Remove The Documentation File Too

This documentation file was also created by this work:

```text
UI-ux-pro-max-installation.md
```

To remove it:

```bash
rm -f /Users/sps/Documents/GitHub/sull1van.com/UI-ux-pro-max-installation.md
```

## Optional: Remove The Pre-Existing `.agents` Copy

Only do this if you also want to remove the older project-local copy that was already present before this install:

```bash
rm -rf /Users/sps/Documents/GitHub/sull1van.com/.agents/skills/ui-ux-pro-max
```

I did not install that copy during this task, so I would not remove it unless you intentionally want both local copies gone.

## Optional: Remove Temporary npm/npx Cache

The installer was run through `npx`, which downloaded `uipro-cli@2.2.3` through npm. That package was not added to this repository as a dependency, and no `package.json` or lockfile was changed by the install.

If you want to clean npm's cache, you can run:

```bash
npm cache clean --force
```

This is global npm cache cleanup, not repo-specific cleanup. It may slow down the next npm or npx command because packages will need to be downloaded again.

## Git Status After Install

After installation, `git status --short` showed:

```text
?? .codex/
```

After this file was added, git should show both:

```text
?? .codex/
?? UI-ux-pro-max-installation.md
```
