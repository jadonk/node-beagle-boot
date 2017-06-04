const ROMVID = 0x0451;
const ROMPID = 0x6141;
const BOOTPS = 67;
const BOOTPC = 68;
const IPUDP = 17;
const SPLVID = 0x0525;
const SPLPID = 0xA4A2;
const ETHIPP = 0x0800;
const ETHARPP = 0x0806;
const MAXBUF = 450;
const server_hwaddr = [0x9a, 0x1f, 0x85, 0x1c, 0x3d, 0x0e];
const server_ip = [0xc0, 0xa8, 0x01, 0x09];     // 192.168.1.9
const BB_ip = [0xc0, 0xa8, 0x01, 0x03];         // 192.168.1.3
const servername = [66, 69, 65, 71, 76, 69, 66, 79, 79, 84];       // ASCII ['B','E','A','G','L','E','B','O','O','T']
const file_spl = [42, 83, 80, 76, 43];                             // ASCII ['*','S','P','L','*']
const file_uboot = [85, 66, 79, 79, 84];                           // ASCII ['U','B','O','O','T']

// Size of all packets
var rndisSize = 44;
var etherSize = 14;
var arp_Size = 28;
var ipSize = 20;
var udpSize = 8;
var bootpSize = 300;
var tftpSize = 4;
var fullSize = 386;


// Include modules
var usb = require('usb');
var protocols = require('./src/protocols');
var deasync = require('deasync');


// Connect to BeagleBone
var device = usb.findByIds(ROMVID, ROMPID);
device.open();
var interface = device.interface(1);    // Select interface 1

// Detach Kernel Driver
if(interface.isKernelDriverActive()){
    interface.detachKernelDriver();
}

interface.claim();                      

// Set endpoints for usb transfer
var inEndpoint = interface.endpoint(0x81);
var outEndpoint = interface.endpoint(0x02);

// Receive BOOTP
var bootp_buf = Buffer.alloc(MAXBUF-rndisSize);     // Buffer for InEnd transfer
inEndpoint.timeout = 1000;                          
inEndpoint.transfer(MAXBUF, onFirstIn);             // InEnd transfer
var done = false;                                   // Boolean for sync function
function onFirstIn(error, data) {                   // Callback for InEnd transfer
        data.copy(bootp_buf, 0, rndisSize, MAXBUF);
        done = true;
}
deasync.loopWhile(function(){return !done;});       // Synchronize InEnd transfer function

var ether = protocols.decode_ether(bootp_buf);      // Gets decoded ether packet data

var rndis = protocols.make_rndis(fullSize-rndisSize);   // Make RNDIS

var eth2 = protocols.make_ether2(ether.h_source, server_hwaddr);    // Make ether2

var ip = protocols.make_ipv4(server_ip, BB_ip, IPUDP, 0, ipSize + udpSize + bootpSize); // Make ipv4

var udp = protocols.make_udp(bootpSize, BOOTPS, BOOTPC);    // Make udp

var bootreply = protocols.make_bootp(servername, file_spl, 1, ether.h_source, BB_ip, server_ip);    // Make BOOTP for reply