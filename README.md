> Cli tool for installing/updating chromium from [chromium-browser-continuous channel](http://commondatastorage.googleapis.com/chromium-browser-continuous/index.html)

## Install

```
$ npm install --global crin
```

## Usage

```
$ crin --help

  Usage
    $ crin [<revision|latest>]

  Examples
    $ crin latest
    $ crin 350030
```

A chromium downgrade by specific revision is not possible. You have to uninstall first.
