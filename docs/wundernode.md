# WunderNode

#### Server listen

`wunderctl up` Starts the server with default host `127.0.0.1` and port `9991`.

By default, the server will listen on the address(es) (IPv4 and IPv6) resolved by `localhost` when no specific address is provided.
If listening on any available interface is desired, then specifying `WG_NODE_HOST=0.0.0.0` for the address will
listen on all IPv4 addresses. This is useful especially in environments like Kubernetes to make the application reachable to
readiness probes.

**Don't forget to use brackets `[::]` when specifying a IPv6 IP.**

_Using `WG_NODE_HOST=[::]` for the address will listen on all IPv6 addresses and, depending on OS, may also listen
on all IPv4 addresses._

Be careful when deciding to listen on all interfaces; it comes with inherent security concerns.
