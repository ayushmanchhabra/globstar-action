import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';

import * as core from '@actions/core';
import client from '@actions/http-client';
import * as cache from '@actions/tool-cache';

async function setupGlobStar() {
    try {
        let version = core.getInput('version');
        const authToken = core.getInput('auth-token');
        /* Boolean('false') is true: parse the input as a YAML boolean instead. */
        const cacheOption = core.getBooleanInput('cache');
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
            if (response.statusCode !== 200 || !Array.isArray(response.result)) {
                throw new Error(`Failed to fetch releases: ${response.statusCode}`);
            }
            const release = findRelease(response.result, getPlatform(), getArch());
            version = releaseVersion(release);
            core.info(`Using Globstar ${version}, the newest release with a ${getPlatform()} ${getArch()} binary`);
            downloadUrl = release.assets.find((asset) => asset.name === assetName(version, getPlatform(), getArch())).browser_download_url;
            shasumUrl = release.assets.find((asset) => asset.name === 'checksums.txt').browser_download_url;
        } else {
            downloadUrl = `https://github.com/DeepSourceCorp/globstar/releases/download/v${version}/globstar_${version}_${getPlatform()}_${getArch()}.tar.gz`;
            shasumUrl = `https://github.com/DeepSourceCorp/globstar/releases/download/v${version}/checksums.txt`;
        }

        /* A cached binary was verified when it was cached: use it as is. */
        const cachedPath = cacheOption ? cache.find('globstar', version) : '';
        if (cachedPath !== '') {
            core.info(`Found cached Globstar binary at ${cachedPath}`);
            core.addPath(cachedPath);
            core.info(`Added ${cachedPath} to PATH`);
            return;
        }
        if (cacheOption) {
            core.info(`Unable to find cached Globstar binary`);
        }

        core.info(`Downloading binary from ${downloadUrl}`);
        const downloadPath = await cache.downloadTool(downloadUrl);

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
        let cachePath = '';
        if (cacheOption) {
            cachePath = await cache.cacheDir(extractedPath, 'globstar', version);
            core.info(`Caching Globstar binary at ${cachePath}`);
        } else {
            /* PATH entries are directories: add the one holding the binary. */
            cachePath = extractedPath;
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

/**
 * Name of the Globstar release archive for a platform and architecture.
 * @param {string} version
 * @param {string} platform
 * @param {string} arch
 * @returns {string}
 */
function assetName(version, platform, arch) {
    return `globstar_${version}_${platform}_${arch}.tar.gz`;
}

/**
 * Version of a GitHub release, without the leading `v` of its tag.
 * @param {{ tag_name: string }} release
 * @returns {string}
 */
function releaseVersion(release) {
    return release.tag_name.replace(/^v/, '');
}

/**
 * Find the newest published release with a binary for this platform and
 * architecture. Not every release ships every binary: v0.7.2, for example,
 * only has darwin_arm64.
 * @param {Array<{ tag_name: string, draft: boolean, prerelease: boolean, assets: Array<{ name: string }> }>} releases  Newest first, as the GitHub API lists them.
 * @param {string} platform
 * @param {string} arch
 * @returns {object}
 */
function findRelease(releases, platform, arch) {
    const release = releases.find((candidate) => {
        if (candidate.draft || candidate.prerelease) {
            return false;
        }
        const names = candidate.assets.map((asset) => asset.name);
        return names.includes(assetName(releaseVersion(candidate), platform, arch)) && names.includes('checksums.txt');
    });
    if (release === undefined) {
        throw new Error(`No Globstar release has a ${platform} ${arch} binary.`);
    }
    return release;
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
