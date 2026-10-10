import { Suspense } from "react";
import EditClub from "./EditClub";

export const metadata = {
  title: "Edit Club",
};

const page = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
          Loading club details...
        </div>
      }
    >
      <EditClub />
    </Suspense>
  );
};

export default page;