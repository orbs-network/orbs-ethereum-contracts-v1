#!/bin/bash -x
echo "Building the test container for the subscription contracts.."
docker build -t orbs:subscription -f subscription/docker/Dockerfile .

echo "Starting up test environment.."
docker-compose -f subscription/docker/docker-compose.yml down -v
docker-compose -f subscription/docker/docker-compose.yml pull
docker-compose -f subscription/docker/docker-compose.yml up -d
docker exec subscription_gamma_1 sudo echo "ganache host.docker.internal" > /etc/hosts

echo "Sleeping for a few seconds to let Ganache and Gamma become ready to accept connections"
sleep 5

echo "====================== Running subscription tests ======================"
docker exec docker_subscription_1 bash ./entrypoint.sh
EXITCODE=$?
echo "====================== subscription tests finished with exit code: $EXITCODE  ======================"

mkdir _out
docker-compose -f subscription/docker/docker-compose.yml logs > _out/docker.log

echo "Shutting down test environment.."
#docker-compose -f subscription/docker/docker-compose.yml down -v

exit $EXITCODE
