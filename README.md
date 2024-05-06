# YouTube Clone Web App

This project is a YouTube clone web application built using Node.js, MongoDB, and EJS. It allows users to authenticate via Google Auth or Passport.js, upload short or long videos with thumbnail images, add captions and descriptions, subscribe to other users, create playlists, like/dislike videos, add videos to watch later, and comment on videos with two-level chained comments. Video streaming is implemented using BunnyCDN.

## Features

- **Authentication**: Users can authenticate using Google Auth or Passport.js.
- **Video Upload**: Users can upload short or long videos along with thumbnail images, captions, and descriptions.
- **Subscription**: Users can subscribe to other users to stay updated with their content.
- **Playlist Creation**: Users can create playlists to organize their favorite videos.
- **Interactions**: Users can like/dislike videos and add them to their watch later list.
- **Comments**: Users can comment on videos, and the comment section supports two-level chained comments.
- **Video Streaming**: Videos are streamed using BunnyCDN for efficient delivery.

## Technologies Used

- **Node.js**: Backend server environment.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database for storing user data and video metadata.
- **EJS**: Templating language for generating HTML markup.
- **Passport.js**: Authentication middleware.
- **BunnyCDN**: Content delivery network for efficient video streaming.

## Getting Started

1. Clone this repository:

   ```
   git clone https://github.com/WebWithAstha/youtubeclone.git
   ```

2. Install dependencies:

   ```
   cd youtube-clone
   npm install
   ```

3. Set up environment variables:

   ```
   cp .env.example .env
   ```

   Update `.env` file with your environment-specific configurations.

4. Start the server:

   ```
   npx nodemon
   ```

5. Access the application at `http://localhost:3000`.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
