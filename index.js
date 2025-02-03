import { getInput, info, setFailed, addPath } from '@actions/core';
import { getOctokit } from '@actions/github';
import { downloadTool, extractTar } from '@actions/tool-cache';
import { platform as _platform, arch as _arch } from 'os';
import { join } from 'path';

async function main() {
    try {
        const version = getInput('version');
        const authToken = getInput('auth-token');
        if (!authToken) {
            setFailed('Missing auth-token input');
            return;
          }
        let downloadUrl;

        if (version === 'latest') {
            info('Fetching latest release version from GitHub');
            const octokit = getOctokit(authToken);
            const { data: releases } = await octokit.rest.repos.listReleases({
                owner: 'DeepSourceCorp',
                repo: 'globstar',
            });

            if (releases.length === 0) {
                setFailed('No releases found');
                return;
            }

            const latestRelease = releases[0];
            downloadUrl = latestRelease.assets.find(asset => asset.name.includes(getPlatform())).browser_download_url;
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
        setFailed(error.message);
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

function getArch () {
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
