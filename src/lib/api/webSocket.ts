"use client";

import { WaveFile } from "wavefile";
import { getWaveBlob } from "webm-to-wav-converter";
// import {MediaRecorder, register} from 'extendable-media-recorder';
// import {connect} from 'extendable-media-recorder-wav-encoder';
import RecordRTC, { StereoAudioRecorder } from "recordrtc";
import { API_BASE_URL } from "./config";

const isBrowser = () => typeof window !== "undefined";

export enum WebSocketMessageType {
  BASE = "websocket_base",
  START = "websocket_start",
  AUDIO = "websocket_audio",
  TRANSCRIPT = "websocket_transcript",
  READY = "websocket_ready",
  STOP = "websocket_stop",
  AUDIO_CONFIG_START = "websocket_audio_config_start",
  ERROR = "websocket_error",
  // KEEPALIVE = "websocket_keepalive"
}

interface WebSocketMessage {
  type: WebSocketMessageType;
}

interface AudioMessage extends WebSocketMessage {
  type: WebSocketMessageType.AUDIO;
  data: string;
}

interface TranscriptMessage extends WebSocketMessage {
  type: WebSocketMessageType.TRANSCRIPT;
  text: string;
  sender: "agent" | "human";
  timestamp: number;
}

interface StartMessage extends WebSocketMessage {
  type: WebSocketMessageType.START;
  agent_config: {
    llm_type: string;
    initial_message?: string;
    prompt_preamble?: string;
    filler_type?: string;
  };
  stt_type: string;
  stt_language_id: string;
  tts_type: string;
  tts_voice: string;
}

interface AudioConfigStartMessage extends WebSocketMessage {
  type: WebSocketMessageType.AUDIO_CONFIG_START;
  input_audio_config: {
    format: string;
    sample_rate: number;
  };
  output_audio_config: {
    format: string;
    sample_rate: number;
  };
}

interface ErrorMessage extends WebSocketMessage {
  type: WebSocketMessageType.ERROR;
  error: string;
}

// interface KeepaliveMessage extends WebSocketMessage {
//     type: WebSocketMessageType.KEEPALIVE;
//     timestamp: number;
//

interface ConversationStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}
export default class AIConversationClient {
  private clientId: string;
  private ws: WebSocket | null;
  private recorder: RecordRTC | null;
  private isRecording: boolean;
  private mediastream: MediaStream | null;
  private audioContext: AudioContext | null;
  private audioAnalyser: AnalyserNode | null;
  private compressor: DynamicsCompressorNode | null;
  private onMessageCallback: ((message: any) => void) | null;
  private onStatusChangeCallback: ((status: ConversationStatus) => void) | null;
  private onErrorCallback: ((error: string) => void) | null;
  private connectionTimeout: NodeJS.Timeout | null;
  private hasStartMessageSent: boolean = false;
  private audioQueue: string[] = [];
  private isPlaying: boolean = false;
  private isProcessingQueue: boolean = false;
  // private keepaliveTimeout: NodeJS.Timeout | null;
  private pendingConfig: any | null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private isIntentionalDisconnect: boolean = false;

  constructor(clientId: string) {
    if (!isBrowser()) {
      throw new Error("This client can only be instantiated in the browser");
    }
    this.clientId = clientId;
    this.ws = null;
    this.recorder = null;
    this.isRecording = false;
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
    this.onErrorCallback = null;
    this.connectionTimeout = null;
    this.mediastream = null;
    this.audioContext = null;
    this.audioAnalyser = null;
    this.compressor = null;
    // this.keepaliveTimeout = null;
    this.pendingConfig = null;

    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.startConversation = this.startConversation.bind(this);
    this.stopConversation = this.stopConversation.bind(this);
    this.stopAndCleanup = this.stopAndCleanup.bind(this);
    this.setupAudioRecording = this.setupAudioRecording.bind(this);
    this.playAudioResponse = this.playAudioResponse.bind(this);
    this.handleConnectionError = this.handleConnectionError.bind(this);
    this.processAudioQueue = this.processAudioQueue.bind(this);
    this.addToAudioQueue = this.addToAudioQueue.bind(this);
    // this.setupKeepaliveCheck = this.setupKeepaliveCheck.bind(this);
  }

  private async initAudioContext() {
    if (!this.audioContext && isBrowser()) {
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContext({
          sampleRate: 16000,
          latencyHint: "interactive",
        });
        this.audioAnalyser = this.audioContext.createAnalyser();
        this.compressor = this.audioContext.createDynamicsCompressor();
      } catch (error) {
        console.error("Failed to initialize AudioContext:", error);
        throw new Error("AudioContext initialization failed");
      }
    }
    return this.audioContext;
  }

  private async processAudioQueue() {
    if (this.isProcessingQueue || this.audioQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.audioQueue.length > 0) {
        const audioBlob = this.audioQueue[0];
        await this.playAudioResponse(audioBlob);
        this.audioQueue.shift(); // Remove the played item
      }
    } catch (error) {
      console.error("Error processing audio queue:", error);
      this.onErrorCallback?.("Error during audio playback");
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private addToAudioQueue(audioBlob: string) {
    this.audioQueue.push(audioBlob);
    if (!this.isProcessingQueue) {
      this.processAudioQueue();
    }
  }

  setCallbacks(callbacks: (message: any) => void) {
    this.onMessageCallback = callbacks;
    if (this.ws && this.onMessageCallback) {
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.onMessageCallback?.(message.type);
      };
    }
  }

  private handleConnectionError(error: any, reject: (reason?: any) => void) {
    console.error("Connection error:", error);
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    const errorMessage =
      error instanceof Error ? error.message : "Connection failed";
    this.onStatusChangeCallback?.({
      isConnected: false,
      isConnecting: false,
      error: errorMessage,
    });
    this.onErrorCallback?.(errorMessage);
    reject(error);
  }

  async connect(agentConfig: any): Promise<void> {
    if (!isBrowser()) {
      throw new Error("WebSocket can only be used in the browser");
    }
    this.isIntentionalDisconnect = false;
    this.hasStartMessageSent = false;
    return new Promise((resolve, reject) => {
      try {
        this.onStatusChangeCallback?.({
          isConnected: false,
          isConnecting: true,
        });
        this.pendingConfig = agentConfig;
        if (!API_BASE_URL) {
          throw new Error("API_BASE_URL is not defined");
        }

        this.ws = new WebSocket(
          process.env.NEXT_ENVIRONMENT == "DEV"
            ? "ws://"
            : "wss://" + `${API_BASE_URL}/ws/${this.clientId}` // TODO: Change to actual server URL or Make it configurable
        );

        this.connectionTimeout = setTimeout(() => {
          this.handleConnectionError(
            new Error("WebSocket connection timeout"),
            reject
          );
        }, 5000);

        this.ws.onopen = () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
          }
          // console.log("Connected to websocket server");
          // this.setupKeepaliveCheck();
        };

        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          try {
            // if (event.data instanceof Blob) {
            //     this.playAudioResponse(message.data);
            // } else {
            switch (message.type) {
              case WebSocketMessageType.AUDIO:
                // const audioMessage = atob(message.data);
                this.addToAudioQueue(message.data);
                break;
              case WebSocketMessageType.READY:
                if (
                  !this.hasStartMessageSent &&
                  this.ws?.readyState === WebSocket.OPEN
                ) {
                  this.startConversation();
                  this.hasStartMessageSent = true;
                  this.ws.send(
                    JSON.stringify({
                      type: WebSocketMessageType.START,
                      agent_config: this.pendingConfig,
                    })
                  );
                }
                break;

              case WebSocketMessageType.AUDIO_CONFIG_START:
                this.onStatusChangeCallback?.({
                  isConnected: true,
                  isConnecting: false,
                });
                this.reconnectAttempts = 0;
                resolve();
                break;

              case WebSocketMessageType.STOP:
                this.stopAndCleanup();
                break;

              case WebSocketMessageType.ERROR:
                const errorMsg = (message as ErrorMessage).error;
                this.onErrorCallback?.(errorMsg);
                this.onStatusChangeCallback?.({
                  isConnected: false,
                  isConnecting: false,
                  error: errorMsg,
                });
                break;

              // case WebSocketMessageType.KEEPALIVE:
              //     this.lastKeepaliveTimestamp = (message as KeepaliveMessage).timestamp;
              //     break;
              // }
            }
          } catch (error) {
            console.error("Error handling message:", error);
            this.onErrorCallback?.("Error processing server message");
          }
        };

        this.ws.onclose = async (event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
          }
          // if (this.keepaliveTimeout) {
          //     clearTimeout(this.keepaliveTimeout);
          // }

          console.log("WebSocket closed:", event.code, event.reason);
          this.onStatusChangeCallback?.({
            isConnected: false,
            isConnecting: false,
            error: event.reason || "Connection closed",
          });
          this.stopAndCleanup();

          if (
            !this.isIntentionalDisconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.reconnectAttempts++;
            console.log(
              `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            );
            try {
              await this.connect(this.pendingConfig || agentConfig);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error("WebSocket connection closed"));
          }
        };

        this.ws.onerror = (error) => {
          this.handleConnectionError(error, reject);
        };
      } catch (error) {
        this.handleConnectionError(error, reject);
      }
    });
  }

  blobToBase64 = (blob: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const base64String = (reader.result as string)?.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  handleDataAvailable = async (event: Blob) => {
    if (event.size > 0) {
      try {
        // Convert blob to base64
        const base64Data = await this.blobToBase64(event);

        // Send properly formatted JSON message
        const audioMessage = {
          type: WebSocketMessageType.AUDIO,
          data: base64Data,
        };

        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(audioMessage));
        }
      } catch (error) {
        console.error("Error processing audio data:", error);
        this.onErrorCallback?.("Failed to process audio data");
      }
    }
  };

  private async setupAudioRecording() {
    if (!isBrowser()) {
      throw new Error(
        "Audio recording is only supported in browser environments"
      );
    }
    try {
      this.mediastream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.recorder = new RecordRTC(this.mediastream, {
        type: "audio",
        recorderType: StereoAudioRecorder,
        mimeType: "audio/wav",
        timeSlice: 500,
        desiredSampRate: 8000,
        numberOfAudioChannels: 1,
        bufferSize: 256,
        ondataavailable: this.handleDataAvailable,
      });
    } catch (error) {
      console.error("Failed to setup audio recording:", error);
      throw error;
    }
  }

  async startConversation() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const error = "WebSocket is not connected";
      this.onErrorCallback?.(error);
      throw new Error(error);
    }

    try {
      console.log("Starting conversation...");
      this.isRecording = true;
      await this.setupAudioRecording();
      this.recorder?.startRecording();
    } catch (error) {
      console.error("Error starting conversation:", error);
      this.onErrorCallback?.("Failed to start conversation");
      throw error;
    }
  }

  stopConversation() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: WebSocketMessageType.STOP }));
    }
    this.stopAndCleanup();
  }

  private stopAndCleanup() {
    this.isRecording = false;
    if (this.recorder) {
      this.recorder.stopRecording();
      this.recorder = null;
    }

    // Stop all media tracks
    if (this.mediastream) {
      this.mediastream.getTracks().forEach((track) => {
        track.stop();
      });
      this.mediastream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private async playAudioResponse(
    audioBlob: string,
    playbackSpeed: number = 1
  ) {
    if (!audioBlob) {
      console.error("Empty audio blob");
      this.onErrorCallback?.("Empty audio blob received");
      return;
    }

    try {
      if (!isBrowser()) {
        throw new Error(
          "Audio playback is only supported in browser environments"
        );
      }

      const audioContext = await this.initAudioContext();
      if (!audioContext) {
        throw new Error("AudioContext not available");
      }

      // Resume AudioContext if it's in suspended state
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      const wav = new WaveFile();
      wav.fromScratch(1, 8000, "8m", Buffer.from(audioBlob, "base64"));
      wav.fromMuLaw();
      // You can resample.
      wav.toSampleRate(24000, {method: "cubic" , LPF: true});
      const blob = new Blob([wav.toBuffer()], { type: "audio/wav" });
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackSpeed;

      // Connect the audio nodes
      if (this.compressor && this.audioAnalyser) {
        source.connect(this.compressor);
        this.compressor.connect(audioContext.destination);
      } else {
        source.connect(audioContext.destination);
      }

      return new Promise((resolve) => {
        source.onended = () => {
          resolve(null);
        };
        source.start(0);
      });
    } catch (error) {
      console.error(
        "Failed to play with audio element, trying Web Audio API..."
      );
    }
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    this.hasStartMessageSent = false;
    this.audioQueue = [];
    this.stopConversation();
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.stopAndCleanup();
  }
}
