import Foundation
import Capacitor
import NaturalLanguage

@objc(AppleLanguagePlugin)
public class AppleLanguagePlugin: CAPPlugin {
    
    // MARK: - Language Detection (iOS 12+)
    
    @objc func detectLanguage(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.reject("Must provide non-empty text")
            return
        }
        
        let recognizer = NLLanguageRecognizer()
        recognizer.processString(text)
        
        if let language = recognizer.dominantLanguage {
            call.resolve(["languageCode": language.rawValue])
        } else {
            call.resolve(["languageCode": NSNull()])
        }
    }
    
    // MARK: - Translation (iOS 17.4+ via Translation framework)
    
    @objc func translateText(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.reject("Must provide non-empty text")
            return
        }
        
        let targetLang = call.getString("targetLanguage") ?? Locale.current.language.languageCode?.identifier ?? "en"
        
        // First detect the source language
        let recognizer = NLLanguageRecognizer()
        recognizer.processString(text)
        let sourceLang = recognizer.dominantLanguage?.rawValue ?? "es"
        
        // If the source and target are the same, return the original text
        if sourceLang == targetLang {
            call.resolve(["translatedText": text])
            return
        }
        
        #if canImport(Translation)
        if #available(iOS 17.4, *) {
            Task {
                do {
                    let sourceLanguage = Locale.Language(identifier: sourceLang)
                    let targetLanguage = Locale.Language(identifier: targetLang)
                    
                    let session = try await TranslationSession(
                        configuration: .init(source: sourceLanguage, target: targetLanguage)
                    )
                    
                    let response = try await session.translate(text)
                    call.resolve(["translatedText": response.targetText])
                } catch {
                    // If translation fails (e.g. language pair not downloaded), return original text
                    call.resolve(["translatedText": text])
                }
            }
        } else {
            // iOS < 17.4 — return original text unchanged
            call.resolve(["translatedText": text])
        }
        #else
        // Translation framework not available at all — return original
        call.resolve(["translatedText": text])
        #endif
    }
}
