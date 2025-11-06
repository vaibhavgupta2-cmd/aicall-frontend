"use client";
import Loading from "@/components/Loading";
import DropdownInput from "@/components/inputs/DropdownInput";
import InputFile from "@/components/inputs/InputFile";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import Typography from "@/components/ui/typography";
import { useToast } from "@/components/ui/use-toast";
import useUser from "@/hooks/useUser";
import { createCustomers } from "@/lib/api/customers";
import { TCreateCustomerDTO } from "@/types";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import React, { useState } from "react";

type FileData = {
  rows: string[];
  data: any[];
};

type FieldMapping = {
  [key in keyof Omit<TCreateCustomerDTO, "organisationId">]: string;
};

type Data = {
  fileData?: FileData;
  mapping?: FieldMapping;
};

function FileInput({
  handleFileSubmit,
}: {
  handleFileSubmit: (fileData: FileData) => void;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<FileData>({ rows: [], data: [] });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length !== 1) {
      return;
    }

    const file = e.target.files?.[0];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
      complete: function (results) {
        if (results.data.length === 0) {
          toast({
            title: "Invalid CSV File",
            description: "Please check the file and try again",
            variant: "destructive",
          });
          return;
        }

        setData({
          rows: Object.keys(results.data[0] as object),
          data: results.data,
        });
      },
      error: function (error) {
        toast({
          title: "Error parsing file",
          description: "Please verify that your CSV file format is correct",
          variant: "destructive",
        });
      },
    });
  };

  const onSubmit = () => {
    if (data.rows.length <= 0 || data.data.length <= 0) {
      toast({
        title: "No File Selected",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    handleFileSubmit(data);
  };

  return (
    <>
      <Typography variant={"h4"}>Step 1: Upload Customers</Typography>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p>Customers can be imported using CSV files</p>
          <p>Please note that the name and number fields are required</p>
        </div>
        <div className="lg:col-span-2">
          <InputFile
            placeholder="Customers CSV File"
            onChange={handleFileChange}
            accept=".csv"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Button className="mt-4" onClick={onSubmit}>
          Next
        </Button>
      </div>
    </>
  );
}

type MappingProps = {
  fileData: FileData;
  setMapping: (mapping: FieldMapping) => void;
};

const DummyCreateCustomer: FieldMapping = {
  phone: "Phone",
  name: "Name",
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
};

const requiredMappingKeys = ["phone"];
function Mapping({ fileData, setMapping }: MappingProps) {
  const { toast } = useToast();

  const [currentMapping, setCurrentMapping] = useState<Partial<FieldMapping>>(
    {}
  );

  const onSubimt = () => {
    const currKeys = Object.keys(currentMapping);
    for (let field of requiredMappingKeys) {
      const value = currentMapping[field as keyof FieldMapping];
      if (!currKeys.includes(field) || value === "None") {
        toast({
          title: "Invalid Mapping",
          description: "Please fill in all mappings",
          variant: "destructive",
        });
        return;
      }
    }

    setMapping(currentMapping as FieldMapping);
  };

  return (
    <>
      <Typography variant={"h4"}>Step 2: Map Fields</Typography>
      <div className="grid mt-4 gap-y-4 grid-cols-2 child:text-center">
        <p className="text-lg font-semibold">Map To</p>
        <p className="text-lg font-semibold">Field Name in CSV</p>
        {Object.keys(DummyCreateCustomer).map((key) => (
          <React.Fragment key={key}>
            <p>
              {DummyCreateCustomer[key as keyof FieldMapping]}
              {requiredMappingKeys.includes(key) && "*"}
            </p>
            <DropdownInput
              setSelected={(selected) => {
                setCurrentMapping((prev) => {
                  const newData = { ...prev };

                  newData[key as keyof FieldMapping] = selected;
                  return newData;
                });
              }}
              selected={currentMapping[key as keyof FieldMapping] || "None"}
              options={[
                { value: "None", key: "None" },
                ...fileData.rows
                  .filter(
                    (row) =>
                      currentMapping[key as keyof FieldMapping] === row ||
                      !Object.values(currentMapping).includes(row)
                  )
                  .map((x) => ({
                    value: x,
                    key: x,
                  })),
              ]}
            />
          </React.Fragment>
        ))}
      </div>
      <div className="flex mt-4 gap-x-4 items-center justify-center">
        <Button
          variant={"outline"}
          onClick={() => setCurrentMapping({})}
          className="text-center"
        >
          Reset
        </Button>
        <Button onClick={onSubimt} className="text-center">
          Next
        </Button>
      </div>
    </>
  );
}

const ImportLeads = () => {
  return (
    <>
      <Typography variant={"h4"}>Step 3: Import Customers</Typography>
      <p className="mt-4 p-2 bg-gray-100">
        Your customers are being imported. Please do not close this page.
      </p>
    </>
  );
};

function Page() {
  const [data, setData] = useState<Data>({});
  const { loading, organisation } = useUser();

  const { toast } = useToast();

  const router = useRouter();
  // useEffect(() => {
  //   const id = setTimeout(() => {
  //     router.push("/customers");
  //   }, 5000);

  //   return () => clearTimeout(id);
  // }, [router]);

  const handleFileSubmit = (fileData: FileData) => {
    setData((prev) => ({ ...prev, fileData }));
  };

  const handleMappingSubmit = async (mapping: FieldMapping) => {
    if (!organisation || !router) {
      return;
    }

    setData((prev) => ({ ...prev, mapping }));

    const customers: TCreateCustomerDTO[] = [];

    for (let row of data.fileData?.data || []) {
      const customer: TCreateCustomerDTO = {
        organisationId: organisation.uid,
        phone: row[mapping.phone],
        name: mapping.name ? row[mapping.name] : "",
        addressLine1: mapping.addressLine1 ? row[mapping.addressLine1] : "",
        addressLine2: mapping.addressLine2 ? row[mapping.addressLine2] : "",
      };

      customers.push(customer);
    }

    try {
      await createCustomers(customers);
      toast({
        title: "Customers Imported",
        description: "Customers have been imported successfully",
      });

      router.push("/customers");
    } catch (error: any) {
      toast({
        title: "Error importing customers",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || !organisation) {
    return <Loading />;
  }

  return (
    <>
      <CardHeader>
        <Typography variant="h3">Import Customers</Typography>
      </CardHeader>
      <CardContent>
        {!data.fileData && <FileInput handleFileSubmit={handleFileSubmit} />}
        {data.fileData && !data.mapping && (
          <Mapping fileData={data.fileData} setMapping={handleMappingSubmit} />
        )}
        {data.fileData && data.mapping && <ImportLeads />}
      </CardContent>
    </>
  );
}

export default Page;

