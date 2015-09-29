'use strict';

var fs = require('fs'),
    os = require('os'),
    path = require('path'),
    spawnSync = require('child_process').spawnSync,
    request = require('request'),
    progress = require('request-progress');

var platformUrlPath = '',
    revision = 0;

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
                reject(new Error('Could not find the lastest revision'));
            }
            try {
                var data = JSON.parse(body);
                var latestRevision = parseInt(data['metadata']['cr-commit-position-number'], 10) || 0;
                if (latestRevision > 0) {
                    revision = (revision > 0) ? revision : latestRevision;
                    console.log('Latest revision: ' + latestRevision);
                    console.log('Install revision: ' + revision);
                    console.log();
                    resolve(revision);
                }
            } catch (e) {
                reject(new Error('Revision number not found in response'));
            }
        });
    });
}

function downloadChromiumBinary() {
    var url = 'https://www.googleapis.com/storage/v1/b/chromium-browser-continuous/o?delimiter=/&prefix=' + platformUrlPath + '/' + revision +
              '/&fields=items(mediaLink,name,size,updated)';

    return new Promise(function (resolve, reject) {
        request(url, function (error, response, body) {
            if (error) {
                reject(new Error('Could not find the right binary'));
            }
            try {
                var data = JSON.parse(body);

                var binaryFileName = 'mini_installer.exe';

                var found;
                for (var i = 0; i < data.items.length; i++) {
                    var item = data.items[i];
                    if (item.name.indexOf(binaryFileName) > 0) {
                        found = item;
                        break;
                    }
                }

                var binaryDownloadPath = path.join(os.tmpdir(), binaryFileName);

                console.log('Starting binary download');
                progress(request.get(found.mediaLink))
                    .on('progress', function (state) {
                        console.log('Download progress: ' + state.percent + '%');
                    })
                    .on('error', function () {
                        reject(new Error('Could not download binary'));
                    })
                    .pipe(fs.createWriteStream(binaryDownloadPath))
                    .on('close', function (err) {
                        if (err) {
                            reject(new Error('Could not save binary to tempfolder "' + binaryDownloadPath + '"'));
                        }
                        console.log('Download successful');
                        console.log();
                        resolve(binaryDownloadPath);
                    });

            } catch (e) {
                reject(new Error('Error while finding the correct binary for revision "' + revision + '".'));
            }
        });

    });
}

function startInstallProcess(binaryPath) {
    console.log('Installing from "' + binaryPath + '"');
    var ret = spawnSync(binaryPath);
    if (!ret.error) {
        console.log('Install process successful');
    } else {
        console.log('Install failed. Please kill all chromium instances and run this script again');
    }
    fs.unlink(binaryPath);
}

module.exports = function (specificRevision) {
    revision = specificRevision;

    getPlatformSpecificUrlPath(process.platform, process.arch)
        .then(getLatestRevisionNumber)
        .then(downloadChromiumBinary)
        .then(startInstallProcess)
        .catch(function (error) {
            console.error(error.message);
            throw error.message;
        });
};
