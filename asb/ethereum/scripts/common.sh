#!/usr/bin/env bash

balance=10000000000000000000000000000
accounts=""

acc=( \
    0xcba8bc6ebdfb0725078c0ef527b6ae714a1056be2e970eec46a139fee4bc08e5 \
    0xeb0f50796fb2a6c0c197e3278b2c24d3e327ada96f0ff7aef05004ce06bbd135 \
    0x0e138328111902ebae14dcc3313d17c1a8f2e65b950aa71667b49d38f3fd5a18 \
    0xee24b24451afbcafd3b4abf82b60beb94c6b187c5b61be9989ecf97ea477185d \
    0x4771cd799764f0fe929a45e9218e336fb9caa5949a28718071eef731f5181109 \
    0x70b53106b1ce3e6b65cf8bcf8521163802e292c7e6809892c1abf8b89fc0a4e0 \
    0x97db63f41164d266915a563b337faf3a39e5bc733c11ecf5be153424edbbb501 \
    0x95ef376b4e63d9a9c5d3f934dbfb4c349809ddc8f12903778690bf58f93d71d9 \
    0xbeddf64f95109277e65f11b7b9c303da13ddec85a99e36a95e049e70a1e0319e \
    0x84521e299de7f835d75c7866fe69e1b8f238b65a311e7ce3943bb02d86b0aac1 \
    )

# Prepare a ganache accounts parameter string like --account="0x11c..,1000" --account="0xc5d...,1000" ....
for a in ${acc[@]}; do
  accounts=$accounts" --account=${a},${balance}"
done

# Helper funcs.

# Test if ganache is running on port $1.
# Result is in $?
ganache_running() {
  nc -z localhost $1
}

# Kills ganache process with its PID in $ganache_pid.
cleanup() {
  echo "cleaning up"
  # Kill the ganache instance that we started (if we started one).
  if [ -n "$ganache_pid" ]; then
    kill -9 $ganache_pid
  fi
}
