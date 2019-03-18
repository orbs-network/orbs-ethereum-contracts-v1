# Orbs Voting Proxy Server
> The purpose of this server is to be a proxy for the [voting UI](https://orbs-network.github.io/voting/) in case user doesn't have Metamask extension. It allows to view the application in the read-only mode by querying this server.

## Development
1. Run `npm install`
1. Run `npm start`

## Deployment
The current host of the docker image is Heroku.

### Prerequsites
1. Install Docker
1. Install Heroku CLI
1. Login to Heroku

### How to deploy?
1. Run `npm run contracts:prod` (Optional)
1. Run `npm run deploy`