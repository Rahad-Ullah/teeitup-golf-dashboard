import Requests from "./Requests";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Requests",
};

const page = () => {
  return (
    <div>
      <Requests />
    </div>
  );
};

export default page;