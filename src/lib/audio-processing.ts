import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

// Audio processing constants
export const CHUNK_DURATION_MINUTES = 20
export const CHUNK_DURATION_SECONDS = CHUNK_DURATION_MINUTES * 60
export const SAMPLE_RATE = 44100

export interface AudioChunk {
  buffer: Buffer
  startTime: number
  endTime: number
  chunkIndex: number
  totalChunks: number
}

// Split audio into chunks
export async function splitAudioIntoChunks(
  audioBuffer: Buffer,
  chunkDurationSeconds: number = 30,
  originalFormat: string = 'webm'
): Promise<Buffer[]> {
  const tempDir = tmpdir()
  const inputFile = join(tempDir, `input_${Date.now()}.${originalFormat}`)
  
  try {
    await writeFile(inputFile, audioBuffer)

    // Get total duration using ffprobe
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format "${inputFile}"`
    )
    
    const metadata = JSON.parse(stdout)
    const totalDuration = parseFloat(metadata.format.duration || '0')
    
    if (totalDuration === 0) {
      throw new Error('Could not determine audio duration')
    }

    const chunks: Buffer[] = []
    const numChunks = Math.ceil(totalDuration / chunkDurationSeconds)

    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDurationSeconds
      const outputFile = join(tempDir, `chunk_${i}_${Date.now()}.mp3`)

      try {
        await execAsync(
          `ffmpeg -i "${inputFile}" -ss ${startTime} -t ${chunkDurationSeconds} -acodec mp3 -y "${outputFile}"`
        )

        const chunkBuffer = await readFile(outputFile)
        chunks.push(chunkBuffer)

        await unlink(outputFile)
      } catch (chunkError) {
        console.error(`Error processing chunk ${i}:`, chunkError)
      }
    }

    return chunks
  } catch (error) {
    console.error('Error splitting audio into chunks:', error)
    throw new Error('Failed to split audio into chunks')
  } finally {
    try {
      await unlink(inputFile)
    } catch (cleanupError) {
      console.warn('Failed to clean up input file:', cleanupError)
    }
  }
}

// Convert audio to format suitable for Whisper
export async function convertAudioForWhisper(audioBuffer: Buffer, originalFormat: string = 'webm'): Promise<Buffer> {
  const tempDir = tmpdir()
  const inputFile = join(tempDir, `input_${Date.now()}.${originalFormat}`)
  const outputFile = join(tempDir, `output_${Date.now()}.mp3`)

  try {
    // Write input file
    await writeFile(inputFile, audioBuffer)

    // Convert to MP3 format suitable for Whisper
    await execAsync(
      `ffmpeg -i "${inputFile}" -acodec mp3 -ar ${SAMPLE_RATE} -ac 1 "${outputFile}"`
    )

    // Read converted file
    const convertedBuffer = await readFile(outputFile)
    return convertedBuffer
  } catch (error) {
    console.error('Error converting audio:', error)
    throw new Error('Failed to convert audio for Whisper')
  } finally {
    // Clean up files
    try {
      await unlink(inputFile)
      await unlink(outputFile)
    } catch (cleanupError) {
      console.warn('Failed to clean up files:', cleanupError)
    }
  }
}

// Validate audio file
export function validateAudioBuffer(buffer: Buffer): boolean {
  // Basic validation - check if buffer has content and starts with valid audio headers
  if (!buffer || buffer.length === 0) {
    return false
  }

  // Check for common audio file signatures
  const header = buffer.subarray(0, 12).toString('hex')
  
  // WebM signature
  if (header.startsWith('1a45dfa3')) {
    return true
  }
  
  // MP3 signature
  if (header.startsWith('494433') || header.startsWith('fffb') || header.startsWith('fff3')) {
    return true
  }
  
  // WAV signature
  if (header.startsWith('52494646')) {
    return true
  }
  
  // M4A/MP4 signature (ftyp)
  if (header.includes('66747970')) {
    return true
  }
  
  // OGG signature
  if (header.startsWith('4f676753')) {
    return true
  }
  
  return false
}

// Get audio metadata
export async function getAudioMetadata(audioBuffer: Buffer, originalFormat: string = 'webm'): Promise<{
  duration: number
  sampleRate: number
  channels: number
  bitrate: number
}> {
  const tempDir = tmpdir()
  const inputFile = join(tempDir, `input_${Date.now()}.${originalFormat}`)

  try {
    await writeFile(inputFile, audioBuffer)

    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${inputFile}"`
    )

    const metadata = JSON.parse(stdout)
    const audioStream = metadata.streams.find((stream: any) => stream.codec_type === 'audio')

    return {
      duration: parseFloat(metadata.format.duration || '0'),
      sampleRate: parseInt(audioStream?.sample_rate || '0'),
      channels: parseInt(audioStream?.channels || '0'),
      bitrate: parseInt(metadata.format.bit_rate || '0')
    }
  } catch (error) {
    console.error('Error getting audio metadata:', error)
    throw new Error('Failed to get audio metadata')
  } finally {
    try {
      await unlink(inputFile)
    } catch (cleanupError) {
      console.warn('Failed to clean up metadata file:', cleanupError)
    }
  }
}