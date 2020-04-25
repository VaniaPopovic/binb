'use strict';
const artistIds = require('./artist-ids');
const http = require('http');
const fs = require('fs');
const JSONStream = require('JSONStream');
const limit = 7; // The number of songs to retrieve for each artist
const parser = JSONStream.parse(['results', true]);
const popIds = artistIds.pop;
const rapIds = artistIds.rap;
const rc = require('redis').createClient();
const rockIds = artistIds.rock;
let rooms = require('../config').rooms;
let score;
let skip = 0; // Skip counter
let songId = 0;
let c = 0;
let artists = "";
// const options = {
//   headers: { 'content-type': 'application/json' },
//   host: 'itunes.apple.com',
//   // Look up multiple artists by their IDs and get `limit` songs for each one
//   path:
//     '/lookup?id=' +
//     popIds.concat(rapIds, rockIds).join() +
//     '&entity=song&limit=' +
//     limit,
//   port: 80
// };
/**
 * Set the rooms in which the songs of a given artist will be loaded.
 */
const updateRooms = function(t) {
  rooms = ['mixed','hits'];
  score = 0;
  var primaryGenreName= t.primaryGenreName;
  if (Array.isArray(primaryGenreName)){
    return;
  }
  else if(typeof primaryGenreName === 'string'){
    if(primaryGenreName.toLowerCase().indexOf('rap')) rooms.push('rap')
    if(primaryGenreName.toLowerCase().indexOf('pop')) rooms.push('pop')
    if(primaryGenreName.toLowerCase().indexOf('rock')) rooms.push('rock','oldies')
  }
//   if (t.primaryGenreName === popIds[0]) {
//     rooms.push('pop');
//     // Set the skip counter (there is no need to update the rooms for the next pop artists)
//   } else if () {
//     rooms.push('rap');
//     skip = rapIds.length - 1;
//   } else {
//     rooms.push('oldies', 'rock');
//     skip = rockIds.length - 1;
//  }
};
parser.on('data', function(track) {
  if (track.wrapperType === 'artist') {
      return;
    }
    updateRooms(track);
  rc.hmset(
    'song:' + songId,
    'artistName',
    track.artistName,
    'trackName',
    track.trackName,
    'trackViewUrl',
    track.trackViewUrl,
    'previewUrl',
    track.previewUrl,
    'artworkUrl60',
    track.artworkUrl60,
    'artworkUrl100',
    track.artworkUrl100
  );
  rooms.forEach(function(room) {
    const _score = room === 'mixed' ? songId : score;
    rc.zadd(room, _score, songId);
  });
  score++;
  songId++;
});
parser.on('end', function() {
	
  rc.quit();
  process.stdout.write('OK\n');
    process.stdout.write('NEOLAN');
  process.stdout.write(artists);
});
rc.del(rooms, function(err) {
  if (err) {
    throw err;
  }
  process.stdout.write('Loading sample tracks... ');
  // http.get(options, function(res) {
  //   res.pipe(parser);
  // });
  var jsonData = 'test2.json',
        stream = fs.createReadStream(jsonData);
  stream.pipe(parser);
  process.stdout.write(artists);
});