#!/bin/bash -xe
mkdir -p _out
mkdir -p _reports
go get -u github.com/orbs-network/go-junit-report
go test ./_OrbsVoting/. -v &> _out/test.out || true # so that we always go to the junit report step
go-junit-report -set-exit-code < _out/test.out > _out/results.xml
