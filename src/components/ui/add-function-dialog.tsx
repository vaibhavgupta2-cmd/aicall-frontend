import React, { useEffect, useState } from "react";
import { Button } from "./button";
import { Label } from "./label";
import { Input } from "./input";
import { Dialog, DialogContent } from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Switch } from "./switch";
import { toast } from "./use-toast";

interface AddFunctionDialogProps {
  initialData?: ExternalFunctionData;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ExternalFunctionData) => void;
}
export interface ExternalFunctionData {
  functionName: string;
  description: string;
  apiUrl: string;
  method: Method;
  headers: { key: string; value: string }[];
  queryParams: {
    param: string;
    type: QueryParamType;
    description: string;
    required: boolean;
  }[];
  speak_on_send: boolean;
  speak_on_receive: boolean;
}

enum QueryParamType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  FLOAT = "float",
}

enum Method {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export const AddFunctionDialog = ({
  initialData,
  isOpen,
  onClose,
  onConfirm,
}: AddFunctionDialogProps) => {
  const [step, setStep] = useState(1); // Step tracker

  const [data, setData] = useState<ExternalFunctionData>({
    functionName: initialData?.functionName || "",
    description: initialData?.description || "",
    apiUrl: initialData?.apiUrl || "",
    method: initialData?.method || Method.GET,
    headers: initialData?.headers || [],
    queryParams: initialData?.queryParams || [],
    speak_on_send: initialData?.speak_on_send || false,
    speak_on_receive: initialData?.speak_on_receive || false,
  });

  const handleSubmit = () => {
    var canSubmit: Boolean = true;
    if (data.functionName === "") {
      toast({
        title: "Error",
        description: "Function name cannot be empty",
        variant: "destructive",
      });
      canSubmit = false;
      return;
    }
    if (data.functionName.includes(" ")) {
      toast({
        title: "Error",
        description: "Function name cannot contain spaces",
        variant: "destructive",
      });
      canSubmit = false;
      return;
    }
    data.queryParams.map((param) => {
      if (param.param === "") {
        toast({
          title: "Error",
          description: "Query Parameter name cannot be empty",
          variant: "destructive",
        });
        canSubmit = false;
        return;
      }
    });
    data.headers.map((header) => {
      if (header.key === "") {
        toast({
          title: "Error",
          description: "Header key cannot be empty",
          variant: "destructive",
        });
        canSubmit = false;
        return;
      }
      if (header.value === "") {
        toast({
          title: "Error",
          description: "Header value cannot be empty",
          variant: "destructive",
        });
        canSubmit = false;
        return;
      }
    });
    if (canSubmit) {
      onConfirm(data);
      setData({
        headers: [],
        queryParams: [],
        functionName: "",
        description: "",
        apiUrl: "",
        method: Method.GET,
        speak_on_send: false,
        speak_on_receive: false,
      });
      setStep(1);
    }
  };
  useEffect(() => {
    if (initialData) {
      setData({
        functionName: initialData.functionName,
        description: initialData.description,
        apiUrl: initialData.apiUrl,
        method: initialData.method,
        headers: initialData.headers,
        queryParams: initialData.queryParams,
        speak_on_send: initialData.speak_on_send,
        speak_on_receive: initialData.speak_on_receive,
      });
    }
  }, [initialData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white p-6 rounded-lg shadow-lg dark:bg-darkBgGray max-h-[86vh] overflow-auto">
        <h2 className="text-lg font-bold mb-4">Add Function</h2>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="function-name">Function Name</Label>
              <Input
                id="function-name"
                placeholder="Enter function name"
                value={data.functionName}
                disabled={initialData != undefined}
                onChange={(e) => {
                  setData({ ...data, functionName: e.target.value });
                }}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={data.description}
                onChange={(e) => {
                  setData({ ...data, description: e.target.value });
                }}
              />
            </div>
            <div>
              <Label htmlFor="api-url">API URL</Label>
              <Input
                id="api-url"
                placeholder="Enter API URL"
                value={data.apiUrl}
                onChange={(e) => {
                  setData({ ...data, apiUrl: e.target.value });
                }}
              />
            </div>
            <div className="flex flex-col space-y-3">
              <Label htmlFor="method">Method</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="dark:bg-darkNavBarGray items-start justify-start"
                  >
                    <div className="flex flex-row justify-between w-full">
                      {data.method}
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  <DropdownMenuItem
                    onClick={() => setData({ ...data, method: Method.GET })}
                  >
                    GET
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setData({ ...data, method: Method.POST })}
                  >
                    POST
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setData({ ...data, method: Method.PUT })}
                  >
                    PUT
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setData({ ...data, method: Method.DELETE })}
                  >
                    DELETE
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex flex-col space-y-3 mt-4">
                <Label htmlFor="headers">More Options</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="speak-on-send"
                    onCheckedChange={(checked) => {
                      setData({ ...data, speak_on_send: checked });
                    }}
                    checked={data.speak_on_send}
                  />
                  <Label htmlFor="speak-on-send">Speak on Send</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="speak-on-receive"
                    onCheckedChange={(checked) => {
                      setData({ ...data, speak_on_receive: checked });
                    }}
                    checked={data.speak_on_receive}
                  />
                  <Label htmlFor="speak-on-receive">Speak on Receive</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Advanced Settings */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Headers</Label>
              <div className="space-y-2">
                {data.headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={header.key}
                      onChange={(e) => {
                        const updatedHeaders = [...data.headers];
                        updatedHeaders[index].key = e.target.value;
                        setData({ ...data, headers: updatedHeaders });
                      }}
                    />
                    <Input
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => {
                        const updatedHeaders = [...data.headers];
                        updatedHeaders[index].value = e.target.value;
                        setData({ ...data, headers: updatedHeaders });
                      }}
                    />
                    <Button
                      variant="default"
                      className=" hover:text-white text-white"
                      onClick={() => {
                        const updatedHeaders = data.headers.filter(
                          (_, i) => i !== index
                        );
                        setData({ ...data, headers: updatedHeaders });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() => {
                  setData({
                    ...data,
                    headers: [...data.headers, { key: "", value: "" }],
                  });
                }}
              >
                Add Header
              </Button>
            </div>
            <div>
              <Label>Query Params</Label>
              <div className="space-y-2">
                {data.queryParams.map((param, index) => (
                  <div key={index} className="grid grid-cols-1 gap-2">
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Param"
                        value={param.param}
                        onChange={(e) => {
                          const updatedParams = [...data.queryParams];
                          updatedParams[index].param = e.target.value;
                          setData({ ...data, queryParams: updatedParams });
                        }}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="dark:bg-darkNavBarGray items-start justify-start"
                          >
                            <div className="flex flex-row justify-between w-full">
                              {data.queryParams[index].type}
                              <ChevronsUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="">
                          <DropdownMenuItem
                            onClick={() => {
                              const updatedParams = [...data.queryParams];
                              updatedParams[index].type = QueryParamType.STRING;
                              setData({ ...data, queryParams: updatedParams });
                            }}
                          >
                            String
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const updatedParams = [...data.queryParams];
                              updatedParams[index].type = QueryParamType.NUMBER;
                              setData({ ...data, queryParams: updatedParams });
                            }}
                          >
                            Number
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              const updatedParams = [...data.queryParams];
                              updatedParams[index].type =
                                QueryParamType.BOOLEAN;
                              setData({ ...data, queryParams: updatedParams });
                            }}
                          >
                            Boolean
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              const updatedParams = [...data.queryParams];
                              updatedParams[index].type = QueryParamType.FLOAT;
                              setData({ ...data, queryParams: updatedParams });
                            }}
                          >
                            Float
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="flex items-center justify-center space-x-4 ">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between"
                            >
                              {data.queryParams[index].required
                                ? "Required"
                                : "Optional"}
                              <ChevronsUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => {
                                const updatedParams = [...data.queryParams];
                                updatedParams[index].required = true;
                                setData({
                                  ...data,
                                  queryParams: updatedParams,
                                });
                              }}
                            >
                              Required
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const updatedParams = [...data.queryParams];
                                updatedParams[index].required = false;
                                setData({
                                  ...data,
                                  queryParams: updatedParams,
                                });
                              }}
                            >
                              Optional
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Description"
                        value={param.description}
                        onChange={(e) => {
                          const updatedParams = [...data.queryParams];
                          updatedParams[index].description = e.target.value;
                          setData({ ...data, queryParams: updatedParams });
                        }}
                      />

                      <Button
                        variant="default"
                        className=" hover:text-white text-white "
                        onClick={() => {
                          const updatedParams = data.queryParams.filter(
                            (_, i) => i !== index
                          );
                          setData({ ...data, queryParams: updatedParams });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() => {
                  setData({
                    ...data,
                    queryParams: [
                      ...data.queryParams,
                      {
                        param: "",
                        type: QueryParamType.STRING,
                        description: "",
                        required: false,
                      },
                    ],
                  });
                }}
              >
                Add Query Parameter
              </Button>
            </div>
          </div>
        )}

        {/* Footer: Navigation Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          {step === 1 && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
              }}
            >
              Cancel
            </Button>
          )}
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          {step === 1 && <Button onClick={() => setStep(2)}>Next</Button>}
          {step === 2 && <Button onClick={handleSubmit}>Add Function</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFunctionDialog;
