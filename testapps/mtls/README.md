# WunderGraph with mTLS

1. Start the mTLS server that mocks the SpaceX API.
   ```
   pnpm start:server
   ```
2. Start WunderGraph with mTLS.
   ```
   pnpm run dev
   ```
3. Make a request
   ```
   curl -X GET http://localhost:9991/operations/Dragons
   ```

## Cheat Sheet

Before the PEM can be passed as ENV, you need to remove newlines with

```shell
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' ca.pem
```
