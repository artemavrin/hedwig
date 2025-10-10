"use server"

import { convertToMp3, getAudioDuration, splitAudioIntoChunks } from '@/lib/audio-converter'

const baseUrl = process.env.API_URL

// Функция для распознавания текста из одного аудио файла
const transcribeAudioChunk = async (audioFile: File): Promise<string | null> => {
  try {
    console.log(`Распознаем текст из части: ${audioFile.name}`)
    
    const formData = new FormData()
    formData.append("file", audioFile)
    formData.append("model", "./whisper.cpp/models/ggml-large-v3.bin")
    formData.append("language", "ru")
    formData.append("response_format", "text")
    
    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      body: formData,
    })
    
    if (!response.ok) {
      console.log("response", response)
      return null
    }
    
    return response.text()
  } catch (error) {
    console.error("Error transcribing audio chunk:", error)
    return null
  }
}

export const getTextFromAudio = async (audio: File) => {
  try {
    // Проверяем, что файл существует и не пустой
    if (!audio || audio.size === 0) {
      console.error("Аудио файл пустой или не существует")
      return null
    }
    
    console.log(`Размер аудио файла: ${(audio.size / 1024 / 1024).toFixed(2)} MB`)
    
    // Получаем длительность аудио файла
    const duration = await getAudioDuration(audio)
    const durationMinutes = duration / 60
    
    console.log(`Длительность аудио: ${durationMinutes.toFixed(2)} минут`)
    
    // Если файл больше 30 минут, разбиваем на части
    if (durationMinutes > 30) {
      console.log("Файл слишком большой, разбиваем на части по 10 минут")
      
      // Разбиваем аудио на части
      const audioChunks = await splitAudioIntoChunks(audio, 10)
      console.log(`Создано ${audioChunks.length} частей`)
      
      // Распознаем текст из каждой части
      const transcriptionResults: string[] = []
      
      for (let i = 0; i < audioChunks.length; i++) {
        const chunk = audioChunks[i]
        console.log(`Обрабатываем часть ${i + 1} из ${audioChunks.length}`)
        
        const chunkText = await transcribeAudioChunk(chunk)
        if (chunkText) {
          transcriptionResults.push(chunkText.trim())
        } else {
          console.warn(`Не удалось распознать текст из части ${i + 1}`)
        }
      }
      
      // Объединяем все результаты
      const fullText = transcriptionResults.join(' ').trim()
      console.log(`Получен полный текст длиной ${fullText.length} символов`)
      
      return fullText || null
    } else {
      // Для коротких файлов используем старую логику
      console.log("Файл короткий, обрабатываем целиком")
      const mp3File = await convertToMp3(audio)
      return await transcribeAudioChunk(mp3File)
    }
  } catch (error) {
    console.error("Error processing audio:", error)
    return null
  }
}
