const fs = require('fs');
const path = require('path');

console.log('Patching Capacitor for Xcode 14 compatibility...');

const bridgePath = path.join(__dirname, '../node_modules/@capacitor/ios/Capacitor/Capacitor/CapacitorBridge.swift');
if (fs.existsSync(bridgePath)) {
  let content = fs.readFileSync(bridgePath, 'utf8');
  if (content.includes('webView?.isInspectable = true') && !content.includes('#if compiler(>=5.8)')) {
    content = content.replace(
      /if #available\(macOS 13\.3, iOS 16\.4, tvOS 16\.4, \*\) \{\s*webView\?\.isInspectable = true\s*\}/g,
      '#if compiler(>=5.8)\nif #available(macOS 13.3, iOS 16.4, tvOS 16.4, *) {\n    webView?.isInspectable = true\n}\n#endif'
    );
    fs.writeFileSync(bridgePath, content);
    console.log('Patched CapacitorBridge.swift');
  }
}

const decoderPath = path.join(__dirname, '../node_modules/@capacitor/ios/Capacitor/Capacitor/JSValueDecoder.swift');
if (fs.existsSync(decoderPath)) {
  let content = fs.readFileSync(decoderPath, 'utf8');
  if (content.includes('MSEC_PER_SEC')) {
    content = content.replace(/MSEC_PER_SEC/g, '1000');
    fs.writeFileSync(decoderPath, content);
    console.log('Patched JSValueDecoder.swift');
  }
}

const encoderPath = path.join(__dirname, '../node_modules/@capacitor/ios/Capacitor/Capacitor/JSValueEncoder.swift');
if (fs.existsSync(encoderPath)) {
  let content = fs.readFileSync(encoderPath, 'utf8');
  if (content.includes('MSEC_PER_SEC')) {
    content = content.replace(/MSEC_PER_SEC/g, '1000');
    fs.writeFileSync(encoderPath, content);
    console.log('Patched JSValueEncoder.swift');
  }
}

console.log('Xcode 14 patch complete.');
