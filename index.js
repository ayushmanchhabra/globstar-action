import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import core from '@actions/core';
import client from '@actions/http-client';
import cache from '@actions/tool-cache';

async function setupGlobStar() {
    try {
        let version = core.getInput('version');
        const authToken = core.getInput('auth-token');
        const cacheOption = Boolean(core.getInput('cache'));
        let downloadUrl;
        let shasumUrl;

        if (version === 'latest') {
            core.info('Initializing HTTP client');
            const http = new client.HttpClient('ayushmanchhabra/globstar-action', [], {
                allowRetries: true,
                maxRetries: 3,
            });

            core.info('Fetching latest release version from GitHub');
            const response = await http.getJson('https://api.github.com/repos/DeepSourceCorp/globstar/releases', { authorization: authToken });
            version = response.result[0].tag_name.replace(/v/g, '');
            if (response.statusCode !== 200) {
                throw new Error(`Failed to fetch releases: ${response.statusCode}`);
            }
            downloadUrl = response.result[0].assets.find(asset => asset.name.includes(getPlatform())).browser_download_url;
            shasumUrl = response.result[0].assets.find(asset => asset.name.includes('checksums.txt')).browser_download_url;
        } else {
            downloadUrl = `https://github.com/DeepSourceCorp/globstar/releases/download/v${version}/globstar_${version}_${getPlatform()}_${getArch()}.tar.gz`;
            shasumUrl = `https://github.com/DeepSourceCorp/globstar/releases/download/v${version}/checksums.txt`;
        }

        let downloadPath = '';
        downloadPath = cache.find('globstar', version);
        if (cacheOption && downloadPath !== '') {
            core.info(`Found cached Globstar binary at ${downloadPath}`);
        } else {
            core.info(`Downloading binary from ${downloadUrl}`);
            downloadPath = await cache.downloadTool(downloadUrl);
        }

        core.info(`Verifying shasum of Globstar binary.`);
        const shasumFilePath = await cache.downloadTool(shasumUrl);
        const shasumFileBuffer = await fs.promises.readFile(shasumFilePath, { encoding: 'utf-8' });

        const shasums = shasumFileBuffer.trim().split('\n');
        const storedShasum = shasums.find((line) => {
            const [shasum, release] = line.split(/\s+/);
            if (release === `globstar_${version}_${getPlatform()}_${getArch()}.tar.gz`) {
                return shasum;
            }
        });
        if (!storedShasum) {
            throw new Error(`Unable to get shasum for globstar_${version}_${getPlatform()}_${getArch()}.tar.gz release.`);
        }

        const fileBuffer = await fs.promises.readFile(downloadPath);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        const generatedShasum = hash.digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(generatedShasum, 'hex'), Buffer.from(storedShasum, 'hex'))) {
            throw new Error(`Expected ${storedShasum}, but got ${generatedShasum}`);
        }

        core.info(`Verification of Globstar binary is successful`);

        const extractedPath = await cache.extractTar(downloadPath);
        const binaryPath = path.join(extractedPath, 'globstar');
        let cachePath = '';
        if (cacheOption) {
            core.info(`Caching Globstar binary at ${cachePath}`);
            cachePath = await cache.cacheDir(extractedPath, 'globstar', version);
        } else {
            cachePath = binaryPath;
        }

        core.addPath(cachePath);
        core.info(`Added ${cachePath} to PATH`);
    } catch (error) {
        if (
            error instanceof client.HttpClientError &&
            (error.statusCode === 403 || error.statusCode === 429)
          ) {
            core.setFailed(
              `Received HTTP status code ${error.statusCode}. This usually indicates the rate limit has been exceeded`
            );
        }
        else {
            core.setFailed(error.message);
        }
    }
}

function getPlatform() {
    const platform = os.platform();

    if (platform === 'linux') {
        return 'linux';
    } else if (platform === 'darwin') {
        return 'darwin';
    } else if (platform === 'win32') {
        return 'windows';
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
}

function getArch() {
    const arch = os.arch();
    if (arch === 'ia32') {
        return 'x86';
    } else if (arch === 'x64') {
        return 'amd64';
    } else if (arch === 'arm64') {
        return 'arm64';
    } else {
        throw new Error(`Unsupported architecture: ${arch}`);
    }
}

setupGlobStar();
