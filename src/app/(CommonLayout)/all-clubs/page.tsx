import AllClubs from "./AllClubs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Clubs",
};

export default function AllClubsPage() {
  return <AllClubs />;
}
