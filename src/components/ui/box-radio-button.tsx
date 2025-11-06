import * as React from "react";

interface RadioProps {
  className?: string;
  list: string[];
  checked: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BoxRadioButton({ className, ...props }: RadioProps) {
  return (
    <div className="flex flex-wrap bg-gray-100 dark:bg-darkBgGray rounded-xl  items-center justify-center px-5 py-2">
      {props.list &&
        props.list.map((item) => (
          <div
            key={item}
            className={
              `${item === props.checked ? "bg-black dark:bg-white " : ""}` +
              "rounded-lg"
            }
          >
            <button
              onClick={() => {
                props.onChange({ target: { value: item } } as any);
              }}
              className={
                "px-2 py-1" +
                ` ${
                  item === props.checked
                    ? "text-white dark:text-black"
                    : "text-black dark:text-white"
                } `
              }
            >
              {item}
            </button>
          </div>
        ))}
    </div>
  );
}
