import TeaTime from "./TeaTime";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tea Time",
};

const page = () => {
  return (
    <div>
      <TeaTime />
    </div>
  );
};

export default page;