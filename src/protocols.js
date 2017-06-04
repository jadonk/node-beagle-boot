var sp = require('schemapack');             // Serialization module
var bp = require('binary-parser');          // Binary parser module
var Parser = bp.Parser;
var toggle = require('endian-toggle');      


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// Headers for encoding (Schemapack) //////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// rndis header for encoding
var rndis_1 = sp.build([
    { msg_type: 'uint32'},      // always
    { msg_len: 'uint32'},       // length of header + data + payload
    { data_offset: 'uint32'},   // offset from data until payload
    { data_len: 'uint32'},      // length of payload
    { band_offset: 'uint32'},   // not used here
    { pad: 'string'}
]);
var rndis_2 = sp.build([
    { band_len: 'uint32'},      // not used here
    { out_band_elements: 'uint32'}, //not used here
    { packet_offset: 'uint32'},     // not used here
    { packet_info_len: 'uint32'},   // not used here
    { reserved_first: 'uint32'},    // not used here
    { reserved_second: 'uint32'},   // not used here
    { pad: 'string'}
]);

// ether2 header for encoding
var ethhdr_e = sp.build([
    { h_dest:{0:'uint8',1:'uint8',2:'uint8',3:'uint8',4:'uint8',5:'uint8'} },       // Destination address
    { h_source:{0:'uint8',1:'uint8',2:'uint8',3:'uint8',4:'uint8',5:'uint8'} },     // Source address
    { h_proto : 'uint16' },        // Protocol Id
    { pad: 'string' }              // Padding to shift extra bit to last for Schemapack
]);

// ipv4 header in two parts for encoding
var iphdr1 = sp.build([
    { ver_hl: 'uint8'},            // version and header length each of 4 bits
    { tos: 'uint8'},               // Type of service
    { tot_len: 'uint16'},          // Total length of IP datagram
    { id: 'uint16'},               // Identfication
    { frag_off: 'uint16'},         // Flag and Fragment offset
    { ttl: 'uint8'},               // Time to live
    { protocol: 'uint8'},          // Protocol UDP/IP here
    { check: 'uint16'},            // Checksum for IP header
    { pad: 'string'}               // Padding to shift extra bit to last for Schemapack
    ]);
var iphdr2 = sp.build([
    { saddr: {0:'uint8',1:'uint8',2:'uint8',3:'uint8'} },   // Source IP address (Server)
    { daddr: {0:'uint8',1:'uint8',2:'uint8',3:'uint8'} },   // Destination IP address (BB)
    { pad: 'string'}
]); 

// UDP Packet for encoding
var udp_e = sp.build([
    { udpSrc: 'uint16'},            // Server UDP port
    { udpDst: 'uint16'},            // BB UDP port
    { udpLen: 'uint16'},            // UDP data length + UDP header length
    { chkSum: 'uint16'},            // Checksum
    { pad: 'string'}
])

// BOOTP packet 
var bootp1 = sp.build([
    { opcode: 'uint8'},             // Operation code, 1: BOOTREQUEST, 2: BOOTREPLY
    { hw: 'uint8'},                 // Hardware Type, 1: Ethernet
    { hw_length: 'uint8'},          // Hardware Address length
    { hopcount: 'uint8'},           // Set to 0 by client before transmitting
    { xid: 'uint32'},               // Transaction ID
    { secs: 'uint16'},              // Seconds since client started trying to boot
    { flags: 'uint16'},             // Optional flag, not used 
    { ciaddr: {0:'uint8', 1:'uint8', 2:'uint8', 3:'uint8'}},    // Client IP Address
    { pad: 'string'}
]);
var bootp2 = sp.build([
    { yiaddr: {0:'uint8', 1:'uint8', 2:'uint8', 3:'uint8'}},        // Your IP Address ( Server assigns to client )
    { server_ip: {0:'uint8', 1:'uint8', 2:'uint8', 3:'uint8'}},     // Server IP Address
    { bootp_gw_ip: {0:'uint8', 1:'uint8', 2:'uint8', 3:'uint8'}},   // Gateway IP Address
    { hwaddr: {0:'uint8', 1:'uint8', 2:'uint8', 3:'uint8', 4:'uint8', 5:'uint8'}},  // MAC Address of client (BB)
    { pad: 'string'}
]);
var bootp_servername = sp.build([
    { servername: {0:'uint8', 1:'uint8', 2:'uint8', 3:'uint8', 4:'uint8', 5:'uint8', 6:'uint8', 7:'uint8',
        8:'uint8', 9:'uint8',}},                                    // Server Name
    { pad: 'string'}
]);
var bootp_bootfile = sp.build([
    { bootfile: {0:'uint8', 1:'uint8', 2:'uint8', 3:'uint8', 4:'uint8'}},   // Name of File to boot
    { pad: 'string'}
]);
var bootp_vendor = sp.build([       // Vendor extensions (Subnet here for this project)
    { vendor: {0:'uint8', 1:'uint8', 2:'uint8', 3:'uint8', 4:'uint8', 5:'uint8', 6:'uint8', 7:'uint8', 8:'uint8',
        9:'uint8', 10:'uint8', 11:'uint8', 12:'uint8', 13:'uint8', 14:'uint8', 15:'uint8', 16:'uint8'}},
    { pad: 'string'}
]);




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// Headers for parsing (Binary-Praser) /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ether header
var ethhdr = new Parser()
    .array('h_dest',{
        type: 'uint8',
        length: 6
    })
    .array('h_source',{
        type: 'uint8',
        length: 6
    })
    .int16be('h_proto'); 






///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// Packet make functions /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function for rndis data packet
function make_rndis(data_length){
    var rndis1 = [
        { msg_type: 0x00000001},
        { msg_len: data_length+44},
        { data_offset: 0x24},
        { data_len: data_length},
        { band_offset: 0}
    ];
    var rndis2 =[
        { band_len: 0},
        { out_band_elements: 0},
        { packet_offset: 0},
        { packet_info_len: 0},
        { reserved_first: 0},
        { reserved_second: 0}
    ];

    var buf1 = fix_buff(rndis_1.encode(rndis1));
    var buf2 = fix_buff(rndis_2.encode(rndis2));
    var data = Buffer.concat([buf1, buf2], 44);
    return toggle(data, 32);    // convert byte order to little endian
}


// Function for ether2 data packet
function make_ether2(dest, source){
    var eth = [
        { h_dest: dest},
        { h_source: source},
        { h_proto: 0x0008}
    ];
    var data = fix_buff(ethhdr_e.encode(eth));
    return data;
}


// Function for ipv4 header packet
function make_ipv4(src_addr, dst_addr, proto, id_, total_len){
    var ip1 = [
        { ver_hl: 69},
        { tos: 0},
        { tot_len: total_len},
        { id: id_},
        { frag_off: 0},
        { ttl: 64},
        { protocol: proto},
        { check: 0xF648}
    ];
    var ip2 = [
        { saddr: src_addr},
        { daddr: dst_addr}
    ];
    var buf1 = fix_buff(iphdr1.encode(ip1));
    var buf2 = fix_buff(iphdr2.encode(ip2));
    var data = Buffer.concat([buf1, buf2], 20);
    return data;
}


// Function for UDP packet
function make_udp(udpData_len, srcPort, dstPort){
    var udp = [
        { udpSrc: srcPort},         
        { udpDst: dstPort},         
        { udpLen: udpData_len+8},       
        { chkSum: 0}                
    ];
    return fix_buff(udp_e.encode(udp));
}


// Function for BOOTP packet
function make_bootp(server_name, file_name, xid_, hw_dest, BB_ip, serverIP){
    var bootp_1 =[
        { opcode: 2},
        { hw: 1},
        { hw_length: 6},
        { hopcount: 0},
        { xid: xid_},
        { secs: 0},
        { flags: 0},
        { ciaddr: [0,0,0,0]}
    ];
    var bootp_2 = [
        { yiaddr: BB_ip},
        { server_ip: serverIP},
        { bootp_gw_ip: serverIP},
        { hwaddr: hw_dest}
    ];
    var servername = [ { servername: server_name} ];
    var bootfile = [ { bootfile: file_name} ];
    var vendor = [ { vendor: [ 99, 130, 83, 99, 1, 4, 255, 255, 255, 0, 3, 4, 192, 168, 1, 9, 0xFF] } ];
    var buf1 = fix_buff(bootp1.encode(bootp_1));
    var buf2 = fix_buff(bootp2.encode(bootp_2));
    var buf2_ = Buffer.alloc(10);           // Remaining 10 bytes out of 16 of hwaddr
    var buf3 = fix_buff(bootp_servername.encode(servername));
    var buf3_ = Buffer.alloc(54);           // Remaining 54 bytes out of 64 of servername
    var buf4 = fix_buff(bootp_bootfile.encode(bootfile));
    var buf4_ = Buffer.alloc(123);          // Remaining 123 bytes out of 128 of bootfile
    var buf5 = fix_buff(bootp_vendor.encode(vendor));
    var buf5_ = Buffer.alloc(47);           // Remaining 47 bytes out of 64 of vendor
    return Buffer.concat([buf1, buf2, buf2_, buf3, buf3_, buf4, buf4_, buf5, buf5_], 300);

}




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// Packet decode functions ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Decode ether packet
function decode_ether(buf){
    return ethhdr.parse(buf);
}





///////////////////////////////////////// Function to remove extra byte from last /////////////////////////////////
function fix_buff(buf){
    var buf_fix = Buffer.alloc(buf.length-1,0,'hex');
    buf.copy(buf_fix, 0, 0, buf.length-1);
    return buf_fix;
}


exports.make_rndis = make_rndis;
exports.decode_ether = decode_ether;
exports.make_ether2 = make_ether2;
exports.make_ipv4 = make_ipv4;
exports.make_udp = make_udp;
exports.make_bootp = make_bootp;