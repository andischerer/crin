'use strict';

var fs = require('fs'),
    os = require('os'),
    path = require('path'),
    spawnSync = require('child_process').spawnSync,
    request = require('request'),
    progress = require('request-progress');

var revision = 0,
    platformUrlPath = '';

function getPlatformSpecificUrlPath(platform, arch) {
    var platformIdentifier = platform.toLowerCase() + arch.toLowerCase();
    console.log('current platform:' + platformIdentifier);
    return new Promise(function (resolve, reject) {
        var systemUrlTranslation = {
                'win32x86': 'Win',
                'win32x64': 'Win_x64'
            };
        if (systemUrlTranslation.hasOwnProperty(platformIdentifier)) {
            platformUrlPath = systemUrlTranslation[platformIdentifier];
            resolve(platformUrlPath);
        }
        reject(new Error('Your System "' + platformIdentifier + '" is currently not supported'));
    });
}

function getLatestRevisionNumber() {
    var url = 'https://www.googleapis.com/storage/v1/b/chromium-browser-continuous/o/' + platformUrlPath + '%2FLAST_CHANGE';
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, body) {
            if (error) {
                reject(new Error('Could not find the last chromium revision number'));
            }
            try {
                var data = JSON.parse(body);
                revision = parseInt(data['metadata']['cr-commit-position-number'], 10) || 0;
                if (revision > 0) {
                    resolve(revision);
                }
                console.log('Latest chromium revision: ' + revision);
                console.log();
            } catch (e) {
                reject(new Error('Revision number not found in response'));
            }
        });
    });
}

function downloadChromiumBinary() {
    var url = 'https://www.googleapis.com/storage/v1/b/chromium-browser-continuous/o?delimiter=/&prefix=' + platformUrlPath + '/' + revision + '/&fields=items(mediaLink,name,size,updated)';
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, body) {
            if (error) {
                reject(new Error('Could not find the right chromium binary file'));
            }
            try {
                var data = JSON.parse(body);

                // @TODO: find correct executable binary for the given platform
                var found = data.items.find(function (item) {
                    return item.name.indexOf('mini_installer') > 0;
                });

                var binaryDownloadPath = path.join(os.tmpdir(), 'chromium.exe');

                console.log('Starting chromium binary download');
                progress(request.get(found.mediaLink))
                    .on('progress', function (state) {
                        console.log('Download progress: ' + state.percent + '%');
                    })
                    .on('error', function () {
                        reject(new Error('Could not download chromium binary'));
                    })
                    .pipe(fs.createWriteStream(binaryDownloadPath))
                    .on('close', function (err) {
                        if (err) {
                            reject(new Error('Could not save chromium binary to tempfolder "' + binaryDownloadPath + '"'));
                        }
                        console.log('Download successful');
                        console.log();
                        resolve(binaryDownloadPath);
                    });

            } catch (e) {
                reject(new Error('Error while finding the correct binary name.'));
            }
        });

    });
}

function startInstallProcess(binaryPath) {
    console.log('Installing chromium from "' + binaryPath + '"');
    var ret = spawnSync(binaryPath);
    if (!ret.error) {
        console.log('Install successful');
    } else {
        console.log('Install failed. Please kill all chromium instances and run this script again');
    }

    fs.unlink(binaryPath);
}

module.exports = function () {
    getPlatformSpecificUrlPath(process.platform, process.arch)
        .then(getLatestRevisionNumber)
        .then(downloadChromiumBinary)
        .then(startInstallProcess)
        .catch(function (error) {
            console.error(error.message);
            throw error.message;
        });
};
