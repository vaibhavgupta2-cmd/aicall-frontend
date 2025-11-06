"use client";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Typography from "@/components/ui/typography";
import useUser from "@/hooks/useUser";
import { TCreateCustomerDTO } from "@/types";
import Link from "next/link";
import React, { useState } from "react";

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

export type TCustomerData = Omit<TCreateCustomerDTO, "organisationId">;

function CustomerInput({
  onSubmit,
  canSubmit,
  initialData,
  actionName,
}: {
  onSubmit: (data: TCustomerData) => void;
  canSubmit?: boolean;
  initialData?: TCustomerData;
  actionName: string;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [addressLine1, setAddressLine1] = useState(
    initialData?.addressLine1 || ""
  );
  const [addressLine2, setAddressLine2] = useState(
    initialData?.addressLine2 || ""
  );

  const { organisation, loading } = useUser();

  if (loading || !organisation) {
    return <Loading />;
  }

  const handleSubmit = async () => {
    onSubmit({
      name,
      phone,
      addressLine1,
      addressLine2,
    });
  };

  return (
    <React.Fragment>
      <CardHeader>
        <Typography variant={"h3"}>{actionName} Customer</Typography>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-3 gap-y-4 gap-x-8">
          <TextInput
            label="Phone"
            id="phone"
            placeholder="+91-9876543210"
            value={phone}
            setValue={setPhone}
          />

          <TextInput
            label="Name"
            id="name"
            placeholder="John Doe"
            value={name}
            setValue={setName}
          />

          <TextInput
            label="Address Line 1"
            id="addressLine1"
            placeholder="123 Main St"
            value={addressLine1}
            setValue={setAddressLine1}
          />

          <TextInput
            label="Address Line 2"
            id="addressLine2"
            placeholder="Apt 123"
            value={addressLine2}
            setValue={setAddressLine2}
          />
        </div>

        <div className="flex items-center justify-center mt-4 lg:mt-6 gap-x-4">
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            {actionName}
          </Button>
          <Button variant={"outline"} asChild>
            <Link href="/customers">Cancel</Link>
          </Button>
        </div>
      </CardContent>
    </React.Fragment>
  );
}

export default CustomerInput;

