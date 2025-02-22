import os from 'node:os';
import path from 'node:path';

import core from '@actions/core';
import client from '@actions/http-client';
import cache from '@actions/tool-cache';

async function setupGlobStar() {
    try {
        const version = core.getInput('version');
        const authToken = core.getInput('auth-token');
        let downloadUrl;

        if (version === 'latest') {
            core.info('Initializing HTTP client');
            const http = new client.HttpClient('ayushmanchhabra/globstar-action', [], {
                allowRetries: true,
                maxRetries: 3,
            });

            core.info('Fetching latest release version from GitHub');
            const response = await http.getJson('https://api.github.com/repos/DeepSourceCorp/globstar/releases', { authorization: authToken });
            if (response.statusCode !== 200) {
                throw new Error(`Failed to fetch releases: ${response.statusCode}`);
            }
            downloadUrl = response.result[0].assets.find(asset => asset.name.includes(getPlatform())).browser_download_url;
        } else {
            downloadUrl = `https://github.com/DeepSourceCorp/globstar/releases/download/globstar_${version}_${getPlatform()}_${getArch()}.tar.gz`;
        }

        core.info(`Downloading binary from ${downloadUrl}`);
        const downloadPath = await cache.downloadTool(downloadUrl);
        const extractedPath = await cache.extractTar(downloadPath);
        const binaryPath = path.join(extractedPath, 'globstar');

        core.addPath(binaryPath);
        core.info(`Added ${binaryPath} to PATH`);
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
    } else if (arch == 'arm64') {
        return 'arm64';
    } else {
        throw new Error(`Unsupported architecture: ${arch}`);
    }
}

setupGlobStar();
