#!/usr/bin/env bash

#docker build -t orbs:asb --no-cache -f docker/images/asb/Dockerfile .
docker-compose -f docker/compose/asb/docker-compose.yml up -d
docker exec asb_asb_1 go test . -run TestFullFlowOnGanache -v -count 1