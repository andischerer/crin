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

if (cli.input[0] === 'latest') {
    crin();
} else {
    console.error('Parameter latest missing.');
    cli.showHelp();
}
