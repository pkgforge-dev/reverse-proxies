const std = @import("std");

pub fn main() !void {
    // Check args (minimal error message)
    if (std.os.argv.len != 3) return error.InvalidArgs;
    
    const url = std.mem.span(std.os.argv[1]);
    const output = std.mem.span(std.os.argv[2]);
    
    // Parse URL (ultra minimal)
    const proto_end = std.mem.indexOf(u8, url, "://") orelse return error.InvalidUrl;
    const host_start = proto_end + 3;
    const path_start = std.mem.indexOfPos(u8, url, host_start, "/") orelse url.len;
    const host = url[host_start..path_start];
    const path = if (path_start < url.len) url[path_start..] else "/";
    
    // Connect
    var addrs = try std.net.getAddressList(std.heap.page_allocator, host, 80);
    defer addrs.deinit();
    var stream = try std.net.tcpConnectToAddress(addrs.addrs[0]);
    defer stream.close();
    
    // Send request
    try stream.writer().print("GET {s} HTTP/1.0\r\nHost: {s}\r\n\r\n", .{path, host});
    
    // Process response
    var file = try std.fs.cwd().createFile(output, .{});
    defer file.close();
    
    var buf: [1024]u8 = undefined;
    var in_header = true;
    var header_end_seq = [_]u8{0,0,0,0}; // Track last 4 chars
    
    while (true) {
        const n = try stream.read(&buf);
        if (n == 0) break;
        
        if (in_header) {
            var i: usize = 0;
            while (i < n) {
                // Shift sequence buffer
                header_end_seq[0] = header_end_seq[1];
                header_end_seq[1] = header_end_seq[2];
                header_end_seq[2] = header_end_seq[3];
                header_end_seq[3] = buf[i];
                
                // Check for \r\n\r\n sequence
                if (header_end_seq[0] == '\r' and header_end_seq[1] == '\n' and 
                    header_end_seq[2] == '\r' and header_end_seq[3] == '\n') {
                    in_header = false;
                    // Write remaining content after headers
                    if (i + 1 < n) try file.writeAll(buf[i+1..n]);
                    break;
                }
                i += 1;
            }
        } else {
            try file.writeAll(buf[0..n]);
        }
    }
}