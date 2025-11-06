import React from "react";
//@ts-ignore
import LoaderImg from "@/../public/loadinggif.gif";
import Image from "next/image";

function Loading({ className }: { className?: string }) {
  return (
    <div>
      <Image
        src={LoaderImg}
        className="m-auto"
        alt="my gif"
        width={110}
        height={110}
      />
    </div>
  );
}

export default Loading;
