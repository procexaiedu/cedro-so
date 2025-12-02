import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

// Local storage directory for audio files (same as in minio-fallback.ts)
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'audio')

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    
    if (!filename) {
      return new NextResponse('Filename is required', { status: 400 })
    }

    // Security check to prevent directory traversal
    const safeFilename = path.basename(filename)
    const filePath = path.join(STORAGE_DIR, safeFilename)

    // Check if file exists
    try {
      await stat(filePath)
    } catch (error) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on extension
    const ext = path.extname(safeFilename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (ext === '.mp3') contentType = 'audio/mpeg'
    else if (ext === '.wav') contentType = 'audio/wav'
    else if (ext === '.webm') contentType = 'audio/webm'
    else if (ext === '.m4a') contentType = 'audio/mp4'
    else if (ext === '.ogg') contentType = 'audio/ogg'

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving audio file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}