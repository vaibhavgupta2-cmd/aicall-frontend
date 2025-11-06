"use client";

import Loading from "@/components/Loading";
import DropdownInput from "@/components/inputs/DropdownInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useUser from "@/hooks/useUser";
import { cn, toCapitalizedSentence } from "@/lib/utils";

import {
  FillerWords,
  getEnumFromString,
  LLMType,
  STTType,
  TCreateAgentDTO,
  TTSType,
} from "@/types";
import { Bot, ChevronRight, StepForward, WholeWord, Play, Pause } from "lucide-react";
import React, { useEffect, useState } from "react";
import { IoRemoveCircleOutline } from "react-icons/io5";
import BoxRadioButton from "@/components/ui/box-radio-button";
import { Switch } from "@/components/ui/switch";
import {
  AddFunctionDialog,
  ExternalFunctionData,
} from "@/components/ui/add-function-dialog";
import { toast } from "@/components/ui/use-toast";

// Import SmallestAI SDK
import { WavesClient, Configuration } from 'smallestai';

const TextInput = (props: {
  label: string;
  id: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
}) => (
  <div>
    <Label htmlFor={props.id}>{props.label}</Label>
    <Input
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.setValue(e.target.value)}
      id={props.id}
    />
  </div>
);

interface ExternalFunctionDialogState {
  isOpen: boolean;
  data: ExternalFunctionData | undefined;
}

export type TAgentData = Omit<TCreateAgentDTO, "organisationId">;

// SmallestAI Voice interface
interface SmallestAIVoice {
  voiceId: string;
  displayName: string;
  tags: {
    age: string;
    emotions: string[];
    language: string[];
    usecases: string[];
    accent: string;
    gender: string;
  };
  audioPreview: string;
}

// Audio player component for voice previews
const AudioPlayer = ({ audioUrl, voiceName }: { audioUrl: string; voiceName: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = new Audio(audioUrl);
    audioElement.addEventListener('ended', () => setIsPlaying(false));
    setAudio(audioElement);

    return () => {
      audioElement.pause();
      audioElement.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={togglePlay}
      className="p-2 h-8 w-8"
    >
      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </Button>
  );
};

function AgentInput({
  onSubmit,
  canSubmit,
  initialData,
  actionName,
}: {
  onSubmit: (data: TAgentData) => void;
  canSubmit?: boolean;
  initialData?: TAgentData;
  actionName: string;
}) {
  console.log(JSON.stringify(initialData, null, 2));
  console.log(getEnumFromString(TTSType, initialData?.ttsType!));
  console.log(initialData?.ttsType);
  const languages = [
    "Hindi",
    "English",
    "Tamil",
    "Malayalam",
    "Telugu",
    "Gujarati",
    "Marathi",
    "Punjabi",
  ];

  const languagePromptTemplates: { [key: string]: string } = {
    Hindi: "You are a Hindi Agent, speak in Hindi script only.",
    English: "You are an English Agent, communicate in English.",
    Tamil: "You are a Tamil Agent, speak in Tamil script only.",
    Malayalam: "You are a Malayalam Agent, speak in Malayalam script only.",
    Telugu: "You are a Telugu Agent, speak in Telugu script only.",
    Gujarati: "You are a Gujarati Agent, speak in Gujarati script only.",
    Marathi: "You are a Marathi Agent, speak in Marathi script only.",
    Punjabi: "You are a Punjabi Agent, speak in Punjabi script only.",
  };

  const languageToSttLanguageIdAndTtsVoiceId: {
    [key: string]: [string, string];
  } = {
    Hindi: ["hi-IN", "hi-IN-AaravNeural"],
    English: ["en-US", "en-US-AndrewMultilingualNeural"],
    Tamil: ["ta-IN", "ta-IN-ValluvarNeural"],
    Malayalam: ["ml-IN", "ml-IN-MidhunNeural"],
    Telugu: ["te-IN", "te-IN-MohanNeural"],
    Gujarati: ["gu-IN", "gu-IN-NiranjanNeural"],
    Marathi: ["mr-IN", "mr-IN-ManoharNeural "],
    Punjabi: ["pa-IN", "pa-IN-OjasNeural"],
  };

  const sttToLanguage: { [key: string]: string } = {
    "hi-IN": "Hindi",
    "en-US": "English",
    "ta-IN": "Tamil",
    "ml-IN": "Malayalam",
    "te-IN": "Telugu",
    "gu-IN": "Gujarati",
    "mr-IN": "Marathi",
    "pa-IN": "Punjabi",
  };

  const steps: string[] = [
    "Agent Details",
    "Model Details",
    "Inputs and Prompts",
    "Extraction Fields",
    "Config",
  ];

  const [currentStep, setCurrentStep] = useState(0);

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [promptTemplate, setPromptTemplate] = useState(
    initialData?.promptTemplate || ""
  );
  const [initialMessage, setInitialMessage] = useState(
    initialData?.initialMessage || ""
  );
  const [fields, setFields] = useState(initialData?.fields || []);

  const [llmType, setLlmType] = useState<LLMType>(
    getEnumFromString(
      LLMType,
      initialData?.llmType ?? LLMType.CHATGPT,
      initialData?.llmType
    )
  );
  const [ttsType, setTtsType] = useState<TTSType>(
    getEnumFromString(
      TTSType,
      initialData?.ttsType ?? TTSType.AZURE,
      initialData?.ttsType
    )
  );

  const [fillerWords, setFillerWords] = useState(
    initialData?.fillerWords || "NONE"
  );

  const [ttsVoice, setTtsVoice] = useState(initialData?.ttsVoice || "");

  const [extractionFields, setExtractionFields] = useState(
    initialData?.extractionFields || []
  );

  const [sttType, setSttType] = useState<STTType>(
    getEnumFromString(
      STTType,
      initialData?.sttType ?? STTType.AZURE,
      initialData?.sttType
    )
  );

  const [sttLanguageId, setSttLanguageId] = useState(
    initialData?.sttLanguageId || ""
  );
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    sttToLanguage[sttLanguageId] ?? ""
  );

  // SmallestAI specific states
  const [smallestAIVoices, setSmallestAIVoices] = useState<SmallestAIVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);

  const { organisation, loading } = useUser();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const extractionInputRef = React.useRef<HTMLInputElement>(null);

  const [externalFunctions, setExternalFunctions] = useState<
    ExternalFunctionData[]
  >(initialData?.actions.externalFunctions || []);

  const [endCall, setEndCall] = useState(initialData?.actions.endCall || false);
  const [transferCall, setTransferCall] = useState(
    initialData?.actions.transferCall.transferCall || false
  );
  const [phone, setPhone] = useState(
    initialData?.actions.transferCall.phone || ""
  );
  const [showExternalFunctionDialog, setShowExternalFunctionDialog] =
    useState<ExternalFunctionDialogState>({
      isOpen: false,
      data: undefined,
    });
  const [bgNoise, setBgNoise] = useState(initialData?.bgNoise || false);
  const [maxCallDuration, setMaxCallDuration] = useState(
    initialData?.maxCallDuration || 300
  );
  const [idleTimeout, setIdleTimeout] = useState(
    initialData?.idleTimeout || 20
  );

  const [ignoreUtterance, setIgnoreUtterance] = useState(
    initialData?.ignoreUtterance || false
  );

  const [modelId, setModelId] = useState(initialData?.modelId || "");

  // Function to fetch SmallestAI voices
  const fetchSmallestAIVoices = async (modelVersion: string) => {
    const smallestAPIKey = process.env.NEXT_PUBLIC_SMALLEST_API_KEY;
    
    if (!smallestAPIKey) {
      toast({
        title: "API Key Missing",
        description: "SmallestAI API key not found in environment variables",
        variant: "destructive",
      });
      return;
    }

    setLoadingVoices(true);
    try {
      const config = new Configuration({
        accessToken: smallestAPIKey
      });
      const client = new WavesClient(config);
      
      const modelParam = "lightning";
      const voices = await client.getWavesVoices(modelParam);
      console.log("Fetched SmallestAI voices:", voices);
      
      setSmallestAIVoices(voices.data.voices);
      
      toast({
        title: "Voices Loaded",
        description: `Successfully loaded ${voices.data.voices.length} voices`,
      });
    } catch (error) {
      console.error("Error fetching SmallestAI voices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch voices. Please check your API key configuration.",
        variant: "destructive",
      });
    } finally {
      setLoadingVoices(false);
    }
  };

  useEffect(() => {
    if (
      !initialData ||
      initialData.ttsType !== ttsType ||
      initialData.ttsVoice !== ttsVoice
    ) {
      switch (ttsType) {
        case TTSType.ELEVENLABS:
          setTtsVoice("NT8a3K1cnQ6LbyJsJU4J");
          setModelId("eleven_multilingual_v2");
          break;
        case TTSType.NEETS:
          setModelId("");
          break;
        case TTSType.SMALLESTAI:
          setModelId("V1");
          setTtsVoice("");
          setSmallestAIVoices([]);
          break;
        case TTSType.AZURE:
          setModelId("");
          break;
        case TTSType.POLLY:
          setTtsVoice("");
          setModelId("");
          break;
      }
    }
  }, [ttsType, initialData]);

  // Fetch voices when SmallestAI model changes
  useEffect(() => {
    if (ttsType === TTSType.SMALLESTAI && modelId) {
      fetchSmallestAIVoices(modelId);
    }
  }, [modelId, ttsType]);

  useEffect(() => {
    if (
      !initialData ||
      initialData.sttType !== sttType ||
      initialData.sttLanguageId !== sttLanguageId
    ) {
      switch (sttType) {
        case STTType.AZURE:
          setSttLanguageId("hi-IN");
          break;
        case STTType.DEEPGRAM:
          setSttLanguageId("hi");
          break;
      }
    }
  }, [sttType, initialData]);

  useEffect(() => {
    if (initialData) {
     if (currentLanguage != "") {
      const [newSttLanguageId, newTtsVoiceId] =
        languageToSttLanguageIdAndTtsVoiceId[currentLanguage];

      setSttLanguageId(newSttLanguageId);
      if (!ttsType) {
        setTtsType(TTSType.AZURE);
      }
    }
    return;
  }
    const newPromptText = languagePromptTemplates[currentLanguage];

    let updatedPromptTemplate = promptTemplate;
    Object.values(languagePromptTemplates).forEach((text) => {
      if (updatedPromptTemplate.includes(text)) {
        updatedPromptTemplate = updatedPromptTemplate.replace(text, "").trim();
      }
    });

    if (!updatedPromptTemplate.includes(newPromptText)) {
      updatedPromptTemplate = newPromptText + " " + updatedPromptTemplate;
      setPromptTemplate(updatedPromptTemplate);
    }

    if (currentLanguage != "") {
      const [newSttLanguageId, newTtsVoiceId] =
        languageToSttLanguageIdAndTtsVoiceId[currentLanguage];

      setSttLanguageId(newSttLanguageId);
      if (ttsType !== TTSType.SMALLESTAI) {
        setTtsVoice(newTtsVoiceId);
      }
      if (!ttsType) {
        setTtsType(TTSType.AZURE);
      }
    }
  }, [currentLanguage]);

  if (loading || !organisation) {
    return <Loading />;
  }

  const handleSubmit = async () => {
    onSubmit({
      name,
      description,
      promptTemplate,
      initialMessage,
      fields,
      documents: [],
      llmType,
      ttsType,
      ttsVoice,
      sttType,
      fillerWords,
      sttLanguageId,
      extractionFields,
      actions: {
        endCall,
        transferCall: {
          phone,
          transferCall,
        },
        externalFunctions,
      },
      bgNoise,
      ignoreUtterance,
      maxCallDuration,
      idleTimeout,
      modelId: modelId,
    });
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 rounded-xl p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted pointer-events-none rounded-xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div className="flex flex-row relative">
        <div className="sidebar hidden md:block  bg-gray-50 dark:bg-darkNavBarGray rounded-xl m-5 w-80">
          <div className="sidebar hidden md:block bg-white/80 dark:bg-darkNavBarGray rounded-xl backdrop-blur-xl shadow-lg w-80 p-6 min-h-screen">
            <div className="flex items-center space-x-3 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                <Bot className="w-8 h-8 text-primary relative" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Agent Configuration
              </h2>
            </div>

            <nav className="space-y-2">
              {steps.map((step, index) => {
                return (
                  <button
                    key={index}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300",
                      currentStep === index
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300"
                    )}
                    onClick={() => setCurrentStep(index)}
                  >
                    <span className="font-medium">{step}</span>
                    {currentStep === index && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        <Card className="w-full m-5">
          <CardContent>
            <div className="">
              <div className="m-5 ml-0 text-xl font-bold">
                {steps[currentStep]}
              </div>
              {currentStep === 0 ? (
                <div className="space-y-4">
                  <TextInput
                    label="Name"
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    setValue={setName}
                  />
                  <div>
                    <Label htmlFor="description">
                      Description (For your reference)
                    </Label>
                    <Textarea
                      placeholder="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      id="description"
                    />
                  </div>
                </div>
              ) : null}
              {currentStep === 1 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <BoxRadioButton
                      list={languages}
                      checked={currentLanguage}
                      onChange={(e) => setCurrentLanguage(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>TTS</Label>
                    <DropdownInput
                      selected={ttsType}
                      setSelected={(e) => {
                        if (!e) {
                          return;
                        }

                        setTtsType(e as TTSType);
                      }}
                      options={Object.keys(TTSType).map((key) => ({
                        value: toCapitalizedSentence(Object(TTSType)[key]),
                        key: Object(TTSType)[key],
                      }))}
                    />
                  </div>

                  {ttsType === TTSType.SMALLESTAI && (
                    <>
                      <div>
                        <Label>Model Version</Label>
                        <DropdownInput
                          selected={modelId}
                          setSelected={(e) => {
                            if (!e) return;
                            setModelId(e);
                            setTtsVoice(""); // Reset voice selection when model changes
                          }}
                          options={[
                            { value: "V1", key: "V1" },
                            { value: "V2", key: "V2" }
                          ]}
                        />
                      </div>

                      {modelId && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Button
                              variant="secondary"
                              onClick={() => fetchSmallestAIVoices(modelId)}
                              disabled={loadingVoices}
                            >
                              {loadingVoices ? "Loading..." : "Fetch Voices"}
                            </Button>
                          </div>
                          
                          {smallestAIVoices.length > 0 && (
                            <div>
                              <Label>Select Voice</Label>
                              <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                                {smallestAIVoices.map((voice) => (
                                  <div
                                    key={voice.voiceId}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                      ttsVoice === voice.voiceId
                                        ? "bg-primary/10 border-primary"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                    )}
                                    onClick={() => setTtsVoice(voice.voiceId)}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">{voice.displayName}</div>
                                      <div className="text-sm text-gray-500">
                                        {voice.tags.gender} • {voice.tags.age} • {voice.tags.accent}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        Languages: {voice.tags.language.join(", ")}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <AudioPlayer
                                        audioUrl={voice.audioPreview}
                                        voiceName={voice.displayName}
                                      />
                                      {ttsVoice === voice.voiceId && (
                                        <div className="w-4 h-4 bg-primary rounded-full" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {ttsType !== TTSType.SMALLESTAI && (
                    <div>
                      <Label>Voice ID</Label>
                      <Input
                        value={ttsVoice}
                        onChange={(e) => setTtsVoice(e.target.value)}
                        placeholder="Voice ID"
                      />
                    </div>
                  )}

                  {ttsType === TTSType.ELEVENLABS && (
                    <div>
                      <Label>Model ID</Label>
                      <Input
                        value={modelId}
                        onChange={(e) => setModelId(e.target.value)}
                        placeholder="Model ID"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Transcriber</Label>
                    <DropdownInput
                      selected={sttType}
                      setSelected={(e) => {
                        if (!e) {
                          return;
                        }

                        setSttType(e as STTType);
                      }}
                      options={Object.keys(STTType).map((key) => ({
                        value: toCapitalizedSentence(Object(STTType)[key]),
                        key: Object(STTType)[key],
                      }))}
                    />
                  </div>

                  <div>
                    <Label>Language ID</Label>
                    <Input
                      value={sttLanguageId}
                      onChange={(e) => setSttLanguageId(e.target.value)}
                      placeholder="Language ID"
                    />
                  </div>

                  <div>
                    <Label>LLM</Label>
                    <DropdownInput
                      selected={llmType}
                      setSelected={(e) => {
                        if (!e) {
                          return;
                        }
                        setLlmType(e as LLMType);
                      }}
                      options={Object.keys(LLMType).map((key) => ({
                        value: toCapitalizedSentence(key),
                        key: key.toString(),
                      }))}
                    />
                  </div>
                </div>
              ) : null}
              {currentStep === 2 ? (
                <div>
                  <div className="mt-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (
                          inputRef.current &&
                          inputRef.current.value.trim().length > 0 &&
                          !fields.find(
                            (field) => field.name === inputRef?.current?.value
                          )
                        ) {
                          setFields([
                            ...fields,
                            { name: inputRef.current.value, type: "string" },
                          ]);
                          inputRef.current.value = "";
                        }
                      }}
                    >
                      <Label>Agent Inputs</Label>
                      <p className="text-sm text-gray-500">
                        Define the input data for your agent. This is usually
                        user data such as the EMI Amount for a client.
                      </p>
                      <div className="grid gap-2 md:grid-cols-3">
                        <Input
                          className="md:col-span-2"
                          ref={inputRef}
                          placeholder="Agent Input, Ex. EMI Amount"
                        />
                        <Button variant={"secondary"} type="submit">
                          Add Field
                        </Button>
                      </div>
                      <div className="mt-2 flex gap-x-4 gap-y-4">
                        {fields.map((field, index) => (
                          <div key={index} className="border flex rounded">
                            <p className="p-2">{field.name}</p>
                            <Button
                              className="ml-auto p-2"
                              variant={"outline"}
                              onClick={() => {
                                const newFields = [...fields];
                                newFields.splice(index, 1);
                                setFields(newFields);
                              }}
                            >
                              <IoRemoveCircleOutline className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </form>

                    <div className="mt-2">
                      <Label htmlFor="promptTemplate">Prompt</Label>
                      <p className="text-sm text-gray-500">
                        This is the prompt that the agent will use. To use any
                        of your input fields here, use the format &#123;field
                        name&#125;. For example, if you have a field named EMI
                        Amount, you can use it in the prompt as &#123;EMI
                        Amount&#125;.
                      </p>
                      <Textarea
                        placeholder="Prompt"
                        value={promptTemplate}
                        onChange={(e) => setPromptTemplate(e.target.value)}
                        id="promptTemplate"
                      />
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="initialMessage">Initial Message</Label>
                      <p className="text-sm text-gray-500">
                        This is the message that will be sent to the user when
                        the agent initiates a call (optional).
                      </p>
                      <Textarea
                        placeholder="Initial Message"
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        id="initialMessage"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
              {currentStep === 3 ? (
                <div className="my-4 space-y-4">
                  <p className="text-sm text-gray-500">
                    These are the fields that the agent will extract from the
                    conversation. For example, if you want to extract the EMI
                    Amount from the conversation, you can add a field named EMI
                    Amount here.
                  </p>

                  <p className="text-sm text-gray-500">
                    Add a description for each field to help the agent
                    understand what the field is.
                  </p>

                  <div className="w-48">
                    <Label className="">Field Name</Label>
                    <Input
                      ref={extractionInputRef}
                      className="mb-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (
                            extractionInputRef.current &&
                            extractionInputRef.current.value.trim().length >
                              0 &&
                            !extractionFields.find(
                              (field) =>
                                field.name ===
                                extractionInputRef?.current?.value
                            )
                          ) {
                            setExtractionFields([
                              ...extractionFields,
                              {
                                name: extractionInputRef.current.value,
                                description: "",
                              },
                            ]);
                            extractionInputRef.current.value = "";
                          }
                        }
                      }}
                    />
                    <Button
                      variant={"secondary"}
                      onClick={() => {
                        if (
                          extractionInputRef.current &&
                          extractionInputRef.current.value.trim().length > 0 &&
                          !extractionFields.find(
                            (field) =>
                              field.name === extractionInputRef?.current?.value
                          )
                        ) {
                          setExtractionFields([
                            ...extractionFields,
                            {
                              name: extractionInputRef.current.value,
                              description: "",
                            },
                          ]);
                          extractionInputRef.current.value = "";
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>

                  {extractionFields.length > 0 && (
                    <div className="grid grid-cols-6 mt-4 gap-4">
                      <Label>Name</Label>
                      <Label className="col-span-4">Description</Label>
                      <Label>Remove</Label>

                      {extractionFields.map((field, index) => (
                        <React.Fragment key={field.name}>
                          <p>{field.name}</p>

                          <Textarea
                            className="col-span-4"
                            value={field.description}
                            onChange={(e) => {
                              const newFields = [...extractionFields];
                              newFields[index].description = e.target.value;
                              setExtractionFields(newFields);
                            }}
                          />

                          <Button
                            variant={"destructive"}
                            onClick={() => {
                              const newFields = [...extractionFields];
                              newFields.splice(index, 1);
                              setExtractionFields(newFields);
                            }}
                            className="ml-2"
                          >
                            -
                          </Button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              {currentStep === 4 ? (
                <div className="space-y-4 ">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="end-call"
                      onCheckedChange={(e) => setEndCall(e)}
                      checked={endCall}
                    />
                    <Label htmlFor="end-call">End Call</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="transfer-call"
                      onCheckedChange={(e) => setTransferCall(e)}
                      checked={transferCall}
                    />
                    <Label htmlFor="transfer-call">Transfer Call</Label>
                  </div>
                  {transferCall ? (
                    <Input
                      id="phone-number"
                      type="text"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  ) : undefined}
                  <div className="m-5 ml-0 text-xl font-bold ">
                    Other Configuration
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="bg-noise"
                      onCheckedChange={(e) => setBgNoise(e)}
                      checked={bgNoise}
                    />
                    <Label htmlFor="transfer-call">Background Noise</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ignore-utterance"
                      onCheckedChange={(e) => setIgnoreUtterance(e)}
                      checked={ignoreUtterance}
                    />
                    <Label htmlFor="transfer-call">Ignore Utterance</Label>
                  </div>

                  <TextInput
                    id="max-call-duration"
                    label="Max Call Duration (in seconds)"
                    value={maxCallDuration.toString()}
                    setValue={(value) => {
                      //function to check if the value is a number
                      const num = Number(value);
                      if (isNaN(num)) {
                        setMaxCallDuration(300);
                        toast({
                          title: "Invalid value",
                          description: "Please enter a valid number",
                          variant: "destructive",
                        });
                      } else {
                        setMaxCallDuration(num);
                      }
                    }}
                  />
                  <TextInput
                    id="idle-timeout"
                    label="Idle Timeout (in seconds)"
                    value={idleTimeout.toString()}
                    setValue={(value) => {
                      //function to check if the value is a number
                      const num = Number(value);
                      if (isNaN(num)) {
                        setIdleTimeout(20);
                        toast({
                          title: "Invalid value",
                          description: "Please enter a valid number",
                          variant: "destructive",
                        });
                      } else {
                        setIdleTimeout(num);
                      }
                    }}
                  />
                  <div>
                    <Label>Filler Words</Label>
                    <DropdownInput
                      selected={fillerWords}
                      setSelected={(e) => {
                        if (!e) {
                          return;
                        }
                        setFillerWords(e as FillerWords);
                      }}
                      options={Object.keys(FillerWords).map((key) => ({
                        value: toCapitalizedSentence(key),
                        key: key.toString(),
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 h-full">
                    <Label htmlFor="functions">External Functions</Label>
                    <Button
                      variant={"secondary"}
                      onClick={() =>
                        setShowExternalFunctionDialog({
                          isOpen: true,
                          data: undefined,
                        })
                      }
                    >
                      Add
                    </Button>
                    <AddFunctionDialog
                      isOpen={showExternalFunctionDialog.isOpen}
                      onClose={() =>
                        setShowExternalFunctionDialog({
                          isOpen: false,
                          data: undefined,
                        })
                      }
                      initialData={showExternalFunctionDialog.data}
                      onConfirm={(data) => {
                        if (showExternalFunctionDialog.data === undefined) {
                          setExternalFunctions([...externalFunctions, data]);
                        } else {
                          setExternalFunctions(
                            externalFunctions.map((func) => {
                              if (func.functionName === data.functionName) {
                                return data;
                              }
                              return func;
                            })
                          );
                        }
                        setShowExternalFunctionDialog({
                          isOpen: false,
                          data: undefined,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-6">
                    {externalFunctions.map((func, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-darkBgGray p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-primary dark:text-primary-dark">
                            {func.functionName}
                          </h3>
                          <div className="space-x-2">
                            <Button
                              variant={"default"}
                              className=" text-white"
                              onClick={() =>
                                setShowExternalFunctionDialog({
                                  isOpen: true,
                                  data: func,
                                })
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              variant={"secondary"}
                              className="bg-red-500 hover:bg-red-600 text-white"
                              onClick={() =>
                                setExternalFunctions(
                                  externalFunctions.filter(
                                    (_, i) => i !== index
                                  )
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-md text-muted-foreground">
                          {func.description}
                        </p>

                        {/* Details */}
                        <div className="mt-4 space-y-4">
                          <div>
                            <strong className="block text-lg text-gray-800 dark:text-gray-100">
                              API URL
                            </strong>
                            <p className="text-gray-600 dark:text-gray-400">
                              {func.apiUrl}
                            </p>
                          </div>
                          <div>
                            <strong className="block text-lg text-gray-800 dark:text-gray-100">
                              Method
                            </strong>
                            <p className="text-gray-600 dark:text-gray-400">
                              {func.method}
                            </p>
                          </div>

                          {/* Headers */}
                          {func.headers.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                Headers
                              </h4>
                              <ul className="pl-4 list-disc text-gray-600 dark:text-gray-400">
                                {func.headers.map((header, idx) => (
                                  <li key={idx}>
                                    <span className="font-medium">
                                      {header.key}:
                                    </span>{" "}
                                    {header.value}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Query Parameters */}
                          {func.queryParams.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                Query Parameters
                              </h4>
                              <ul className="pl-4 list-disc text-gray-600 dark:text-gray-400">
                                {func.queryParams.map((param, idx) => (
                                  <li key={idx}>
                                    <strong>{param.param}</strong> ({param.type}
                                    ): {param.description} (
                                    {param.required ? "Required" : "Optional"})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Additional Details */}
                        <div className="mt-4  space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                              Speak on Send
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                              {func.speak_on_send ? "Yes" : "No"}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                              Speak on Receive
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                              {func.speak_on_receive ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center justify-center mt-4 lg:mt-6 gap-x-4">
              {currentStep !== 0 ? (
                <Button
                  variant={"outline"}
                  onClick={() => {
                    setCurrentStep(currentStep - 1);
                  }}
                >
                  Back
                </Button>
              ) : null}
              {currentStep !== steps.length - 1 ? (
                <Button
                  disabled={!canSubmit}
                  onClick={() => {
                    setCurrentStep(currentStep + 1);
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button disabled={!canSubmit} onClick={handleSubmit}>
                  {actionName}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default AgentInput;