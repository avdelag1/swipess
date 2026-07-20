import Foundation
import Capacitor
import Vision
import CoreImage

@objc(AppleVisionPlugin)
public class AppleVisionPlugin: CAPPlugin {
    
    @objc func analyzeImage(_ call: CAPPluginCall) {
        guard let base64String = call.getString("base64"),
              let data = Data(base64Encoded: base64String, options: .ignoreUnknownCharacters),
              let ciImage = CIImage(data: data) else {
            call.reject("Must provide a valid base64 image string")
            return
        }
        
        if #available(iOS 13.0, *) {
            let request = VNClassifyImageRequest { (request, error) in
                if let error = error {
                    call.reject("Classification failed: \(error.localizedDescription)")
                    return
                }
                
                guard let observations = request.results as? [VNClassificationObservation] else {
                    call.reject("No results found")
                    return
                }
                
                // Filter tags with high confidence (> 0.7) and map them to strings
                let highConfidenceTags = observations
                    .filter { $0.confidence > 0.7 }
                    .map { $0.identifier }
                
                call.resolve([
                    "tags": highConfidenceTags
                ])
            }
            
            let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    try handler.perform([request])
                } catch {
                    call.reject("Failed to perform classification: \(error.localizedDescription)")
                }
            }
        } else {
            call.reject("Image classification requires iOS 13.0+")
        }
    }
    
    @objc func extractText(_ call: CAPPluginCall) {
        guard let base64String = call.getString("base64"),
              let data = Data(base64Encoded: base64String, options: .ignoreUnknownCharacters),
              let cgImage = CIImage(data: data)?.cgImage else {
            call.reject("Must provide a valid base64 image string")
            return
        }
        
        if #available(iOS 13.0, *) {
            let request = VNRecognizeTextRequest { (request, error) in
                if let error = error {
                    call.reject("Text recognition failed: \(error.localizedDescription)")
                    return
                }
                
                guard let observations = request.results as? [VNRecognizedTextObservation] else {
                    call.reject("No text found")
                    return
                }
                
                let text = observations.compactMap { observation in
                    // Return the top candidate
                    return observation.topCandidates(1).first?.string
                }.joined(separator: "\n")
                
                call.resolve([
                    "text": text
                ])
            }
            
            // Use accurate recognition
            request.recognitionLevel = .accurate
            
            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    try handler.perform([request])
                } catch {
                    call.reject("Failed to perform text recognition: \(error.localizedDescription)")
                }
            }
        } else {
            call.reject("Text recognition requires iOS 13.0+")
        }
    }
}
