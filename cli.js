#!/usr/bin/env node

'use strict';

var updateNotifier = require('update-notifier');
var meow = require('meow');
var crin = require('./');

var cli = meow({
	help: [
		'Usage',
		'  $ crin latest'
	]
}, {
	string: ['_']
});

updateNotifier({pkg: cli.pkg}).notify();

var input = cli.input;
var opts = cli.flags;

if (input[0] === 'latest') {
    crin();
} else {
    console.error('Parameter latest missing.');
    cli.showHelp();
}
