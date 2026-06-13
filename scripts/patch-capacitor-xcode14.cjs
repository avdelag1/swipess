const fs = require('fs');
const path = require('path');

console.log('Patching Capacitor for Xcode 14 compatibility...');

const bridgePath = path.join(__dirname, '../node_modules/@capacitor/ios/Capacitor/Capacitor/CapacitorBridge.swift');
if (fs.existsSync(bridgePath)) {
  let content = fs.readFileSync(bridgePath, 'utf8');
  if (content.includes('isInspectable') && !content.includes('#if compiler(>=5.8)')) {
    content = content.replace(
      /if #available\(iOS 16\.4, \*\) \{\s*self\.webView\?\.isInspectable = isWebDebuggable\s*\}/g,
      '#if compiler(>=5.8)\n        if #available(iOS 16.4, *) {\n            self.webView?.isInspectable = isWebDebuggable\n        }\n#endif'
    );
    fs.writeFileSync(bridgePath, content);
    console.log('Patched CapacitorBridge.swift');
  }
}

const decoderPath = path.join(__dirname, '../node_modules/@capacitor/ios/Capacitor/Capacitor/Codable/JSValueDecoder.swift');
if (fs.existsSync(decoderPath)) {
  let content = fs.readFileSync(decoderPath, 'utf8');
  if (content.includes('MSEC_PER_SEC')) {
    content = content.replace(/MSEC_PER_SEC/g, '1000');
    fs.writeFileSync(decoderPath, content);
    console.log('Patched JSValueDecoder.swift');
  }
}

const encoderPath = path.join(__dirname, '../node_modules/@capacitor/ios/Capacitor/Capacitor/Codable/JSValueEncoder.swift');
if (fs.existsSync(encoderPath)) {
  let content = fs.readFileSync(encoderPath, 'utf8');
  let changed = false;
  
  if (content.includes('MSEC_PER_SEC')) {
    content = content.replace(/MSEC_PER_SEC/g, '1000');
    changed = true;
  }
  
  if (content.includes('case .singleValue:\n            "SingleValueContainer"')) {
    content = content.replace(/case \.singleValue:\n\s+"SingleValueContainer"/g, 'case .singleValue:\n            return "SingleValueContainer"');
    content = content.replace(/case \.unkeyed:\n\s+"UnkeyedContainer"/g, 'case .unkeyed:\n            return "UnkeyedContainer"');
    content = content.replace(/case \.keyed:\n\s+"KeyedContainer"/g, 'case .keyed:\n            return "KeyedContainer"');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(encoderPath, content);
    console.log('Patched JSValueEncoder.swift');
  }
}

console.log('Xcode 14 patch complete.');
