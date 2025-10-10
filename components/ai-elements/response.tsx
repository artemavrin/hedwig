"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";


type ResponseProps = ComponentProps<typeof Streamdown>;

// Компонент для обработки тега <reasoning>
const ReasoningWrapper = ({ children }: { children: React.ReactNode }) => (
  <Reasoning
    className="w-full"

  >
    <ReasoningTrigger />
    <ReasoningContent>{children as string}</ReasoningContent>
  </Reasoning>
);

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={{
        think: ReasoningWrapper,
        reasoning: ReasoningWrapper,
      } as any}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
