### This is very much a work in progress. Some of these notes may be completely wrong.

### Findings so far:

* Shearwater uses [UDS protocol](https://en.wikipedia.org/wiki/Unified_Diagnostic_Services)
* A received message is always prepended with one of: 
    * 0x01 0x00 
    * 0x02 0x00
    * 0x02 0x01
* Sent data is encapsulated with 0xFF 0x01 XX 0x00 ZZ
    * XX is the message length + 1 
    * ZZ is the message
* Received data is encapsulated with 0x01 0xFF XX 0x00 ZZ
    * XX is the message length + 1
    * ZZ is the message
* stop bluetooth communication: 0x2E 0x90 0x20 0x00

Examples:

```shell
RDBI 8021: 
Request: 01 00 FF 01 04 00 22 80 21 C0
Response: 010001ff0d00628021018000000000020080c0
# 01 00 
# 01 ff 0d 00 <- response contains 13 byes (12 + 1 end of message)
# 62  <- indicates successful 8021 response
# 8021
# 01 80 00 00 00 <- format is "Petrel Native"
# 00 02 00 80
# c0
```

```shell
Get manifest:
Request:  01 00 ff 01 08 00 35 00 34 e0 00 00 00 c0
Response: 010001ff0400751082c0
Request:  01 00 ff 01 03 00 36 01 c0
Response: 020001ff83007601a5c4001a665314ce66531a470000057e0089001b0007a5000007bf4000020602a5c40019665314056653143b0000003b0024001a00079e200007a32000020602a5c4001865
Response: 020145033b6545104a00000d140084001900075020000788dbdc00020602a5c400176544f35c6544f8d700000580008700180007300000074a8000020602c0
# Keep sending 01 00 ff 01 03 00 36 XX c0 where XX is subsequent blocks (02, 03, etc.) until you reach block 12 (0x0C)
# at this point send 01 00 ff 01 02 00 37 c0 to complete the transfer
```

```shell
Get dive log:
Request:  01 00 ff 01 08 00 35 10 34 80 07 9e 20 c0
Response: 010001ff0400751092c0
Request:  01 00 ff 01 03 00 36 01 c0
Response: 030001ff93007601887fdbdc319945568ffd00c380566a9c520a01a360b272005c07fe018cca2ab47fe8061d1500daaa73ca840f3d2c9a6e770098d40c131500c300328aac0fa7aed2663558cd
Response: 03010ca3400281806791a80c320703f456803089a42269089a7ffffff00c2c030380c4b19a194680050300cf003078540e077ead62a1314854d211bfffddfe10e00c06040882dbdc4050189c12
Response: 03027196c0
# Keep sending  01 00 ff 01 03 00 36 XX c0 where XX is subsequent blocks (02, 03, etc.)
# until you get something like:
# Response: 0301dbdc0e79958143a178428800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
# Response: 03020000c0
```

### Basic UI

![ui](/assets/screenshot.png)