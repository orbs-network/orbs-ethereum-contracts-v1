#!/usr/bin/env bash

echo "Building the test container for ASB.."
docker build -t orbs:asb -f asb/docker/Dockerfile .

echo "Starting up test environment.."
docker-compose -f asb/docker/docker-compose.yml down -v

export GANACHE_START_TIME=$(node -e "console.log(new Date(new Date() - 1000 * 60 * 2))")
docker-compose -f asb/docker/docker-compose.yml up -d
docker exec asb_gamma_1 echo "ganache host.docker.internal" > /etc/hosts

echo "Sleeping for a few seconds to let Ganache and Gamma become ready to accept connections"
sleep 5

echo "====================== Running ASB tests ======================"
docker exec docker_asb_1 go test . -run TestFullFlowOnGanache -v -count 1
EXITCODE=$?
echo "====================== ASB tests finished with exit code: $EXITCODE  ======================"

echo "Shutting down test environment.."
docker-compose -f asb/docker/docker-compose.yml down -v

exit $EXITCODE
