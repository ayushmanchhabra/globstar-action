import core from '@actions/core';
import github from '@actions/github';

try {
    const version = core.getInput('version');
    core.setOutput("version", version);    
} catch (error) {
    core.setFailed(error.message);
}
