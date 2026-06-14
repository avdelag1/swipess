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

// Geolocation patches
const geoErrorPath = path.join(__dirname, '../node_modules/@capacitor/geolocation/ios/Sources/GeolocationPlugin/GeolocationError.swift');
if (fs.existsSync(geoErrorPath)) {
  let content = fs.readFileSync(geoErrorPath, 'utf8');
  let changed = false;
  if (content.includes('case .positionUnavailable: 2')) {
    content = content.replace(/case \.positionUnavailable: 2/g, 'case .positionUnavailable: return 2');
    content = content.replace(/case \.permissionDenied: 3/g, 'case .permissionDenied: return 3');
    content = content.replace(/case \.locationServicesDisabled: 7/g, 'case .locationServicesDisabled: return 7');
    content = content.replace(/case \.permissionRestricted: 8/g, 'case .permissionRestricted: return 8');
    content = content.replace(/case \.getCurrentPosition: 4/g, 'case .getCurrentPosition: return 4');
    content = content.replace(/case \.watchPosition: 5/g, 'case .watchPosition: return 5');
    content = content.replace(/case \.clearWatch: 6/g, 'case .clearWatch: return 6');
    changed = true;
  }
  if (content.includes('case .positionUnavailable: "There was')) {
    content = content.replace(/case \.positionUnavailable: "There was en error trying to obtain the location\."/g, 'case .positionUnavailable: return "There was en error trying to obtain the location."');
    content = content.replace(/case \.permissionDenied: "Location permission request was denied\."/g, 'case .permissionDenied: return "Location permission request was denied."');
    content = content.replace(/case \.locationServicesDisabled: "Location services are not enabled\."/g, 'case .locationServicesDisabled: return "Location services are not enabled."');
    content = content.replace(/case \.permissionRestricted: "Application's use of location services was restricted\."/g, 'case .permissionRestricted: return "Application\'s use of location services was restricted."');
    content = content.replace(/case \.inputArgumentsIssue\(let target\): "The '\\\\\\(target\\.rawValue\\\\\\)' input parameters aren't valid\\."/g, 'case .inputArgumentsIssue(let target): return "The \'\\\\(target.rawValue)\' input parameters aren\'t valid."');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(geoErrorPath, content);
    console.log('Patched GeolocationError.swift');
  }
}

const geoPluginPath = path.join(__dirname, '../node_modules/@capacitor/geolocation/ios/Sources/GeolocationPlugin/GeolocationPlugin.swift');
if (fs.existsSync(geoPluginPath)) {
  let content = fs.readFileSync(geoPluginPath, 'utf8');
  if (content.includes('let status = switch locationService?.authorisationStatus {')) {
    content = content.replace(
      /let status = switch locationService\?\.authorisationStatus \{\n\s*case \.restricted, \.denied: Constants\.AuthorisationStatus\.Status\.denied\n\s*case \.authorisedAlways, \.authorisedWhenInUse: Constants\.AuthorisationStatus\.Status\.granted\n\s*default: Constants\.AuthorisationStatus\.Status\.prompt\n\s*\}/g,
      'let status: String\n        switch locationService?.authorisationStatus {\n        case .restricted, .denied: status = Constants.AuthorisationStatus.Status.denied\n        case .authorisedAlways, .authorisedWhenInUse: status = Constants.AuthorisationStatus.Status.granted\n        default: status = Constants.AuthorisationStatus.Status.prompt\n        }'
    );
    fs.writeFileSync(geoPluginPath, content);
    console.log('Patched GeolocationPlugin.swift');
  }
}

// Contacts patches
const contactsPluginPath = path.join(__dirname, '../node_modules/@capacitor-community/contacts/ios/Sources/ContactsPlugin/ContactsPlugin.swift');
if (fs.existsSync(contactsPluginPath)) {
  let content = fs.readFileSync(contactsPluginPath, 'utf8');
  let changed = false;
  if (content.includes('case .limited:')) {
    content = content.replace(/\s*case \.limited:\n\s*permissionState = "limited"/g, '');
    content = content.replace(/case \.authorized, \.limited:/g, 'case .authorized:');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(contactsPluginPath, content);
    console.log('Patched ContactsPlugin.swift');
  }
}

console.log('Xcode 14 patch complete.');
