// src/app/api/recording-proxy/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Recording URL is required' },
        { status: 400 }
      );
    }

    // Get your Exotel API credentials from environment variables
    const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY;
    const EXOTEL_TOKEN = process.env.EXOTEL_API_TOKEN;

    if (!EXOTEL_API_KEY || !EXOTEL_TOKEN) {
      return NextResponse.json(
        { error: 'Exotel API credentials not configured' },
        { status: 500 }
      );
    }

    // Create Basic Auth header
    const credentials = Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_TOKEN}`).toString('base64');
    
    // Prepare headers for the request to Exotel
    const headers: HeadersInit = {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'audio/*',
    };

    // Forward range header if present (for seeking support)
    const range = request.headers.get('range');
    if (range) {
      headers['Range'] = range;
    }

    // Fetch the recording from Exotel with authentication
    const response = await fetch(decodeURIComponent(url), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recording: ${response.status} ${response.statusText}`);
    }

    // Create response headers
    const responseHeaders = new Headers();
    
    // Copy relevant headers from the original response
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
    ];
    
    headersToForward.forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        responseHeaders.set(headerName, headerValue);
      }
    });

    // Set additional headers for audio streaming
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    // Return the streaming response
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error('Error proxying recording:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recording', details: error.message },
      { status: 500 }
    );
  }
}