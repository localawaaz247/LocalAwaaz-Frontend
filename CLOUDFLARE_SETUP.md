# Cloudflare Media Upload Setup

This document explains how to set up Cloudflare media upload for the LocalAwaaz application.

## Overview

The application now uses Cloudflare Images to store media files (photos and videos) uploaded when reporting issues. This replaces the previous base64 encoding approach, providing better performance and scalability.

## Setup Instructions

### 1. Cloudflare Account Setup

1. Sign up for a Cloudflare account at [https://www.cloudflare.com](https://www.cloudflare.com)
2. Navigate to the **Images** product in the Cloudflare dashboard
3. Enable Cloudflare Images for your account

### 2. Get Account ID and API Token

#### Account ID:
- Go to your Cloudflare dashboard
- In the right sidebar, you'll find your **Account ID**
- Copy this ID for later use

#### API Token:
1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use the **Custom token** template
4. Configure with the following permissions:
   - **Account**: `Cloudflare Images:Edit`
   - **Zone Resources**: `All zones` (or specific zones if preferred)
5. Set the token permissions to include your account
6. Copy the generated API token

### 3. Environment Variables

Update your `.env` file with the following variables:

```env
# Replace YOUR_ACCOUNT_ID with your actual Cloudflare Account ID
VITE_CLOUDFLARE_UPLOAD_URL=https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/images/v1/direct_upload

# Replace YOUR_CLOUDFLARE_API_TOKEN with your actual API token
VITE_CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN
```

### 4. File Upload Process

The new upload process works as follows:

1. **File Selection**: User selects a file through the report issue form
2. **Validation**: File is validated for size (max 20MB) and type (PNG, JPG, JPEG, MP4)
3. **Direct Upload Request**: App requests a direct upload URL from Cloudflare
4. **File Upload**: File is uploaded directly to Cloudflare's servers
5. **Public URL**: Cloudflare returns a public URL that gets stored with the issue

## API Changes

### Backend Expectations

Your backend API should now expect media data in this format:

```json
{
  "media": {
    "url": "https://imagedelivery.net/ACCOUNT_ID/IMAGE_ID/public",
    "name": "example.jpg",
    "type": "image/jpeg",
    "size": 1024000
  }
}
```

### Previous Format (Deprecated)

```json
{
  "media": {
    "name": "example.jpg",
    "type": "image/jpeg", 
    "size": 1024000,
    "data": "base64_encoded_string"
  }
}
```

## Security Considerations

- API tokens should be kept secure and never committed to version control
- Consider using environment-specific configurations
- The API token should have minimal required permissions
- File uploads are validated on the client side, but consider server-side validation as well

## Benefits

1. **Performance**: Direct uploads to Cloudflare CDN
2. **Scalability**: Cloudflare handles storage and delivery
3. **Cost Efficiency**: Pay only for what you use
4. **Global Delivery**: Files served from edge locations
5. **Automatic Optimization**: Cloudflare optimizes images for different devices

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your API token and permissions
2. **404 Not Found**: Verify your Account ID in the upload URL
3. **File Size Errors**: Ensure files are under 20MB
4. **Unsupported File Type**: Check file type validation

### Debug Mode

To enable debug logging, check the browser console for:
- Upload request details
- Cloudflare API responses
- Error messages

## Alternative: Cloudflare R2

If you prefer using Cloudflare R2 (object storage) instead of Images:

1. Update the `uploadToCloudflareR2` function in `src/utils/cloudflareUpload.js`
2. Implement presigned URL generation in your backend
3. Update the ReportIssue component to use `uploadToCloudflareR2` instead

## Support

For issues related to:
- **Cloudflare Images**: Check [Cloudflare Images documentation](https://developers.cloudflare.com/images/)
- **Application Code**: Review the implementation in `src/utils/cloudflareUpload.js`
- **API Integration**: Ensure your backend handles the new media URL format
