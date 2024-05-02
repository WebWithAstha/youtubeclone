const videoModel = require('../models/videoModel.js')
const playlistModel = require('../models/playlistModel.js');
const { all } = require('axios');
const userModel = require('../models/userModel.js');


module.exports.timeSpanFromNow = (inputDate) => {

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
    return `${years} years`;
  } else if (months > 0) {
    return `${months} month`;
  } else if (weeks > 0) {
    return `${weeks} week`;
  } else if (days > 0) {
    return `${days} day`;
  } else if (hours > 0) {
    return `${hours} hours`;
  } else if (minutes > 0) {
    return `${minutes} mins`;
  } else {
    return `${seconds}s`;
  }


}

module.exports.getLatestContent = async (userId) => {
  const [latestVideos, latestPlaylists] = await Promise.all([
    videoModel.find({ user: userId }).populate('user'),
    playlistModel.find({ user: userId }).populate('user')
  ]);

  return [...latestVideos, ...latestPlaylists].sort((a, b) => b.createdDate - a.createdDate);
}

module.exports.getAllContent = async () => {
  const allVideos = await videoModel.find({ visibility: 'public' }).populate('user');
  const allPlaylists = await playlistModel.find({ visibility: 'public' }).populate('user');
  return shuffledArray([...allVideos, ...allPlaylists]);
}

exports.subscribe = async (subscribedUserIds) => {
  let mergedArray = [];
  videos = await videoModel.find({ user: { $in: subscribedUserIds } }).populate('user')
  playlists = await playlistModel.find({ user: { $in: subscribedUserIds } }).populate('user')
  mergedArray.push(...videos, ...playlists)
  mergedArray.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return mergedArray;
}


async function aggregateUserSubscriptions(userIds) {
  const result = await User.aggregate([
    {
      $match: {
        _id: { $in: userIds },
        'subscriptions': { $exists: true, $ne: [] }
      }
    },
    { $unwind: '$subscriptions' },
    {
      $lookup: {
        from: 'videos',
        localField: 'subscriptions',
        foreignField: '_id',
        as: 'videos'
      }
    },
    { $unwind: '$videos' },
    {
      $lookup: {
        from: 'playlists',
        localField: 'subscriptions',
        foreignField: '_id',
        as: 'playlists'
      }
    },
    { $unwind: '$playlists' },
    {
      $group: {
        _id: '$_id',
        videos: { $push: '$videos' },
        playlists: { $push: '$playlists' }
      }
    },
    {
      $project: {
        _id: 0,
        videos: { $sortByCount: '$videos' },
        playlists: { $sortByCount: '$playlists' }
      }
    }
  ]);

  return result;
}

// Usage:
// const result = await aggregateUserSubscriptions(userIds);








const shuffledArray = (array) => {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}