#!/usr/bin/env bash

heroku container:login
heroku container:push web -a orbs-voting-proxy-server
heroku container:release web -a orbs-voting-proxy-server