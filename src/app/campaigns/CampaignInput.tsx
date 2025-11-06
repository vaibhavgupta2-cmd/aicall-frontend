// Updated CampaignInput component with comprehensive validation

"use client";

import Loading from "@/components/Loading";
import DropdownInput from "@/components/inputs/DropdownInput";
import InputFile from "@/components/inputs/InputFile";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Typography from "@/components/ui/typography";
import { useToast } from "@/components/ui/use-toast";
import useUser from "@/hooks/useUser";
import { getAgents } from "@/lib/api/agents";
import { getCustomers } from "@/lib/api/customers";
import { TAgent, TCustomer, TFetched } from "@/types";
import Link from "next/link";
import Papa from "papaparse";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeftIcon,
  ClockIcon,
  FileIcon,
  MegaphoneIcon,
  PhoneIcon,
  UserIcon,
  AlertCircleIcon,
} from "lucide-react";

const TextInput = (props: {
  label: string;
  id: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  error?: string;
}) => (
  <div>
    <Label htmlFor={props.id} className={props.error ? "text-destructive" : ""}>
      {props.label}
    </Label>
    <Input
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.setValue(e.target.value)}
      id={props.id}
      className={props.error ? "border-destructive focus:border-destructive" : ""}
    />
    {props.error && (
      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
        <AlertCircleIcon className="w-3 h-3" />
        {props.error}
      </p>
    )}
  </div>
);

export type TCampaignData = {
  mapping: TMapping[];
  name: string;
  agentId: string;
  customerPhoneKey: string;
  customers: TCustomer[];
  uploadedData: FileDataProcessed;
  retryFailedCallsAfter: number;
  phone: string;
};

const formatTime = (date: Date) => {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

type FileData = {
  rows: string[];
  data: any[];
};

type FileDataProcessed = { [x: string]: string }[];

function FileInput({
  handleFileSubmit,
  error,
}: {
  handleFileSubmit: (fileData: FileDataProcessed) => void;
  error?: string;
}) {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length !== 1) {
      return;
    }

    const file = e.target.files?.[0];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
      complete: function (results: any) {
        if (results.data.length === 0) {
          toast({
            title: "Error reading CSV",
            description: "CSV file is empty",
            variant: "destructive",
          });
          return;
        }

        handleFileSubmit(results.data);
      },
      error: function (error: any) {
        toast({
          title: "Error reading CSV",
          description: "Invalid CSV File",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div>
      <InputFile
        placeholder="Customer CSV"
        onChange={handleFileChange}
        accept=".csv"
      />
      {error && (
        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
          <AlertCircleIcon className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

type TMapping = {
  agentField: string;
  fileField?: string;
};

const RESERVERD_FIELDS = ["CUSTOMER_NAME"];

// Validation types
type ValidationErrors = {
  name?: string;
  agentId?: string;
  customerData?: string;
  retryFailedCallsAfter?: string;
  selectedServiceProvider?: string;
  phoneNumber?: string;
  emailMappingKey?: string;
  mappings?: { [key: string]: string };
  dataValidation?: string[];
};

function CampaignInput({
  onSubmit,
  canSubmit,
  initialData,
}: {
  onSubmit: (data: TCampaignData) => void;
  canSubmit?: boolean;
  initialData?: TCampaignData;
}) {
  const { organisation, loading } = useUser();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedServiceProvider, setSelectedServiceProvider] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [agents, setAgents] = useState<TFetched<TAgent[]>>({
    loading: true,
    data: undefined,
  });

  const [customers, setCustomers] = useState<TFetched<TCustomer[]>>({
    loading: true,
    data: undefined,
  });
  const [customerData, setCustomerData] = useState<FileDataProcessed>([]);
  const [emailMappingKey, setEmailMappingKey] = useState<string>();
  const [retryFailedCallsAfter, setRetryFailedCallsAfter] = useState(
    initialData?.retryFailedCallsAfter || 30
  );

  const handleFileSubmit = (fileData: FileDataProcessed) => {
    setCustomerData(fileData);
    // Clear file-related validation errors when new file is uploaded
    setValidationErrors(prev => ({
      ...prev,
      customerData: undefined,
      dataValidation: undefined
    }));
  };

  const [mappings, setMappings] = useState<TMapping[]>([]);
  
  // Get available service providers
  const getServiceProviders = () => {
    if (!organisation || !organisation.Service_Provider) {
      return [];
    }
    return Object.keys(organisation.Service_Provider);
  };

  // Get phone numbers for a specific service provider
  const getPhoneNumbersForProvider = (provider: string) => {
    if (!organisation || !organisation.Service_Provider || !organisation.Service_Provider[provider]) {
      return [];
    }
    
    const numbers = organisation.Service_Provider[provider];
    return numbers.map((number: string | any) => {
      if (typeof number === 'object' && number !== null) {
        const displayName = number.name ? `${number.name} (${number})` : number.toString();
        return {
          key: typeof number === 'string' ? number : number.toString(),
          value: typeof number === 'string' ? number : number.toString()
        };
      } else {
        return {
          key: number.toString(),
          value: number.toString()
        };
      }
    });
  };

  // Reset phone number when service provider changes
  useEffect(() => {
    setPhoneNumber("");
  }, [selectedServiceProvider]);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!organisation) {
        return;
      }

      try {
        const res = await getAgents(organisation.uid);
        setAgents({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setAgents({ loading: false, data: [], error: error.message });
      }
    };

    const fetchCustomers = async () => {
      if (!organisation) {
        return;
      }

      try {
        const res = await getCustomers(organisation.uid);
        setCustomers({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setCustomers({ loading: false, data: [], error: error.message });
      }
    };

    Promise.all([fetchAgents(), fetchCustomers()]);
  }, [organisation]);

  // Set first service provider as default when organisation data loads
  useEffect(() => {
    if (organisation && organisation.Service_Provider) {
      const providers = Object.keys(organisation.Service_Provider);
      if (providers.length > 0) {
        setSelectedServiceProvider(providers[0]);
      }
    }
  }, [organisation]);

  const [name, setName] = useState(initialData?.name || "");
  const [agentId, setAgentId] = useState<string | undefined>(
    initialData?.agentId || ""
  );

  const selectedAgent = useMemo(
    () => agents.data?.find((x) => x.uid === agentId),
    [agentId, agents.data]
  );

  const serviceProviders = getServiceProviders();

  // Comprehensive validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Campaign name validation
    if (!name.trim()) {
      errors.name = "Campaign name is required";
    } else if (name.trim().length < 3) {
      errors.name = "Campaign name must be at least 3 characters";
    }

    // Agent selection validation
    if (!agentId) {
      errors.agentId = "Please select an agent";
    }

    // Customer data file validation
    if (customerData.length === 0) {
      errors.customerData = "Please upload a customer CSV file";
    }

    // Retry interval validation
    if (!retryFailedCallsAfter || retryFailedCallsAfter < 1) {
      errors.retryFailedCallsAfter = "Retry interval must be at least 1 minute";
    }

    // Service provider validation
    if (!selectedServiceProvider) {
      errors.selectedServiceProvider = "Please select a service provider";
    }

    // Phone number validation
    if (!phoneNumber) {
      errors.phoneNumber = "Please select a phone number";
    }

    // Phone mapping validation
    if (customerData.length > 0 && !emailMappingKey) {
      errors.emailMappingKey = "Please map the phone number field";
    }

    // Field mappings validation
    if (selectedAgent && customerData.length > 0) {
      const mappingErrors: { [key: string]: string } = {};
      const requiredFields = selectedAgent.fields.filter(
        (field) => !RESERVERD_FIELDS.includes(field.name)
      );

      requiredFields.forEach((field) => {
        const mapping = mappings.find((m) => m.agentField === field.name);
        if (!mapping || !mapping.fileField) {
          mappingErrors[field.name] = `Please map the ${field.name} field`;
        }
      });

      if (Object.keys(mappingErrors).length > 0) {
        errors.mappings = mappingErrors;
      }
    }

    // Data validation - check if mapped fields have values in the uploaded data
    if (customerData.length > 0 && emailMappingKey && mappings.length > 0) {
      const dataErrors: string[] = [];
      
      // Check phone number field
      const phoneFieldExists = customerData.some(row => 
        row[emailMappingKey] && row[emailMappingKey].toString().trim()
      );
      if (!phoneFieldExists) {
        dataErrors.push(`No valid data found in phone number field: ${emailMappingKey}`);
      }

      // Check other mapped fields
      mappings.forEach(mapping => {
        if (mapping.fileField) {
          const hasValidData = customerData.some(row => 
            row[mapping.fileField!] && row[mapping.fileField!].toString().trim()
          );
          if (!hasValidData) {
            dataErrors.push(`No valid data found in field: ${mapping.fileField}`);
          }
        }
      });

      if (dataErrors.length > 0) {
        errors.dataValidation = dataErrors;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear specific validation errors when fields are updated
  const clearFieldError = (field: keyof ValidationErrors) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before submitting",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      name,
      agentId: selectedAgent?.uid || "",
      mapping: mappings,
      customerPhoneKey: emailMappingKey || "",
      customers: customers.data!,
      uploadedData: customerData,
      retryFailedCallsAfter: retryFailedCallsAfter,
      phone: phoneNumber,
    });
  };

  if (
    loading ||
    !organisation ||
    agents.loading ||
    !agents.data ||
    customers.loading ||
    !customers.data
  ) {
    return <Loading />;
  }

  return (
    <React.Fragment>
      <div className="relative rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted pointer-events-none rounded-xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <CardHeader className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
              <MegaphoneIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <Typography
                variant="h3"
                className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent"
              >
                Create Campaign
              </Typography>
              <p className="text-sm text-muted-foreground mt-1">
                Set up your campaign details and customer mapping
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <TextInput
              label="Campaign Name"
              id="name"
              placeholder="My Campaign"
              value={name}
              setValue={(value) => {
                setName(value);
                if (value.trim()) clearFieldError('name');
              }}
              error={validationErrors.name}
            />

            <div className="flex flex-col justify-between">
              <Label className={`text-sm font-medium flex items-center gap-2 ${validationErrors.agentId ? 'text-destructive' : ''}`}>
                Agent
              </Label>
              <div className="bg-background/50 backdrop-blur-sm border-border/50">
                <DropdownInput
                  options={agents.data.map((x) => ({
                    key: x.uid,
                    value: x.name,
                  }))}
                  selected={agentId}
                  setSelected={(value) => {
                    setAgentId(value);
                    if (value) clearFieldError('agentId');
                  }}
                />
              </div>
              {validationErrors.agentId && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircleIcon className="w-3 h-3" />
                  {validationErrors.agentId}
                </p>
              )}
            </div>

            <div className="flex flex-col justify-between">
              <Label className={`text-sm font-medium ${validationErrors.customerData ? 'text-destructive' : ''}`}>
              </Label>
              <FileInput 
                handleFileSubmit={handleFileSubmit} 
                error={validationErrors.customerData}
              />
            </div>

            <TextInput
              id="retry-failured-calls-after"
              label="Retry Interval (minutes)"
              value={retryFailedCallsAfter.toString()}
              setValue={(value) => {
                const num = Number(value);
                if (isNaN(num)) {
                  setRetryFailedCallsAfter(30);
                  toast({
                    title: "Invalid value",
                    description: "Please enter a valid number",
                    variant: "destructive",
                  });
                } else {
                  setRetryFailedCallsAfter(num);
                  if (num >= 1) clearFieldError('retryFailedCallsAfter');
                }
              }}
              error={validationErrors.retryFailedCallsAfter}
            />

            {/* Service Provider Selection */}
            {organisation && organisation.Service_Provider && (
              <>
                <div className="flex flex-col justify-between">
                  <Label className={`text-sm font-medium flex items-center gap-2 ${validationErrors.selectedServiceProvider ? 'text-destructive' : ''}`}>
                    Service Provider
                  </Label>
                  <div className="bg-background/50 backdrop-blur-sm border-border/50">
                    <DropdownInput
                      options={serviceProviders.map((provider) => ({
                        key: provider,
                        value: provider,
                      }))}
                      selected={selectedServiceProvider}
                      setSelected={(value) => {
                        setSelectedServiceProvider(value || "");
                        if (value) clearFieldError('selectedServiceProvider');
                      }}
                    />
                  </div>
                  {validationErrors.selectedServiceProvider && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircleIcon className="w-3 h-3" />
                      {validationErrors.selectedServiceProvider}
                    </p>
                  )}
                </div>

                {/* Phone Number Selection */}
                {selectedServiceProvider && (
                  <div className="flex flex-col justify-between">
                    <Label className={`text-sm font-medium flex items-center gap-2 ${validationErrors.phoneNumber ? 'text-destructive' : ''}`}>
                      <PhoneIcon className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <div className="bg-background/50 backdrop-blur-sm border-border/50">
                      {getPhoneNumbersForProvider(selectedServiceProvider).length > 0 ? (
                        <DropdownInput
                          options={getPhoneNumbersForProvider(selectedServiceProvider)}
                          selected={phoneNumber}
                          setSelected={(value) => {
                            setPhoneNumber(value || "");
                            if (value) clearFieldError('phoneNumber');
                          }}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground p-2 border border-border rounded-md">
                          No phone numbers available for this provider
                        </div>
                      )}
                    </div>
                    {validationErrors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-3 h-3" />
                        {validationErrors.phoneNumber}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {customerData.length > 0 && selectedAgent && (
            <div className="relative p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
              <Typography
                variant="h3"
                className="text-xl font-semibold mb-6 relative"
              >
                Field Mapping
              </Typography>

              <div className="grid grid-cols-2 gap-4 relative">
                <p className="font-medium text-muted-foreground">Agent Field</p>
                <p className="font-medium text-muted-foreground">
                  Field in File
                </p>

                <p className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-primary/70" />
                  Phone Number *
                </p>
                <div className="space-y-1">
                  <div className="bg-background/50 backdrop-blur-sm border-border/50">
                    <DropdownInput
                      options={Object.keys(customerData[0]).map((x) => ({
                        key: x,
                        value: x,
                      }))}
                      selected={emailMappingKey}
                      setSelected={(value) => {
                        setEmailMappingKey(value);
                        if (value) clearFieldError('emailMappingKey');
                      }}
                    />
                  </div>
                  {validationErrors.emailMappingKey && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircleIcon className="w-3 h-3" />
                      {validationErrors.emailMappingKey}
                    </p>
                  )}
                </div>

                {selectedAgent.fields
                  .filter((field) => !RESERVERD_FIELDS.includes(field.name))
                  .map((field) => (
                    <React.Fragment key={field.name}>
                      <p className="flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-primary/70" />
                        {field.name} *
                      </p>
                      <div className="space-y-1">
                        <div className="bg-background/50 backdrop-blur-sm border-border/50">
                          <DropdownInput
                            options={Object.keys(customerData[0]).map((x) => ({
                              key: x,
                              value: x,
                            }))}
                            selected={
                              mappings.find((x) => x.agentField === field.name)
                                ?.fileField
                            }
                            setSelected={(value) => {
                              setMappings((prev) => {
                                const index = prev.findIndex(
                                  (x) => x.agentField === field.name
                                );

                                if (index === -1) {
                                  return [
                                    ...prev,
                                    { agentField: field.name, fileField: value },
                                  ];
                                }

                                return [
                                  ...prev.slice(0, index),
                                  { agentField: field.name, fileField: value },
                                  ...prev.slice(index + 1),
                                ];
                              });
                              
                              // Clear mapping error for this field
                              if (value && validationErrors.mappings) {
                                const newMappingErrors = { ...validationErrors.mappings };
                                delete newMappingErrors[field.name];
                                setValidationErrors(prev => ({
                                  ...prev,
                                  mappings: Object.keys(newMappingErrors).length > 0 ? newMappingErrors : undefined
                                }));
                              }
                            }}
                          />
                        </div>
                        {validationErrors.mappings?.[field.name] && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircleIcon className="w-3 h-3" />
                            {validationErrors.mappings[field.name]}
                          </p>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
              </div>
              
              {/* Data validation errors */}
              {validationErrors.dataValidation && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                    <AlertCircleIcon className="w-4 h-4" />
                    Data Validation Issues:
                  </h4>
                  <ul className="text-sm text-destructive space-y-1">
                    {validationErrors.dataValidation.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl px-8"
            >
              Create Campaign
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-border/50 hover:bg-background/50"
            >
              <Link href="/campaigns" className="flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4" />
                Cancel
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </React.Fragment>
  );
}

export default CampaignInput;