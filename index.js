import { getInput, info, addPath, setFailed } from '@actions/core';
import { HttpClient, HttpClientError } from '@actions/http-client';
import { downloadTool, extractTar } from '@actions/tool-cache';
import { platform as _platform, arch as _arch } from 'os';
import { join } from 'path';

async function main() {
    try {
        const version = getInput('version');
        const authToken = getInput('auth-token');
        let downloadUrl;

        if (version === 'latest') {
            info('Initializing HTTP client');
            const http = new HttpClient('ayushmanchhabra/globstar-action', [], {
                allowRetries: true,
                maxRetries: 3,
            });

            info('Fetching latest release version from GitHub');
            const response = await http.getJson('https://api.github.com/repos/DeepSourceCorp/globstar/releases', { authorization: authToken });
            if (response.statusCode !== 200) {
                throw new Error(`Failed to fetch releases: ${response.statusCode}`);
            }
            info('Parse the result')
            const data = response.result;
            downloadUrl = data.assets.find(asset => asset.name.includes(getPlatform())).browser_download_url;
        } else {
            downloadUrl = `https://github.com/DeepSourceCorp/globstar/releases/download/globstar_${version}_${getPlatform()}_${getArch()}.tar.gz`;
        }

        info(`Downloading binary from ${downloadUrl}`);
        const downloadPath = await downloadTool(downloadUrl);
        const extractedPath = await extractTar(downloadPath);
        const binaryPath = join(extractedPath, 'globstar');

        addPath(binaryPath);
        info(`Added ${binaryPath} to PATH`);
    } catch (error) {
        if (
            error instanceof HttpClientError &&
            (error.statusCode === 403 || error.statusCode === 429)
          ) {
            setFailed(
              `Received HTTP status code ${error.statusCode}. This usually indicates the rate limit has been exceeded`
            );
        }
        else {
            setFailed(error.message);
        }
    }
}

function getPlatform() {
    const platform = _platform();

    if (platform === 'linux') {
        return 'linux';
    } else if (platform === 'darwin') {
        return 'darwin';
    } else if (platform === 'win32') {
        return 'windows';
    } else {
        throw new Error(`Unsupported platform: ${platform} ${arch}`);
    }
}

function getArch() {
    const arch = _arch();
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

main();
