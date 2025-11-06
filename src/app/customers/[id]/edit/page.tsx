"use client";

import Loading from "@/components/Loading";
// import useAxiosData from "@/hooks/useAxiosData";
import { useToast } from "@/components/ui/use-toast";
import { editCustomer, getCustomer } from "@/lib/api/customers";
import { TCustomer, TFetched } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CustomerInput, { TCustomerData } from "../../CustomerInput";

function Page({ params }: { params: { id: string } }) {
  const [uploading, setUploading] = useState(false);

  const [customer, setCustomer] = useState<TFetched<TCustomer>>({
    data: undefined,
    loading: true,
  });

  const router = useRouter();

  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await getCustomer(params.id);
        setCustomer({
          data: response,
          loading: false,
          error: undefined,
        });
      } catch (error: any) {
        setCustomer({
          data: undefined,
          loading: false,
          error: error.message,
        });
      }
    };

    fetchCustomer();
  }, [params.id]);

  const handleSubmit = async ({
    name,
    phone,
    addressLine1,
    addressLine2,
  }: TCustomerData) => {
    if (uploading || !customer.data) {
      return;
    }

    setUploading(true);

    try {
      const response = await editCustomer({
        uid: params.id,
        name,
        phone,
        addressLine1,
        addressLine2,
        organisationId: customer.data.organisationId,
      });

      setUploading(false);

      toast({
        title: "Customer edited successfully",
        description: "Customer has been edited successfully",
      });
      console.log(`/customers/${response.uid}`);
      router.push(`/customers`);
      // router.push(`/customers/${response.uid}`);
      return;
    } catch (err: any) {
      // toast.error(response.error);
      toast({
        title: "Error editing customer",
        description: err.message,
      });
    }
  };

  if (customer.error) {
    return <div>Customer not found</div>;
  }

  if (customer.loading || !customer.data) {
    return <Loading />;
  }

  return (
    <CustomerInput
      initialData={{
        ...customer.data,
      }}
      canSubmit={!uploading}
      onSubmit={handleSubmit}
      actionName="Modify"
    />
  );
}

export default Page;
