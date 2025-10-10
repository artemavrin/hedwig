"use client";

import { useFileUpload } from "@/hooks/use-file-upload";
import { DragEvent, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTextFromAudio } from "@/actions/api";


const statuses = {
  idle: {
    title: "Перетащите файлы сюда",
    description: "или нажмите на кнопку ниже",
  },
  hover: {
    title: "Да, бросьте файлы сюда",
    description: "попробую их обработать",
  },
  working: {
    title: "Обработка файла",
    description: "пожалуйста, подождите",
  },
  completed: {
    title: "Файлы обработаны",
    description: "нажмите на кнопку ниже",
  },
  error: {
    title: "Ошибка",
    description: "пожалуйста, попробуйте снова",
  },
}

export const FileUploader = ({ updateText }: { updateText: (text: string) => void }) => {

  const maxSizeMB = 500
  const maxSize = maxSizeMB * 1024 * 1024 // 500MB default

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
      
    },
  ] = useFileUpload({
    accept: "audio/*, video/*",
    maxSize
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<"idle" | "hover" | "working" | "completed" | "error">("idle")

  const onDragEnter = (e: DragEvent<HTMLElement>) => {
    setStatus("hover")
    handleDragEnter(e)
  }
  const onDragLeave = (e: DragEvent<HTMLElement>) => {
    setStatus("idle")
    handleDragLeave(e)
  }

  const transcript = async () => {
    const text = await getTextFromAudio(files[0].file as File)
    if (text) {
      updateText(text)
    } else {
      toast.error("Ошибка при обработке файла", {
        position: "top-center"
      })
      setStatus("idle")
    }
  }

  useEffect(() => {
    if (!videoRef.current) return
    if (files.length > 0) {
      setStatus("working")
      transcript()
    }
    if (files.length === 0) {
      setStatus("idle")
    }
  }, [files])

  useEffect(() => {
    if (errors.length > 0) {
      toast.error(errors[0], {
        position: "top-center"
      })
    }
  }, [errors])

  useEffect(() => {
    if (!videoRef.current) return

    if (status === "hover") {
      videoRef.current.playbackRate = 1
      videoRef.current.loop = false
      videoRef.current.play()
    }
    if (status === "idle") {
      videoRef.current.loop = false
      videoRef.current.currentTime = 0
      videoRef.current.pause()
    }

    if (status === "working") {
      videoRef.current.playbackRate = 1
      videoRef.current.loop = true
      videoRef.current.play()
    }

  }, [status])



  return <div
    role="button"
    onDragEnter={onDragEnter}
    onDragLeave={onDragLeave}
    onDragOver={handleDragOver}
    onDrop={handleDrop}
    data-dragging={isDragging || undefined}
    className="flex flex-col gap-2 items-center justify-center h-full"
  >

    <video src={status === "working" ? "/owl-working.mov" : "/owl-thumbsup.mov"} muted className="pointer-events-none" width={200} height={200} ref={videoRef} />
    <div className="flex flex-col gap-0 items-center justify-center pointer-events-none">
      <h2 className="text-2xl font-bold leading-tight">
        {statuses[status].title}
      </h2>
      <p className="text-sm">
        {statuses[status].description}
      </p>
    </div>
    <input
      {...getInputProps()}
      className="sr-only pointer-events-none"
      aria-label="Upload file"
    />
    <Button onClick={openFileDialog} className={cn("opacity-0 transition-opacity pointer-events-none", status === "idle" && "opacity-100 pointer-events-auto")}>Выбрать файл</Button>
  </div>;
};