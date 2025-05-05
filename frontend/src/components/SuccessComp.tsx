import React from "react";

interface Props {
  msg: string;
}

const SuccessComp: React.FC<Props> = ({ msg }) => {
  return <div className="text-gray-400 text-sm">{msg}</div>;
};

export default SuccessComp;
