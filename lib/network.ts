import { networkInterfaces } from 'os'

export function getLocalIpAddress(): string {
  const interfaces = networkInterfaces()
  let localIp = '127.0.0.1'

  // Look for the first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal and non-IPv4 addresses
      if (iface.internal || iface.family !== 'IPv4') continue
      
      // Check if it's a local network address
      if (iface.address.startsWith('192.168.') || 
          iface.address.startsWith('10.') || 
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(iface.address)) {
        localIp = iface.address
        break
      }
    }
    if (localIp !== '127.0.0.1') break
  }

  return localIp
} 