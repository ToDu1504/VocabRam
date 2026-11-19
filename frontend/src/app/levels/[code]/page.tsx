import { Suspense } from "react";
import { Loading } from "@/components/Status";
import { UnitsView } from "./UnitsView";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <UnitsView />
    </Suspense>
  );
}
