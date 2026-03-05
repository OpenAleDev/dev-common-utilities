
// before use install bun.sh
// launch with:
// bun run github_up.ts

import {$} from "bun";
import config from './config/config.json';
import { existsSync } from "fs";


// Guard: if .env or .ssh already exist, abort to avoid overwriting existing keys/config
const envExists = existsSync("docker/.env");
const sshExists = existsSync(".ssh");


// 1. Read config.json 
//console.log("- Config:", config)
if(!config) {
    throw new Error("ERR => config.json could not be read or is empty");
}

const _githubEmail = config?.github_account_email;
const _githubUsername = config?.github_account_username;
const _githubLocalFolder = config?.github_repo_local_folder;

if(!_githubEmail) {
    throw new Error("ERR => $githubEmail is not defined in config.json");
}

if(!_githubUsername) {
    throw new Error("ERR => $githubUsername is not defined in config.json");
}


if(!_githubLocalFolder) {
    throw new Error("ERR => $githubLocalFolder is not defined in config.json");
}

// 2. We have to create files to generate a docker container for common dev utilities: first of all managing github actions for all repositories
//    This project will be called "dev-common-utilities"

// Files to create:


// - .env --------------------------------------------------------------
if(!envExists) {

    const envFileContent = `
GITHUB_EMAIL=${_githubEmail}
GITHUB_USERNAME=${_githubUsername}

REPO_ROOT_PATH=${_githubLocalFolder}

GITHUB_SSH_KEY_PATH=${_githubLocalFolder}/dev-common-utilities/github/.ssh
`
    await $`echo "${envFileContent}" > docker/.env`

}
// -----------------------------------------------------------------


// - .ssh for github --------------------------------------------------------------
if(!sshExists) {
    // - .ssh/id_ed25519 => to connect to github
    await $`mkdir -p .ssh`
    await $`ssh-keygen -t ed25519 -C "${_githubEmail}" -f .ssh/id_ed25519`

    // Don't forget to register the generated public key in github account settings 
    // -> ssh and gpg keys 
    // -> new ssh key
}
// -----------------------------------------------------------------


// - Dockerfile => already present
// - docker-compose.yml => already present

// launch the container
await $`cd docker && docker-compose up -d`
