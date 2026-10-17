import { Fragment, useMemo } from "react";
import { highlightSegments } from "@/lib/rag";

export default function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const segments = useMemo(() => highlightSegments(text, terms), [text, terms]);
  return (
    <>
      {segments.map((s, i) =>
        s.match ? (
          <mark key={i} className="hl">
            {s.text}
          </mark>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
    </>
  );
}
