#!/usr/bin/env node

'use strict';

var updateNotifier = require('update-notifier');
var meow = require('meow');
var crin = require('./');

var cli = meow({
    help: [
        'Usage',
        '  $ crin [<revision|latest>]',
        '',
        'Examples',
        '  $ crin latest',
        '  $ crin 350030'
    ]
}, {
    string: ['_']
});

updateNotifier({pkg: cli.pkg}).notify();

var input = cli.input;

if (input.length === 0) {
    console.error('Parameter [<revision|latest>] missing.');
    cli.showHelp();
} else {
    var revision = input[0];
    if (revision === 'latest') {
        crin(0);
    } else {
        revision = parseInt(revision, 10);
        if (isNaN(revision)) {
            console.error(
                'Revision number is not valid.\n' +
                'See available revisions here: http://commondatastorage.googleapis.com/chromium-browser-continuous/index.html'
            );
        } else {
            crin(revision);
        }
    }
}
