const fs = require('fs');

// Create a mapping from corrupted character back to original byte
// We know that for bytes 0x80-0xFF, PowerShell maps them to some Unicode characters.
// Let's generate a file with bytes 0x00 to 0xFF, read it with PowerShell, and see what characters they become!
