const videoModel = require('../routes/video.js')

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
      
        // Determine the largest time unit
        if (weeks > 0) {
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