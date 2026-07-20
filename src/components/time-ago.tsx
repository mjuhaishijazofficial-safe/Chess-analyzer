"use client";

import { useEffect, useState } from "react";
import { formatDate, timeAgo } from "@/lib/format";

export function TimeAgo({ unix }: { unix?: number }) {
  const [label, setLabel] = useState(() => formatDate(unix));

  useEffect(() => {
    setLabel(timeAgo(unix));
  }, [unix]);

  return <>{label}</>;
}