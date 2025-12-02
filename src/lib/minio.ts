import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)
const readdir = promisify(fs.readdir)
const mkdir = promisify(fs.mkdir)

// Local storage directory for audio files
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'audio')

// Ensure storage directory exists
export async function ensureBucketExists() {
  try {
    await mkdir(STORAGE_DIR, { recursive: true })
    console.log(`Storage directory ${STORAGE_DIR} ensured`)
  } catch (error) {
    console.error('Error ensuring storage directory exists:', error)
    throw error
  }
}

// Upload audio file to local storage
export async function uploadAudioFile(
  fileName: string, 
  fileBuffer: Buffer, 
  metadata?: Record<string, string>
): Promise<string> {
  try {
    await ensureBucketExists()
    
    // Clean filename to avoid issues
    const cleanFileName = path.basename(fileName)
    const objectName = `${Date.now()}-${cleanFileName}`
    const filePath = path.join(STORAGE_DIR, objectName)
    
    await writeFile(filePath, fileBuffer)
    
    console.log(`File uploaded locally to ${filePath}`)
    
    // Return a local URL that can be accessed via the API route we created
    // Note: This requires the API route /api/audio/file/[filename] to be implemented
    return `/api/audio/file/${objectName}`
  } catch (error) {
    console.error('Error uploading audio file:', error)
    throw error
  }
}

// Download audio file from local storage
export async function downloadAudioFile(objectName: string): Promise<Buffer> {
  try {
    // Extract filename from URL if needed
    // Handles both full URLs and just filenames
    let fileName = objectName
    if (objectName.includes('/api/audio/file/')) {
      fileName = objectName.split('/api/audio/file/')[1]
    } else if (objectName.includes('/')) {
      fileName = path.basename(objectName)
    }
    
    const filePath = path.join(STORAGE_DIR, fileName)
    return await readFile(filePath)
  } catch (error) {
    console.error('Error downloading audio file:', error)
    throw error
  }
}

// Generate presigned URL for audio file (just return the local URL)
export async function getPresignedUrl(objectName: string, expiry: number = 3600): Promise<string> {
  try {
    let fileName = objectName
    if (objectName.includes('/api/audio/file/')) {
      fileName = objectName.split('/api/audio/file/')[1]
    } else if (objectName.includes('/')) {
      fileName = path.basename(objectName)
    }
    
    return `/api/audio/file/${fileName}`
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}

// Delete audio file from local storage
export async function deleteAudioFile(objectName: string): Promise<void> {
  try {
    let fileName = objectName
    if (objectName.includes('/api/audio/file/')) {
      fileName = objectName.split('/api/audio/file/')[1]
    } else if (objectName.includes('/')) {
      fileName = path.basename(objectName)
    }
    
    const filePath = path.join(STORAGE_DIR, fileName)
    
    // Check if file exists before trying to delete
    if (fs.existsSync(filePath)) {
        await unlink(filePath)
    }
  } catch (error) {
    console.error('Error deleting audio file:', error)
    // Don't throw on delete error to avoid blocking flows
  }
}

// List audio files
export async function listAudioFiles(prefix: string = ''): Promise<string[]> {
  try {
    await ensureBucketExists()
    const files = await readdir(STORAGE_DIR)
    return files.filter(file => file.startsWith(prefix))
  } catch (error) {
    console.error('Error listing audio files:', error)
    return []
  }
}