import * as React from "react";

interface RadioProps {
  className?: string;
  type?: string;
  list?: string[];
  checked?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UiverseRadioButton({
  className,
  ...props
}: RadioProps) {
  return (
    <div className="wrapper px-5 py-2 space-x-2">
      <div className="text-gray-500">Select Language</div>
      {props.list &&
        props.list.map((item) => (
          <div key={item} className="option">
            <input
              className="input-radio"
              type="radio"
              name="btn"
              value={item}
              checked={props.checked === item}
              onChange={props.onChange}
            />
            <div className="btn">
              <span className="span">{item}</span>
            </div>
          </div>
        ))}
    </div>
  );
}
