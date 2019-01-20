The `go-node` image is a base image which we use to install
a base environment for our test based `asb` image in CircleCI

This base image includes Node.js version 10+ and Go 1.11+ and prevents us from installing sort of static depedencies everytime within our `asb` testing Docker image build.