'use client';

import {
  PromptInput,
  
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { CopyIcon, Loader, RefreshCcwIcon, Trash2Icon } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { useStickToBottomContext } from 'use-stick-to-bottom';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { FileUploader } from '@/components/file-uploader';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Action } from '@/components/ai-elements/actions';
import { Actions } from '@/components/ai-elements/actions';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { Button } from '@/components/ui/button';
import { CollapsibleText, CollapsibleTextContent, CollapsibleTextTrigger } from '@/components/ai-elements/collapsible-text';

const models = [
  { id: 'gpt-oss:20b', name: 'gpt-oss 20b', description: 'Базовая модель' },
  { id: 'gpt-oss:120b', name: 'gpt-oss 120b', description: 'Продвинутая модель' },
];

const suggestions = [
  {
    title: 'Сделай краткое изложение',
    suggestion: 'Перескажи кратко с выделением ключевых моментов'
  },
  {
    title: 'Выдели задачи',
    suggestion: 'Выдели задачи, исполнителей и сроки'
  }
];

const InputDemo = () => {
  const [text, setText] = useState<string>('');
  const [model, setModel] = useState<string>(models[0].id);
  
  const [firstMessage, setFirstMessage] = useState<string>("");

  const { messages, status, sendMessage, setMessages, regenerate } = useChat();

  useEffect(() => {
    if (firstMessage) {
      setMessages([
        {
          id: "1",
          role: "system",
          parts: [
            { type: "text", text: firstMessage }
          ]
        }
      ])
    }
  }, [firstMessage])

  // Компонент для автоматического скролла
  const AutoScroll = () => {
    const { scrollToBottom } = useStickToBottomContext();
    
    useEffect(() => {
      if (messages.length > 0) {
        // Небольшая задержка для корректного скролла
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }, [messages, scrollToBottom]);
    
    return null;
  };

  const handleSubmit = (message: PromptInputMessage) => {

    if (!message.text) {
      return;
    }
    sendMessage({ text: message.text }, { body: { model: model } });

    setText('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion }, { body: { model: model } });

  };

  const handleDeleteMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      // Удаляем сообщение и все последующие
      const newMessages = messages.slice(0, messageIndex);
      setMessages(newMessages);
    }
  };

  if (messages.length === 0) {
    return <FileUploader updateText={setFirstMessage} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            <AutoScroll />
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      // Для системного сообщения (исходный текст файла) используем CollapsibleText
                      if (message.role === 'system') {
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <CollapsibleText defaultOpen={false}>
                              <CollapsibleTextTrigger text={part.text} />
                              <CollapsibleTextContent>
                                {part.text}
                              </CollapsibleTextContent>
                            </CollapsibleText>
                          </Fragment>
                        );
                      }
                      
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role} className="flex items-center">
                            {message.role === 'user' && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  variant="ghost"
                                  size="icon"
                                  title="Удалить сообщение и все последующие"
                                >
                                  <Trash2Icon className="size-3" />
                                </Button>
                              </div>
                            )}
                            <MessageContent>
                              <Response>
                                {part.text}
                              </Response>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' && i === messages.length - 1 && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                        </Fragment>
                      );
                    // case 'reasoning':
                    //   return (
                    //     <Reasoning
                    //       key={`${message.id}-${i}`}
                    //       className="w-full"
                    //       isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                    //     >
                    //       <ReasoningTrigger />
                    //       <ReasoningContent>{part.text}</ReasoningContent>
                    //     </Reasoning>
                    //   );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader className="size-4 animate-spin" />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <Suggestions className="animate-fade-up animate-once">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion.title}
              onClick={handleSuggestionClick}
              suggestion={suggestion.suggestion}
            >
              {suggestion.title}
            </Suggestion>
          ))}
        </Suggestions>
        <PromptInput onSubmit={handleSubmit} className="mt-4 animate-fade-up animate-once delay-100" globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              value={text}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              {/* <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                onClick={() => setUseWebSearch(!useWebSearch)}
                variant={useWebSearch ? 'default' : 'ghost'}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton> */}
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue >{model}</PromptInputModelSelectValue>
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col items-start">
                        <div className="text-sm font-medium">
                          {model.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {model.description}
                        </div>
                      </div>
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !status} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default InputDemo;