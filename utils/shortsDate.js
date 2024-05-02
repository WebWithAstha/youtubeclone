const videoModel = require('../models/videoModel.js');


exports.categorizeVideos = async (allWatchedVideos)=>{
 
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Initialize objects to store categorized videos
    const categorizedVideos = {
        today: { shorts: [], videos: [] },
        yesterday: { shorts: [], videos: [] },
        others: { shorts: [], videos: [] }
    };

    // Iterate over each watched video
    allWatchedVideos.forEach(videoObj => {
        // Determine the category based on createdDate
        const createdDate = new Date(videoObj.watchedAt);
        let category;
        if (createdDate.toDateString() === today.toDateString()) {
            category = "today";
        } else if (createdDate.toDateString() === yesterday.toDateString()) {
            category = "yesterday";
        } else {
            category = "others";
        }

        // Determine the type of video
        if (videoObj.video.type === "short") {
            categorizedVideos[category].shorts.push(videoObj.video);
        } else {
            categorizedVideos[category].videos.push(videoObj.video);
        }
    });
    return categorizedVideos;
}