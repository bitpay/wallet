# Copay Project Resources

This directory contains a `src.sketch` file from which all other assets are exported or derived.

## Requirements

You'll need [Sketch](https://www.sketchapp.com/) to make any changes to this directory. You'll also need to have [Homebrew](http://brew.sh/) installed to regenerate all assets.

Sketch and Homebrew are only available for macOS, and several processes in `generate.sh` require utilities that ship with macOS, so this process requires macOS.

## Install sketchtool

If you do not have `sketchtool` installed, you'll first need to install it.

```sh
sh install.sh
```

## Generate assets

To make an update, first make the change in `src.sketch`, then run:

```sh
sh generate.sh
```

## Commit the changes

Be sure to commit the modified `src.sketch`, as well as any modified exported assets.
