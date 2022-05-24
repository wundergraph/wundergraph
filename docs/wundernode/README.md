# WunderNode

#### Server listen

`wunderctl up --listen_addr localhost:9991` Starts the server on the given port.

By default, the server will listen on the address(es) (IPv4 and IPv6) resolved by `localhost` when no specific address is provided. If listening on any available interface is desired, then specifying `--listen_addr 0.0.0.0:9991` for the address will
listen on all IPv4 addresses. This is useful especially in environments like Kubernetes to make the application reachable to
readiness probes.

__Don't forget to use brackets `[::]:port` when specifying a IPv6 IP.__

_Using `[::]` for the address will listen on all IPv6 addresses and, depending on OS, may also listen
on all IPv4 addresses._

Be careful when deciding to listen on all interfaces; it comes with inherent security concerns.