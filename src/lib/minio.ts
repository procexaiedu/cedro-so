import { Client } from 'minio'

// MinIO client configuration
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || ''
})

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'cedro-audio'

// Ensure bucket exists
export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`Bucket ${BUCKET_NAME} created successfully`)
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error)
    throw error
  }
}

// Upload audio file to MinIO
export async function uploadAudioFile(
  fileName: string, 
  fileBuffer: Buffer, 
  metadata?: Record<string, string>
): Promise<string> {
  try {
    await ensureBucketExists()
    
    const objectName = `audio/${Date.now()}-${fileName}`
    
    await minioClient.putObject(
      BUCKET_NAME, 
      objectName, 
      fileBuffer, 
      fileBuffer.length,
      {
        'Content-Type': 'audio/webm',
        ...metadata
      }
    )
    
    // Return the object URL
    return `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${BUCKET_NAME}/${objectName}`
  } catch (error) {
    console.error('Error uploading audio file:', error)
    throw error
  }
}

// Download audio file from MinIO
export async function downloadAudioFile(objectName: string): Promise<Buffer> {
  try {
    // Extract object name from URL if full URL is provided
    const cleanObjectName = objectName.includes(BUCKET_NAME) 
      ? objectName.split(`${BUCKET_NAME}/`)[1]
      : objectName
    
    const stream = await minioClient.getObject(BUCKET_NAME, cleanObjectName)
    
    const chunks: Buffer[] = []
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('Error downloading audio file:', error)
    throw error
  }
}

// Generate presigned URL for audio file
export async function getPresignedUrl(objectName: string, expiry: number = 3600): Promise<string> {
  try {
    const cleanObjectName = objectName.includes(BUCKET_NAME) 
      ? objectName.split(`${BUCKET_NAME}/`)[1]
      : objectName
    
    return await minioClient.presignedGetObject(BUCKET_NAME, cleanObjectName, expiry)
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}

// Delete audio file from MinIO
export async function deleteAudioFile(objectName: string): Promise<void> {
  try {
    const cleanObjectName = objectName.includes(BUCKET_NAME) 
      ? objectName.split(`${BUCKET_NAME}/`)[1]
      : objectName
    
    await minioClient.removeObject(BUCKET_NAME, cleanObjectName)
  } catch (error) {
    console.error('Error deleting audio file:', error)
    throw error
  }
}

// List audio files
export async function listAudioFiles(prefix: string = 'audio/'): Promise<string[]> {
  try {
    const objectsList: string[] = []
    const stream = minioClient.listObjects(BUCKET_NAME, prefix, true)
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          objectsList.push(obj.name)
        }
      })
      stream.on('end', () => resolve(objectsList))
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('Error listing audio files:', error)
    throw error
  }
}