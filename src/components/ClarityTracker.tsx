"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityTracker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    Clarity.init("z26y4rhn8y");
  }, []);

  return null;
}
