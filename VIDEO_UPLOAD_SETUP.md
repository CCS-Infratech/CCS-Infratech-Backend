# Walkthrough video upload — setup

The walkthrough form's video field now has three tabs:

- **Video Library** — pick a video already uploaded to S3 (the default tab)
- **Upload New** — drag or choose a file; it uploads straight to S3
- **Paste URL** — the original behaviour, for a video hosted elsewhere

Uploads go from the browser to S3 using a short-lived pre-signed URL, so
the file never passes through the API server.

## How it works

1. Admin picks a file → admin calls `POST /api/v1/videos/presign`.
2. The API checks the type and size, then returns a signed `PUT` URL that is
   valid for 15 minutes.
3. The browser `PUT`s the file straight to S3, with a progress bar.
4. The public S3 URL is saved in the walkthrough's `videoUrl` field — the
   same field as before, so the website needs no change.

Objects land under `walkthroughs/videos/` in the bucket. The Video Library
tab is just a listing of that prefix (`GET /api/v1/videos`), so anything
uploaded here is reusable on any other walkthrough.

Limits: 1 GB per file. Allowed types: MP4, WebM, OGG, MOV, M4V, AVI, MKV.
To change these, edit `MAX_VIDEO_SIZE` / `ALLOWED_VIDEO_TYPES` in
`src/controllers/videoController.ts` and the matching values in the admin's
`src/http/video/index.ts`.

## Two things you must do on AWS

### 1. Add a CORS rule to the S3 bucket

Your bucket: `ccs-infratech-635891305240-ap-south-1-an` (region `ap-south-1`).

Without this rule the browser's `PUT` is blocked and the upload sticks at 0%.

**Click path**

1. Sign in to the AWS console, top-right region picker → **Asia Pacific
   (Mumbai) ap-south-1**.
2. Go to **S3** → **Buckets** → click
   `ccs-infratech-635891305240-ap-south-1-an`.
3. Open the **Permissions** tab.
4. Scroll to the bottom — **Cross-origin resource sharing (CORS)** → **Edit**.
5. Paste the JSON below. If a rule is already there, add this object to the
   existing list rather than replacing it.
6. **Save changes**. It takes effect within a few seconds.

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "https://admin.ccsinfratech.com",
      "https://www.admin.ccsinfratech.com",
      "http://localhost:3002"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

The origins are the pages the upload runs from — your admin site, and
localhost:3002 for development (matches the admin's dev/start scripts). Drop the localhost line if you only want it on
the live site. The origin must match exactly: scheme, domain and port, with
no trailing slash.

**Or from the terminal**, if you have the AWS CLI set up:

```
aws s3api put-bucket-cors \
  --bucket ccs-infratech-635891305240-ap-south-1-an \
  --region ap-south-1 \
  --cors-configuration file://s3-cors.json
```

where `s3-cors.json` wraps the same list as
`{ "CORSRules": [ ... ] }`. A ready copy is in `aws/s3-cors.json` in this
repo. Check what is currently set with:

```
aws s3api get-bucket-cors \
  --bucket ccs-infratech-635891305240-ap-south-1-an \
  --region ap-south-1
```

### 2. Make sure the uploaded videos are publicly readable

The website plays the video from the plain S3 URL, so the object has to be
readable by anyone. Whatever you already do for blog images will work here
too — usually a bucket policy like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadWalkthroughVideos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ccs-infratech-635891305240-ap-south-1-an/walkthroughs/videos/*"
    }
  ]
}
```

If you serve media through CloudFront instead, point `buildPublicUrl` in
`src/controllers/videoController.ts` at the CloudFront domain.

## Environment variables

No new ones. It reuses `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY` and `AWS_S3_BUCKET`.

The IAM user needs `s3:PutObject` (and `s3:DeleteObject` if you want the
delete endpoint) on `walkthroughs/videos/*`.

## New dependency

`@aws-sdk/s3-request-presigner`.

It and `@aws-sdk/client-s3` can resolve to different copies of
`@smithy/types`, which makes TypeScript treat the two `S3Client` types as
unrelated even though they are the same object at runtime. Rather than
forcing the versions to line up, `getSignedUrl` in
`src/controllers/videoController.ts` casts its two arguments. If you ever
get the versions onto a matching pair, those casts can be dropped.

## Files changed

Backend:

- `src/controllers/videoController.ts` (new) — presign, list, delete
- `src/routes/videoRoute.ts` (new) — admin-only routes
- `aws/s3-cors.json` (new) — the CORS rule, ready for the AWS CLI
- `src/index.ts` — mounts `/api/v1/videos`

Admin:

- `src/http/video/index.ts` (new) — list, presign, direct S3 upload, delete
- `src/components/media-library/video-upload-field.tsx` (new) — the
  three-tab field
- `src/app/dashboard/walkthrough/new/page.tsx`
- `src/app/dashboard/walkthrough/edit/[id]/page.tsx`

## Quick test

1. Start the backend and the admin.
2. Go to Dashboard → Walkthrough → Create.
3. On the **Upload New** tab, drop in a small MP4. Watch the progress bar.
4. When it finishes the preview player should appear and play.
5. Save, then open the walkthrough page on the public website.
6. Create a second walkthrough — the video should now be listed on the
   **Video Library** tab, ready to reuse without uploading again.

If the upload sticks at 0% and the browser console shows a CORS error, the
bucket rule in step 1 is missing or has the wrong origin.
