"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BookOpenIcon, ChevronDownIcon, CopyIcon, CheckIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext, useState } from "react";
import { Response } from "./response";

type CollapsibleTextContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const CollapsibleTextContext = createContext<CollapsibleTextContextValue | null>(null);

const useCollapsibleText = () => {
  const context = useContext(CollapsibleTextContext);
  if (!context) {
    throw new Error("CollapsibleText components must be used within CollapsibleText");
  }
  return context;
};

export type CollapsibleTextProps = ComponentProps<typeof Collapsible> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const CollapsibleText = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: CollapsibleTextProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
    };

    return (
      <CollapsibleTextContext.Provider
        value={{ isOpen, setIsOpen }}
      >
        <Collapsible
          className={cn("not-prose mb-4", className)}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </CollapsibleTextContext.Provider>
    );
  }
);

export type CollapsibleTextTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  text?: string;
};

export const CollapsibleTextTrigger = memo(
  ({ className, children, text, ...props }: CollapsibleTextTriggerProps) => {
    const { isOpen } = useCollapsibleText();
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (text) {
        try {
          await navigator.clipboard.writeText(text);
          setIsCopied(true);
          // Возвращаем иконку копирования через 3 секунды
          setTimeout(() => {
            setIsCopied(false);
          }, 3000);
        } catch (error) {
          console.error('Failed to copy text:', error);
        }
      }
    };

    return (
      <div className="flex w-full items-center justify-between">
        <CollapsibleTrigger
          className={cn(
            "flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground",
            className
          )}
          {...props}
        >
          {children ?? (
            <>
              <BookOpenIcon className="size-4" />
              <span>Исходный текст файла</span>
              <ChevronDownIcon
                className={cn(
                  "size-4 transition-transform",
                  isOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </>
          )}
        </CollapsibleTrigger>
        {text && (
          <button
            onClick={handleCopy}
            className={cn(
              "p-1 rounded hover:bg-muted transition-colors",
              isCopied 
                ? "text-green-600 hover:text-green-700" 
                : "text-muted-foreground hover:text-foreground"
            )}
            title={isCopied ? "Текст скопирован!" : "Копировать текст"}
          >
            {isCopied ? (
              <CheckIcon className="size-3" />
            ) : (
              <CopyIcon className="size-3" />
            )}
          </button>
        )}
      </div>
    );
  }
);

export type CollapsibleTextContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

export const CollapsibleTextContent = memo(
  ({ className, children, ...props }: CollapsibleTextContentProps) => (
    <CollapsibleContent
      className={cn(
        "mt-4 text-sm",
        "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      {...props}
    >
      <Response className="grid gap-2">{children}</Response>
    </CollapsibleContent>
  )
);

CollapsibleText.displayName = "CollapsibleText";
CollapsibleTextTrigger.displayName = "CollapsibleTextTrigger";
CollapsibleTextContent.displayName = "CollapsibleTextContent";
