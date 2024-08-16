## Obsidian & reMarkable

This is a rework and improvement of [Obsidian & Remarkable](https://github.com/cobalamin/obsidian-remarkable), a plugin that uses [reSnap](https://github.com/cloudsftp/reSnap) to capture images of your Remarkable tablet.

A proper README will come soon!``

This also acts as a "nixification" of reSnap, and can be used as such for that purpose...

```bash
nix run .#setup-remarkable
nix run .#resnap -- <args>
```
