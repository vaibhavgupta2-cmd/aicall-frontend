"use client";

import Loading from "@/components/Loading";
import { Header } from "@/components/Typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useUser from "@/hooks/useUser";
import { getCustomers } from "@/lib/api/customers";
import { TCustomer, TFetched } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoAddCircleOutline, IoCloudUploadOutline } from "react-icons/io5";

const CustomerTable = ({ customers }: { customers: TFetched<TCustomer[]> }) => {
  if (customers.loading) {
    return <Loading />;
  }

  if (customers.error) {
    return <div>{customers.error}</div>;
  }

  if (!customers.data || customers.data.length <= 0) {
    return <div>No customers found</div>;
  }

  return (
    // <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ">
    //   {customers.data.map((customer) => (
    //     <Link
    //       href={`/customers/${customer.uid}/edit`}
    //     >
    //       <Card className="w-full hover:shadow-md transition-shadow">
    //         <CardHeader className="pb-1 font-medium">
    //           {customer.phone}
    //         </CardHeader>
    //         <CardContent>
    //           <p className="text-sm">{customer.name}</p>
    //           <p className="text-sm">{customer.addressLine1}</p>
    //         </CardContent>


    //       </Card></Link>))}

    // </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Phone</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.data.map((customer) => (
          <TableRow key={customer.uid}>
            <TableCell>{customer.phone}</TableCell>
            <TableCell>{customer.name}</TableCell>
            <TableCell>{customer.addressLine1}</TableCell>
            <TableCell>
              <Link
                className="underline text-blue-500"
                href={`/customers/${customer.uid}/edit`}
              >
                Edit
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

function Page() {
  const { organisation } = useUser();

  const [customers, setCustomers] = useState<TFetched<TCustomer[]>>({
    loading: true,
    data: undefined,
  });

  useEffect(() => {
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

    fetchCustomers();
  }, [organisation]);

  return (
    <div>
      <div className="my-5 flex items-center">
        <Header className="text-2xl ">Customer Database</Header>
        <Link
          href="/customers/add"
          className="w-6 h-6 ml-4 child:w-full child:h-full"
        >
          <IoAddCircleOutline />
        </Link>

        <Link
          href="/customers/upload"
          className="w-6 h-6 ml-4 child:w-full child:h-full"
        >
          <IoCloudUploadOutline />
        </Link>
      </div>
      <CustomerTable customers={customers} />
    </div>
  );
}

export default Page;

