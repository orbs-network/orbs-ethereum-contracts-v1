#!/bin/bash -xe
mkdir -p _out
mkdir -p _reports
go get -u github.com/orbs-network/go-junit-report
go test ./_OrbsVoting/. -v &> _out/test.out || true # so that we always go to the junit report step
EXITCODE=$?
go-junit-report < _out/test.out > _out/results.xml
cat _out/test.out
exit $EXITCODE
