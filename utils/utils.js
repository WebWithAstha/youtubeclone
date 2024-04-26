const videoModel = require('../models/videoModel.js')
const playlistModel = require('../models/playlistModel.js')


module.exports.timeSpanFromNow = (inputDate)=>{

    // Convert inputDate to a Date object
    const inputDateTime = new Date(inputDate);
  
    // Get the current date and time
    const currentDateTime = new Date();
  
    // Calculate the time difference in milliseconds
    const timeDifference = currentDateTime - inputDateTime;
  
    // Calculate days, hours, minutes, seconds, and weeks
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(currentDateTime.getMonth() - inputDateTime.getMonth() + (12 * (currentDateTime.getFullYear() - inputDateTime.getFullYear())));
    const years = Math.floor(months / 12);

  
    // Determine the largest time unit
    if (years > 0) {
        return `${years} yr`;
    } else if (months > 0) {
        return `${months} m`;
    } else if (weeks > 0) {
      return `${weeks} w`;
    } else if (days > 0) {
      return `${days} d`;
    } else if (hours > 0) {
      return `${hours} hr`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return `${seconds}s`;
    }
  

}

module.exports.getLatestContent = async (userId) => {
        const [latestVideos, latestPlaylists] = await Promise.all([
        videoModel.find({ user: userId }),
        playlistModel.find({ user: userId })
    ]);

    return [...latestVideos, ...latestPlaylists].sort((a, b) => b.createdDate - a.createdDate);
}

module.exports.getAllContent = async () => {
        // Fetch all videos and playlists from the database
        const allVideos = await videoModel.find({visibility: 'public'});
        const allPlaylists = await playlistModel.find({visibility: 'public'});
        return shuffledArray([...allVideos, ...allPlaylists]);
}



const shuffledArray =(array) => {
        for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
        return array;
}