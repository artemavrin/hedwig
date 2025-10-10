import ffmpeg from 'fluent-ffmpeg'
import { writeFileSync, unlinkSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

// Получаем длительность аудио файла в секундах
export const getAudioDuration = async (audioFile: File): Promise<number> => {
  const tempDir = tmpdir()
  const inputId = randomUUID()
  const inputPath = join(tempDir, `${inputId}.${audioFile.name.split('.').pop()}`)
  
  try {
    // Записываем входной файл во временную директорию
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    writeFileSync(inputPath, buffer)
    
    // Получаем длительность с помощью ffprobe
    return new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        // Очищаем временный файл сразу после получения метаданных
        try {
          if (existsSync(inputPath)) {
            unlinkSync(inputPath)
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup temporary file:', cleanupError)
        }
        
        if (err) {
          reject(err)
          return
        }
        
        const duration = metadata.format.duration || 0
        resolve(duration)
      })
    })
  } catch (error) {
    // Дополнительная очистка в случае ошибки
    try {
      if (existsSync(inputPath)) {
        unlinkSync(inputPath)
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError)
    }
    throw error
  }
}

// Разбиваем аудио на части по 10 минут
export const splitAudioIntoChunks = async (audioFile: File, chunkDurationMinutes: number = 10): Promise<File[]> => {
  const tempDir = tmpdir()
  const inputId = randomUUID()
  const inputPath = join(tempDir, `${inputId}.${audioFile.name.split('.').pop()}`)
  
  try {
    // Записываем входной файл во временную директорию
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    writeFileSync(inputPath, buffer)
    
    // Получаем длительность файла напрямую, чтобы избежать проблем с временными файлами
    const totalDuration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err)
          return
        }
        
        const duration = metadata.format.duration || 0
        resolve(duration)
      })
    })
    
    const chunkDurationSeconds = chunkDurationMinutes * 60
    
    // Если файл короче чем один чанк, возвращаем его как есть
    if (totalDuration <= chunkDurationSeconds) {
      const mp3File = await convertToMp3(audioFile)
      return [mp3File]
    }
    
    // Вычисляем количество чанков
    const numberOfChunks = Math.ceil(totalDuration / chunkDurationSeconds)
    const chunks: File[] = []
    
    console.log(`Разбиваем аудио на ${numberOfChunks} частей по ${chunkDurationMinutes} минут`)
    
    // Создаем чанки
    for (let i = 0; i < numberOfChunks; i++) {
      const startTime = i * chunkDurationSeconds
      const outputId = randomUUID()
      const outputPath = join(tempDir, `${outputId}.mp3`)
      
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(inputPath)
            .seekInput(startTime)
            .duration(chunkDurationSeconds)
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run()
        })
        
        // Проверяем, что выходной файл создан
        if (!existsSync(outputPath)) {
          throw new Error(`Failed to create chunk ${i + 1}`)
        }
        
        // Читаем результат
        const chunkBuffer = readFileSync(outputPath)
        
        // Создаем новый File объект
        const chunkBlob = new Blob([chunkBuffer], { type: 'audio/mp3' })
        const chunkFile = new File([chunkBlob], `${audioFile.name.replace(/\.[^/.]+$/, '')}_part_${i + 1}.mp3`, {
          type: 'audio/mp3'
        })
        
        chunks.push(chunkFile)
        
        // Очищаем временный файл чанка
        unlinkSync(outputPath)
      } catch (error) {
        console.error(`Error creating chunk ${i + 1}:`, error)
        throw error
      }
    }
    
    return chunks
  } finally {
    // Очищаем временный файл
    try {
      if (existsSync(inputPath)) {
        unlinkSync(inputPath)
      }
    } catch (error) {
      console.warn('Failed to cleanup temporary file:', error)
    }
  }
}

export const convertToMp3 = async (audioFile: File): Promise<File> => {
  // Если файл уже в формате MP3, возвращаем его как есть
  if (audioFile.type === 'audio/mp3' || audioFile.name.toLowerCase().endsWith('.mp3')) {
    return audioFile
  }

  const tempDir = tmpdir()
  const inputId = randomUUID()
  const outputId = randomUUID()
  const inputPath = join(tempDir, `${inputId}.${audioFile.name.split('.').pop()}`)
  const outputPath = join(tempDir, `${outputId}.mp3`)
  
  try {
    // Записываем входной файл во временную директорию
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    writeFileSync(inputPath, buffer)
    
    // Выполняем конвертацию в MP3 с помощью fluent-ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run()
    })
    
    // Проверяем, что выходной файл создан
    if (!existsSync(outputPath)) {
      throw new Error('Failed to create MP3 file')
    }
    
    // Читаем результат
    const mp3Buffer = readFileSync(outputPath)
    
    // Создаем новый File объект
    const mp3Blob = new Blob([mp3Buffer], { type: 'audio/mp3' })
    const mp3File = new File([mp3Blob], audioFile.name.replace(/\.[^/.]+$/, '.mp3'), {
      type: 'audio/mp3'
    })
    
    return mp3File
  } finally {
    // Очищаем временные файлы
    try {
      if (existsSync(inputPath)) {
        unlinkSync(inputPath)
      }
      if (existsSync(outputPath)) {
        unlinkSync(outputPath)
      }
    } catch (error) {
      console.warn('Failed to cleanup temporary files:', error)
    }
  }
}
