import AddTeaTime from "./AddTeaTime";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Tea Time",
};

const page = () => {
  return (
    <div>
      <AddTeaTime />
    </div>
  );
};

export default page;