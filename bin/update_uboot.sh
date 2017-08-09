#!/bin/sh
start=0x44082
end=0x462b8
count=0x2236
cp uboot uboot-new
dd if=/dev/zero of=uboot-new seek=${start} count=${count} bs=1 conv=notrunc
cat tester.txt | tr '\n' '\0' | dd of=uboot-new seek=${start} bs=1 conv=notrunc
xxd uboot-new uboot-new.txt
