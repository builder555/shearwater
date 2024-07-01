### Findings so far:

* A message is always prepended with 0x01 0x00
* Sent data is encapsulated with 0xFF 0x01 XX 0x00 ZZ
    * XX is the message length + 1 
    * ZZ is the message
* Received data is encapsulated with 0x01 0xFF XX 0x00 ZZ
    * XX is the message length + 1
    * ZZ is the message
* To download the log:
    * Request dive log download: 0x35 XX 0x34 YY ZZ
        * XX: compression method 0x00 - none, 0x10 - compressed
        * YY: address
        * ZZ: download size
    * receive acknowledgement: 0x75 0x10 0x82
    * while received data < ZZ, request next block of data: 0x36 NN
        * NN: block number, starting at 1
* stop bluetooth communication: 0x2E 0x90 0x20 0x00


### TODO
- [ ] Figure out proper decoding algorithm
- [ ] Clean up send/receive loop
- [ ] Put message hex in vars
- [ ] Check messages against actual logs