### This is very much a work in progress. Some of these notes may be completely wrong.

### Findings so far:

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
* To download the manifest:
    * Request dive manifest download: 0x35 XX 0x34 YY ZZ
        * XX: compression method 0x00 - none, 0x10 - compressed
        * YY: address
        * ZZ: download size
    * receive acknowledgement: 0x75 0x10 0x82
    * while received data < ZZ, request next block of data: 0x36 NN
        * NN: block number, starting at 1
* stop bluetooth communication: 0x2E 0x90 0x20 0x00

```
RDBI 8021: 
Request: [0x22, 0x80, 0x21]
Response: 010001ff0d00628021018000000000020080c0
    01 00 
    01 ff 0d 00 <- response contains 12 byes + 1 end of message
    62  <- indicates successful 8021 response
    8021
    01 80 00 00 00 <- format is "Petrel Native"
    00 02 00 80
    c0
```


### TODO
- [x] Figure out proper decoding algorithm
- [x] Clean up send/receive loop
- [ ] Put message hex in vars
- [ ] Check messages against actual logs