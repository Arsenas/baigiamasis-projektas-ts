import React from "react";

interface Props {
  error: string;
}

const ErrorComp: React.FC<Props> = ({ error }) => {
  return <div className="text-gray-400 text-sm">{error}</div>;
};

export default ErrorComp;
