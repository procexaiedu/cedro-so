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
    // Don't throw here to allow fallback or retry logic in caller if needed, 
    // but for now we assume MinIO must be available if configured.
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
    
    // Use timestamp to ensure uniqueness
    const objectName = `audio/${Date.now()}-${fileName}`
    
    await minioClient.putObject(
      BUCKET_NAME, 
      objectName, 
      fileBuffer, 
      fileBuffer.length,
      {
        'Content-Type': 'audio/webm', // Adjust if you support multiple types dynamically
        ...metadata
      }
    )
    
    // Construct public URL
    // If MINIO_PUBLIC_URL is set (e.g. behind Nginx/Traefik), use it. 
    // Otherwise fall back to constructing from endpoint/port.
    const publicUrlBase = process.env.MINIO_PUBLIC_URL 
      ? process.env.MINIO_PUBLIC_URL 
      : `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`

    return `${publicUrlBase}/${BUCKET_NAME}/${objectName}`
  } catch (error) {
    console.error('Error uploading audio file to MinIO:', error)
    throw error
  }
}

// Download audio file from MinIO
export async function downloadAudioFile(objectName: string): Promise<Buffer> {
  try {
    // Clean object name if full URL is passed
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
    console.error('Error downloading audio file from MinIO:', error)
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
    console.error('Error deleting audio file from MinIO:', error)
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
    console.error('Error listing audio files from MinIO:', error)
    throw error
  }
}