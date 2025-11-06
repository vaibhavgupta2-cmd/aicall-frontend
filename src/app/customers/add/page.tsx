"use client";

// import { createLead } from "@/lib/cus";
import { useToast } from "@/components/ui/use-toast";
import useUser from "@/hooks/useUser";
import { createCustomer } from "@/lib/api/customers";
import { useState } from "react";
import CustomerInput, { TCustomerData } from "../CustomerInput";

function Page() {
  const { organisation } = useUser();
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);

  const handleSubmit = async ({
    name,
    phone,
    addressLine1,
    addressLine2,
  }: TCustomerData) => {
    if (!organisation) {
      toast({
        title: "Error creating customer",
        description: "Organisation not found",
        variant: "destructive",
      });
      return;
    }
    if (uploading) {
      toast({
        title: "Customer is being created",
        description: "Please wait",
      });
      return;
    }

    setUploading(true);

    try {
      const customer = await createCustomer({
        name,
        phone,
        addressLine1,
        addressLine2,
        organisationId: organisation.uid,
      });

      toast({
        title: "Customer created",
        description: `Customer "${customer.name}" created`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating customer",
        description: error.message,
      });
    }

    setUploading(false);
  };

  return (
    <CustomerInput
      canSubmit={!uploading}
      onSubmit={handleSubmit}
      actionName="Add"
    />
  );
}

export default Page;

