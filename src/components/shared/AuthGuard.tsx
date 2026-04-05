"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
