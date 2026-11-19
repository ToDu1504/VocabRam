import { Suspense } from "react";
import { Loading } from "@/components/Status";
import { ReviewView } from "./ReviewView";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ReviewView />
    </Suspense>
  );
}
