const core = require('@actions/core');
const { execSync, exec } = require('child_process')

//Variables.
let heroku = {
    'app_name': core.getInput('heroku_app_name'),
    'api_key': core.getInput('heroku_api_key'),
    'email_address': core.getInput('heroku_email_address'),
    'want_to_login': core.getInput('want_to_just_login'),
    'use_git': core.getInput('use_git'),
    'use_docker': core.getInput('use_docker'),
}

//Create Netrc cat file used during login with cli.
const createNetrcFileForLogin = ({ email_address, api_key }) => {
    return execSync(`cat >~/.netrc <<EOF
machine api.heroku.com
  login ${email_address}
  password ${api_key}
machine git.heroku.com
  login ${email_address}
  password ${api_key}
        `);
}
//Login method to check if user is logged in.
const login = () => {
    try {
        createNetrcFileForLogin(heroku);
        const user = execSync('heroku auth:whoami').toString();
        console.log(`Successfully Logged in with user: ${user}`);
    } catch (error) {
        console.log(error.message);
        core.setFailed(error.message);
    }
}

//Adding remote repo to heroku.
const addRemote = ({ app_name }) => {
    try {
        const gitInit = execSync('git init').toString();
        console.log(gitInit);
        execSync(`heroku git:remote -a ${app_name}`);
    } catch (error) {
        core.setFailed(error.message);
        console.log(error.message);
    }
}


const deployWithDocker = () => {

}
const deployWithGit = () => {
    try {
        execSync("git add .");
        execSync(`git commit -m "Initial commit" `);
        execSync("git push heroku master");
        execSync("heroku run python manage.py migrate");
    } catch (error) {
        console.log(error.message);
        console.log("Attempting to disable `collecstatic` cmd");
        try {
            execSync("git config:set DISABLE_COLLECTSTATIC=1");
            execSync("git push heroku master");
            execSync("heroku run python manage.py migrate");
        } catch (error) {
            core.setFailed(error.message);
            console.log(error.message);
        }
    }
}
const pushAndRelease = ({ use_docker, use_git }) => {
    try {
        if (use_docker) {
            deployWithDocker();
        } else if (use_git) {
            deployWithGit();
        }
        else if (use_docker && use_git) {
            //Error only one deployment method at a time is allowed
            core.setFailed('Error : One deployment method at a time is allowed');
            console.log('Error : One deployment method at a time is allowed');
        } else {
            //Nothing is configured attempting to use default git
            console.log('No deployment method is specified. Attempting to use default use git...');
            deployWithGit();
        }
    } catch (error) {
        core.setFailed(error.message);
        console.log(error.message);
    }
}

//Run Login
if (heroku.want_to_just_login) {
    login();
    return //, use return if user jus want to login
}

login();
addRemote(docker);
pushAndRelease(docker);

core.setOutput(
    "status",
    "Successfully deployed app from branch"
);

