#!/usr/bin/env bash -x

echo "Building the test container for the voting contracts.."
docker build -t orbs:voting -f docker/images/voting/Dockerfile .

echo "Starting up test environment.."
docker-compose -f docker/compose/voting/docker-compose.yml down -v
docker-compose -f docker/compose/voting/docker-compose.yml up -d
docker exec voting_gamma_1 echo "ganache host.docker.internal" > /etc/hosts

echo "Sleeping for a few seconds to let Ganache and Gamma become ready to accept connections"
sleep 5

echo "====================== Running Voting tests ======================"
docker exec voting_voting_1 bash ./entrypoint.sh
EXITCODE=$?
echo "====================== Voting tests finished with exit code: $EXITCODE  ======================"

echo "Shutting down test environment.."
docker-compose -f docker/compose/voting/docker-compose.yml down -v

exit $EXITCODE