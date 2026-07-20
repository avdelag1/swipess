import Foundation
import Capacitor
import Speech
import AVFoundation

@objc(AppleSpeechPlugin)
public class AppleSpeechPlugin: CAPPlugin {
    
    private var audioEngine: AVAudioEngine?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var speechRecognizer: SFSpeechRecognizer?
    private var currentTranscript: String = ""
    private var silenceTimer: Timer?
    private var activeCall: CAPPluginCall?
    
    // MARK: - Check availability
    
    @objc func isAvailable(_ call: CAPPluginCall) {
        let recognizer = SFSpeechRecognizer()
        let available = recognizer?.isAvailable ?? false
        
        SFSpeechRecognizer.requestAuthorization { status in
            let authorized = status == .authorized
            call.resolve([
                "available": available,
                "authorized": authorized
            ])
        }
    }
    
    // MARK: - Start Recognition
    
    @objc func startRecognition(_ call: CAPPluginCall) {
        let locale = call.getString("locale") ?? Locale.current.identifier
        
        // Request authorization
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            guard let self = self else { return }
            
            switch status {
            case .authorized:
                DispatchQueue.main.async {
                    self.beginRecording(locale: locale, call: call)
                }
            case .denied, .restricted:
                call.reject("Speech recognition permission denied. Please enable it in Settings.")
            case .notDetermined:
                call.reject("Speech recognition authorization not determined.")
            @unknown default:
                call.reject("Unknown authorization status.")
            }
        }
    }
    
    // MARK: - Stop Recognition
    
    @objc func stopRecognition(_ call: CAPPluginCall) {
        stopCurrentRecording()
        call.resolve(["transcript": currentTranscript])
    }
    
    // MARK: - Private helpers
    
    private func beginRecording(locale: String, call: CAPPluginCall) {
        // Stop any existing session
        stopCurrentRecording()
        
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: locale))
        
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            call.reject("Speech recognizer not available for locale: \(locale)")
            return
        }
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            call.reject("Failed to configure audio session: \(error.localizedDescription)")
            return
        }
        
        audioEngine = AVAudioEngine()
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        
        guard let audioEngine = audioEngine, let recognitionRequest = recognitionRequest else {
            call.reject("Unable to create audio engine or recognition request")
            return
        }
        
        // Prefer on-device recognition for privacy and speed
        if #available(iOS 13.0, *) {
            recognitionRequest.requiresOnDeviceRecognition = speechRecognizer.supportsOnDeviceRecognition
        }
        
        recognitionRequest.shouldReportPartialResults = true
        currentTranscript = ""
        activeCall = call
        
        // Start the recognition task
        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            if let result = result {
                self.currentTranscript = result.bestTranscription.formattedString
                
                // Reset the silence timer on each new result
                self.resetSilenceTimer()
                
                if result.isFinal {
                    self.stopCurrentRecording()
                    self.activeCall?.resolve(["transcript": self.currentTranscript])
                    self.activeCall = nil
                }
            }
            
            if let error = error {
                self.stopCurrentRecording()
                // If we have some transcript, return it rather than failing
                if !self.currentTranscript.isEmpty {
                    self.activeCall?.resolve(["transcript": self.currentTranscript])
                } else {
                    self.activeCall?.reject("Recognition error: \(error.localizedDescription)")
                }
                self.activeCall = nil
            }
        }
        
        // Install audio tap
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }
        
        do {
            audioEngine.prepare()
            try audioEngine.start()
            
            // Set an initial silence timer (auto-stop after 3 seconds of silence)
            resetSilenceTimer()
        } catch {
            stopCurrentRecording()
            call.reject("Failed to start audio engine: \(error.localizedDescription)")
        }
    }
    
    private func resetSilenceTimer() {
        silenceTimer?.invalidate()
        silenceTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            // Auto-stop after 3 seconds of silence
            self.stopCurrentRecording()
            if !self.currentTranscript.isEmpty {
                self.activeCall?.resolve(["transcript": self.currentTranscript])
            } else {
                self.activeCall?.resolve(["transcript": ""])
            }
            self.activeCall = nil
        }
    }
    
    private func stopCurrentRecording() {
        silenceTimer?.invalidate()
        silenceTimer = nil
        
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        
        audioEngine = nil
        recognitionRequest = nil
        recognitionTask = nil
    }
}
