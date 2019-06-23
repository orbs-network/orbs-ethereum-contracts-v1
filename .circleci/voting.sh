#!/bin/bash -x
echo "Building the test container for the voting contracts.."
docker build -t orbs:voting -f voting/docker/Dockerfile .
docker build -t orbs:unsanitry-gamma -f voting/docker/Dockerfile.gamma .

echo "Starting up test environment.."
docker-compose -f voting/docker/docker-compose.yml down -v
docker-compose -f voting/docker/docker-compose.yml up -d
#docker exec voting_gamma_1 sudo echo "ganache host.docker.internal" > /etc/hosts

echo "Sleeping for a few seconds to let Ganache and Gamma become ready to accept connections"
sleep 5

echo "====================== Running Voting tests ======================"
docker exec docker_voting_1 bash ./entrypoint.sh
EXITCODE=$?
echo "====================== Voting tests finished with exit code: $EXITCODE  ======================"

mkdir _out
docker-compose -f voting/docker/docker-compose.yml logs > _out/docker.log

echo "Shutting down test environment.."
docker-compose -f voting/docker/docker-compose.yml down -v

exit $EXITCODE
