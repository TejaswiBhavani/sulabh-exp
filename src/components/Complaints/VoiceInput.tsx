import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  language?: string
  className?: string
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscript, 
  language = 'en-IN',
  className = '' 
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = getLanguageCode(language)

      recognition.onstart = () => {
        setIsListening(true)
        setError('')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const fullTranscript = finalTranscript || interimTranscript
        setTranscript(fullTranscript)
        
        if (finalTranscript) {
          onTranscript(finalTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(getErrorMessage(event.error))
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, onTranscript])

  const getLanguageCode = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'kn': 'kn-IN'
    }
    return languageMap[lang] || 'en-IN'
  }

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.'
      case 'audio-capture':
        return 'Microphone not accessible. Please check permissions.'
      case 'not-allowed':
        return 'Microphone access denied. Please allow microphone access.'
      case 'network':
        return 'Network error. Please check your connection.'
      default:
        return 'Speech recognition error. Please try again.'
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      setError('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-gray-600">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">
            Voice input is not supported in your browser. Please use Chrome or Edge for voice features.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={toggleListening}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isListening
              ? 'bg-error-600 text-white hover:bg-error-700 animate-pulse'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Start Voice Input</span>
            </>
          )}
        </button>

        {isListening && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Listening...</span>
          </div>
        )}
      </div>

      {transcript && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="text-sm text-primary-700 mb-1">Transcript:</div>
          <div className="text-primary-900">{transcript}</div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-center space-x-2 text-error-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>• Speak clearly and at a normal pace</p>
        <p>• Ensure you're in a quiet environment</p>
        <p>• Allow microphone access when prompted</p>
      </div>
    </div>
  )
}

// Extend the Window interface to include Speech Recognition

declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
    // Add other properties if needed, or use 'any' for broader compatibility initially
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
    // Add other properties if needed
  }

  interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    grammars: any; // SpeechGrammarList; Not strictly typed here for simplicity
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;

    start(): void;
    stop(): void;
    abort(): void;

    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

export default VoiceInput