import { Suspense } from "react";
import { Loading } from "@/components/Status";
import { LearnView } from "./LearnView";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LearnView />
    </Suspense>
  );
}
