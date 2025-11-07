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
    
    const objectName = `${Date.now()}-${fileName}`
    const filePath = path.join(STORAGE_DIR, objectName)
    
    await writeFile(filePath, fileBuffer)
    
    // Return a local URL
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
    const fileName = objectName.includes('/') 
      ? objectName.split('/').pop() || objectName
      : objectName
    
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
    const fileName = objectName.includes('/') 
      ? objectName.split('/').pop() || objectName
      : objectName
    
    return `/api/audio/file/${fileName}`
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}

// Delete audio file from local storage
export async function deleteAudioFile(objectName: string): Promise<void> {
  try {
    const fileName = objectName.includes('/') 
      ? objectName.split('/').pop() || objectName
      : objectName
    
    const filePath = path.join(STORAGE_DIR, fileName)
    await unlink(filePath)
  } catch (error) {
    console.error('Error deleting audio file:', error)
    throw error
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
    throw error
  }
}