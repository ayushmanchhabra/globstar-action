const core = require('@actions/core');
const github = require('@actions/github');
const tc = require('@actions/tool-cache');
const os = require('os');
const path = require('path');

async function main() {
    try {
        const version = core.getInput('version');
        let downloadUrl;

        if (version === 'latest') {
            core.info('Fetching latest release version from GitHub');
            const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
            const { data: releases } = await octokit.repos.listReleases({
                owner: 'DeepSourceCorp',
                repo: 'globstar',
            });

            if (releases.length === 0) {
                core.setFailed('No releases found');
                return;
            }

            const latestRelease = releases[0];
            downloadUrl = latestRelease.assets.find(asset => asset.name.includes(getPlatform())).browser_download_url;
        } else {
            downloadUrl = `https://github.com/DeepSourceCorp/globstar/releases/download/globstar_${version}_${getPlatform()}_${getArch()}.tar.gz`;
        }

        core.info(`Downloading binary from ${downloadUrl}`);
        const downloadPath = await tc.downloadTool(downloadUrl);
        const extractedPath = await tc.extractTar(downloadPath);
        const binaryPath = path.join(extractedPath, 'globstar');

        core.addPath(binaryPath);
        core.info(`Added ${binaryPath} to PATH`);
    } catch (error) {
        core.setFailed(error.message);
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
        throw new Error(`Unsupported platform: ${platform} ${arch}`);
    }
}

function getArch () {
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

main();
