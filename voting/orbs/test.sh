#!/bin/bash -x
mkdir -p _out
mkdir -p _reports
go get -u github.com/orbs-network/go-junit-report
go get -u ./...
go test ./_OrbsVoting/. -v &> _out/test.out # so that we always go to the junit report step
go-junit-report -set-exit-code < _out/test.out > _out/results.xml
EXITCODE=$?
cat _out/test.out
exit $EXITCODE
