const fs = require('fs');
const path = require('path');

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crcVal]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;

  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        rawData.push(r, g, b);
      } else {
        rawData.push(255, 255, 255);
      }
    }
  }

  const rawBuf = Buffer.from(rawData);
  const { deflateSync } = require('zlib');
  const compressed = deflateSync(rawBuf);

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '..', 'client', 'public', 'icons');
const publicDir = path.join(__dirname, '..', 'client', 'public');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const primaryColor = { r: 220, g: 38, b: 38 };

const icon192 = createPNG(192, 192, primaryColor.r, primaryColor.g, primaryColor.b);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
console.log('Created icon-192.png');

const icon512 = createPNG(512, 512, primaryColor.r, primaryColor.g, primaryColor.b);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
console.log('Created icon-512.png');

const appleIcon = createPNG(180, 180, primaryColor.r, primaryColor.g, primaryColor.b);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Created apple-touch-icon.png');

console.log('All icons generated successfully!');
