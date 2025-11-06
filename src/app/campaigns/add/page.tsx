// Updated Page component with comprehensive data validation

"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ui/use-toast";
import useUser from "@/hooks/useUser";
import { createCampaign } from "@/lib/api/campaigns";
import { createCustomers } from "@/lib/api/customers";
import {
  CallStatus,
  CampaignStatus,
  TCreateCallDTO,
  TCreateCustomerDTO,
  TField,
} from "@/types";
import { useRouter } from "next/navigation";
import CampaignInput, { TCampaignData } from "../CampaignInput";
import { triggerCallsCheck, retryFailedCalls } from "@/lib/api/cron";

// Loader Modal Component
const LoaderModal = ({ isOpen, message }: { isOpen: boolean; message: string }) => {
  const { systemTheme, theme, setTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  
  if (!isOpen) return null;

  const isDark = currentTheme === "dark";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className={`
          relative p-8 rounded-2xl max-w-sm w-full mx-4 border border-orange-300/30
          ${isDark ? 'bg-black' : 'bg-white'}
        `}
        style={{
          background: isDark 
            ? `linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%), linear-gradient(135deg, rgba(255, 153, 77, 0.6) 0%, rgba(255, 136, 51, 0.4) 50%, rgba(255, 119, 40, 0.7) 100%)`
            : `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%), linear-gradient(135deg, rgba(255, 153, 77, 0.6) 0%, rgba(255, 136, 51, 0.4) 50%, rgba(255, 119, 40, 0.7) 100%)`,
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          boxShadow: `
            inset 0 0 15px rgba(255, 153, 77, 0.5),
            0 4px 8px rgba(255, 136, 51, 0.3),
            0 0 10px rgba(255, 119, 40, 0.6),
            0 0 20px rgba(255, 119, 40, 0.4)
          `
        }}
      >
        <div className="flex flex-col items-center space-y-4">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-2 border-transparent"
            style={{
              borderTopColor: '#ff8833',
              borderRightColor: '#ff7728',
              filter: 'drop-shadow(0 0 6px rgba(255, 119, 40, 0.6))'
            }}
          ></div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Creating Campaign
          </h3>
          <p className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Enhanced validation types
type DataValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  invalidRecords: Array<{
    index: number;
    phone: string;
    issues: string[];
  }>;
  emptyFieldRecords: Array<{
    index: number;
    phone: string;
    emptyFields: string[];
  }>;
};

function Page() {
  const [uploading, setUploading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("");
  const { loading, organisation } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  // Helper function to validate phone number (10 digits or +91 followed by 10 digits)
  const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove any non-digit characters except + for country code
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Check if it's exactly 10 digits
    if (cleanPhone.length === 10 && /^\d{10}$/.test(cleanPhone)) {
      return true;
    }
    
    // Check if it's +91 followed by exactly 10 digits
    if (cleanPhone.startsWith('+91') && cleanPhone.length === 13) {
      const numberPart = cleanPhone.substring(3); // Remove +91
      return /^\d{10}$/.test(numberPart);
    }
    
    return false;
  };

  // Comprehensive data validation function
  const validateUploadedData = (
    uploadedData: Array<{ [key: string]: string }>,
    customerPhoneKey: string,
    mappings: Array<{ agentField: string; fileField?: string }>
  ): DataValidationResult => {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      invalidRecords: [],
      emptyFieldRecords: []
    };

    if (uploadedData.length === 0) {
      result.isValid = false;
      result.errors.push("No data found in uploaded file");
      return result;
    }

    // Check if required columns exist
    const fileColumns = Object.keys(uploadedData[0]);
    
    if (!fileColumns.includes(customerPhoneKey)) {
      result.isValid = false;
      result.errors.push(`Phone number column '${customerPhoneKey}' not found in uploaded data`);
      return result;
    }

    // Check if all mapped fields exist in the file
    const missingMappedFields = mappings
      .filter(mapping => mapping.fileField && !fileColumns.includes(mapping.fileField))
      .map(mapping => mapping.fileField);

    if (missingMappedFields.length > 0) {
      result.isValid = false;
      result.errors.push(`Mapped fields not found in file: ${missingMappedFields.join(', ')}`);
      return result;
    }

    // Validate each record
    uploadedData.forEach((record, index) => {
      const recordIssues: string[] = [];
      const emptyFields: string[] = [];
      const phone = record[customerPhoneKey];

      // Validate phone number
      if (!phone || !phone.toString().trim()) {
        recordIssues.push("Phone number is empty");
      } else if (!isValidPhoneNumber(phone.toString().trim())) {
        recordIssues.push("Invalid phone number format");
      }

      // Validate all mapped fields have values
      mappings.forEach(mapping => {
        if (mapping.fileField) {
          const fieldValue = record[mapping.fileField];
          if (!fieldValue || !fieldValue.toString().trim()) {
            emptyFields.push(mapping.agentField);
          }
        }
      });

      // Record issues if any
      if (recordIssues.length > 0) {
        result.invalidRecords.push({
          index: index + 1, // 1-based index for user display
          phone: phone || 'N/A',
          issues: recordIssues
        });
      }

      if (emptyFields.length > 0) {
        result.emptyFieldRecords.push({
          index: index + 1,
          phone: phone || 'N/A',
          emptyFields
        });
      }
    });

    // Determine if validation passed
    const hasInvalidRecords = result.invalidRecords.length > 0;
    const hasEmptyFields = result.emptyFieldRecords.length > 0;

    if (hasInvalidRecords || hasEmptyFields) {
      result.isValid = false;
      
      if (hasInvalidRecords) {
        result.errors.push(`${result.invalidRecords.length} record(s) have invalid data`);
      }
      
      if (hasEmptyFields) {
        result.errors.push(`${result.emptyFieldRecords.length} record(s) have empty required fields`);
      }
    }

    // Add warnings for large datasets
    if (uploadedData.length > 1000) {
      result.warnings.push(`Large dataset detected (${uploadedData.length} records). Processing may take longer.`);
    }

    return result;
  };

  // Show detailed validation errors to user
  const showValidationErrors = (validationResult: DataValidationResult) => {
    let errorMessage = "Data validation failed:\n\n";
    
    validationResult.errors.forEach(error => {
      errorMessage += `• ${error}\n`;
    });

    if (validationResult.invalidRecords.length > 0) {
      errorMessage += "\nInvalid Records:\n";
      validationResult.invalidRecords.slice(0, 5).forEach(record => {
        errorMessage += `Row ${record.index} (${record.phone}): ${record.issues.join(', ')}\n`;
      });
      
      if (validationResult.invalidRecords.length > 5) {
        errorMessage += `... and ${validationResult.invalidRecords.length - 5} more records\n`;
      }
    }

    if (validationResult.emptyFieldRecords.length > 0) {
      errorMessage += "\nRecords with Empty Fields:\n";
      validationResult.emptyFieldRecords.slice(0, 5).forEach(record => {
        errorMessage += `Row ${record.index} (${record.phone}): Missing ${record.emptyFields.join(', ')}\n`;
      });
      
      if (validationResult.emptyFieldRecords.length > 5) {
        errorMessage += `... and ${validationResult.emptyFieldRecords.length - 5} more records\n`;
      }
    }

    toast({
      title: "Data Validation Failed",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleSubmit = async ({
    name,
    agentId,
    mapping,
    customerPhoneKey,
    customers,
    uploadedData,
    retryFailedCallsAfter,
    phone,
  }: TCampaignData) => {
    if (uploading || uploadedData.length === 0 || loading || !organisation) {
      return;
    }

    // Comprehensive validation before processing
    const validationResult = validateUploadedData(uploadedData, customerPhoneKey, mapping);
    
    if (!validationResult.isValid) {
      showValidationErrors(validationResult);
      return;
    }

    // Show warnings if any
    if (validationResult.warnings.length > 0) {
      validationResult.warnings.forEach(warning => {
        toast({
          title: "Warning",
          description: warning,
          variant: "default",
        });
      });
    }

    const calls: TCreateCallDTO[] = [];
    let customersNotFound: string[] = [];
    let invalidPhoneNumbers: string[] = [];
    let recordsWithEmptyFields: string[] = [];

    setUploading(true);

    // Process each record with enhanced validation
    for (let i = 0; i < uploadedData.length; i++) {
      const callData = uploadedData[i];
      const customerPhone = callData[customerPhoneKey];

      // Skip records that were already identified as invalid
      const isInvalidRecord = validationResult.invalidRecords.some(r => r.index === i + 1);
      const hasEmptyFields = validationResult.emptyFieldRecords.some(r => r.index === i + 1);
      
      if (isInvalidRecord || hasEmptyFields) {
        continue;
      }

      // Validate phone number format again (redundant but safe)
      if (!isValidPhoneNumber(customerPhone)) {
        invalidPhoneNumbers.push(`Row ${i + 1}: ${customerPhone}`);
        continue;
      }

      // Check for empty mapped fields
      const emptyFields = mapping
        .filter(m => m.fileField && (!callData[m.fileField] || !callData[m.fileField].toString().trim()))
        .map(m => m.agentField);

      if (emptyFields.length > 0) {
        recordsWithEmptyFields.push(`Row ${i + 1} (${customerPhone}): Missing ${emptyFields.join(', ')}`);
        continue;
      }

      const customer = customers.find((c) => c.phone === customerPhone);

      if (!customer) {
        customersNotFound.push(customerPhone);
      }
    }

    // Show summary of skipped records
    if (invalidPhoneNumbers.length > 0 || recordsWithEmptyFields.length > 0) {
      let message = "Some records were skipped:\n\n";
      
      if (invalidPhoneNumbers.length > 0) {
        message += `Invalid phone numbers (${invalidPhoneNumbers.length}):\n`;
        message += invalidPhoneNumbers.slice(0, 3).join('\n');
        if (invalidPhoneNumbers.length > 3) {
          message += `\n... and ${invalidPhoneNumbers.length - 3} more`;
        }
        message += '\n\n';
      }
      
      if (recordsWithEmptyFields.length > 0) {
        message += `Empty required fields (${recordsWithEmptyFields.length}):\n`;
        message += recordsWithEmptyFields.slice(0, 3).join('\n');
        if (recordsWithEmptyFields.length > 3) {
          message += `\n... and ${recordsWithEmptyFields.length - 3} more`;
        }
      }

      toast({
        title: "Records Skipped",
        description: message,
        variant: "destructive",
      });
    }

    let finalCustomers = customers;

    // Create customers that don't exist
    if (customersNotFound.length > 0) {
      const toCreate: TCreateCustomerDTO[] = customersNotFound.map((phone) => ({
        phone,
        addressLine1: "",
        addressLine2: "",
        organisationId: organisation.uid,
      }));

      try {
        const res = await createCustomers(toCreate);
        finalCustomers = [...customers, ...res];
      } catch (e: any) {
        console.log(e);
        toast({
          title: "Error creating customers",
          description: "Some customers could not be created",
          variant: "destructive",
        });
      }
    }

    let finalCustomersNotFound = 0;
    let validRecordsProcessed = 0;
    let totalSkippedRecords = invalidPhoneNumbers.length + recordsWithEmptyFields.length;

    // Process valid records
    for (let i = 0; i < uploadedData.length; i++) {
      const callData = uploadedData[i];
      const customerPhone = callData[customerPhoneKey];

      // Skip invalid records
      if (!isValidPhoneNumber(customerPhone)) {
        continue;
      }

      // Skip records with empty fields
      const hasEmptyFields = mapping.some(m => 
        m.fileField && (!callData[m.fileField] || !callData[m.fileField].toString().trim())
      );
      
      if (hasEmptyFields) {
        continue;
      }

      const customer = finalCustomers.find((c) => c.phone === customerPhone);

      if (!customer) {
        finalCustomersNotFound++;
        totalSkippedRecords++;
        continue;
      }

      const fields: TField[] = [];

      // Build fields from mapping
      for (const mappingEntry of mapping) {
        if (mappingEntry.fileField) {
          const fieldValue = callData[mappingEntry.fileField];
          fields.push({
            name: mappingEntry.agentField,
            value: fieldValue ? fieldValue.toString().trim() : "",
            type: "string",
          });
        }
      }

      const call: TCreateCallDTO = {
        customerId: customer.uid,
        campaignId: "",
        fields: fields,
        organisationId: organisation.uid,
        status: CallStatus.PENDING,
        callType: "OUTBOUND",
        agentId,
        fromPhone: phone,
      };

      calls.push(call);
      validRecordsProcessed++;
    }

    // Check if we have any valid calls to process
    if (calls.length === 0) {
      toast({
        title: "No valid records to process",
        description: "All records were skipped due to validation errors or missing data",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    try {
      // Create campaign with enhanced metadata
      const res = await createCampaign(
        {
          name,
          agentId,
          callIds: [],
          organisationId: organisation.uid,
          status: CampaignStatus.PENDING,
          retryFailedCallsAfter: retryFailedCallsAfter,
          phone: phone,
          totalSkippedRecords: totalSkippedRecords,
        },
        calls
      );
      
      if (res) {
        setShowLoader(true);
        setLoaderMessage("Saving campaign and calls");
        
        // Wait for Firebase to save the data
        await new Promise((resolve) => setTimeout(resolve, 5000));
        
        setLoaderMessage("Initializing calls and setting up retry logic...");
        
        // Make the backend calls
        await triggerCallsCheck(res.uid);
        await retryFailedCalls(res.uid, retryFailedCallsAfter);
        
        setShowLoader(false);
        
        toast({ 
          title: "Campaign created successfully",
          description: `${validRecordsProcessed} calls created. ${totalSkippedRecords} records skipped.`
        });
        
        setUploading(false);
        window.location.href = `/campaigns`;
      }
    } catch (e: any) {
      console.log(e);
      setShowLoader(false);
      setUploading(false);
      
      toast({
        title: "Error creating campaign",
        description: "An error occurred while creating the campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <CampaignInput
        canSubmit={!uploading}
        onSubmit={handleSubmit}
      />
      <LoaderModal isOpen={showLoader} message={loaderMessage} />
    </>
  );
}

export default Page;